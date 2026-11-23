// 작은 DOM 도우미
export function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = [el.className, value].filter(Boolean).join(' ');
    else if (key === 'vars') Object.entries(value).forEach(([prop, val]) => val != null && el.style.setProperty(prop, String(val)));
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'html') el.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, String(value));
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const child of [children].flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function setVars(el, vars) {
  Object.entries(vars).forEach(([prop, value]) => el.style.setProperty(prop, value == null ? '' : String(value)));
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function rectOf(el) {
  const rect = el.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, w: rect.width, h: rect.height, left: rect.left, top: rect.top };
}

export function formatNumber(value) {
  return Number(value || 0).toLocaleString('ko-KR');
}

export function stars(count) {
  return '★'.repeat(Math.max(1, Math.min(8, Number(count) || 1)));
}

// 받침 있는 말 뒤 조사(이/가 · 은/는 · 을/를 · 와/과 · 으로/로)
export function josa(word, pair) {
  const text = String(word || '');
  const last = text.charCodeAt(text.length - 1);
  if (!(last >= 0xac00 && last <= 0xd7a3)) return `${text}${pair.split('/')[1]}`;
  const final = (last - 0xac00) % 28;
  const [withFinal, withoutFinal] = pair.split('/');
  if (pair === '으로/로') return `${text}${final === 0 || final === 8 ? '로' : '으로'}`;
  return `${text}${final ? withFinal : withoutFinal}`;
}

export const prefersReducedMotion = () => globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
