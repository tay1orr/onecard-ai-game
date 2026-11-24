// GPT 로 만든 그림 목록 — scripts/build-gpt.mjs 가 gpt그림/ 을 줄여 public 에 넣고 이 파일을 다시 쓴다(손으로 고치지 않음)
export const GPT_ART = Object.freeze(["back-01","face-01","map-01","map-02","map-03","map-04","map-05","map-06","map-07","map-08","map-09","map-10"]);
export const hasGptArt = (key) => GPT_ART.includes(key);
