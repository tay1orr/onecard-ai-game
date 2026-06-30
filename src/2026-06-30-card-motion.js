export function calculateCardFlight(sourceRect, targetRect) {
  const sourceCenterX = sourceRect.left + sourceRect.width / 2;
  const sourceCenterY = sourceRect.top + sourceRect.height / 2;
  const targetCenterX = targetRect.left + targetRect.width / 2;
  const targetCenterY = targetRect.top + targetRect.height / 2;
  return {
    x: targetCenterX - sourceCenterX,
    y: targetCenterY - sourceCenterY,
    scale: Math.min(2.1, Math.max(0.72, targetRect.width / sourceRect.width)),
    arc: Math.min(76, Math.max(30, Math.abs(targetCenterY - sourceCenterY) * 0.14)),
  };
}

export async function animateCardToPile({ source, target, cardFace = null, fromOpponent = false, hideTarget = false }) {
  if (!source || !target) return;
  const sourceRect = source.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (!sourceRect.width || !targetRect.width) return;

  const flight = (cardFace || source).cloneNode(true);
  const { x, y, scale, arc } = calculateCardFlight(sourceRect, targetRect);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reducedMotion ? 140 : fromOpponent ? 600 : 540;
  const turn = fromOpponent ? -7 : 8;

  flight.classList.add('card-flight');
  flight.removeAttribute('id');
  flight.removeAttribute('disabled');
  flight.setAttribute('aria-hidden', 'true');
  Object.assign(flight.style, {
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`,
  });
  document.body.append(flight);
  source.classList.add('card-motion-source');
  if (hideTarget) target.classList.add('card-motion-target');

  const animation = flight.animate([
    { transform: `translate3d(0, 0, 0) scale(1) rotate(0deg) rotateY(${fromOpponent ? 78 : 0}deg)`, opacity: 0.96, offset: 0 },
    { transform: `translate3d(${x * 0.52}px, ${y * 0.5 - arc}px, 0) scale(1.08) rotate(${turn * 0.45}deg) rotateY(0deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate3d(${x}px, ${y}px, 0) scale(${scale}) rotate(${turn}deg) rotateY(0deg)`, opacity: 0.98, offset: 1 },
  ], {
    duration,
    easing: 'cubic-bezier(.2,.78,.18,1)',
    fill: 'forwards',
  });

  try { await animation.finished; } catch { /* 화면 전환으로 취소될 수 있습니다. */ }
  source.classList.remove('card-motion-source');
  target.classList.remove('card-motion-target');
  flight.remove();
}
