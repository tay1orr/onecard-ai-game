const EFFECT_DURATIONS = {
  attack: 1050,
  joker: 1450,
  skip: 1050,
  suit: 1050,
  onecard: 1650,
  impact: 1150,
};

const EFFECT_COLORS = {
  attack: ['#ff315f', '#ff8a55', '#ffd3dc'],
  joker: ['#ffd76a', '#a775ff', '#ffffff'],
  skip: ['#a787ff', '#6a78ff', '#f0eaff'],
  suit: ['#ff5f82', '#ffd061', '#77ddff', '#83efbf'],
  onecard: ['#ff4975', '#ffd96f', '#ffffff'],
  impact: ['#ff3f68', '#ffb15e', '#ffffff'],
};

export function createGameEffects({ root, particles, symbol, title, subtitle }) {
  let queue = [];
  let activeTimer = null;
  let settleTimer = null;
  let running = false;

  function play(type, payload = {}) {
    queue.push({ type, ...payload });
    if (!running) runNext();
  }

  function runNext() {
    const effect = queue.shift();
    if (!effect) {
      running = false;
      return;
    }
    running = true;
    const duration = effect.duration || EFFECT_DURATIONS[effect.type] || 1100;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.className = `action-overlay effect-${effect.type}`;
    symbol.textContent = effect.symbol || '!';
    title.textContent = effect.title || 'ACTION';
    subtitle.textContent = effect.subtitle || '';
    root.setAttribute('aria-label', [effect.title, effect.subtitle].filter(Boolean).join('. '));
    createParticles(effect.type, reducedMotion ? 0 : effect.particleCount);
    requestAnimationFrame(() => root.classList.add('is-active'));

    activeTimer = setTimeout(() => {
      root.classList.remove('is-active');
      settleTimer = setTimeout(runNext, reducedMotion ? 20 : 190);
    }, reducedMotion ? Math.min(duration, 650) : duration);
  }

  function createParticles(type, requestedCount) {
    particles.replaceChildren();
    const colors = EFFECT_COLORS[type] || EFFECT_COLORS.suit;
    const count = requestedCount ?? (type === 'onecard' || type === 'joker' ? 28 : 18);
    for (let index = 0; index < count; index += 1) {
      const particle = document.createElement('i');
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.3;
      const distance = 90 + Math.random() * 210;
      particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--delay', `${Math.random() * 150}ms`);
      particle.style.setProperty('--spin', `${Math.round(Math.random() * 560 - 280)}deg`);
      particle.style.setProperty('--color', colors[index % colors.length]);
      particle.className = index % 4 === 0 ? 'spark-star' : index % 3 === 0 ? 'spark-dot' : 'spark-card';
      particles.append(particle);
    }
  }

  function clear() {
    clearTimeout(activeTimer);
    clearTimeout(settleTimer);
    queue = [];
    running = false;
    root.className = 'action-overlay';
    particles.replaceChildren();
  }

  return { play, clear };
}
