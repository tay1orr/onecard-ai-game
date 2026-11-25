# ONE! 시즌 2 — 에셋 출처

시즌 2 화면에 쓰는 그림 · 소리 · 글꼴의 출처와 이용 조건입니다. 원본은 `npm run assets:fetch`로 받고(`.asset-cache/`, git 에 올리지 않음) `npm run assets:build`로 줄여 `public/assets/s2/`에 둡니다.

| 쓰는 곳 | 에셋 | 만든 곳 · 조건 |
|---|---|---|
| 캐릭터 · 아바타 · 장식 · 아이콘 그림(`m/`) | Fluent Emoji 3D | Microsoft — MIT · https://github.com/microsoft/fluentui-emoji |
| 움직이는 캐릭터 · 장난감 · 효과(`a/`) | Fluent Emoji Animated | Microsoft — MIT · https://github.com/microsoft/fluentui-emoji-animated |
| 카드 · 칩 · 주사위 소리 | Casino Audio | Kenney — CC0 · https://opengameart.org/content/54-casino-sound-effects-cards-dice-chips |
| 단추 · 창 소리 | Interface Sounds | Kenney — CC0 · https://opengameart.org/content/interface-sounds |
| 승리 · 패배 · 보상 잔음악 | Music Jingles | Kenney — CC0 · https://opengameart.org/content/85-short-music-jingles |
| 탁자 펠트 | Felt backgrounds | OpenGameArt — CC0 · https://opengameart.org/content/felt-backgrounds |
| 나무 · 가죽 · 대리석 · 종이 · 리넨 · 코듀로이 질감 | Wood066 · Wood052 · Leather026 · Marble006 · Paper005 · Fabric030 · Fabric026 | ambientCG — CC0 · https://ambientcg.com |
| 리얼 로즈 테마 사진 | 장미 사진 3장 | 선생님이 찍으신 사진 |
| 글꼴 | Pretendard | 길형진 — SIL OFL 1.1 · https://github.com/orioncactus/pretendard |
| 글꼴 | Big Shoulders Display | Patric King — SIL OFL 1.1 (Fontsource) |
| 움직임 | GSAP 3 | GreenSock / Webflow — 무료 표준 라이선스 · https://gsap.com |

수업 자료로도 쓰기 때문에 출처는 이 파일과 코드 주석에 남깁니다.

## 실사 에셋(시즌 2 꾸미기 개편, 11-24)

꾸미기 아이템은 실제 사진 · 명화 · 옛 카드 · 재질 사진으로 그립니다. 원본은 `.asset-cache/real/`(git 제외), 줄인 파일은 `public/assets/s2/r/` · `t/`. 줄이기는 `node scripts/build-real.mjs`, 이 표는 `node scripts/credits.mjs` 로 만듭니다.

이용 조건 요약: 미술관 공개 소장품(CC0 · 퍼블릭 도메인), 위키미디어 공용(CC BY · CC BY-SA — 저작자 표시), pngimg 누끼(CC BY-NC 4.0 — 비상업 · 출처 표시, 이 게임은 수업 · 개인용이라 해당), Poly Haven · ambientCG 재질(CC0).

