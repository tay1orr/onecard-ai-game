import { aiTier } from './rating.js';

const DIFFICULTY_MULTIPLIER = Object.freeze({
  easy: 1.15, normal: 1, hard: 0.82,
  star1: 1.15, star2: 1.07, star3: 1, star4: 0.9, star5: 0.82, star6: 0.78, star7: 0.74, star8: 0.72,
});
const STAR_MULTIPLIERS = [1, 2, 3, 4, 5, 6, 7, 8].map((stars) => DIFFICULTY_MULTIPLIER[`star${stars}`]);

// AI 난이도 20단계(lv1~lv20, 11-27) — 옛 별로 친 값(4.67 성 …)으로 이웃 별 사이를 고르게
function levelTier(difficulty) {
  const match = /^lv(\d{1,2})$/.exec(String(difficulty));
  return match ? aiTier(Number(match[1])) : null;
}

function multiplierFor(difficulty) {
  if (DIFFICULTY_MULTIPLIER[difficulty] != null) return DIFFICULTY_MULTIPLIER[difficulty];
  const tier = levelTier(difficulty);
  if (tier == null) return 1;
  const low = Math.floor(tier);
  const high = Math.min(8, low + 1);
  return STAR_MULTIPLIERS[low - 1] + (STAR_MULTIPLIERS[high - 1] - STAR_MULTIPLIERS[low - 1]) * (tier - low);
}

const REACTION_RULES = Object.freeze({
  'player-attack': { chance: 0.62, options: ['oops', 'fire'] },
  'player-joker': { chance: 0.92, options: ['oops', 'fire'] },
  'player-onecard': { chance: 0.86, options: ['oops', 'fire'] },
  'player-penalty': { chance: 0.58, options: ['nice', 'lol'] },
  'ai-attack': { chance: 0.72, options: ['fire', 'nice'] },
  'ai-joker': { chance: 0.94, options: ['fire'] },
  'ai-onecard': { chance: 0.88, options: ['fire', 'nice'] },
  'ai-penalty': { chance: 0.72, options: ['oops'] },
  'player-win': { chance: 1, options: ['gg'] },
  'ai-win': { chance: 1, options: ['gg'] },
  rematch: { chance: 1, options: ['again'] },
});

const EMOTE_REPLIES = Object.freeze({
  nice: ['nice'],
  fire: ['fire'],
  oops: ['nice', 'oops'],
  lol: ['lol'],
  gg: ['gg'],
  again: ['again'],
});

export function chooseAiReaction(context, difficulty = 'normal', random = Math.random) {
  const type = typeof context === 'string' ? context : context?.type;
  const directReply = type === 'player-emote' ? EMOTE_REPLIES[context?.emote] : null;
  const rule = directReply
    ? { chance: 0.9, options: directReply }
    : REACTION_RULES[type];
  if (!rule) return null;

  const multiplier = multiplierFor(difficulty);
  const chance = rule.chance === 1 ? 1 : Math.min(1, rule.chance * multiplier);
  if (random() > chance) return null;
  return rule.options[Math.floor(random() * rule.options.length)];
}

export function aiReactionDelay(difficulty = 'normal', random = Math.random) {
  const tier = levelTier(difficulty) ?? (difficulty.startsWith('star') ? Number(difficulty.at(-1)) : difficulty === 'easy' ? 1 : difficulty === 'hard' ? 5 : 3);
  const base = 550 + tier * 70;
  return base + Math.floor(random() * 420);
}
