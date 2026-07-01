const DIFFICULTY_MULTIPLIER = Object.freeze({ easy: 1.15, normal: 1, hard: 0.82 });

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

  const multiplier = DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
  const chance = rule.chance === 1 ? 1 : Math.min(1, rule.chance * multiplier);
  if (random() > chance) return null;
  return rule.options[Math.floor(random() * rule.options.length)];
}

export function aiReactionDelay(difficulty = 'normal', random = Math.random) {
  const base = difficulty === 'easy' ? 620 : difficulty === 'hard' ? 900 : 760;
  return base + Math.floor(random() * 420);
}
