export const REACTIONS = Object.freeze([
  { key: 'nice', label: 'NICE!', description: '좋은 수!' },
  { key: 'fire', label: 'FIRE!', description: '강렬해!' },
  { key: 'oops', label: 'OOPS!', description: '앗!' },
  { key: 'lol', label: 'LOL!', description: '하하!' },
  { key: 'gg', label: 'GG!', description: '굿게임!' },
  { key: 'again', label: 'AGAIN!', description: '한 판 더!' },
]);

export function getReaction(key) {
  return REACTIONS.find((reaction) => reaction.key === key) || null;
}

export function createReactionArtwork(key) {
  const art = document.createElement('span');
  art.className = `reaction-art reaction-art-${key}`;
  art.setAttribute('aria-hidden', 'true');
  art.innerHTML = '<i></i><b></b><em></em>';
  return art;
}

export function createReactionButton(reaction) {
  const button = document.createElement('button');
  button.type = 'button';
  button.dataset.emote = reaction.key;
  button.setAttribute('aria-label', `${reaction.label} ${reaction.description}`);
  button.append(createReactionArtwork(reaction.key));
  const label = document.createElement('strong');
  label.textContent = reaction.label;
  button.append(label);
  return button;
}
