export function normalizeRoomCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '').slice(0, 6);
}

export function normalizeNickname(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, 12);
}

export function validateNickname(value) {
  const nickname = normalizeNickname(value);
  if (nickname.length < 2) throw new Error('닉네임은 2자 이상 입력해 주세요.');
  return nickname;
}

export function validateRoomCode(value) {
  const code = normalizeRoomCode(value);
  if (code.length !== 6) throw new Error('방 코드는 6자리입니다.');
  return code;
}

export function getSeatView(view) {
  const mine = view.mySeat === 0 ? view.host : view.guest;
  const opponent = view.mySeat === 0 ? view.guest : view.host;
  return { mine, opponent };
}

export function isMyTurn(view) {
  return view.status === 'playing' && view.currentSeat === view.mySeat;
}
