// 시즌 2 에셋 목록 — 받기(fetch-assets)와 줄이기(build-assets)가 함께 쓴다.
// 그림: Microsoft Fluent Emoji 3D (MIT) — https://github.com/microsoft/fluentui-emoji
// 움직이는 그림: Microsoft Fluent Emoji Animated (MIT) — https://github.com/microsoft/fluentui-emoji-animated
// 소리: Kenney (CC0) — OpenGameArt 에 Kenney 가 올린 판
// 질감: ambientCG (CC0) · OpenGameArt felt backgrounds (CC0)

// 앱 안 이름 → Fluent 폴더 이름
// 시즌 2 실사 개편(11-24) 뒤로 Fluent 3D 는 반응 스티커 · 파비콘만 쓴다 — 나머지는 받지 않음
const ALL_FLUENT_STATIC = {
  // AI 상대
  sloth: 'Sloth', 'cat-face': 'Cat face', owl: 'Owl', wolf: 'Wolf', 'dragon-face': 'Dragon face',
  // 내 캐릭터(아바타)
  'rabbit-face': 'Rabbit face', 'dog-face': 'Dog face', bear: 'Bear', penguin: 'Penguin', fox: 'Fox',
  hamster: 'Hamster', panda: 'Panda', frog: 'Frog', unicorn: 'Unicorn', 'tiger-face': 'Tiger face',
  koala: 'Koala', 'baby-chick': 'Baby chick',
  // 표정
  'star-struck': 'Star-struck', grimacing: 'Grimacing face', rofl: 'Rolling on the floor laughing',
  saluting: 'Saluting face', steam: 'Face with steam from nose', sleeping: 'Sleeping face',
  sunglasses: 'Smiling face with sunglasses', thinking: 'Thinking face', smirking: 'Smirking face',
  partying: 'Partying face', crying: 'Loudly crying face', screaming: 'Face screaming in fear',
  astonished: 'Astonished face', zany: 'Zany face', monocle: 'Face with monocle', squinting: 'Grinning squinting face',
  // 게임 소품
  joker: 'Joker', 'game-die': 'Game die', trophy: 'Trophy', medal: '1st place medal', 'sports-medal': 'Sports medal',
  crown: 'Crown', sparkles: 'Sparkles', collision: 'Collision', fire: 'Fire', 'high-voltage': 'High voltage',
  dizzy: 'Dizzy', 'crossed-swords': 'Crossed swords', spade: 'Spade suit', heart: 'Heart suit',
  diamond: 'Diamond suit', club: 'Club suit', 'party-popper': 'Party popper', 'confetti-ball': 'Confetti ball',
  fireworks: 'Fireworks', sparkler: 'Sparkler', 'wrapped-gift': 'Wrapped gift', balloon: 'Balloon', ribbon: 'Ribbon',
  locked: 'Locked', megaphone: 'Megaphone', stopwatch: 'Stopwatch', bell: 'Bell', 'light-bulb': 'Light bulb',
  gear: 'Gear', 'speaker-high': 'Speaker high volume', 'muted-speaker': 'Muted speaker', door: 'Door', books: 'Books',
  // 하늘 · 별
  star: 'Star', 'glowing-star': 'Glowing star', 'shooting-star': 'Shooting star', comet: 'Comet',
  'ringed-planet': 'Ringed planet', telescope: 'Telescope', compass: 'Compass', 'milky-way': 'Milky way',
  'crescent-moon': 'Crescent moon', 'full-moon': 'Full moon', sun: 'Sun', rainbow: 'Rainbow', cloud: 'Cloud',
  rocket: 'Rocket',
  // 디저트
  strawberry: 'Strawberry', shortcake: 'Shortcake', cupcake: 'Cupcake', milk: 'Glass of milk',
  'birthday-cake': 'Birthday cake', lollipop: 'Lollipop', candy: 'Candy', peach: 'Peach', bubbles: 'Bubbles',
  'cup-with-straw': 'Cup with straw', 'tropical-drink': 'Tropical drink', custard: 'Custard',
  'hot-beverage': 'Hot beverage', teapot: 'Teapot', teacup: 'Teacup without handle',
  'growing-heart': 'Growing heart', 'sparkling-heart': 'Sparkling heart', 'love-letter': 'Love letter',
  rabbit: 'Rabbit', carrot: 'Carrot',
  // 고서 · 도서관
  scroll: 'Scroll', 'open-book': 'Open book', feather: 'Feather', candle: 'Candle', 'old-key': 'Old key',
  'fountain-pen': 'Fountain pen',
  // 아케이드
  'alien-monster': 'Alien monster', joystick: 'Joystick', 'video-game': 'Video game', 'flying-saucer': 'Flying saucer',
  'optical-disk': 'Optical disk', guitar: 'Guitar', microphone: 'Microphone', robot: 'Robot', 'musical-notes': 'Musical notes',
  // 왕국
  'gem-stone': 'Gem stone', castle: 'Castle', 'crystal-ball': 'Crystal ball', ring: 'Ring', 'magic-wand': 'Magic wand',
  // 바다
  'tropical-fish': 'Tropical fish', blowfish: 'Blowfish', octopus: 'Octopus', coral: 'Coral', 'spiral-shell': 'Spiral shell',
  jellyfish: 'Jellyfish', 'spouting-whale': 'Spouting whale', 'water-wave': 'Water wave',
  // 신전
  'classical-building': 'Classical building', moai: 'Moai', amphora: 'Amphora', hourglass: 'Hourglass done',
  // 꽃
  rose: 'Rose', bouquet: 'Bouquet', fountain: 'Fountain', tulip: 'Tulip', hibiscus: 'Hibiscus',
  'cherry-blossom': 'Cherry blossom', basket: 'Basket', lantern: 'Red paper lantern', 'rice-ball': 'Rice ball', dango: 'Dango',
  'snow-capped-mountain': 'Snow-capped mountain', 'tanabata-tree': 'Tanabata tree',
  // 디자인
  'triangular-ruler': 'Triangular ruler', 'straight-ruler': 'Straight ruler', 'artist-palette': 'Artist palette',
  paintbrush: 'Paintbrush',
  // 장난감
  'teddy-bear': 'Teddy bear', cat: 'Cat',
};

