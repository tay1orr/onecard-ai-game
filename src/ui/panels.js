// 설정 · 규칙 · 미션 · 기록 보호 창
import { h, formatNumber } from './dom.js';
import { openModal, toast } from './modal.js';
import { settings } from './settings.js';
import { loadMissionDashboard } from '../core/missions.js';
import { WIN_REWARDS, LOSS_PENALTY } from '../core/rating.js';
import { suitSvg } from './suits.js';
import { play } from './sound.js';
import { hasMusic } from './music.js';
import { MUSIC } from '../data/music.js';

function toggleRow({ label, sub, options, value, onChange }) {
  const group = h('div.seg', { role: 'group', 'aria-label': label }, ...options.map((option) => h('button.seg-btn', {
    type: 'button', 'aria-pressed': String(option.value === value),
    onClick: (event) => {
      group.querySelectorAll('.seg-btn').forEach((button) => button.setAttribute('aria-pressed', 'false'));
      event.currentTarget.setAttribute('aria-pressed', 'true');
      play('toggle');
      onChange(option.value);
    },
  }, option.label)));
  return h('div.set-row', {}, h('div.set-text', {}, h('b', {}, label), sub ? h('small', {}, sub) : null), group);
}

export function openSettings({ onReplayOpening, onAccount, onRules, onCredits }) {
  const state = settings.get();
  const volume = h('input.volume', {
    type: 'range', min: '0', max: '1', step: '0.05', value: String(state.volume), 'aria-label': '소리 크기',
    onInput: (event) => settings.set({ volume: Number(event.currentTarget.value) }),
    onChange: () => play('click'),
  });
  // 배경음악 줄은 곡이 들어온 뒤에만(src/data/music.js). 소리를 끄면 배경음악도 같이 꺼진다
  const musicVolume = h('input.volume', {
    type: 'range', min: '0', max: '1', step: '0.05', value: String(state.musicVolume), 'aria-label': '배경음악 크기',
    onInput: (event) => settings.set({ musicVolume: Number(event.currentTarget.value) }),
  });
  const body = h('div.settings', {},
    toggleRow({ label: '소리', options: [{ label: '켜기', value: true }, { label: '끄기', value: false }], value: state.sound, onChange: (value) => settings.set({ sound: value }) }),
    h('div.set-row', {}, h('div.set-text', {}, h('b', {}, '소리 크기')), volume),
    hasMusic() ? toggleRow({ label: '배경음악', options: [{ label: '켜기', value: true }, { label: '끄기', value: false }], value: state.music, onChange: (value) => settings.set({ music: value }) }) : null,
    hasMusic() ? h('div.set-row', {}, h('div.set-text', {}, h('b', {}, '배경음악 크기')), musicVolume) : null,
    toggleRow({ label: '연출', sub: '줄이면 화면 흔들림과 큰 소품이 빠져요', options: [{ label: '크게', value: 'full' }, { label: '줄이기', value: 'reduced' }], value: state.effects, onChange: (value) => settings.set({ effects: value }) }),
    toggleRow({ label: '연출 속도', options: [{ label: '보통', value: 1 }, { label: '빠르게', value: 1.6 }], value: state.speed, onChange: (value) => settings.set({ speed: value }) }),
    h('div.set-links', {},
      h('button.btn.ghost', { type: 'button', onClick: () => { modal.close(); onAccount?.(); } }, '기록 보호'),
      h('button.btn.ghost', { type: 'button', onClick: () => { modal.close(); onRules?.(); } }, '규칙'),
      h('button.btn.ghost', { type: 'button', onClick: () => { modal.close(); onReplayOpening?.(); } }, '시즌 2 오프닝 다시 보기'),
      h('button.btn.ghost', { type: 'button', onClick: () => { modal.close(); onCredits?.(); } }, '그림 · 소리 출처')));
  const modal = openModal({ title: '설정', body, className: 'is-settings' });
  return modal;
}

export function openRules() {
  const rows = [
    ['2', '공격 2장', '2나 A, 조커로 이어서 막을 수 있어요'],
    ['A', '공격 3장', '못 막으면 쌓인 만큼 받아요'],
    ['JOKER', '공격 5장', '조커로만 막아요. 상대가 받으면 다음에 아무 카드나 낼 수 있어요'],
    ['J', '건너뛰기', '상대 차례를 한 번 건너뛰어요'],
    ['7', '무늬 바꾸기', '바꾼 무늬나 다른 7을 낼 수 있어요'],
    ['Q', '그냥 카드', '둘이서 할 때는 효과가 없어요'],
    ['K', '그냥 카드', '둘이서 할 때는 효과가 없어요'],
  ];
  const body = h('div.rules', {},
    h('p.rules-lead', {}, '맨 위 카드와 같은 무늬나 같은 숫자를 내요. 손패를 먼저 다 내면 이겨요.'),
    h('ul.rules-list', {}, ...rows.map(([rank, title, text]) => h('li', {},
      h(`span.rule-card${['2', 'J', '7'].includes(rank) ? '.is-red' : ''}`, { html: rank === 'JOKER' ? '<b>JK</b>' : `<b>${rank}</b>${suitSvg(['2', 'J', '7'].includes(rank) ? 'hearts' : 'spades')}` }),
      h('div', {}, h('b', {}, title), h('small', {}, text))))),
    h('p.rules-points', {}, `이기면 상대 별에 따라 +${WIN_REWARDS[1]}점에서 +${WIN_REWARDS[5]}점, 지면 ${LOSS_PENALTY}점이에요. 보너스판에서 이기면 2배예요.`),
    h('p.rules-points', {}, '꾸미기는 역대 최고 점수나 시즌 패스 단계로 열리고, 한 번 열리면 다시 잠기지 않아요.'));
  return openModal({ title: '규칙', body, className: 'is-rules', actions: [{ label: '확인', kind: 'primary', onClick: (modal) => modal.close() }] });
}