### 카드 뒷면 그림(명화 · 식물화 · 사진) (44)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| redoute-01 | Les Roses: Rosa Gallica Purpurea Velutina, Parva | Pierre-Joseph Redouté (painter); stipple engraving by Langlois | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1965.293 |
| redoute-02 | Les Roses, vol. 1 (1817): Rosa Centifolia | Pierre-Joseph Redouté | Public domain | https://archive.org/details/lesroses1817pjre/page/n34/mode/1up |
| redoute-03 | Les Roses, vol. 1 (1817): Rosa Centifolia Carnea | Pierre-Joseph Redouté | Public domain | https://archive.org/details/lesroses1817pjre/page/n130/mode/1up |
| redoute-04 | Les Roses, vol. 1 (1817): Rosa Eglanteria | Pierre-Joseph Redouté | Public domain | https://archive.org/details/lesroses1817pjre/page/n112/mode/1up |
| redoute-05 | Les Roses, vol. 1 (1817): Rosa Gallica Versicolor | Pierre-Joseph Redouté | Public domain | https://archive.org/details/lesroses1817pjre/page/n228/mode/1up |
| redoute-06 | ‘Empress Josephine’ or Frankfort Rose (Rosa turbinata), from "Les Roses" by Claude-Antoin… | Pierre Joseph Redouté, French (born Belgium), Saint-Hubert 1759–1840 … | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/762055 |
| redoute-07 | Les Roses, vol. 3 (1824): Rosa Gallica Agatha (var. Regalis) | Pierre-Joseph Redouté (painter); engraved by Langlois | Public domain | https://archive.org/details/lesroses1824pjre/page/n128/mode/1up |
| redoute-08 | Les Roses, vol. 1 (1817): Rosa Muscosa Alba | Pierre-Joseph Redouté | Public domain | https://archive.org/details/lesroses1817pjre/page/n146/mode/1up |
| redoute-09 | Les Roses: Rosa Gallica Agatha (Varietas parva violacea) | Pierre-Joseph Redouté (painter); museum record lists Henri Joseph Red… | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1943.139 |
| redoute-10 | Les Roses: Rosa Indica Vulgaris | Pierre-Joseph Redouté (painter); museum record lists Henri Joseph Red… | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1943.138 |
| redoute-11 | Les Roses, vol. 1 (1817): Rosa Eglanteria var. Punicea | Pierre-Joseph Redouté | Public domain | https://archive.org/details/lesroses1817pjre/page/n116/mode/1up |
| redoute-12 | Les Roses: Rosa Centifolia Anglica Rubra | Pierre-Joseph Redouté (painter); museum record lists Henri Joseph Red… | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1943.137 |
| fantin-roses | Roses in a Bowl | Henri Fantin-Latour, French, Grenoble 1836–1904 Buré | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/437995 |
| vangogh-roses | Roses | Vincent van Gogh, Dutch, Zundert 1853–1890 Auvers-sur-Oise | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/436534 |
| vangogh-irises | Irises | Vincent van Gogh, Dutch, Zundert 1853–1890 Auvers-sur-Oise | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/436528 |
| vangogh-almond | Almond Blossom | Vincent van Gogh | Public domain | https://commons.wikimedia.org/wiki/File:Amandelbloesem_-_s0176V1962_-_Van_Gogh_Museum.jpg |
| huysum-flowers | Vase of Flowers | Jan van Huysum | Public domain | https://commons.wikimedia.org/wiki/File:Jan_van_Huysum_(Dutch_-_Vase_of_Flowers_-_Google_Art_Project.jpg |
| ruysch-flowers | Still Life with Flowers | Rachel Ruysch | Public domain | https://commons.wikimedia.org/wiki/File:Rachel_Ruysch_-_Still-Life_with_Flowers_-_Google_Art_Project.jpg |
| bosschaert-flowers | Flowers in a Glass | Ambrosius Bosschaert (Dutch, 1573–1621) | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1960.108 |
| mucha-rose | La Rose (The Rose), from the series Les Fleurs (The Flowers) | Alphonse Mucha (artist); photograph by Tylwyth Eldar | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Alfons_Mucha_-_La_Rose.jpg |
| mucha-lily | Le Lys (The Lily), from the series Les Fleurs (The Flowers) | Alphonse Mucha (artist); photograph by Tylwyth Eldar | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Alfons_Mucha_-_Le_Lys.jpg |
| klimt-roses | Rosebushes under the Trees | Gustav Klimt | Public domain | https://commons.wikimedia.org/wiki/File:Gustav_Klimt_-_Rosebushes_under_the_Trees_-_Google_Art_Project.jpg |
| monet-waterlilies | Pond with Water Lilies | Claude Monet | Public domain | https://commons.wikimedia.org/wiki/File:Claude_Monet_-_Pond_with_Water_Lilies_-_Google_Art_Project.jpg |
| renoir-roses | Roses in a Vase | Pierre-Auguste Renoir (French, 1841–1919) | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1941.14 |
| morris-rose | Pink and Rose | William Morris, British, Walthamstow, London 1834–1896 Hammersmith, L… | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/337071 |
| morris-trellis | Trellis | William Morris, British, Walthamstow, London 1834–1896 Hammersmith, L… | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/384020 |
| morris-strawberry | Strawberry Thief | William Morris (British, 1834–1896) | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1937.696 |
| japanese-peony | Lacquer Paintings of Various Subjects: Peonies | Shibata Zeshin, Japanese, 1807–1891 | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/57193 |
| japanese-cherry | Suijin Shrine and Massaki on the Sumida River (Sumidagawa Suijin no mori Massaki), from O… | Utagawa Hiroshige | Public domain | https://commons.wikimedia.org/wiki/File:NDL-DC_1303239-Utagawa_Hiroshige-%E5%90%8D%E6%89%80%E6%B1%9F%E6%88%B8%E7%99%BE%E6%99%AF_%E9%9A%85%E7%94%B0%E5%B7%9D%E6%B0%B4%E7%A5%9E%E3%81%AE%E6%A3%AE%E7%9C%9F%E5%B4%8E-crd.jpg |
| rose-damask | Length of dress silk | Unknown weaver | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/765505 |
| rose-window | West rose window, Sainte-Chapelle, Paris | Photograph by Diego Delso | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Sainte-Chapelle_west_rose.webp |
| hubble-rose | Arp 273 (UGC 1810 and UGC 1813), the 'rose' of galaxies | NASA, ESA, and the Hubble Heritage Team (STScI/AURA) | Public domain (NASA) | https://commons.wikimedia.org/wiki/File:UGC_1810_and_UGC_1813_in_Arp_273_(captured_by_the_Hubble_Space_Telescope).jpg |
| strawberry-plate | Fragaria (strawberry), USDA Pomological Watercolor POM00004399 | Ellen Isham Schutt | Public domain (U.S. Government work) | https://commons.wikimedia.org/wiki/File:Pomological_Watercolor_POM00004399.jpg |
| celestial-map | Scenographia Systematis Mundani Ptolemaici, from Harmonia Macrocosmica | Andreas Cellarius | Public domain | https://commons.wikimedia.org/wiki/File:Scenographia_Systematis_Mundani_Ptolemaici_by_Cellarius_(1708).jpg |
| star-candy | Konpeito (kompeito), Japanese star sugar candy | Photograph by Midori | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Kompeito_konpeito.JPG |
| kandinsky-comp8 | Composition VIII | Wassily Kandinsky | Public domain (artwork); photo released CC0 by uploader Xyxyzyz | https://commons.wikimedia.org/wiki/File:Kandinsky_-_Composition_8,_July_1923.jpg |
| jade-carving | Disk with antiquarian theme | China | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/41741 |
| orrery | Orrery clock | Louis Thouverez, French, master 1788– died after 1823 | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/785846 |
| great-wave | Under the Wave off Kanagawa (Kanagawa oki nami ura), also known as The Great Wave, from t… | Katsushika Hokusai, Japanese, Tokyo (Edo) 1760–1849 Tokyo (Edo) | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/45434 |
| whale-galaxy | NGC 4631, the Whale Galaxy | KPNO/NOIRLab/NSF/AURA/John Vickery and Jim Matthes/Adam Block | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:NGC_4631-_The_Whale_(noao-n4631vickery).jpg |
| bookbinding | Bookbinding for a Qur'an | Turkey, Istanbul, Ottoman period, 15th century | CC0 1.0 (Cleveland Museum of Art Open Access) | https://clevelandart.org/art/1944.495 |
| dream-castle | Neuschwanstein Castle at sunset | Photograph by Michael Schlöffel (michaelmuc68) | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Castle_Neuschwanstein_sunset_-_Flickr_-_michaelmuc68.jpg |
| classic-engraving | Ornamental Frame with Garlands | Anonymous, 18th century | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/380430 |
| sunburst-gold | Monstrance | Diego de Atienza, Spanish, born Luja (present-day Ecuador) 1610, acti… | CC0 1.0 (The Met Open Access) | https://www.metmuseum.org/art/collection/search/197090 |

