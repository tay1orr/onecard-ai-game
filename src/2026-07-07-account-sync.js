import { SUPABASE_CONFIG, isSupabaseConfigured } from './2026-06-30-supabase-config.js';
import { PROFILE_KEY, loadPlayerProfile, savePlayerProfile } from './2026-07-05-rating.js';
import { DEFAULT_EQUIPPED, normalizeEquipped } from './2026-07-06-cosmetics.js';
import { MISSION_STORAGE_KEY } from './2026-07-07-missions.js';

export const ACCOUNT_SYNC_TABLE = 'onecard_profiles';
export const ACCOUNT_SYNC_PENDING_EMAIL_KEY = 'onecard-account-pending-email-v1';
export const ACCOUNT_SYNC_LAST_SYNC_KEY = 'onecard-account-last-sync-v1';

let clientPromise = null;
let queuedSyncTimer = null;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_DOMAIN_SUGGESTIONS = Object.freeze({
  'gmial.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.comm': 'gmail.com',
  'naver.con': 'naver.com',
  'naver.co': 'naver.com',
  'naver.comm': 'naver.com',
  'navr.com': 'naver.com',
  'daum.con': 'daum.net',
  'hanmail.con': 'hanmail.net',
  'kakao.con': 'kakao.com',
  'icloud.con': 'icloud.com',
  'outlook.con': 'outlook.com',
  'hotmial.com': 'hotmail.com',
});

function defaultStorage() {
  return globalThis.localStorage;
}

