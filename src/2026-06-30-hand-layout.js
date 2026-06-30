export function calculateHandLayout({
  containerWidth,
  horizontalPadding,
  cardWidth,
  cardCount,
  compact = false,
}) {
  if (cardCount <= 0 || containerWidth <= 0 || cardWidth <= 0) {
    return { step: 0, contentWidth: horizontalPadding, scrolls: false };
  }

  const available = Math.max(0, containerWidth - horizontalPadding - cardWidth);
  const minStep = compact ? Math.min(42, cardWidth * 0.6) : Math.min(46, cardWidth * 0.5);
  const fitStep = cardCount === 1 ? cardWidth : available / (cardCount - 1);
  const step = cardCount === 1 ? cardWidth : Math.max(minStep, Math.min(cardWidth + 6, fitStep));
  const contentWidth = horizontalPadding + cardWidth + step * (cardCount - 1);

  return {
    step,
    contentWidth,
    scrolls: contentWidth > containerWidth + 1,
  };
}

export function calculateFanTransform({ index, cardCount, compact }) {
  if (!compact || cardCount <= 0) return { angle: 0, hoverAngle: 0, y: 0 };
  const midpoint = (cardCount - 1) / 2;
  const divisor = Math.max(midpoint, 1);
  const normalized = (index - midpoint) / divisor;
  const fanLimit = cardCount > 10 ? 9 : 15;
  const angle = normalized * fanLimit;
  return {
    angle,
    hoverAngle: angle * 0.28,
    y: normalized * normalized * 13 - 13,
  };
}