// 움직이는 판 — 대전 상대 · 장착한 장난감 · 큰 연출에서만 그때 받는다.
export const FLUENT_ANIMATED = [];

// OpenGameArt 에 Kenney 가 올린 소리 묶음(CC0)
export const OGA_FILES = {
  'kenney-casino': 'https://opengameart.org/sites/default/files/kenney_casino-audio.zip',
  'kenney-interface': 'https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip',
  'kenney-rpg': 'https://opengameart.org/sites/default/files/RPGsounds_Kenney.zip', // 창 열기(bookOpen) — 11-25 선생님 고름
  felt: 'https://opengameart.org/sites/default/files/felt.tar.gz',
};

export const OGA_PAGES = {
  'kenney-jingles': 'https://opengameart.org/content/85-short-music-jingles',
};

// Kenney Music Jingles(CC0) 가운데 고른 것 — 음높이 흐름을 재서 골랐다(끝이 오르면 승리 · 보상, 내리면 패배)
export const JINGLES = {
  'jingle-win': 'jingles_STEEL03.ogg', 'jingle-season': 'jingles_STEEL02.ogg', 'jingle-unlock': 'jingles_STEEL15.ogg',
  'jingle-lose': 'jingles_STEEL01.ogg', 'jingle-bonus': 'jingles_HIT11.ogg', 'jingle-onecard': 'jingles_SAX02.ogg',
  'jingle-level': 'jingles_PIZZA02.ogg',
};

// ambientCG (CC0) 1K 질감
// ambientCG 재질은 REAL_TEXTURES(아래)로 옮김
export const AMBIENTCG = [];

// 실제 재질 사진(CC0) — 탁자 윗면 · 테두리 · 카드 종이. 키 → Poly Haven 또는 ambientCG 아이디
export const REAL_TEXTURES = {
  velvet: { polyhaven: 'velour_velvet' },
  satin: { polyhaven: 'crepe_satin' },
  'jacquard-floral': { polyhaven: 'floral_jacquard' },
  'jacquard-quatrefoil': { polyhaven: 'quatrefoil_jacquard_fabric' },
  gingham: { polyhaven: 'gingham_check' },
  herringbone: { polyhaven: 'poly_wool_herringbone' },
  suede: { polyhaven: 'scuba_suede' },
  'leather-red': { ambientcg: 'Leather037' },
  'leather-brown': { polyhaven: 'brown_leather' },
  walnut: { polyhaven: 'black_walnut_veneer_01' },
  cherry: { polyhaven: 'cherry_veneer' },
  rosewood: { polyhaven: 'rosewood_veneer1' },
  lacquer: { polyhaven: 'lacquered_cherry_wood' },
  parquet: { polyhaven: 'herringbone_parquet' },
  terrazzo: { polyhaven: 'terrazzo_tiles' },
  sandstone: { polyhaven: 'large_sandstone_blocks' },
  'petal-gravel': { polyhaven: 'flower_scattered_gravel' },
  linen: { ambientcg: 'Fabric061' },
  quilt: { ambientcg: 'Fabric048' },
  'marble-white': { ambientcg: 'Marble012' },
  'marble-black-gold': { ambientcg: 'Marble006' },
  'marble-black': { ambientcg: 'Marble016' },
  'onyx-white': { ambientcg: 'Onyx015' },
  'onyx-black': { ambientcg: 'Onyx013' },
  malachite: { ambientcg: 'Onyx011' },
  travertine: { ambientcg: 'Travertine009' },
  'checker-marble': { ambientcg: 'Tiles074' },
  gold: { ambientcg: 'Metal034' },
  brass: { ambientcg: 'Metal048B' },
  'gold-pale': { ambientcg: 'Metal042A' },
  'gold-foil': { ambientcg: 'Foil002' },
  lawn: { ambientcg: 'Grass004' },
  moss: { ambientcg: 'Moss002' },
  pavers: { ambientcg: 'PavingStones138' },
  'paper-white': { ambientcg: 'Paper001' },
  'paper-cream': { ambientcg: 'Paper002' },
};

const KEEP_FLUENT = new Set(['spade', 'star-struck', 'fire', 'grimacing', 'rofl', 'saluting', 'steam']);
export const FLUENT_STATIC = Object.fromEntries(Object.entries(ALL_FLUENT_STATIC).filter(([key]) => KEEP_FLUENT.has(key)));
