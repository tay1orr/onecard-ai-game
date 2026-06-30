// Supabase Dashboard > Project Settings > API에서 확인한 공개 값만 입력하세요.
// Secret key, service_role key, 데이터베이스 비밀번호는 절대 여기에 넣지 마세요.
export const SUPABASE_CONFIG = {
  url: 'https://ndmvjtnetcizvnasphlo.supabase.co',
  publishableKey: 'sb_publishable_FLMcgIfeNwVq07hzDHuC3A_fDeM_B-k',
};

export function isSupabaseConfigured() {
  return /^https:\/\/.+\.supabase\.co$/.test(SUPABASE_CONFIG.url)
    && SUPABASE_CONFIG.publishableKey.length > 20;
}
