// 출처 모으기 — node scripts/credits.mjs
// .asset-cache/real/<영역>/manifest.json 을 모아 src/data/credits.js(게임 안 출처 창) · docs/ASSET-CREDITS.md(실사 에셋 표) 를 쓴다.
// 레두테 장미 판화의 학명도 뽑아 src/data/plate-names.js 로(카드 뒷면에 작게 인쇄)
import fs from 'node:fs';
import path from 'node:path';
import { REAL_TEXTURES } from './asset-list.mjs';

const SRC = path.resolve('.asset-cache/real');
const AREAS = [
  ['backs', '카드 뒷면 그림(명화 · 식물화 · 사진)'],
  ['courts', '그림카드 · 에이스 · 조커(옛 카드 · 명화)'],
  ['scenes', '맵 · 승리 배경 사진'],
  ['surface', '사진 한 장 판(위에서 내려다본 꽃 · 테이블 사진, Pexels · Unsplash)'],
  ['cutouts', '장난감 · 소품 · 캐릭터 누끼 사진'],
  ['cutouts2', '상자 · 상자 전용 아이템(곰 인형 · 디저트 · 꽃) 누끼 사진'],
];

const read = (area) => {
  const file = path.join(SRC, area, 'manifest.json');
  if (!fs.existsSync(file)) return [];
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return Array.isArray(data) ? data : data.items || Object.values(data);
};
const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const short = (value, max = 90) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

const groups = AREAS.map(([area, name]) => ({
  name,
  items: read(area).filter((entry) => entry && entry.key && entry.file).map((entry) => ({
    key: entry.key,
    title: short(clean(entry.title)),
    creator: short(clean(entry.creator || entry.author || entry.institution || ''), 70),
    license: clean(entry.license),
    source: clean(entry.source_page || entry.image_url),
  })),
}));
groups.push({
  name: '탁자 · 테두리 · 종이 재질 사진',
  items: Object.entries(REAL_TEXTURES).map(([key, source]) => ({
    key,
    title: source.polyhaven || source.ambientcg,
    creator: source.polyhaven ? 'Poly Haven' : 'ambientCG',
    license: 'CC0 1.0',
    source: source.polyhaven ? `https://polyhaven.com/a/${source.polyhaven}` : `https://ambientcg.com/view?id=${source.ambientcg}`,
  })),
});
groups.push({
  name: '선생님이 만든 그림(GPT 이미지 생성)',
  items: [
    { key: 'gpt', title: '판 18장(장미 정원 · 베르사유 · 황금 장미 · 백만 송이 · 겨울 정원 · 장미 온실 · 꿈빛 왕국 · 블랙 오닉스 · 밀푀유 · 두바이 · 자수정 · 루비 왕관), 카드 뒷면 12장 · 앞면 테 10장(gpt그림 → scripts/build-gpt.mjs)', creator: '이 게임 전용(선생님 제작)', license: '이 게임 전용', source: '' },
    { key: 'gpt-characters', title: '캐릭터 22명 그림 — 원작: 치이카와 · 하치와레 · 우사기 · 랏코(나가노) · 짱구(우스이 요시토) · 체리(CLAMP) · 코난 · 키드(아오야마 고쇼) · 케로로(요시자키 미네) · 하츄핑(SAMG) · 마이멜로디 · 쿠로미 · 시나모롤 · 폼폼푸린 · 헬로키티 · 포차코 · 한교동(산리오) · 망그러진 곰(유랑) · 잔망루피(아이코닉스) · 세일러문(다케우치 나오코) · 춘식이(카카오프렌즈)', creator: '선생님이 GPT 로 그린 팬 그림', license: '수업 자료(저작권 교육 예외)', source: '' },
  ],
});
groups.push({
  name: '시즌 1 그림(그대로 되살림)',
  items: [{ key: 's1', title: '장미 무도회 · 리얼 로즈가든 · 달토끼 · 태양 신전 · 네온 심해 · 딸기 퍼레이드 · 핑크 구름, 장미 오르골 · 인형꽃 · 왕실 꽃정원 분수', creator: '시즌 1 제작 그림', license: '이 게임 전용', source: '' }],
});

fs.writeFileSync('src/data/credits.js', `// 자동으로 만든 파일 — node scripts/credits.mjs (손으로 고치지 않음)\nexport const CREDIT_GROUPS = ${JSON.stringify(groups, null, 1)};\n`);

// 레두테 장미 학명 — 노트의 첫 줄에서 "Rosa ..." 를 뽑는다
const plates = {};
for (const entry of read('backs').filter((item) => /^redoute-\d+$/.test(item.key))) {
  const text = clean(entry.note || entry.title);
  const latin = (text.match(/Rosa [A-Za-zÀ-ÿ.\- ]+?(?=[,;(]|$| —| - )/) || [])[0] || clean(entry.title).replace(/^Les Roses:\s*/i, '');
  const common = (text.match(/\(([^)]+)\)/) || [])[1] || '';
  plates[entry.key] = { latin: clean(latin), common: clean(common), title: clean(entry.title) };
}
fs.writeFileSync('src/data/plate-names.js', `// 자동으로 만든 파일 — node scripts/credits.mjs (레두테 「장미」 판화 이름)\nexport const PLATE_NAMES = ${JSON.stringify(plates, null, 1)};\n`);

// 문서 — 실사 에셋 표
const md = ['## 실사 에셋(시즌 2 꾸미기 개편, 11-24)', '', '꾸미기 아이템은 실제 사진 · 명화 · 옛 카드 · 재질 사진으로 그립니다. 원본은 `.asset-cache/real/`(git 제외), 줄인 파일은 `public/assets/s2/r/` · `t/`. 줄이기는 `node scripts/build-real.mjs`, 이 표는 `node scripts/credits.mjs` 로 만듭니다.', ''];
md.push('이용 조건 요약: 미술관 공개 소장품(CC0 · 퍼블릭 도메인), 위키미디어 공용(CC BY · CC BY-SA — 저작자 표시), pngimg 누끼(CC BY-NC 4.0 — 비상업 · 출처 표시, 이 게임은 수업 · 개인용이라 해당), Poly Haven · ambientCG 재질(CC0).', '');
for (const group of groups) {
  md.push(`### ${group.name} (${group.items.length})`, '', '| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |', '|---|---|---|---|---|');
  group.items.forEach((item) => md.push(`| ${item.key} | ${item.title.replace(/\|/g, '/')} | ${item.creator.replace(/\|/g, '/')} | ${item.license} | ${item.source} |`));
  md.push('');
}
const doc = fs.readFileSync('docs/ASSET-CREDITS.md', 'utf8');
const marker = '## 실사 에셋(시즌 2 꾸미기 개편';
const head = doc.includes(marker) ? doc.slice(0, doc.indexOf(marker)) : `${doc.trimEnd()}\n\n`;
fs.writeFileSync('docs/ASSET-CREDITS.md', `${head}${md.join('\n')}\n`);
console.log(groups.map((group) => `${group.name} ${group.items.length}`).join(' / '));
console.log('장미 판화 이름', Object.keys(plates).length);
