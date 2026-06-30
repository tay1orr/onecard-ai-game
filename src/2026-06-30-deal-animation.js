function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createBack() {
  const card = document.createElement('div');
  card.className = 'deal-flight-card card-back';
  card.innerHTML = '<span class="back-logo">ONE<b>!</b></span>';
  return card;
}

export function createDealSequence(cardsPerPlayer = 7) {
  return Array.from({ length: cardsPerPlayer * 2 }, (_, index) => ({
    index,
    toPlayer: index % 2 === 1,
    slot: Math.floor(index / 2),
  }));
}

export async function runDealAnimation({ playerCards = [], createCardFace, playSound }) {
  const existing = document.querySelector('.deal-overlay');
  existing?.remove();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const overlay = document.createElement('div');
  overlay.className = 'deal-overlay';
  overlay.innerHTML = `
    <div class="deal-copy" role="status" aria-live="polite">
      <small>NEW ROUND</small><strong>덱을 섞는 중…</strong>
    </div>
    <div class="deal-deck card-back"><span class="back-logo">ONE<b>!</b></span></div>
  `;
  document.body.append(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-active', 'is-shuffling'));
  playSound?.('shuffle');
  await wait(reducedMotion ? 220 : 720);

  overlay.classList.remove('is-shuffling');
  overlay.classList.add('is-dealing');
  overlay.querySelector('.deal-copy strong').textContent = '카드를 나누는 중…';
  const flights = [];
  let playerIndex = 0;

  for (const { index, toPlayer, slot } of createDealSequence()) {
    let card;
    if (toPlayer && playerCards[playerIndex] && createCardFace) {
      card = createCardFace(playerCards[playerIndex]);
      card.classList.add('deal-flight-card');
      playerIndex += 1;
    } else card = createBack();
    card.setAttribute('aria-hidden', 'true');
    overlay.append(card);

    const spread = (slot - 3) * (window.innerWidth <= 760 ? 12 : 18);
    const destinationY = toPlayer ? window.innerHeight * 0.36 : window.innerHeight * -0.34;
    const destinationX = spread;
    const rotation = (slot - 3) * 2.5;
    const duration = reducedMotion ? 150 : 430;
    const animation = card.animate([
      { transform: 'translate3d(-50%, -50%, 0) scale(.82) rotate(0deg)', opacity: 0 },
      { transform: `translate3d(calc(-50% + ${destinationX * 0.55}px), calc(-50% + ${destinationY * 0.48}px), 0) scale(1.04) rotate(${rotation * 0.4}deg)`, opacity: 1, offset: 0.48 },
      { transform: `translate3d(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px), 0) scale(.78) rotate(${rotation}deg)`, opacity: 1 },
    ], { duration, easing: 'cubic-bezier(.18,.78,.2,1)', fill: 'forwards' });
    flights.push(animation.finished.catch(() => {}));
    if (index % 2 === 0) playSound?.('deal');
    await wait(reducedMotion ? 22 : 92);
  }

  await Promise.all(flights);
  overlay.querySelector('.deal-copy strong').textContent = '패를 펼칩니다!';
  overlay.classList.add('is-complete');
  await wait(reducedMotion ? 100 : 360);
  overlay.classList.remove('is-active');
  await wait(220);
  overlay.remove();
}
