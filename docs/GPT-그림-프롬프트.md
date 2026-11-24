# GPT 그림 프롬프트 (원카드 시즌 2)

실제 사진 · 명화를 이어 붙이면 오려 붙인 티가 나는 것만 모았습니다. 시즌 1 그림(장미 무도회 · 리얼 로즈가든)과 같은 화풍 · 구도로 맞췄습니다.

## 지금 게임에 들어간 그림(11-24 저녁)
- 캐릭터는 파일 이름(상대 · 나)과 상관없이 그림을 보고 나눴습니다.
  - 상대 15명(카드를 든 그림): 치이카와 · 하치와레 · 우사기 · 랏코 · 짱구 · 체리 · 코난 · 키드 · 케로로 · 하츄핑 · 쿠로미 · 헬로키티 · 포차코 · 한교동 · 장미 공주
  - 내 캐릭터 7명(장미 · 디저트 · 풍선을 든 그림). 동물은 모두 뺐습니다.
    - 처음부터: 춘식이(기본) · 마이멜로디 · 시나모롤
    - 시즌 패스: 폼폼푸린 1단계 · 잔망루피 5단계 · 망그러진 곰 10단계 · 세일러문 19단계
  - 누가 누구인지는 `scripts/build-gpt.mjs` 의 `CHARACTER_FILES` 표에 적었습니다. 새 캐릭터 그림이 오면 표에 한 줄 더합니다.
- 판 · 뒷면 · 앞면은 같은 주제끼리 한 벌(세트)로 묶었습니다. 상자 전용은 피스타치오 한 벌(두 장)뿐입니다.

| 세트 | 판 | 뒷면 | 앞면 | 여는 곳 |
|---|---|---|---|---|
| 장미 정원 7곳 · 베르사유 · 장미 온실 · 꿈빛 왕국 · 블랙 오닉스 | 01~08 · 12~14 | — | — | 원래 아이템 자리 그대로(그림만 바뀜) |
| 달빛 티아라 | — | 07 | 05 | 시즌 패스 3 · 4단계 |
| 진주 조개 | — | 08 | 06 | 시즌 패스 8 · 9단계 |
| 흑임자 몽블랑 | — | 06 | 04 | 시즌 패스 14 · 15단계 |
| 분홍 장미 | — | 04 | — | 시즌 패스 17단계 |
| 왕실 겨울 정원 | 11 | 03 | 02 | 43만 5천 · 44만 5천 · 45만 5천 |
| 밀푀유 파티스리 | 15 | 09 | 07 | 60만 · 62만 · 64만 |
| 두바이 쫀득쿠키 | 19 | 13 | 11 | 70만 · 71만 · 73만 |
| 자수정 | 18 | 12 | 10 | 75만 · 76만 · 78만 |
| 루비 왕관 | 17 | 11 | 09 | 80만 · 81만 · 83만 |
| 황금 장미(효과 · 장난감 · 피날레는 뺌) | 09 | 01 | 01 | 89만 · 90만 5천 · 92만 |
| 백만 송이 장미 | 10 | 02 | — | 뒷면 95만 · 판 100만 |
| 피스타치오 파리브레스트 | — | 05 | 03 | 보상 상자에서만 |

## 다음에 만들 그림 — 승리 연출용 표정 22장(11-24 저녁)
- 이기면 상대가 앞으로 나와 울고, 내 캐릭터가 뛰어올라 장면 한가운데 섭니다.
  - 지금은 원래 그림에 낯빛이 질리는 효과를 입혀 둡니다. 아래 그림이 들어오면 그 자리에 저절로 바뀝니다.