export function openMissions() {
  const dashboard = loadMissionDashboard();
  const block = (label, board) => h('section.mission-block', {}, h('div.card-head', {}, h('b', {}, label), h('small', {}, `${board.completedCount}/${board.total}`)),
    h('ul.mission-list', {}, ...board.missions.map((mission) => h(`li.mission-row${mission.completed ? '.is-done' : ''}`, {},
      h('div.mission-line', {}, h('b', {}, mission.title), h('small', {}, `+${mission.reward}점`)),
      h('p.mission-desc', {}, mission.description),
      h('div.mission-bar', {}, h('i', { style: { width: `${mission.percent}%` } })),
      h('small.mission-count', {}, `${mission.progress}/${mission.target}`)))));
  return openModal({ title: '미션', body: h('div.missions', {}, block('오늘', dashboard.daily), block('이번 주', dashboard.weekly), h('p.modal-note', {}, '미션을 하나 마칠 때마다 시즌 패스 경험치 40도 받아요.')), className: 'is-missions' });
}

export async function openCredits() {
  const rows = [
    ['카드 · 칩 · 주사위 · 단추 소리, 잔음악', 'Kenney (CC0)'],
    ['반응 스티커', 'Microsoft Fluent Emoji 3D (MIT)'],
    ['리얼 로즈 사진', '선생님이 찍은 사진'],
    ['글꼴', 'Pretendard, Big Shoulders Display (OFL)'],
    ...MUSIC.map((track) => [`배경음악 ${track.title}`, [track.author, track.license].filter(Boolean).join(', ')]),
  ];
  const list = h('div.credits-groups', {}, h('p.modal-text', {}, '출처 목록을 불러오고 있어요'));
  const modal = openModal({
    title: '그림 · 소리 출처',
    body: h('div.credits-body', {},
      h('ul.credits', {}, ...rows.map(([what, who]) => h('li', {}, h('b', {}, what), h('small', {}, who)))),
      list),
    className: 'is-credits',
  });
  // 실사 에셋 출처는 길어서 창을 열 때 받는다
  try {
    const { CREDIT_GROUPS } = await import('../data/credits.js');
    list.replaceChildren(...CREDIT_GROUPS.filter((group) => group.items.length).map((group) => h('details.credit-group', {},
      h('summary', {}, `${group.name} ${group.items.length}`),
      h('ul.credit-items', {}, ...group.items.map((item) => h('li', {}, h('b', {}, item.title), h('small', {}, [item.creator, item.license].filter(Boolean).join(', '))))))));
  } catch {
    list.replaceChildren(h('p.modal-text', {}, '출처 목록을 불러오지 못했어요. docs/ASSET-CREDITS.md 에도 같은 목록이 있어요'));
  }
  return modal;
}

// 기록 보호(이메일) — 기록 동기화 모듈은 이 창을 열 때 받는다
export async function openAccount({ getState, onSynced }) {
  const status = h('p.account-status', { role: 'status', 'aria-live': 'polite' }, '기록 상태를 확인하고 있어요');
  const input = h('input.account-input', { type: 'email', autocomplete: 'email', inputmode: 'email', placeholder: 'you@example.com', 'aria-label': '이메일' });
  const sendButton = h('button.btn.primary', { type: 'button' }, '이메일로 기록 연결');
  const syncButton = h('button.btn.ghost', { type: 'button' }, '지금 동기화');
  const body = h('div.account', {},
    h('p.modal-text', {}, '이메일 링크로 로그인하면 다른 브라우저에서도 점수, 꾸미기, 미션, 시즌 패스를 불러와요.'),
    status, h('div.account-form', {}, input, sendButton), syncButton);
  const modal = openModal({ title: '기록 보호', body, className: 'is-account' });
  let account;
  try {
    account = await import('../net/account.js');
    const state = await getState(account);
    status.textContent = { email: `${state.email || '이메일'}로 보호하고 있어요`, guest: '게스트 기록이 서버에 있어요. 이메일을 연결하면 더 안전해요', local: '지금은 이 브라우저에만 저장돼요', 'not-configured': '서버 설정이 없어 이 브라우저에만 저장돼요' }[state.status] || '지금은 이 브라우저에만 저장돼요';
    if (state.status === 'email') input.closest('.account-form').hidden = true;
  } catch (error) {
    status.textContent = '기록 서버에 닿지 못했어요. 이 브라우저에는 그대로 저장돼요';
  }
  sendButton.addEventListener('click', async () => {
    if (!account) return;
    sendButton.disabled = true;
    status.textContent = '메일을 보내고 있어요';
    try {
      const result = await account.requestEmailRecordLink(input.value);
      status.textContent = result.status === 'already-connected'
        ? `${result.email}로 이미 연결돼 있어요`
        : `${result.email}로 링크를 보냈어요. 메일의 링크를 열면 기록이 이어져요`;
      onSynced?.();
    } catch (error) {
      status.textContent = account.friendlyAccountSyncError(error);
    } finally {
      sendButton.disabled = false;
    }
  });
  syncButton.addEventListener('click', async () => {
    if (!account) return;
    syncButton.disabled = true;
    try {
      const result = await account.syncAccountProfile();
      status.textContent = result.status === 'local' || result.skipped ? '로그인한 기록이 없어 이 브라우저에만 저장돼요' : '동기화했어요';
      toast('동기화했어요', { anchor: syncButton, tone: 'good' });
      onSynced?.(result);
    } catch (error) {
      status.textContent = account.friendlyAccountSyncError(error);
    } finally {
      syncButton.disabled = false;
    }
  });
  return modal;
}

export { formatNumber };
