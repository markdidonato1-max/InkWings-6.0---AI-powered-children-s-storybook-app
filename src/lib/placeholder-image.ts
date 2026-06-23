/**
 * Generates a placeholder illustration image when the AI image APIs are unavailable.
 * Creates a colorful SVG with a gradient background and text overlay, then converts to base64.
 */

// Generate a deterministic color from a string (so same prompt = same colors)
function stringToColor(str: string, offset: number = 0): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  const hue = Math.abs((hash + offset * 60) % 360)
  const sat = 60 + (Math.abs(hash) % 30)
  const light = 50 + (Math.abs(hash >> 8) % 20)
  return `hsl(${hue}, ${sat}%, ${light}%)`
}

function stringToGradient(str: string): string {
  const color1 = stringToColor(str, 0)
  const color2 = stringToColor(str, 1)
  const color3 = stringToColor(str, 2)
  return `linear-gradient(135deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines
}

export async function createPlaceholderImage(
  prompt: string,
  style: string = 'watercolor'
): Promise<string> {
  // Create a colorful SVG illustration
  const width = 512
  const height = 512
  const primaryColor = stringToColor(prompt, 0)
  const secondaryColor = stringToColor(prompt, 1)
  const accentColor = stringToColor(prompt, 2)
  const bgColor = stringToColor(prompt, 3)

  // Wrap prompt text for display
  const titleLines = wrapText(prompt, 18)
  const titleY = 460
  const lineHeight = 22
  const startY = titleY - ((titleLines.length - 1) * lineHeight) / 2

  // Create decorative circles/patterns based on prompt
  const circles = []
  for (let i = 0; i < 5; i++) {
    const cx = 80 + ((i * 97 + prompt.length * 13) % 350)
    const cy = 80 + ((i * 53 + prompt.length * 7) % 300)
    const r = 20 + ((i * 17 + prompt.length * 3) % 40)
    const fill = stringToColor(prompt, i + 4)
    const opacity = 0.3 + (i % 3) * 0.15
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${opacity}"/>`)
  }

  // Add some stars/sparkles
  const stars = []
  for (let i = 0; i < 8; i++) {
    const sx = 40 + ((i * 61 + prompt.length * 11) % 430)
    const sy = 40 + ((i * 37 + prompt.length * 5) % 380)
    const fill = stringToColor(prompt, i + 10)
    stars.push(`<text x="${sx}" y="${sy}" font-size="16" fill="${fill}" opacity="0.6">✨</text>`)
  }

  const titleTextElements = titleLines
    .map((line, i) => {
      const y = startY + i * lineHeight
      return `<text x="256" y="${y}" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle" opacity="0.9">${escapeXml(line)}</text>`
    })
    .join('\n')

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
      <stop offset="50%" style="stop-color:${secondaryColor};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${accentColor};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="overlay" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:black;stop-opacity:0" />
      <stop offset="60%" style="stop-color:black;stop-opacity:0" />
      <stop offset="100%" style="stop-color:black;stop-opacity:0.5" />
    </linearGradient>
  </defs>
  
  <!-- Background gradient -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- Decorative circles -->
  ${circles.join('\n  ')}
  
  <!-- Stars/sparkles -->
  ${stars.join('\n  ')}
  
  <!-- Center illustration area (rounded rect) -->
  <rect x="76" y="76" width="360" height="300" rx="20" fill="${bgColor}" opacity="0.3" stroke="white" stroke-width="2" stroke-opacity="0.3"/>
  
  <!-- Book icon in center -->
  <text x="256" y="240" font-family="Arial, sans-serif" font-size="80" text-anchor="middle" fill="white" opacity="0.8">📖</text>
  
  <!-- Dark overlay at bottom for text readability -->
  <rect width="100%" height="100%" fill="url(#overlay)"/>
  
  <!-- Style label -->
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="12" fill="white" text-anchor="middle" opacity="0.6">${escapeXml(style)} illustration</text>
  
  <!-- Prompt text -->
  ${titleTextElements}
  
  <!-- "InkWings" watermark -->
  <text x="256" y="496" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle" opacity="0.3">🎨 InkWings • Placeholder</text>
</svg>`

  // Convert SVG to base64 PNG-like data URL (we'll use SVG directly as base64)
  const base64 = Buffer.from(svg).toString('base64')
  return base64
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
