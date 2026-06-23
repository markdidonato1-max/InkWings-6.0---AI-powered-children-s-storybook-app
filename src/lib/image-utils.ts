// Shared image position calculation used across client and API routes
// Images are placed every 2 pages: image i goes on page (i*2) (0-indexed)
// If odd pages, the last image covers just 1 page
export function getImagePositions(pageCount: number, imageCount: number): Set<number> {
  const positions = new Set<number>()
  if (imageCount <= 0 || pageCount <= 0) return positions

  for (let i = 0; i < imageCount; i++) {
    const pos = i * 2
    if (pos < pageCount) {
      positions.add(pos)
    } else {
      const remaining = imageCount - i
      const startPos = pageCount - remaining
      for (let j = i; j < imageCount; j++) {
        positions.add(Math.max(startPos + (j - i), 0))
      }
      break
    }
  }
  return positions
}
