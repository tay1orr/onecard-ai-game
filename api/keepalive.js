// Supabase 휴면 막기(11-25) — Vercel 예약 실행(vercel.json 의 crons)이 하루 한 번 부른다
// Supabase 무료 프로젝트는 일주일 동안 데이터베이스 활동이 적으면 멈춘다(휴면). 아무도 며칠 안 들어와도 멈추지 않게
// DB 함수 onecard_keepalive 를 불러 한 줄을 고쳐 쓴다(supabase/2026-11-25-season2-launch.sql 의 1)
// 공개 키(publishable)만 쓴다 — 게임 화면이 쓰는 그 키라 비밀 키 · 환경 변수가 필요 없다
import { SUPABASE_CONFIG } from '../src/net/config.js';

export async function keepAlive(fetchImpl = fetch, config = SUPABASE_CONFIG) {
  const response = await fetchImpl(`${config.url}/rest/v1/rpc/onecard_keepalive`, {
    method: 'POST',
    headers: { apikey: config.publishableKey, Authorization: `Bearer ${config.publishableKey}`, 'Content-Type': 'application/json' },
    body: '{}',
  });
  const body = (await response.text()).slice(0, 300);
  return { ok: response.ok, status: response.status, body };
}

export default async function handler(request, response) {
  try {
    const result = await keepAlive();
    // 실패하면 Vercel 로그 · 예약 실행 기록에 빨갛게 남는다(대개 SQL 을 아직 넣지 않았을 때 — 404)
    response.status(result.ok ? 200 : 502).json(result);
  } catch (error) {
    response.status(502).json({ ok: false, error: String(error?.message || error) });
  }
}
