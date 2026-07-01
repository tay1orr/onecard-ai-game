export function createCardCenter(card, suitSymbol) {
  const center = document.createElement('strong');
  center.className = `card-suit${card.rank === 'JOKER' ? ' joker-figure' : ''}`;
  if (card.rank !== 'JOKER') {
    center.textContent = suitSymbol;
    return center;
  }

  center.setAttribute('aria-hidden', 'true');
  center.innerHTML = `
    <span class="jester-hat"><i></i><i></i><i></i></span>
    <span class="jester-face"><i></i><i></i><b></b></span>
    <span class="jester-collar"><i></i><i></i><i></i></span>
  `;
  return center;
}
