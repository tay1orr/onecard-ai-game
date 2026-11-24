// GPT 로 만든 그림 목록 — scripts/build-gpt.mjs 가 gpt그림/ 을 줄여 public 에 넣고 이 파일을 다시 쓴다(손으로 고치지 않음)
export const GPT_ART = Object.freeze([]);
export const hasGptArt = (key) => GPT_ART.includes(key);
