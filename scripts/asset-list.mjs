// 시즌 2 에셋 목록 — 받기(fetch-assets)와 줄이기(build-assets)가 함께 쓴다.
// 그림: Microsoft Fluent Emoji 3D (MIT) — https://github.com/microsoft/fluentui-emoji
// 움직이는 그림: Microsoft Fluent Emoji Animated (MIT) — https://github.com/microsoft/fluentui-emoji-animated
// 소리: Kenney (CC0) — OpenGameArt 에 Kenney 가 올린 판
// 질감: ambientCG (CC0) · OpenGameArt felt backgrounds (CC0)

// 앱 안 이름 → Fluent 폴더 이름
export const FLUENT_STATIC = {
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
export const FLUENT_ANIMATED = [
  'sloth', 'cat-face', 'owl', 'wolf', 'dragon-face',
  'teddy-bear', 'cat', 'flying-saucer', 'unicorn', 'fountain', 'star', 'rocket', 'octopus', 'spouting-whale', 'crystal-ball',
  'fire', 'high-voltage', 'party-popper', 'partying', 'rofl', 'star-struck', 'steam', 'crying', 'screaming', 'sunglasses',
];

// OpenGameArt 에 Kenney 가 올린 소리 묶음(CC0)
export const OGA_FILES = {
  'kenney-casino': 'https://opengameart.org/sites/default/files/kenney_casino-audio.zip',
  'kenney-interface': 'https://opengameart.org/sites/default/files/kenney_interfaceSounds.zip',
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
export const AMBIENTCG = ['Wood052', 'Wood066', 'Leather026', 'Fabric026', 'Fabric030', 'Marble006', 'Paper005', 'Carpet006'];