- 만드는 법은 아래 「만드는 법」과 같습니다.
  - **각 프롬프트에 적힌 원래 그림(`gpt그림\` 의 파일)을 함께 첨부**하면 같은 캐릭터 · 같은 화풍으로 나옵니다.
  - 파일 이름은 `울음01` ~ `울음15`, `승리01` ~ `승리07`(번호만 맞으면 뒤는 아무렇게나).
  - 생각 모드 없이 보통 모드로 충분합니다. 배경 투명이 안 되면 흰 배경도 됩니다(제가 지웁니다).

### 우는 상대 15(정사각형, 배경 투명)

**울음01 — 치이카와** · 첨부: `상대2.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Chiikawa who has just lost a card game and is crying: tears pouring like little fountains, mouth trembling in a tiny wavy line. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음02 — 하치와레** · 첨부: `상대3.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Hachiware who has just lost a card game and is crying: big shiny tears, still trying to smile bravely. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음03 — 우사기** · 첨부: `상대4.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Usagi who has just lost a card game and is crying: crying loudly with the mouth wide open, arms flailing, tears flying sideways. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음04 — 랏코** · 첨부: `상대7.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Rakko (the sea otter hunter) who has just lost a card game and is crying: trying to stay cool with arms crossed, a single big tear rolling down, eyes shut tight. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음05 — 짱구** · 첨부: `상대5.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Shin-chan who has just lost a card game and is crying: bawling dramatically with the mouth wide open, snot bubble, cards slipping from his hands. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음06 — 체리** · 첨부: `상대6.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Sakura Kinomoto (Cardcaptor Sakura) who has just lost a card game and is crying: teary eyes and a wobbly "hoe~" mouth, holding her card to her chest. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음07 — 코난** · 첨부: `상대15.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Conan Edogawa (Detective Conan) who has just lost a card game and is crying: frustrated, glasses slipping down the nose, tears in the corners of his eyes, gritting his teeth. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음08 — 키드** · 첨부: `상대16.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Kaito Kid (the phantom thief) who has just lost a card game and is crying: theatrical sorrow, top hat tipped over one eye, one hand on his forehead, a single tear behind the monocle. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음09 — 케로로** · 첨부: `상대12.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Sergeant Keroro who has just lost a card game and is crying: wailing with streams of tears, cap slipping, cards scattering. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음10 — 하츄핑** · 첨부: `상대11.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Hachuping (Catch! Teenieping) who has just lost a card game and is crying: sniffling with big glossy tears, heart decorations drooping. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음11 — 쿠로미** · 첨부: `나2.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Kuromi who has just lost a card game and is crying: angry-crying: pouting, fists clenched, tears at the eye corners, ears drooping. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음12 — 헬로키티** · 첨부: `상대13.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Hello Kitty who has just lost a card game and is crying: teary eyes, bow drooping, hugging her cards sadly (she has no mouth, keep it that way). Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음13 — 포차코** · 첨부: `상대9.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Pochacco who has just lost a card game and is crying: ears drooping all the way down, big tears, sitting down with cards dropped on the floor. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음14 — 한교동** · 첨부: `상대10.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw Hangyodon who has just lost a card game and is crying: crying a little river of tears, lips trembling, fins covering his face. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

**울음15 — 장미 공주** · 첨부: `상대14.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions, same framing. Draw the rose princess who has just lost a card game and is crying: elegant sorrow, a lace handkerchief at her eyes, one tear, holding her card fan limply. Cute and funny sadness, never scary. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character as large in the frame as in the reference.

### 기뻐하는 내 캐릭터 7(정사각형, 배경 투명)

**승리01 — 마이멜로디** · 첨부: `나1.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw My Melody celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding her pink rose high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

**승리02 — 망그러진 곰** · 첨부: `나5.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw Mangeureojin Gom (the squishy yellow bear) celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding his red rose high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

**승리03 — 세일러문** · 첨부: `상대8.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw Sailor Moon celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding her red rose high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

**승리04 — 시나모롤** · 첨부: `나3.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw Cinnamoroll celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding his cinnamon roll high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

**승리05 — 폼폼푸린** · 첨부: `나4.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw Pompompurin celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding his pudding cup high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

**승리06 — 잔망루피** · 첨부: `나6.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw Zanmang Loopy celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding her heart-shaped balloon high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

**승리07 — 춘식이** · 첨부: `상대1.png`

Use the attached picture as the exact character reference: same character design, same art style, same colors and proportions. Draw Choonsik celebrating a victory: jumping for joy with both arms up, sparkling eyes and a big happy smile, holding his roasted sweet potato high in one hand. Full body. Transparent background (PNG), no floor, no shadow, no text. Square 1:1, centered, the character fills about 85% of the frame.

## 어느 모델로 (2026-11-24 확인)
- 그림 모델은 고를 필요가 없습니다. ChatGPT 에서 그림을 부탁하면 최신 그림 모델 **ChatGPT Images 2.6**(11-04 출시)이 저절로 그립니다.
- **생각(추론) 모드를 켜고 그리시는 것을 권합니다.**
  - 위쪽 모델 고르기에서 생각하는 모델(Thinking · 추론 단계 「중간」이나 「높음」)을 고르세요.
  - 생각 모드에서는 그리기 전에 구도를 먼저 짭니다. 그래서 「가운데 탁자는 비우고 가장자리만 꾸미기」 같은 까다로운 요구를 더 잘 지킵니다.
  - 생각 모드는 사용량을 더 쓰고 시간도 더 걸립니다. 상대 캐릭터처럼 단순한 그림은 보통 모드로도 됩니다.
  - 가장 높은 단계(Extra High · Pro 전용)까지는 필요 없습니다.
  - 단계 이름은 앱 판에 따라 조금 다를 수 있습니다.
- **참고 그림을 함께 올리면 화풍이 가장 잘 맞습니다.** `gpt그림\참고\` 에 시즌 1 그림 다섯 장을 꺼내 두었습니다.
  - 판을 만들 때는 `참고-장미무도회-판.png` 를 첨부합니다.
  - 그리고 프롬프트 앞에 「첨부한 그림과 같은 화풍과 시점으로」 한 줄을 붙입니다.
  - 뒷면 · 앞면 테도 같은 방법으로 참고 그림을 첨부합니다.
- 판 여러 장은 한 대화창에서 이어서 만들면 화풍이 서로 비슷하게 유지됩니다.

## 만드는 법
1. 아래 프롬프트를 ChatGPT 에 그대로 붙여 넣습니다(영어 그대로가 화풍이 잘 맞습니다).
2. 마음에 드는 그림을 받아 이 폴더에 넣습니다:
   `C:\Users\user\Documents\인공지능 기초\2026-06-30-onecard-game\gpt그림\`
3. 파일 이름은 **앞의 번호만 맞으면** 됩니다. 뒤는 아무렇게나 두셔도 됩니다(예: `판01.png`, `판01-분홍장미.png` 모두 됨). png · jpg · webp 모두 됩니다.
4. 넣은 뒤 말씀해 주시면 제가 크기를 맞춰 게임에 넣습니다(`node scripts/build-gpt.mjs`). 그림을 하나씩 보고 어느 아이템 · 캐릭터 자리에 둘지 정합니다.

크기:
- 판: 가로 3:2 (1536×1024)
- 카드 뒷면 · 앞면 테: 세로 2:3 (1024×1536)
- 상대 캐릭터: 정사각형 (1024×1024)

마음에 안 들면 같은 프롬프트로 다시 뽑으셔도 됩니다. 판은 「가운데 탁자 면이 비어 있는지」만 꼭 봐 주세요. 그 위에 카드가 올라갑니다.

---

## 1순위 — 상대 캐릭터 8 (정사각형, 배경 투명)

배경 투명이 안 되면 「plain pure white background」 로 바꿔 주세요. 흰 배경은 제가 지웁니다.
GPT 가 캐릭터를 거절하면, 공식 그림(배경이 단색인 것)을 받아 같은 이름으로 넣어 주셔도 됩니다.

### 상대1 — 춘식이
Choonsik (춘식이), the chubby cream-colored cat from Kakao Friends, hugging a roasted sweet potato, sleepy relaxed half-closed eyes and a content smile. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대2 — 치이카와
Chiikawa, the small white bear-like creature from the manga "Chiikawa" by Nagano, holding one tiny playing card with both paws, nervous but determined, eyes a little teary. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대3 — 하치와레
Hachiware, the white cat with the blue-black split-color head from the manga "Chiikawa", cheerful and optimistic, raising one paw with a playing card, bright open smile. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대4 — 우사기
Usagi, the yellow rabbit from the manga "Chiikawa", wild excited expression with mouth wide open as if shouting "Ura!", ears straight up, holding a playing card high in one hand. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대5 — 짱구
Shinnosuke Nohara (Shin-chan) from "Crayon Shin-chan", classic 1990s anime look, red shirt and yellow shorts, mischievous grin, holding a fan of playing cards close to his face like he is hiding his hand. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대6 — 카드캡터 체리
Sakura Kinomoto from the 1998 anime "Cardcaptor Sakura", classic late-90s cel anime style, wearing her pink and white battle costume, holding a glowing magic card in front of her with a confident smile, a few sparkles. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대7 — 랏코
Rakko, the sea otter from the manga "Chiikawa", the top-ranked hunter, calm and cool confident expression, wearing his hunter cape, arms crossed, one playing card held between two fingers. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 상대8 — 세일러문
Sailor Moon (Usagi Tsukino) from the 1992 anime "Sailor Moon", classic early-90s cel animation style, her famous pose with one gloved hand forward, holding a single long-stemmed red rose, soft pink sparkles and a few rose petals. Character portrait for a card game opponent: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

---

## 1순위 — 내 캐릭터 6 (정사각형, 배경 투명)

상대 캐릭터와 따로인 「나만 쓰는 캐릭터」입니다. 상대 캐릭터처럼 참고 그림이 없는 새 대화창에서 만들어 주세요. 파일 이름은 `나1.png` ~ `나6.png` 입니다.
넣으면 로비 오른쪽 위 내 점수 칩 → 「내 프로필」에서 처음부터 고를 수 있습니다. 바꾸고 싶은 캐릭터가 있으면 말씀만 해 주세요.

### 나1 — 마이멜로디
My Melody, the white rabbit with a pink hood and a little flower from Sanrio, holding a small pink rose with both paws, sweet gentle smile. Character portrait for a card game player: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 나2 — 쿠로미
Kuromi from Sanrio, black jester hood with a pink skull, mischievous wink, holding a playing card up near her face. Character portrait for a card game player: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 나3 — 시나모롤
Cinnamoroll, the white puppy with long floppy ears, blue eyes and a curly cinnamon-roll tail from Sanrio, happily hugging a cinnamon roll. Character portrait for a card game player: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 나4 — 폼폼푸린
Pompompurin, the golden-yellow puppy with a small brown beret from Sanrio, sitting next to a custard pudding with caramel on top, content smile. Character portrait for a card game player: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and official art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 나5 — 망그러진 곰
Mangeuroojin Gom (the "broken bear"), the popular Korean character — a soft brown teddy bear with a slightly droopy, imperfect, endearing look, holding a single red rose, shy smile. Character portrait for a card game player: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

### 나6 — 잔망루피
Zanmang Loopy, the pink beaver character from "Pororo the Little Penguin", with her famous half-lidded mischievous expression, holding a heart-shaped balloon. Character portrait for a card game player: upper body, centered, facing the viewer, the character fills about 80% of the frame. Faithful to the original character design and art style, clean crisp outlines, soft shading. Transparent background (PNG). No text, no frame. Square 1:1.

---

## 1순위 — 판 10 (가로 3:2)

판은 모두 같은 틀입니다. 가운데 타원 탁자 면은 **완전히 비어 있어야** 합니다(카드 · 물건 없음).

### 판01 — 분홍 장미 아치 정원 (30만 점대 장미 정원)
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth deep emerald-green velvet with a very subtle damask pattern — nothing on it at all. The table edge is a slim polished brass rim with delicate leaf engravings. Surrounding the table and filling all four edges of the frame: a Parisian rose garden seen from above — arches and garlands of pink climbing roses, white wrought-iron trellises, scattered pink petals on pale gravel paths, small round topiaries. The center stays calm and uncluttered; all decoration is around the outside. Soft golden-hour sunlight from the upper left with a gentle bloom. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, deep saturated colors, no text, no people, no playing cards.

### 판02 — 영국식 장미 정원
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth sage-green felt — nothing on it at all. The table edge is carved light oak wood. Surrounding the table and filling all four edges of the frame: an English cottage rose garden — lush apricot and peach garden roses, lavender borders, a mossy stone path, a white wooden bench, a vintage watering can. The center stays calm and uncluttered; all decoration is around the outside. Soft morning light with a light mist. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, deep saturated colors, no text, no people, no playing cards.

### 판03 — 하얀 장미 테라스
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth dusty-blue velvet — nothing on it at all. The table edge is fine silver filigree. Surrounding the table and filling all four edges of the frame: a white marble terrace whose balustrades overflow with white and blush roses, a small stone fountain, strings of pearls draped over the railing, white petals on the marble floor. The center stays calm and uncluttered; all decoration is around the outside. Bright soft daylight, airy and elegant. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판04 — 붉은 장미 터널
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth deep burgundy velvet with a very subtle damask pattern — nothing on it at all. The table edge is ornate gold filigree. Surrounding the table and filling all four edges of the frame: a tunnel of red climbing roses arching over and around the table, red petals drifting through the air, small brass lanterns hanging from the rose arches. The center stays calm and uncluttered; all decoration is around the outside. Warm sunset light. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, deep saturated colors, no text, no people, no playing cards.

### 판05 — 호숫가 노란 장미
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth navy-blue velvet — nothing on it at all. The table edge is polished gold with tiny rose motifs. Surrounding the table and filling all four edges of the frame: yellow and cream roses along a lakeside promenade, calm blue water with reflections along the top edge, a white gazebo, a few swans in the distance. The center stays calm and uncluttered; all decoration is around the outside. Late afternoon golden glow. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판06 — 분홍 장미 파빌리온
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth blush-pink satin — nothing on it at all. The table edge is polished rose-gold. Surrounding the table and filling all four edges of the frame: a romantic pink rose pavilion with lace curtains, cascading pink and white roses, small side tables with porcelain teacups, macarons and a tiered cake stand. The center stays calm and uncluttered; all decoration is around the outside. Dreamy soft light. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판07 — 밤의 장미 정원
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth midnight-blue velvet — nothing on it at all. The table edge is ornate gold. Surrounding the table and filling all four edges of the frame: a rose garden at night — red and pink roses lit by glowing lanterns and string lights, candles in glass jars, a stone fountain reflecting the full moon along the top edge. The center stays calm and uncluttered; all decoration is around the outside. Moonlight mixed with warm lantern glow. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판08 — 베르사유 거울의 방
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth deep crimson velvet with a subtle gold damask pattern — nothing on it at all. The table edge is a heavy gilded baroque rim. Surrounding the table and filling all four edges of the frame: the Hall of Mirrors of a baroque palace — gilded mirrors, sparkling crystal chandeliers, gold candelabras with lit candles, tall gold vases of red roses, a polished parquet floor. The center stays calm and uncluttered; all decoration is around the outside. Warm candlelight and chandelier sparkle. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, deep saturated colors, no text, no people, no playing cards.

### 판09 — 황금 장미의 방
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth black velvet with a faint gold damask pattern — nothing on it at all. The table edge is ornate polished gold decorated with tiny golden roses. Surrounding the table and filling all four edges of the frame: a luxurious black-and-gold salon filled with metallic 24-karat gold roses (real polished metal with bright specular highlights, not yellow paint, not ochre), gold candelabras with lit candles, black marble pillars, gold-leaf petals scattered on a black marble floor. The center stays calm and uncluttered; all decoration is around the outside. Warm candlelight making the gold gleam against deep black. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판10 — 백만 송이 장미 (50만 점 마지막 보상)
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth deep crimson velvet — nothing on it at all. The table edge is ornate gold. Surrounding the table and filling all four edges of the frame: the table floats in an endless sea of red roses that fills every edge and stretches to the horizon, red petals swirling in the air. The center stays calm and uncluttered; all decoration is around the outside. A glowing sunset sky along the top edge with warm rim light on the roses. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, deep saturated colors, no text, no people, no playing cards.

---

## 1순위 — 황금 장미 카드 2 (세로 2:3)

### 뒷면01 — 황금 장미 카드 뒷면
The back of a single luxury playing card, portrait 2:3, the design fills the whole image edge to edge with slightly rounded corners. Perfectly symmetrical ornamental design, mirrored left-right and top-bottom like a real luxury card back. In the center, a single metallic 24-karat gold rose inside an oval medallion; around it, intricate polished gold filigree with tiny gold roses and leaves on deep black velvet, and a fine double gold border around the edge. Real metallic gold with bright highlights, not ochre or mustard. Semi-realistic fantasy digital painting, intricate, rich detail, soft glow, no text, no letters, no numbers.

### 앞면01 — 황금 장미 카드 앞면 테
A decorative border frame for the FRONT of a playing card, portrait 2:3. The center area (about 80% of the width and 84% of the height) is plain, smooth, empty warm ivory paper — leave it completely blank: no symbols, no letters, no numbers, no pictures. Only a narrow border is decorated: thin polished gold filigree vines with tiny metallic gold roses and leaves, a small gold rose in each corner. Elegant and light, the border no wider than about 8% of the card width. Semi-realistic digital painting, fine detail, no text.

---

## 2순위 — 있으면 좋은 것 8

### 판11 — 왕실 겨울 정원
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth pale ice-blue velvet — nothing on it at all. The table edge is polished silver. Surrounding the table and filling all four edges of the frame: a royal winter glasshouse with white roses and white camellias, frosted glass panes, soft snow visible outside, silver candelabras. The center stays calm and uncluttered; all decoration is around the outside. Cool soft daylight. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판12 — 장미 온실 (시즌 1 「장미 온실」 맵을 새로)
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth soft sage-green velvet — nothing on it at all. The table edge is white-painted wrought iron with brass details. Surrounding the table and filling all four edges of the frame: a Victorian glass conservatory with potted pink and red roses, ferns and palms, a porcelain tea set on a side table, sunlight through the glass roof. The center stays calm and uncluttered; all decoration is around the outside. Bright warm sunlight. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판13 — 꿈빛 왕국 (시즌 1 「꿈빛 왕국 테이블」을 새로)
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, smooth lilac velvet — nothing on it at all. The table edge is ornate gold. Surrounding the table and filling all four edges of the frame: a fairy-tale castle balcony at sunset with lilac and peach clouds, castle towers in the distance, a jeweled crown and pearl necklaces on cushions, wisteria hanging from above. The center stays calm and uncluttered; all decoration is around the outside. Dreamy dusk light. Semi-realistic fantasy digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 판14 — 블랙 오닉스
A high-angle view looking down at about 65 degrees onto an ornate oval card table, landscape composition. The oval tabletop is centered and fills about 70% of the image width and 70% of its height. The tabletop is a completely empty, polished black onyx with faint silver veins — nothing on it at all. The table edge is brushed silver. Surrounding the table and filling all four edges of the frame: a penthouse lounge at night overlooking glittering city lights through tall windows, crystal glasses, a few loose diamonds on black velvet, chrome and glass details. The center stays calm and uncluttered; all decoration is around the outside. Cool moonlight with city glow. Semi-realistic digital painting, painterly realism like a premium mobile card game, rich detail, no text, no people, no playing cards.

### 뒷면02 — 백만 송이 장미 카드 뒷면
The back of a single luxury playing card, portrait 2:3, the design fills the whole image edge to edge with slightly rounded corners. Perfectly symmetrical ornamental design, mirrored left-right and top-bottom like a real luxury card back. In the center, a mandala made of many deep red roses inside a round medallion; around it, polished gold filigree and small red roses on deep crimson, with a fine double gold border around the edge. Semi-realistic fantasy digital painting, intricate, rich detail, soft glow, no text, no letters, no numbers.

### 뒷면03 — 하얀 장미 카드 뒷면
The back of a single luxury playing card, portrait 2:3, the design fills the whole image edge to edge with slightly rounded corners. Perfectly symmetrical ornamental design, mirrored left-right and top-bottom like a real luxury card back. In the center, a single white rose inside an oval medallion framed with pearls; around it, fine silver filigree with small white roses and pale green leaves on soft powder-blue, with a fine double silver border around the edge. Semi-realistic fantasy digital painting, intricate, rich detail, soft glow, no text, no letters, no numbers.

### 뒷면04 — 분홍 장미 정원 카드 뒷면
The back of a single luxury playing card, portrait 2:3, the design fills the whole image edge to edge with slightly rounded corners. Perfectly symmetrical ornamental design, mirrored left-right and top-bottom like a real luxury card back. In the center, a lush pink garden rose inside a round medallion; around it, rose-gold filigree with climbing pink roses and sage-green leaves on blush pink, with a fine double rose-gold border around the edge. Semi-realistic fantasy digital painting, intricate, rich detail, soft glow, no text, no letters, no numbers.

### 앞면02 — 하얀 장미 · 진주 카드 앞면 테
A decorative border frame for the FRONT of a playing card, portrait 2:3. The center area (about 80% of the width and 84% of the height) is plain, smooth, empty white paper — leave it completely blank: no symbols, no letters, no numbers, no pictures. Only a narrow border is decorated: delicate white roses, tiny pearls and thin silver vines, a small white rose in each corner. Elegant and light, the border no wider than about 8% of the card width. Semi-realistic digital painting, fine detail, no text.
