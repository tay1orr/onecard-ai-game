// Supabase 클라이언트 하나 — 대전 · 기록이 함께 쓴다(시즌 1은 둘을 따로 만들었다).
// 라이브러리는 처음 필요할 때 받는다(홈을 열 때마다 받지 않게).
import { SUPABASE_CONFIG, isSupabaseConfigured } from './config.js';

let clientPromise = null;

export function getSupabase() {
  if (!isSupabaseConfigured()) return Promise.reject(new Error('SUPABASE_NOT_CONFIGURED'));
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) => createClient(
      SUPABASE_CONFIG.url,
      SUPABASE_CONFIG.publishableKey,
      { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
    ));
  }
  return clientPromise;
}

// 저장된 로그인이 있는지만 본다 — 없으면 라이브러리를 받지 않는다
export function hasStoredSession(storage = globalThis.localStorage) {
  try {
    const ref = new URL(SUPABASE_CONFIG.url).hostname.split('.')[0];
    return Boolean(storage?.getItem(`sb-${ref}-auth-token`));
  } catch {
    return false;
  }
}

// 이메일 링크로 돌아왔는지(주소에 로그인 정보가 붙어 옴)
export function hasAuthCallbackInUrl(location = globalThis.location) {
  const text = `${location?.hash || ''}${location?.search || ''}`;
  return /access_token=|refresh_token=|[?&]code=|error_description=/.test(text);
}
