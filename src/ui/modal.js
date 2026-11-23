// 창 · 알림 — Esc 는 닫기(취소), Enter 로 확인을 누르지 않는다
import gsap from 'gsap';
import { h } from './dom.js';
import { play } from './sound.js';

let host = null;
const stack = [];

export function setModalHost(el) { host = el; }

export function openModal({ title, body, actions = [], className = '', dismissible = true, onClose, label } = {}) {
  const card = h(`div.modal-card${className ? `.${className}` : ''}`, { role: 'dialog', 'aria-modal': 'true', 'aria-label': label || title || '창' },
    title ? h('h2.modal-title', {}, title) : null,
    body,
    actions.length ? h('div.modal-actions', {}, ...actions.map((action) => h(`button.btn.${action.kind || 'ghost'}`, {
      type: 'button',
      onClick: () => { if (action.sound !== false) play(action.kind === 'primary' ? 'confirm' : 'click'); action.onClick?.(api); },
    }, action.label))) : null,
    dismissible ? h('button.modal-x', { type: 'button', 'aria-label': '닫기', onClick: () => api.close() }, h('span', { html: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>' })) : null);
  const scrim = h('div.modal', { onClick: (event) => { if (dismissible && event.target === scrim) api.close(); } }, card);
  const previousFocus = document.activeElement;
  let closed = false;
  const api = {
    el: card,
    close(result) {
      if (closed) return;
      closed = true;
      const index = stack.indexOf(api);
      if (index >= 0) stack.splice(index, 1);
      gsap.to(card, { y: 14, opacity: 0, duration: 0.16 });
      gsap.to(scrim, { opacity: 0, duration: 0.18, onComplete: () => scrim.remove() });
      play('close', { volume: 0.5 });
      onClose?.(result);
      previousFocus?.focus?.();
    },
    hide(hidden) { scrim.classList.toggle('is-peek', hidden); },
    dismissible,
  };
  (host || document.body).append(scrim);
  stack.push(api);
  gsap.fromTo(scrim, { opacity: 0 }, { opacity: 1, duration: 0.18 });
  gsap.fromTo(card, { y: 18, scale: 0.97, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.28, ease: 'back.out(1.6)' });
  play('open', { volume: 0.5 });
  setTimeout(() => card.querySelector('button.btn, [data-autofocus]')?.focus?.(), 30);
  return api;
}

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const top = stack.at(-1);
  if (top?.dismissible) { event.preventDefault(); top.close(); }
});

export function confirmModal({ title, message, confirmLabel, cancelLabel = '취소' }) {
  return new Promise((resolve) => {
    openModal({
      title, body: h('p.modal-text', {}, message), className: 'is-confirm',
      actions: [
        { label: confirmLabel, kind: 'primary', onClick: (modal) => { resolve(true); modal.close(true); } },
        { label: cancelLabel, kind: 'ghost', onClick: (modal) => { resolve(false); modal.close(false); } },
      ],
      onClose: (result) => resolve(Boolean(result)),
    });
  });
}

let toastEl = null;
let toastTimer = null;
export function toast(text, { anchor = null, tone = 'info' } = {}) {
  if (!toastEl) {
    toastEl = h('div.toast', { role: 'status', 'aria-live': 'polite' });
    document.body.append(toastEl);
  }
  toastEl.textContent = text;
  toastEl.dataset.tone = tone;
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    toastEl.style.left = `${rect.left + rect.width / 2}px`;
    toastEl.style.top = `${Math.max(12, rect.top - 52)}px`;
    toastEl.style.bottom = 'auto';
  } else {
    toastEl.style.left = '50%';
    toastEl.style.top = 'auto';
    toastEl.style.bottom = '24px';
  }
  clearTimeout(toastTimer);
  gsap.fromTo(toastEl, { opacity: 0, y: 8, xPercent: -50 }, { opacity: 1, y: 0, xPercent: -50, duration: 0.2 });
  toastTimer = setTimeout(() => gsap.to(toastEl, { opacity: 0, duration: 0.2 }), 2200);
}
