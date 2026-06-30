function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function makeToyDraggable(button, boundary, onTap) {
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;
  let startRect = null;
  let boundaryRect = null;
  let dragged = false;
  let suppressClick = false;

  const applyOffset = (x, y) => {
    button.dataset.dragX = String(x);
    button.dataset.dragY = String(y);
    button.style.setProperty('--toy-x', `${x}px`);
    button.style.setProperty('--toy-y', `${y}px`);
  };

  const moveTo = (nextX, nextY) => {
    if (!startRect || !boundaryRect) return;
    const minX = startOffsetX + boundaryRect.left + 6 - startRect.left;
    const maxX = startOffsetX + boundaryRect.right - 6 - startRect.right;
    const minY = startOffsetY + boundaryRect.top + 6 - startRect.top;
    const maxY = startOffsetY + boundaryRect.bottom - 6 - startRect.bottom;
    applyOffset(clamp(nextX, minX, maxX), clamp(nextY, minY, maxY));
  };

  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startOffsetX = Number(button.dataset.dragX || 0);
    startOffsetY = Number(button.dataset.dragY || 0);
    startRect = button.getBoundingClientRect();
    boundaryRect = boundary.getBoundingClientRect();
    dragged = false;
    button.setPointerCapture?.(pointerId);
    button.classList.add('is-dragging');
  });

  button.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (Math.hypot(deltaX, deltaY) > 5) dragged = true;
    if (!dragged) return;
    event.preventDefault();
    moveTo(startOffsetX + deltaX, startOffsetY + deltaY);
  });

  const finishDrag = (event) => {
    if (event.pointerId !== pointerId) return;
    button.releasePointerCapture?.(pointerId);
    button.classList.remove('is-dragging');
    suppressClick = dragged;
    pointerId = null;
  };

  button.addEventListener('pointerup', finishDrag);
  button.addEventListener('pointercancel', finishDrag);

  button.addEventListener('click', (event) => {
    if (suppressClick) {
      suppressClick = false;
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
    onTap(button);
  });

  button.addEventListener('keydown', (event) => {
    const directions = {
      ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12],
    };
    if (!directions[event.key]) return;
    event.preventDefault();
    startRect = button.getBoundingClientRect();
    boundaryRect = boundary.getBoundingClientRect();
    startOffsetX = Number(button.dataset.dragX || 0);
    startOffsetY = Number(button.dataset.dragY || 0);
    moveTo(startOffsetX + directions[event.key][0], startOffsetY + directions[event.key][1]);
  });

  return {
    reset() {
      applyOffset(0, 0);
      button.classList.remove('is-dragging');
    },
  };
}
