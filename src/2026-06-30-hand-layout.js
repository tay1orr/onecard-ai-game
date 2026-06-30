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
  const minStep = compact ? Math.min(34, cardWidth * 0.48) : Math.min(46, cardWidth * 0.5);
  const fitStep = cardCount === 1 ? cardWidth : available / (cardCount - 1);
  const step = cardCount === 1 ? cardWidth : Math.max(minStep, Math.min(cardWidth + 6, fitStep));
  const contentWidth = horizontalPadding + cardWidth + step * (cardCount - 1);

  return {
    step,
    contentWidth,
    scrolls: contentWidth > containerWidth + 1,
  };
}