function safeParse(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

function safeInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(...groups) {
  const seen = new Set();
  return groups.flat().filter((value) => {
    const key = String(value || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function writeStorage(storage, key, value) {
  try { storage?.setItem(key, value); } catch { /* storage can be blocked */ }
}

function removeStorage(storage, key) {
  try { storage?.removeItem(key); } catch { /* storage can be blocked */ }
}

export function normalizeEmailInput(email) {
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!EMAIL_PATTERN.test(cleanEmail)) throw new Error('INVALID_EMAIL');
  const atIndex = cleanEmail.lastIndexOf('@');
  const localPart = cleanEmail.slice(0, atIndex);
  const domain = cleanEmail.slice(atIndex + 1);
  const suggestedDomain = EMAIL_DOMAIN_SUGGESTIONS[domain];
  if (suggestedDomain) {
    const error = new Error(`EMAIL_DOMAIN_TYPO:${localPart}@${suggestedDomain}`);
    error.suggestion = `${localPart}@${suggestedDomain}`;
    throw error;
  }
  return cleanEmail;
}

function emailRedirectTo() {
  const origin = globalThis.location?.origin || 'https://onecard-ai-game.vercel.app';
  const pathname = globalThis.location?.pathname || '/';
  return `${origin}${pathname}`;
}

export function isAnonymousUser(user) {
  if (!user) return false;
  return user.is_anonymous === true
    || user.app_metadata?.provider === 'anonymous'
    || user.identities?.some((identity) => identity.provider === 'anonymous') === true
    || (!user.email && !safeArray(user.identities).some((identity) => identity.provider === 'email'));
}

export async function getAccountClient() {
  if (!isSupabaseConfigured()) throw new Error('ACCOUNT_SUPABASE_NOT_CONFIGURED');
  if (!clientPromise) {
    clientPromise = import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm')
      .then(({ createClient }) => createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.publishableKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }));
  }
  return clientPromise;
}

async function currentSession(client) {
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  return data?.session || null;
}

async function ensureAccountSession(client) {
  const session = await currentSession(client);
  if (session?.user) return session;
  const { data, error } = await client.auth.signInAnonymously();
  if (error) throw error;
  return data?.session || currentSession(client);
}

export function readLocalAccountBundle(storage = defaultStorage()) {
  const hadProfile = Boolean(storage?.getItem(PROFILE_KEY));
  const rawMissionState = storage?.getItem(MISSION_STORAGE_KEY) || '';
  return {
    profile: loadPlayerProfile(storage),
    missionState: safeParse(rawMissionState) || null,
    hasProfile: hadProfile,
    hasMissionState: Boolean(rawMissionState),
  };
}

function saveLocalAccountBundle(bundle, storage = defaultStorage()) {
  const profile = bundle?.profile ? savePlayerProfile(bundle.profile, storage) : null;
  if (bundle?.missionState) writeStorage(storage, MISSION_STORAGE_KEY, JSON.stringify(bundle.missionState));
  return { profile, missionState: bundle?.missionState || null };
}

function mergeEquipped(localEquipped, remoteEquipped, peakPoints, preferLocal) {
  const primary = preferLocal ? localEquipped : remoteEquipped;
  const fallback = preferLocal ? remoteEquipped : localEquipped;
  return normalizeEquipped({ ...DEFAULT_EQUIPPED, ...(fallback || {}), ...(primary || {}) }, peakPoints);
}

export function mergeProfiles(localProfile = {}, remoteProfile = {}, options = {}) {
  const preferLocalEquipped = options.preferLocalEquipped !== false;
  const points = Math.max(safeInteger(localProfile.points), safeInteger(remoteProfile.points));
  const peakPoints = Math.max(points, safeInteger(localProfile.peakPoints), safeInteger(remoteProfile.peakPoints));
  const wins = Math.max(safeInteger(localProfile.wins), safeInteger(remoteProfile.wins));
  const games = Math.max(wins, safeInteger(localProfile.games), safeInteger(remoteProfile.games));
  const aiWins = Math.max(safeInteger(localProfile.aiWins), safeInteger(remoteProfile.aiWins));
  const aiGames = Math.max(aiWins, safeInteger(localProfile.aiGames), safeInteger(remoteProfile.aiGames));
  const multiWins = Math.max(safeInteger(localProfile.multiWins), safeInteger(remoteProfile.multiWins));
  const multiGames = Math.max(multiWins, safeInteger(localProfile.multiGames), safeInteger(remoteProfile.multiGames));
  const losses = Math.max(
    safeInteger(localProfile.losses),
    safeInteger(remoteProfile.losses),
    Math.max(0, games - wins),
  );
  return {
    version: 3,
    points,
    peakPoints,
    wins,
    games,
    losses,
    aiWins,
    aiGames,
    multiWins,
    multiGames,
    awardedMatchIds: uniqueStrings(
      safeArray(remoteProfile.awardedMatchIds),
      safeArray(localProfile.awardedMatchIds),
    ).slice(-100),
    recentAiStars: safeArray(localProfile.recentAiStars).length
      ? safeArray(localProfile.recentAiStars).filter((value) => value >= 1 && value <= 5).slice(-2)
      : safeArray(remoteProfile.recentAiStars).filter((value) => value >= 1 && value <= 5).slice(-2),
    equipped: mergeEquipped(localProfile.equipped, remoteProfile.equipped, peakPoints, preferLocalEquipped),
    reducedEffects: typeof localProfile.reducedEffects === 'boolean'
      ? localProfile.reducedEffects
      : Boolean(remoteProfile.reducedEffects),
  };
}

function mergeProgress(localProgress = {}, remoteProgress = {}) {
  const result = {};
  [...new Set([...Object.keys(remoteProgress || {}), ...Object.keys(localProgress || {})])].forEach((key) => {
    result[key] = Math.max(safeInteger(localProgress[key]), safeInteger(remoteProgress[key]));
  });
  return result;
}

function mergeClaimed(localClaimed = {}, remoteClaimed = {}) {
  const result = {};
  [...new Set([...Object.keys(remoteClaimed || {}), ...Object.keys(localClaimed || {})])].forEach((key) => {
    result[key] = Boolean(localClaimed[key] || remoteClaimed[key]);
  });
  return result;
}

function mergeMissionBoard(localBoard, remoteBoard, preferLocalBoard) {
  if (!localBoard?.key) return remoteBoard || null;
  if (!remoteBoard?.key) return localBoard || null;
  if (localBoard.key !== remoteBoard.key) return preferLocalBoard ? localBoard : remoteBoard;
  return {
    key: localBoard.key,
    missionIds: safeArray(localBoard.missionIds).length ? localBoard.missionIds : safeArray(remoteBoard.missionIds),
    progress: mergeProgress(localBoard.progress, remoteBoard.progress),
    claimed: mergeClaimed(localBoard.claimed, remoteBoard.claimed),
  };
}

export function mergeMissionStates(localState = {}, remoteState = {}, options = {}) {
  const preferLocalBoards = options.preferLocalBoards !== false;
  const daily = mergeMissionBoard(localState?.daily, remoteState?.daily, preferLocalBoards);
  const weekly = mergeMissionBoard(localState?.weekly, remoteState?.weekly, preferLocalBoards);
  return {
    version: 1,
    ...(daily ? { daily } : {}),
    ...(weekly ? { weekly } : {}),
    seenEventIds: uniqueStrings(
      safeArray(remoteState?.seenEventIds),
      safeArray(localState?.seenEventIds),
    ).slice(-400),
  };
}

export function mergeAccountBundles(localBundle = {}, remoteBundle = {}) {
  return {
    profile: mergeProfiles(localBundle.profile || {}, remoteBundle.profile || {}, {
      preferLocalEquipped: localBundle.hasProfile !== false,
    }),
    missionState: mergeMissionStates(localBundle.missionState || {}, remoteBundle.missionState || {}, {
      preferLocalBoards: localBundle.hasMissionState !== false,
    }),
  };
}

async function readRemoteAccountBundle(client, userId) {
  const { data, error } = await client
    .from(ACCOUNT_SYNC_TABLE)
    .select('profile, mission_state')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return {
    profile: data?.profile || {},
    missionState: data?.mission_state || {},
    hasProfile: Boolean(data?.profile),
    hasMissionState: Boolean(data?.mission_state),
  };
}

async function upsertRemoteAccountBundle(client, userId, bundle) {
  const { error } = await client.from(ACCOUNT_SYNC_TABLE).upsert({
    user_id: userId,
    profile: bundle.profile || {},
    mission_state: bundle.missionState || {},
    client_saved_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function getAccountSyncState(options = {}) {
  const storage = options.storage || defaultStorage();
  if (!isSupabaseConfigured()) return { status: 'not-configured', configured: false };
  const client = options.client || await getAccountClient();
  const session = await currentSession(client);
  const pendingEmail = storage?.getItem(ACCOUNT_SYNC_PENDING_EMAIL_KEY) || '';
  if (!session?.user) return { status: 'local', configured: true, pendingEmail };
  const anonymous = isAnonymousUser(session.user);
  return {
    status: anonymous ? 'guest' : 'email',
    configured: true,
    userId: session.user.id,
    email: session.user.email || pendingEmail,
    pendingEmail,
    isAnonymous: anonymous,
  };
}

export async function syncAccountProfile(options = {}) {
  const storage = options.storage || defaultStorage();
  if (!isSupabaseConfigured()) return { status: 'not-configured', skipped: true };
  const client = options.client || await getAccountClient();
  const session = options.ensureSession ? await ensureAccountSession(client) : await currentSession(client);
  if (!session?.user) return { status: 'local', skipped: true };

  const localBundle = readLocalAccountBundle(storage);
  const remoteBundle = await readRemoteAccountBundle(client, session.user.id);
  const merged = mergeAccountBundles(localBundle, remoteBundle);
  const saved = saveLocalAccountBundle(merged, storage);
  await upsertRemoteAccountBundle(client, session.user.id, saved);

  const timestamp = new Date().toISOString();
  writeStorage(storage, ACCOUNT_SYNC_LAST_SYNC_KEY, timestamp);
  if (!isAnonymousUser(session.user) && session.user.email) removeStorage(storage, ACCOUNT_SYNC_PENDING_EMAIL_KEY);

  return {
    status: isAnonymousUser(session.user) ? 'guest' : 'email',
    user: session.user,
    email: session.user.email || storage?.getItem(ACCOUNT_SYNC_PENDING_EMAIL_KEY) || '',
    profile: saved.profile,
    missionState: saved.missionState,
    lastSyncedAt: timestamp,
  };
}

export function queueAccountProfileSync(options = {}) {
  const delay = Math.max(0, Number.isFinite(options.delay) ? options.delay : 700);
  clearTimeout(queuedSyncTimer);
  queuedSyncTimer = setTimeout(async () => {
    try {
      const result = await syncAccountProfile(options);
      options.onComplete?.(result);
    } catch (error) {
      options.onError?.(error);
    }
  }, delay);
}

export async function requestEmailConnection(email, options = {}) {
  const storage = options.storage || defaultStorage();
  const cleanEmail = normalizeEmailInput(email);
  const client = options.client || await getAccountClient();
  await syncAccountProfile({ storage, client, ensureSession: true });
  const { error } = await client.auth.updateUser(
    { email: cleanEmail },
    { emailRedirectTo: emailRedirectTo() },
  );
  if (error) throw error;
  writeStorage(storage, ACCOUNT_SYNC_PENDING_EMAIL_KEY, cleanEmail);
  return { status: 'email-link-sent', email: cleanEmail };
}

function isAlreadyRegisteredEmailError(error) {
  const message = String(error?.message || error || '');
  return message.includes('User already registered')
    || message.includes('already been registered')
    || message.includes('already registered')
    || message.includes('identity_already_exists');
}

export async function requestEmailLogin(email, options = {}) {
  const storage = options.storage || defaultStorage();
  const cleanEmail = normalizeEmailInput(email);
  const client = options.client || await getAccountClient();
  const { error } = await client.auth.signInWithOtp({
    email: cleanEmail,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: emailRedirectTo(),
    },
  });
  if (error) throw error;
  writeStorage(storage, ACCOUNT_SYNC_PENDING_EMAIL_KEY, cleanEmail);
  return { status: 'magic-link-sent', email: cleanEmail };
}

export async function requestEmailRecordLink(email, options = {}) {
  const storage = options.storage || defaultStorage();
  const cleanEmail = normalizeEmailInput(email);
  const client = options.client || await getAccountClient();
  const session = await ensureAccountSession(client);
  const currentEmail = session?.user?.email?.toLowerCase?.() || '';
  if (session?.user && !isAnonymousUser(session.user)) {
    if (currentEmail === cleanEmail) {
      const synced = await syncAccountProfile({ storage, client });
      return { status: 'already-connected', email: cleanEmail, profile: synced.profile };
    }
    return requestEmailLogin(cleanEmail, { storage, client });
  }
  try {
    return await requestEmailConnection(cleanEmail, { storage, client });
  } catch (error) {
    if (!isAlreadyRegisteredEmailError(error)) throw error;
    return requestEmailLogin(cleanEmail, { storage, client });
  }
}

export function friendlyAccountSyncError(error) {
  const message = String(error?.message || error || '');
  if (message.includes('ACCOUNT_SUPABASE_NOT_CONFIGURED')) return 'Supabase 공개 설정이 필요해요.';
  if (message.includes('relation') && message.includes(ACCOUNT_SYNC_TABLE)) return 'Supabase SQL을 먼저 실행해야 기록 보호를 사용할 수 있어요.';
  if (message.includes('INVALID_EMAIL')) return '이메일 주소를 다시 확인해 주세요.';
  if (message.startsWith('EMAIL_DOMAIN_TYPO:')) return `혹시 ${message.replace('EMAIL_DOMAIN_TYPO:', '')} 인가요? 이메일 주소를 다시 확인해 주세요.`;
  if (message.includes('Email rate limit exceeded') || message.includes('For security purposes')) return '메일은 잠시 후 다시 보낼 수 있어요.';
  if (isAlreadyRegisteredEmailError(error)) return '이미 연결된 이메일이에요. 같은 이메일로 로그인 메일을 받아 기록을 불러와 주세요.';
  return message || '기록 보호 연결 중 문제가 생겼어요.';
}
