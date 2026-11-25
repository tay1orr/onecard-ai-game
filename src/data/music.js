// 배경음악 목록 — node scripts/build-music.mjs 가 음악/ 폴더에서 만든다(손으로 고치지 않음).
// 비어 있으면 배경음악이 없고, 설정 창의 배경음악 줄도 보이지 않는다
export const MUSIC = Object.freeze([
  Object.freeze({"scene":"game","file":"game-1","title":"Bossa Antigua","author":"Kevin MacLeod (incompetech.com)","license":"CC BY 4.0","source":"https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069"}),
  Object.freeze({"scene":"lobby","file":"lobby-1","title":"Teddy Bear Waltz","author":"Kevin MacLeod (incompetech.com)","license":"CC BY 4.0","source":"https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700064"}),
]);