### 그림카드 · 에이스 · 조커(옛 카드 · 명화) (63)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| english/KS | English pattern king of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KS-full | English pattern king of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KH | English pattern king of hearts | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KH-full | English pattern king of hearts | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KD | English pattern king of diamonds | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KD-full | English pattern king of diamonds | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KC | English pattern king of clubs | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/KC-full | English pattern king of clubs | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QS | English pattern queen of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QS-full | English pattern queen of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QH | English pattern queen of hearts | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QH-full | English pattern queen of hearts | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QD | English pattern queen of diamonds | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QD-full | English pattern queen of diamonds | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QC | English pattern queen of clubs | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/QC-full | English pattern queen of clubs | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JS | English pattern jack of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JS-full | English pattern jack of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JH | English pattern jack of hearts | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JH-full | English pattern jack of hearts | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JD | English pattern jack of diamonds | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JD-full | English pattern jack of diamonds | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JC | English pattern jack of clubs | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/JC-full | English pattern jack of clubs | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/AS | English pattern ace of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| english/AS-full | English pattern ace of spades | Dmitry Fomin (Дмитрий Фомин) | CC0 1.0 (public domain dedication) | https://commons.wikimedia.org/wiki/File:English_pattern_playing_cards_deck.svg |
| cloisters/K | King of Horns, from The Cloisters Playing Cards | South Netherlandish, unknown maker | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/475526 |
| cloisters/Q | Queen of Horns, from The Cloisters Playing Cards | South Netherlandish, unknown maker | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/475527 |
| cloisters/J | Knave of Horns, from The Cloisters Playing Cards | South Netherlandish, unknown maker | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/475528 |
| cloisters/A | 1 of Horns, from The Cloisters Playing Cards | South Netherlandish, unknown maker | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/475538 |
| tarot/K | The King (from the Tarocchi, series E: Conditions of Man, #8) | Master of the E-Series Tarocchi (Italian, active 1460s) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1924.432.8 |
| tarot/Q | Prudence (from the Tarocchi, series B: Cosmic Principles & Virtues, #35) | Master of the E-Series Tarocchi (Italian, active 1460s) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1924.432.35 |
| tarot/J | The Knight (from the Tarocchi, series E: Conditions of Man, #6) | Master of the E-Series Tarocchi (Italian, active 1460s) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1924.432.6 |
| tarot/A | Sun (from the Tarocchi, series A: Firmaments of the Universe, #44) | Master of the E-Series Tarocchi (Italian, active 1460s) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1924.432.44 |
| ink/K | Inwang jesaekdo (Clearing after rain on Mount Inwang) 정선필 인왕제색도 | Jeong Seon 겸재 정선 (1676–1759) | KOGL Type 1 (공공누리 제1유형: 출처표시 — attribution required) | https://www.emuseum.go.kr/detail?relicId=PS0100100102400000100000 |
| ink/Q | Ink bamboo 묵죽도 (墨竹圖) | Yi Jeong 탄은 이정 (1554–1626) | KOGL Type 1 (공공누리 제1유형: 출처표시 — attribution required) | https://www.emuseum.go.kr/detail?relicId=PS0100100102400359200000 |
| ink/J | Dancing boy (무동), from Danwon pungsokdo-cheop 춤추는 아이, 《단원 풍속도첩》 | Kim Hong-do 단원 김홍도 (1745–c.1806) | KOGL Type 1 (공공누리 제1유형: 출처표시 — attribution required) | https://www.emuseum.go.kr/detail?relicId=PS0100100100100650400024 |
| ink/A | Plum blossoms and moon 이방운 필 월매도 (月梅圖) | Yi Bang-un 이방운 (1761–after 1815) | KOGL Type 1 (공공누리 제1유형: 출처표시 — attribution required) | https://www.emuseum.go.kr/detail?relicId=PS0100100100900234800000 |
| fairy/K | "The King went into the Castle, and at first his Queen didn't know him…" (East of the Sun… | Kay Nielsen | Public domain (published before 1929; see note) | https://archive.org/details/eastofsunwestofm00asbj_1/page/n136/mode/1up |
| fairy/Q | The Snow Queen on her ice throne (plate for "The Snow Queen", Stories from Hans Andersen) | Edmund Dulac | Public domain | https://archive.org/details/storiesfromhansa00anderich/page/n84/mode/1up |
| fairy/J | Prince Camaralzaman and the Birds (Princess Badoura, p. 72) | Edmund Dulac (story retold by Laurence Housman) | Public domain | https://archive.org/details/princessbadourat00hous/page/n96/mode/1up |
| fairy/A | "She could not help setting the door a little ajar, just to peep in, when—Pop! out flew t… | Kay Nielsen | Public domain (published before 1929; see note) | https://archive.org/details/eastofsunwestofm00asbj_1/page/n86/mode/1up |
| patent/K | Flying-Machine, U.S. Patent No. 821,393, sheet 1 (Fig. 1) | Orville & Wilbur Wright (inventors) | Public domain (U.S. patent document) | https://patents.google.com/patent/US821393A/en |
| patent/Q | Design for a Statue (Liberty Enlightening the World), U.S. Design Patent No. 11,023 | Auguste Bartholdi | Public domain (U.S. patent document) | https://patents.google.com/patent/USD11023S/en |
| patent/J | Improvement in Telegraphy (the telephone), U.S. Patent No. 174,465, sheet 2 (Figs. 6–7) | Alexander Graham Bell | Public domain (U.S. patent document) | https://patents.google.com/patent/US174465A/en |
| patent/A | Electric-Lamp, U.S. Patent No. 223,898 (Fig. 1) | Thomas A. Edison | Public domain (U.S. patent document) | https://patents.google.com/patent/US223898A/en |
| potter/K | Old Brown the owl receiving the squirrels' gifts (The Tale of Squirrel Nutkin, p. 19) | Beatrix Potter | Public domain | https://archive.org/details/taleofsquirrelnu00pottuoft/page/n20/mode/1up |
| potter/Q | Jemima Puddle-Duck in her bonnet and shawl meets the foxy-whiskered gentleman (The Tale o… | Beatrix Potter | Public domain | https://archive.org/details/taleofjemimapudd00pottiala/page/n9/mode/1up |
| potter/J | Peter Rabbit in his blue jacket with the bundle of onions (The Tale of Benjamin Bunny, p.… | Beatrix Potter | Public domain | https://archive.org/details/taleofbenjaminbu00pottuoft/page/n36/mode/1up |
| potter/A | Squirrel Nutkin on a branch (The Tale of Squirrel Nutkin) | Beatrix Potter | Public domain | https://archive.org/details/taleofsquirrelnu00pottuoft/page/n9/mode/1up |
| antiquity/K | Head of King Seti II Wearing the Blue Crown | Ancient Egyptian (New Kingdom, Dynasty 19) | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/544752 |
| antiquity/Q | Terracotta amphora (jar) | Attributed to the Berlin Painter (Greek, Attic) | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/254896 |
| antiquity/J | Male Figure (Moai Kavakava) | Rapa Nui artist (Easter Island) | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/313680 |
| antiquity/A | Mammalian disk | Carchi-Nariño (Capulí) artist, Colombia/Ecuador | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/312720 |
| botanical/K | Rosa Centifolia Anglica Rubra (Rosier de Cumberland), from Les Roses | Henri Joseph Redouté (French, 1766–1853) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1943.137 |
| botanical/Q | Chinese Tree Peony (Paeonia suffruticosa) | Smith (British) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1939.288 |
| botanical/J | Study of a Tulip (Ammirael Winckel) | Pieter Holsteyn II (Dutch, c.1612–1673) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/2019.4 |
| botanical/A | Pompon Rose (Rosa Pomponia Burgundiaca, Le Pompon de Bourgogne), from Les Roses | Pierre-Joseph Redouté (French, 1759–1840) | CC0 1.0 (CMA Open Access) | https://clevelandart.org/art/1943.142 |
| jokers/joker-1 | Joker (the Fool / Sküs card of an animal-tarock deck) | Anonymous (Dutch or German card maker) | Public Domain Mark 1.0 (Rijksmuseum open data; metadata CC0) | https://www.rijksmuseum.nl/en/collection/KOG-ZG-1-36-101-1 |
| jokers/joker-2 | Figure with sausages on a stick (trump I, the Pagat / Hanswurst fool, same animal-tarock … | Anonymous (Dutch or German card maker) | Public Domain Mark 1.0 (Rijksmuseum open data; metadata CC0) | https://www.rijksmuseum.nl/en/collection/KOG-ZG-1-36-101-2 |
| aces/spade-1 | Russia, Ace of Spades from the "Jeu Impérial – Second Empire – Napoleon III" playing cards | B.P. Grimaud, Paris (manufacturer F. Chardon) | CC0 1.0 (Smithsonian Open Access) | https://collection.cooperhewitt.org/view/objects/asitem/id/128975 |
| ornaments/deco-frame | Arabesque Cartouche | Anonymous, French, 18th century | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/343566 |
| ornaments/victorian-corners | Designs for borders and corners, acanthus | Robert William Hume | CC0 1.0 (Met Open Access, public domain) | https://www.metmuseum.org/art/collection/search/391740 |

### 맵 · 승리 배경 사진 (38)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| rose-garden-1 | Bagatelle roseraie classique01 | Spedona ( Spedona ) | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Bagatelle_roseraie_classique01.jpg |
| rose-garden-2 | Rose Garden at Huntington Library in Pasadena, California. April 2022 20220418 160351 | Steveshelokhonov | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Rose_Garden_at_Huntington_Library_in_Pasadena,_California._April_2022_20220418_160351.jpg |
| rose-garden-3 | RNRS gardens inc pergola | RNRS Rose Society | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:RNRS_gardens_inc_pergola.JPG |
| rose-garden-4 | Rosarium Westfalenpark Dortmund - panoramio (6) | Sebastian “sebrem” B… | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Rosarium_Westfalenpark_Dortmund_-_panoramio_(6).jpg |
| rose-garden-5 | Pörtschach Johannes-Brahms-Promenade Kletterrosen 04062025 5949 | Johann Jaritz | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:P%C3%B6rtschach_Johannes-Brahms-Promenade_Kletterrosen_04062025_5949.jpg |
| rose-garden-6 | 광주대학교 장미터널 | 조원정 | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:%EA%B4%91%EC%A3%BC%EB%8C%80%ED%95%99%EA%B5%90_%EC%9E%A5%EB%AF%B8%ED%84%B0%EB%84%90.jpg |
| rose-field | Rose fields Vampula 1 | kallerna | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Rose_fields_Vampula_1.jpg |
| rose-arch-night | Ishida Rose Garden at night | 掬茶 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Ishida_Rose_Garden_at_night.jpg |
| tulip-field | De Cocksdorp tulip fields 1 | Ymblanter | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:De_Cocksdorp_tulip_fields_1.jpg |
| lavender-field | Lavender fileds in Valensole | Nuno Alves | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Lavender_fileds_in_Valensole.jpg |
| hydrangea | Flickr - ronsaunders47 - FLOWERY PATH IN VENTNOR. | Ronald Saunders from Warrington, UK | CC BY-SA 2.0 | https://commons.wikimedia.org/wiki/File:Flickr_-_ronsaunders47_-_FLOWERY_PATH_IN_VENTNOR..jpg |
| wisteria | Wisteria Tunnel in Kawachi Wisteria Garden 20150509-3 | そらみみ (Soramimi) | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Wisteria_Tunnel_in_Kawachi_Wisteria_Garden_20150509-3.JPG |
| lotus-pond | Water-lily pond (Giverny) (3) | Avi1111 dr. avishai teicher | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Water-lily_pond_(Giverny)_(3).jpg |
| peony-garden | Peonies - Ueno Tōshō-gū Peony Garden - DSC01900 | Daderot | CC0 | https://commons.wikimedia.org/wiki/File:Peonies_-_Ueno_T%C5%8Dsh%C5%8D-g%C5%AB_Peony_Garden_-_DSC01900.JPG |
| sunflower-field | Sunflower field - panoramio (11) | Björn S. | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Sunflower_field_-_panoramio_(11).jpg |
| cherry-park | Rail tracks and cherry trees in Ashino Park | 掬茶 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Rail_tracks_and_cherry_trees_in_Ashino_Park.jpg |
| ballroom-mirrors | Chateau Versailles Galerie des Glaces | Myrabella | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Chateau_Versailles_Galerie_des_Glaces.jpg |
| opera-garnier | Paris Opéra Garnier Innen Grand Foyer 06 | Zairon | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Paris_Op%C3%A9ra_Garnier_Innen_Grand_Foyer_06.jpg |
| palace-gallery | Genova Palazzo Reale Interno Galleria degli Specchi 3 | Zairon | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Genova_Palazzo_Reale_Interno_Galleria_degli_Specchi_3.jpg |
| library-grand | Long Room Interior, Trinity College Dublin, Ireland - Diliff | Diliff | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Long_Room_Interior,_Trinity_College_Dublin,_Ireland_-_Diliff.jpg |
| glasshouse | View to roof in center of Palm House, Kew Gardens | Daniel Case | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:View_to_roof_in_center_of_Palm_House,_Kew_Gardens.jpg |
| winter-garden | Serres royales de Laeken (int.) J3 | Jamain | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Serres_royales_de_Laeken_(int.)_J3.jpg |
| card-room | Billiards Room, Biltmore House, Biltmore Estate, Asheville, NC (32852899048) | Warren LeMay from Cincinnati, OH, United States | CC0 | https://commons.wikimedia.org/wiki/File:Billiards_Room,_Biltmore_House,_Biltmore_Estate,_Asheville,_NC_(32852899048).jpg |
| cafe-terrace | La Maison Rose, Montmartre 23 July 2012 | btwashburn | CC BY 2.0 | https://commons.wikimedia.org/wiki/File:La_Maison_Rose,_Montmartre_23_July_2012.jpg |
| patisserie | Vitrine de la pâtisserie L. Bourbon à Brive-la-Gaillarde, France | Le grand Cricri | CC BY-SA 3.0 | https://commons.wikimedia.org/wiki/File:Vitrine_de_la_p%C3%A2tisserie_L._Bourbon_%C3%A0_Brive-la-Gaillarde,_France.JPG |
| aquarium | Okinawa Churaumi Aquarium 3 | Bernie Ongewe | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Okinawa_Churaumi_Aquarium_3.jpg |
| fairy-castle | Drone view castle and horizon (Unsplash) | Johannes Plenio jplenio | CC0 | https://commons.wikimedia.org/wiki/File:Drone_view_castle_and_horizon_(Unsplash).jpg |
| night-meadow | Lockett Meadow (34670455862) | Coconino National Forest | CC0 | https://commons.wikimedia.org/wiki/File:Lockett_Meadow_(34670455862).jpg |
| night-city | N Seoul Tower view 2 | kallerna | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:N_Seoul_Tower_view_2.jpg |
| fireworks-1 | Red fireworks, Rostov-on-Don, Russia | Vyacheslav Argenberg | CC BY 4.0 | https://commons.wikimedia.org/wiki/File:Red_fireworks,_Rostov-on-Don,_Russia.jpg |
| fireworks-2 | Display Red, blue, and white fireworks McKinney TX 2026 | Ranch9613 | CC0 | https://commons.wikimedia.org/wiki/File:Display_Red,_blue,_and_white_fireworks_McKinney_TX_2026.jpg |
| fireworks-3 | Tulln Gartenbaumesse Feuerwerk 20190831 09 | Uoaei1 | CC BY-SA 4.0 | https://commons.wikimedia.org/wiki/File:Tulln_Gartenbaumesse_Feuerwerk_20190831_09.jpg |
| stage-curtain | Curtain-939464 | tommybuddy | CC0 | https://commons.wikimedia.org/wiki/File:Curtain-939464.jpg |
| concert-lights | Smoke and light beams (Unsplash) | Daniel Robert danielrobertdinu | CC0 | https://commons.wikimedia.org/wiki/File:Smoke_and_light_beams_(Unsplash).jpg |
| aurora | Lofoten, Norway (Unsplash) | Johannes Groll followhansi | CC0 | https://commons.wikimedia.org/wiki/File:Lofoten,_Norway_(Unsplash).jpg |
| moon-full | Moon nearside LRO 5000 | NASA/GSFC/Arizona State University | Public domain | https://commons.wikimedia.org/wiki/File:Moon_nearside_LRO_5000.jpg |
| sun-sdo | The Sun by the Atmospheric Imaging Assembly of NASA's Solar Dynamics Observatory - 201008… | NASA/SDO (AIA) | Public domain | https://commons.wikimedia.org/wiki/File:The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg |
| crab-nebula | Crab Nebula | NASA , ESA , J. Hester and A. Loll (Arizona State University) | Public domain | https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg |

### 사진 한 장 판(위에서 내려다본 꽃 · 테이블 사진, Pexels · Unsplash) (23)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| surf-tulips-white | a bouquet of white tulips on a black background aEOi uLVtZg | Catia Climovich | Unsplash License | https://unsplash.com/photos/a-bouquet-of-white-tulips-on-a-black-background-aEOi-uLVtZg |
| surf-lavender | purple lavender flower wvUs06Rtu5E | NordWood Themes | Unsplash License | https://unsplash.com/photos/purple-lavender-flower-wvUs06Rtu5E |
| surf-water-lily | lily pads on dark pond water 5GYN8U7wFsg | Sujit Bangarshettar | Unsplash License | https://unsplash.com/photos/lily-pads-on-dark-pond-water-5GYN8U7wFsg |
| surf-sunflower | 1478159 | mattycphoto | Pexels License | https://www.pexels.com/photo/1478159/ |
| surf-hydrangea | 8680406 | Asya Vlasova | Pexels License | https://www.pexels.com/photo/8680406/ |
| surf-peony | 12123644 | micheile | Pexels License | https://www.pexels.com/photo/12123644/ |
| surf-lilac | purple flowers on brown wooden table v7vf5ofD5sY | Nina Pix | Unsplash License | https://unsplash.com/photos/purple-flowers-on-brown-wooden-table-v7vf5ofD5sY |
| surf-cherry | 7316810 | amresarse | Pexels License | https://www.pexels.com/photo/7316810/ |
| surf-rose-white | white roses on gray textile TaFTIAaSn1I | Christina Victoria Craft | Unsplash License | https://unsplash.com/photos/white-roses-on-gray-textile-TaFTIAaSn1I |
| surf-rose-apricot | a bunch of flowers that are on a table YJhXk23Qr80 | Annie Spratt | Unsplash License | https://unsplash.com/photos/a-bunch-of-flowers-that-are-on-a-table-YJhXk23Qr80 |
| surf-rose-pink | 5874608 | Gabby K | Pexels License | https://www.pexels.com/photo/5874608/ |
| surf-rose-red | a bouquet of red roses on a black background 6l9m9pFoL8g | Anita Austvika | Unsplash License | https://unsplash.com/photos/a-bouquet-of-red-roses-on-a-black-background-6l9m9pFoL8g |
| surf-rose-night | 6708770 | RDNE Stock project | Pexels License | https://www.pexels.com/photo/6708770/ |
| surf-rose-petals | a bunch of red petals on a black surface tTU 3D40GUU | Jonny Gios | Unsplash License | https://unsplash.com/photos/a-bunch-of-red-petals-on-a-black-surface-tTU-3D40GUU |
| surf-white-blossom | a bunch of flowers that are on a table 6RGDPuvdxQk | Anita Austvika | Unsplash License | https://unsplash.com/photos/a-bunch-of-flowers-that-are-on-a-table-6RGDPuvdxQk |
| surf-rose-border | pink and red rose border with gray copy space romantic floral background | Karolina Grabowska | Kaboompics License | https://kaboompics.com/photo/6858/pink-and-red-rose-border-with-gray-copy-space-romantic-floral-background |
| surf-rose-wreath | red and blush roses framing an open gray center for valentine invitations | Karolina Grabowska | Kaboompics License | https://kaboompics.com/photo/9427/red-and-blush-roses-framing-an-open-gray-center-for-valentine-invitations |
| surf-dark-bloom | a bunch of leaves and flowers on a black surface c9PeR7WuY2c | Evie S. | Unsplash License | https://unsplash.com/photos/a-bunch-of-leaves-and-flowers-on-a-black-surface-c9PeR7WuY2c |
| surf-fairy-lights | string lights on blue textile vsnikmK5eH0 | Joanna Kosinska | Unsplash License | https://unsplash.com/photos/string-lights-on-blue-textile-vsnikmK5eH0 |
| surf-macarons | pile of french macaroons 2VyyvZns3qQ | Keila Hötzel | Unsplash License | https://unsplash.com/photos/pile-of-french-macaroons-2VyyvZns3qQ |
| surf-cafe-pink | a pink table topped with a plate of food and a cup of coffee uAPHWdfpOho | Mockuuups | Unsplash License | https://unsplash.com/photos/a-pink-table-topped-with-a-plate-of-food-and-a-cup-of-coffee-uAPHWdfpOho |
| surf-peach | white labeled bottle on white textile and citrus fruits xrZw86L1jnM | Nadya Spetnitskaya | Unsplash License | https://unsplash.com/photos/white-labeled-bottle-on-white-textile-and-citrus-fruits-xrZw86L1jnM |
| surf-sea-shells | 4455019 |  | Pexels License | https://www.pexels.com/photo/4455019/ |

### 장난감 · 소품 · 캐릭터 누끼 사진 (64)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| rose-red | Rose flower large resolution 3524x3698 |  | CC BY-NC 4.0 | https://pngimg.com/image/66698 |
| rose-pink | Rose flower 1200x995 |  | CC BY-NC 4.0 | https://pngimg.com/image/67015 |
| rose-white | Transparent |  | CC BY-NC 4.0 | https://pngimg.com/image/2788 |
| rose-yellow | round bouquet of yellow roses with tied stems |  | CC BY-NC 4.0 | https://pngimg.com/image/21659 |
| rose-black | Red Rose flower |  | CC BY-NC 4.0 | https://pngimg.com/image/638 |
| rose-bouquet | Rose flower large resolution 3376x4460 |  | CC BY-NC 4.0 | https://pngimg.com/image/66797 |
| rose-vase | Rose flower large resolution 4100x4278 |  | CC BY-NC 4.0 | https://pngimg.com/image/66795 |
| rose-petal-1 | Rose flower large resolution 5760x3840 |  | CC BY-NC 4.0 | https://pngimg.com/image/66734 |
| rose-petal-2 | Rose flower large resolution 5760x3840 |  | CC BY-NC 4.0 | https://pngimg.com/image/66734 |
| rose-petal-3 | Rose flower large resolution 5760x3840 |  | CC BY-NC 4.0 | https://pngimg.com/image/66734 |
| tulip-bunch | bouquet of pink and white tulips with pink hyacinths |  | CC BY-NC 4.0 | https://pngimg.com/image/21655 |
| peony | white round vase holding a bunch of peonies |  | CC BY-NC 4.0 | https://pngimg.com/image/38391 |
| cherry-branch | pink sakura flowers and closed buds on a twig |  | CC BY-NC 4.0 | https://pngimg.com/image/49835 |
| sunflower | Sunflower |  | CC BY-NC 4.0 | https://pngimg.com/image/13362 |
| lotus | Magenta lotus flower with dark red base petals |  | CC BY-NC 4.0 | https://pngimg.com/image/69724 |
| lily | Pink lily with dark spots and white edges over green leaves |  | CC BY-NC 4.0 | https://pngimg.com/image/70125 |
| fire | Flame Fire large resolution 1560x2917 |  | CC BY-NC 4.0 | https://pngimg.com/image/13256 |
| confetti | Explosion of shiny magenta, pink and dark red foil confetti pieces |  | CC BY-NC 4.0 | https://pngimg.com/image/87093 |
| sword | Historic Court sword |  | CC BY-NC 4.0 | https://pngimg.com/image/113217 |
| smoke | Smoke |  | CC BY-NC 4.0 | https://pngimg.com/image/55241 |
| water-splash | Pale water splash forming a triangle sheet with tiny drops above |  | CC BY-NC 4.0 | https://pngimg.com/image/114337 |
| soap-bubble | Soap bubble with blurry green and pink reflections inside |  | CC BY-NC 4.0 | https://pngimg.com/image/110005 |
| playing-cards | Cards |  | CC BY-NC 4.0 | https://pngimg.com/image/8469 |
| perfume | Perfume large resolution 2643x2545 |  | CC BY-NC 4.0 | https://pngimg.com/image/99987 |
| teacup | a porcelain cup of dark tea, pink roses and an ornate spoon in the cup |  | CC BY-NC 4.0 | https://pngimg.com/image/98902 |
| teapot | Teapot ornate white porcelain pot |  | CC BY-NC 4.0 | https://pngimg.com/image/117528 |
| macarons | Peach, lilac and pink macaron stack with an orange one leaning |  | CC BY-NC 4.0 | https://pngimg.com/image/74035 |
| pocket-watch | Antique gold pocket watch with an aged yellow face and ornate black numerals |  | CC BY-NC 4.0 | https://pngimg.com/image/87538 |
| crown | Imperial crown with red velvet and pearl arches |  | CC BY-NC 4.0 | https://pngimg.com/image/23865 |
| diamond | wide brilliant from the side with glittering facets |  | CC BY-NC 4.0 | https://pngimg.com/image/46795 |
| pearls | Pink pearl strand with a gold clasp and graduated beads |  | CC BY-NC 4.0 | https://pngimg.com/image/22165 |
| candle | Candle 1024x1280 |  | CC BY-NC 4.0 | https://pngimg.com/image/7305 |
| champagne | two upright filled champagne flutes standing together |  | CC BY-NC 4.0 | https://pngimg.com/image/17483 |
| gift-box | Gift Box large resolution 4040x3348 |  | CC BY-NC 4.0 | https://pngimg.com/image/100426 |
| trophy | Golden Cup large resolution 1243x2162 |  | CC BY-NC 4.0 | https://pngimg.com/image/14575 |
| gold-star | Brilliant Crystal Star |  | CC BY-NC 4.0 | https://pngimg.com/image/76951 |
| teddy-bear | a teddy bear beige with red plaid ribbon bow |  | CC BY-NC 4.0 | https://pngimg.com/image/57506 |
| strawberry | Red Strawberry fruit transparent |  | CC BY-NC 4.0 | https://pngimg.com/image/2637 |
| strawberry-cake | Cake large resolution 2598x1487 |  | CC BY-NC 4.0 | https://pngimg.com/image/97012 |
| cupcake | Cupcake with pink frosting covered in rainbow sprinkles |  | CC BY-NC 4.0 | https://pngimg.com/image/74333 |
| cake-slice | Cake large resolution 2061x2261 |  | CC BY-NC 4.0 | https://pngimg.com/image/96969 |
| birthday-cake | Cake large resolution 4583x4453 |  | CC BY-NC 4.0 | https://pngimg.com/image/96983 |
| coffee-cup | cappuccino with a foam heart on a white saucer |  | CC BY-NC 4.0 | https://pngimg.com/image/49624 |
| peach | Peach fruit large resolution 3505x2358 |  | CC BY-NC 4.0 | https://pngimg.com/image/4865 |
| soda-glass | a straight glass of golden lemonade with citrus wheels floating among the ice |  | CC BY-NC 4.0 | https://pngimg.com/image/16937 |
| gamepad | Gamepad in black with blue backlit thumbsticks and colored letter buttons |  | CC BY-NC 4.0 | https://pngimg.com/image/83297 |
| joystick | Joystick 768x1024 |  | CC BY-NC 4.0 | https://pngimg.com/image/83315 |
| jellyfish | jellyfish with a purple dome and white frilly arms |  | CC BY-NC 4.0 | https://pngimg.com/image/47049 |
| seashell | scallop seashell with orange stripes |  | CC BY-NC 4.0 | https://pngimg.com/image/37144 |
| gold-coins | Gold Coins transparent |  | CC BY-NC 4.0 | https://pngimg.com/image/10977 |
| poker-chips | three stacks of poker chips in black green and blue |  | CC BY-NC 4.0 | https://pngimg.com/image/48293 |
| dice | two matte red dice with white pips one in front |  | CC BY-NC 4.0 | https://pngimg.com/image/54867 |
| rocket | Rocket vibrant |  | CC BY-NC 4.0 | https://pngimg.com/image/13270 |
| ufo | Ufo |  | CC BY-NC 4.0 | https://pngimg.com/image/71660 |
| octopus | orange octopus with a round head and spread arms |  | CC BY-NC 4.0 | https://pngimg.com/image/46993 |
| whale | humpback whale white winglike pectorals knobby head |  | CC BY-NC 4.0 | https://pngimg.com/image/19239 |
| lantern | Pewter lantern with tall wire bail and warm glow in clear glass Lantern |  | CC BY-NC 4.0 | https://pngimg.com/image/108801 |
| picnic-basket | Wicker picnic basket with a red and white checkered cloth cover and handles |  | CC BY-NC 4.0 | https://pngimg.com/image/118262 |
| books-stack | Colorful Blue Book |  | CC BY-NC 4.0 | https://pngimg.com/image/51089 |
| telescope | Brass telescope with finder on a mahogany tripod with brass fittings |  | CC BY-NC 4.0 | https://pngimg.com/image/66451 |
| amphora | Greek amphora vase with black figures and an orange band |  | CC BY-NC 4.0 | https://pngimg.com/image/38283 |
| rabbit | Rabbit large resolution 1946x2484 |  | CC BY-NC 4.0 | https://pngimg.com/image/96539 |
| white-horse | White Horse animal transparent |  | CC BY-NC 4.0 | https://pngimg.com/image/2560 |
| cat | Fluffy Cat |  | CC BY-NC 4.0 | https://pngimg.com/image/50548 |

### 상자 · 상자 전용 아이템(곰 인형 · 디저트 · 꽃) 누끼 사진 (41)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| box-heart | 빨간 하트 선물 상자(금색 리본) (pngimg gift_PNG100439) |  | CC BY-NC 4.0 | https://pngimg.com/image/100439 |
| box-white | 흰 선물 상자(분홍 리본) (pngimg gift_PNG100421) |  | CC BY-NC 4.0 | https://pngimg.com/image/100421 |
| box-black | 검은 선물 상자 (pngimg gift_PNG100410) |  | CC BY-NC 4.0 | https://pngimg.com/image/100410 |
| teddy-rose | 분홍 장미를 든 곰 인형 (pngimg teddy_bear_PNG108) |  | CC BY-NC 4.0 | https://pngimg.com/image/108 |
| teddy-red-bow | 빨간 리본 곰 인형 (pngimg teddy_bear_PNG141) |  | CC BY-NC 4.0 | https://pngimg.com/image/141 |
| teddy-angel | 날개 단 흰 곰 인형 (pngimg teddy_bear_PNG128) |  | CC BY-NC 4.0 | https://pngimg.com/image/128 |
| teddy-family | 아기 곰을 얹은 곰 인형 (pngimg teddy_bear_PNG104) |  | CC BY-NC 4.0 | https://pngimg.com/image/104 |
| teddy-sweater | 스웨터 입은 곰 인형 (pngimg teddy_bear_PNG127) |  | CC BY-NC 4.0 | https://pngimg.com/image/127 |
| samoyed | 사모예드 (pngimg samoyed_dog_PNG34) |  | CC BY-NC 4.0 | https://pngimg.com/image/34 |
| hedgehog | 고슴도치 (pngimg hedgehog_PNG18) |  | CC BY-NC 4.0 | https://pngimg.com/image/18 |
| capybara | 카피바라 (pngimg capybara_PNG21) |  | CC BY-NC 4.0 | https://pngimg.com/image/21 |
| duckling | 아기 오리 (pngimg duckling_PNG21) |  | CC BY-NC 4.0 | https://pngimg.com/image/21 |
| kitten | 브리티시 쇼트헤어 아기 고양이 (pngimg british_shorthair_PNG22) |  | CC BY-NC 4.0 | https://pngimg.com/image/22 |
| matryoshka | 장미 무늬 마트료시카 (pngimg matryoshka_doll_PNG88) |  | CC BY-NC 4.0 | https://pngimg.com/image/88 |
| wedding-cake | 분홍 장미 웨딩 케이크 (pngimg wedding_cake_PNG99022) |  | CC BY-NC 4.0 | https://pngimg.com/image/99022 |
| macaron-tower | 마카롱 탑 (pngimg macaron_PNG115) |  | CC BY-NC 4.0 | https://pngimg.com/image/115 |
| kulich | 쿨리치(러시아 부활절 케이크) (pngimg easter_cake_PNG22) |  | CC BY-NC 4.0 | https://pngimg.com/image/22 |
| halva | 피스타치오 할바 (pngimg halva_PNG7) |  | CC BY-NC 4.0 | https://pngimg.com/image/7 |
| upside-down-cake | 파인애플 업사이드다운 케이크 (pngimg pie_PNG48) |  | CC BY-NC 4.0 | https://pngimg.com/image/48 |
| jelly-cake | 키위 젤리 케이크 (pngimg cake_PNG97021) |  | CC BY-NC 4.0 | https://pngimg.com/image/97021 |
| parfait | 딸기 파르페 (pngimg ice_cream_PNG98228) |  | CC BY-NC 4.0 | https://pngimg.com/image/98228 |
| lilac-vase | 유리 꽃병의 라일락 (pngimg lilac_PNG102) |  | CC BY-NC 4.0 | https://pngimg.com/image/102 |
| lilac | 라일락 가지 (pngimg lilac_PNG97) |  | CC BY-NC 4.0 | https://pngimg.com/image/97 |
| carnation | 분홍 카네이션 (pngimg carnation_PNG27) |  | CC BY-NC 4.0 | https://pngimg.com/image/27 |
| poppy | 양귀비 (pngimg poppy_PNG56) |  | CC BY-NC 4.0 | https://pngimg.com/image/56 |
| violet-pot | 아프리칸 바이올렛 화분 (pngimg viola_PNG33) |  | CC BY-NC 4.0 | https://pngimg.com/image/33 |
| pansy | 팬지 (pngimg viola_PNG36) |  | CC BY-NC 4.0 | https://pngimg.com/image/36 |
| water-lily | 수련 (pngimg water_lily_PNG50) |  | CC BY-NC 4.0 | https://pngimg.com/image/50 |
| campanula | 캄파눌라 (pngimg bellflower_PNG34) |  | CC BY-NC 4.0 | https://pngimg.com/image/34 |
| camomile | 캐모마일 (pngimg camomile_PNG677) |  | CC BY-NC 4.0 | https://pngimg.com/image/677 |
| bouquet-heart | 하트 장미 부케 (pngimg bouquet_PNG61) |  | CC BY-NC 4.0 | https://pngimg.com/image/61 |
| bouquet-vintage | 빈티지 장미 부케 (pngimg bouquet_PNG59) |  | CC BY-NC 4.0 | https://pngimg.com/image/59 |
| tulips-white | 흰 튤립 (pngimg bouquet_PNG57) |  | CC BY-NC 4.0 | https://pngimg.com/image/57 |
| galle-vase | 아르누보 유리 꽃병 (pngimg vase_PNG181) |  | CC BY-NC 4.0 | https://pngimg.com/image/181 |
| gramophone | 황동 축음기 (pngimg gramophone_PNG41) |  | CC BY-NC 4.0 | https://pngimg.com/image/41 |
| venetian-mask | 베네치아 가면 (pngimg carnival_mask_PNG150) |  | CC BY-NC 4.0 | https://pngimg.com/image/150 |
| sky-lantern | 하트 풍등 (pngimg sky_lantern_PNG57) |  | CC BY-NC 4.0 | https://pngimg.com/image/57 |
| balloon-pink | 분홍 풍선 다발 (pngimg balloon_PNG4963) |  | CC BY-NC 4.0 | https://pngimg.com/image/4963 |
| rose-gold | 황금 장미 — pngimg 장미 사진(rose_PNG66698)을 금빛으로 |  | CC BY-NC 4.0 | https://pngimg.com/image/66698 |
| rose-dome | 유리 구슬 속 장미 — pngimg 장미(rose_PNG66698) + 비눗방울(110005) 사진 겹침 |  | CC BY-NC 4.0 | https://pngimg.com/image/66698 |
| candelabra | Candelabrum (after 1846), gilt brass | The Metropolitan Museum of Art | CC0 1.0 (Met Open Access) | https://www.metmuseum.org/art/collection/search/658639 |

### 탁자 · 테두리 · 종이 재질 사진 (36)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| velvet | velour_velvet | Poly Haven | CC0 1.0 | https://polyhaven.com/a/velour_velvet |
| satin | crepe_satin | Poly Haven | CC0 1.0 | https://polyhaven.com/a/crepe_satin |
| jacquard-floral | floral_jacquard | Poly Haven | CC0 1.0 | https://polyhaven.com/a/floral_jacquard |
| jacquard-quatrefoil | quatrefoil_jacquard_fabric | Poly Haven | CC0 1.0 | https://polyhaven.com/a/quatrefoil_jacquard_fabric |
| gingham | gingham_check | Poly Haven | CC0 1.0 | https://polyhaven.com/a/gingham_check |
| herringbone | poly_wool_herringbone | Poly Haven | CC0 1.0 | https://polyhaven.com/a/poly_wool_herringbone |
| suede | scuba_suede | Poly Haven | CC0 1.0 | https://polyhaven.com/a/scuba_suede |
| leather-red | Leather037 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Leather037 |
| leather-brown | brown_leather | Poly Haven | CC0 1.0 | https://polyhaven.com/a/brown_leather |
| walnut | black_walnut_veneer_01 | Poly Haven | CC0 1.0 | https://polyhaven.com/a/black_walnut_veneer_01 |
| cherry | cherry_veneer | Poly Haven | CC0 1.0 | https://polyhaven.com/a/cherry_veneer |
| rosewood | rosewood_veneer1 | Poly Haven | CC0 1.0 | https://polyhaven.com/a/rosewood_veneer1 |
| lacquer | lacquered_cherry_wood | Poly Haven | CC0 1.0 | https://polyhaven.com/a/lacquered_cherry_wood |
| parquet | herringbone_parquet | Poly Haven | CC0 1.0 | https://polyhaven.com/a/herringbone_parquet |
| terrazzo | terrazzo_tiles | Poly Haven | CC0 1.0 | https://polyhaven.com/a/terrazzo_tiles |
| sandstone | large_sandstone_blocks | Poly Haven | CC0 1.0 | https://polyhaven.com/a/large_sandstone_blocks |
| petal-gravel | flower_scattered_gravel | Poly Haven | CC0 1.0 | https://polyhaven.com/a/flower_scattered_gravel |
| linen | Fabric061 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Fabric061 |
| quilt | Fabric048 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Fabric048 |
| marble-white | Marble012 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Marble012 |
| marble-black-gold | Marble006 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Marble006 |
| marble-black | Marble016 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Marble016 |
| onyx-white | Onyx015 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Onyx015 |
| onyx-black | Onyx013 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Onyx013 |
| malachite | Onyx011 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Onyx011 |
| travertine | Travertine009 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Travertine009 |
| checker-marble | Tiles074 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Tiles074 |
| gold | Metal034 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Metal034 |
| brass | Metal048B | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Metal048B |
| gold-pale | Metal042A | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Metal042A |
| gold-foil | Foil002 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Foil002 |
| lawn | Grass004 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Grass004 |
| moss | Moss002 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Moss002 |
| pavers | PavingStones138 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=PavingStones138 |
| paper-white | Paper001 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Paper001 |
| paper-cream | Paper002 | ambientCG | CC0 1.0 | https://ambientcg.com/view?id=Paper002 |

### 선생님이 만든 그림(GPT 이미지 생성) (2)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| gpt | 판 19장(장미 정원 · 베르사유 · 황금 장미 · 백만 송이 · 겨울 정원 · 장미 온실 · 꿈빛 왕국 · 블랙 오닉스 · 밀푀유 · 두바이 · 자수정 · 루비 왕관 · 크리스마스)과 휴대폰 세로 판 26장, 카드 뒷면 14장 · 앞면 테 13장 · 승리 장면 배경 6장 · 카드 효과 조각 108개(스티커 판 18장) · 보상 상자 2장(닫힌 · 열린, gpt그림 → scripts/build-gpt.mjs) | 이 게임 전용(선생님 제작) | 이 게임 전용 |  |
| gpt-characters | 캐릭터 29명 그림 — 원작: 치이카와 · 하치와레 · 우사기 · 랏코(나가노) · 짱구(우스이 요시토) · 체리(CLAMP) · 코난 · 키드(아오야마 고쇼) · 케로로(요시자키 미네) · 하츄핑(SAMG) · 마이멜로디 · 쿠로미 · 시나모롤 · 폼폼푸린 · 헬로키티 · 포차코 · 한교동(산리오) · 망그러진 곰(유랑) · 잔망루피(아이코닉스) · 세일러문(다케우치 나오코) · 춘식이(카카오프렌즈) · 리락쿠마 · 코리락쿠마(산엑스) · 러브어랏 베어(케어베어) · 벨리곰(롯데홈쇼핑) · 어린 왕자(생텍쥐페리) · 미피(딕 브루너) · 몰랑이(윤혜지) | 선생님이 GPT 로 그린 팬 그림 | 수업 자료(저작권 교육 예외) |  |

### 시즌 1 그림(그대로 되살림) (1)

| 키 | 제목 | 만든 이 · 소장 | 조건 | 출처 |
|---|---|---|---|---|
| s1 | 장미 무도회 · 리얼 로즈가든 · 달토끼 · 태양 신전 · 네온 심해 · 딸기 퍼레이드 · 핑크 구름, 장미 오르골 · 인형꽃 · 왕실 꽃정원 분수 | 시즌 1 제작 그림 | 이 게임 전용 |  |

