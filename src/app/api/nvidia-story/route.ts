// NVIDIA API Story Generation Route
// Uses NVIDIA's LLM API for creative story generation

// Images are placed every 2 pages: image i goes on page (i*2) (0-indexed)
// If odd pages, the last image covers just 1 page
function getImagePositions(pageCount: number, imageCount: number): Set<number> {
  const positions = new Set<number>()
  if (imageCount <= 0 || pageCount <= 0) return positions

  for (let i = 0; i < imageCount; i++) {
    const pos = i * 2
    if (pos < pageCount) {
      positions.add(pos)
    } else {
      // If more images than pairs, distribute remaining at the end
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

export async function POST(request: Request) {
  try {
    const { prompt, storyStyle, genre, ageRange, moral, pageCount, imageCount, childName, apiKey, model } = await request.json()

    if (!apiKey) {
      return Response.json({ error: 'NVIDIA API key is required' }, { status: 400 })
    }

    const selectedModel = model || 'meta/llama-3.3-70b-instruct'

    const vocabularyLevel =
      ageRange === '3-5'
        ? 'very simple words, short sentences, lots of repetition and onomatopoeia'
        : ageRange === '6-8'
          ? 'simple but varied vocabulary, medium sentences, some descriptive language'
          : 'richer vocabulary, longer sentences, more complex narrative structure'

    const systemPrompt = `You are a talented children's book author who creates engaging, age-appropriate stories.

STORY PARAMETERS:
- Age range: ${ageRange} years old
- Vocabulary level: ${vocabularyLevel}
- Story style: ${storyStyle}
- Genre: ${genre}
- Moral/lesson: ${moral === 'none' ? 'No specific moral required, just a fun story' : `The story should teach about ${moral}`}
- Number of pages: ${pageCount}
- Number of illustrations: ${imageCount}

You MUST return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "title": "A creative, engaging story title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The narrative text for this page. Age-appropriate and engaging.",
      "imageDescription": "A detailed description of what the illustration for this page should show, in watercolor children's book style"
    }
  ]
}

RULES:
- Each page should have 2-4 sentences of text appropriate for the age range
- The child's name "${childName}" should appear as the main character
- Image descriptions should be vivid and specific for illustration generation
- Make the story engaging, fun, and appropriate for children
- The story should have a clear beginning, middle, and end
- If a moral is specified, weave it naturally into the story
- Return exactly ${pageCount} pages
- Provide an imageDescription for EVERY page, even though only ${imageCount} images will be generated
- NEVER wrap the JSON in markdown code blocks - return ONLY raw JSON`

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Create a ${storyStyle.toLowerCase()} ${genre} story about: ${prompt}. The main character's name is ${childName}.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('NVIDIA API error:', response.status, errorText)
      return Response.json(
        { error: `NVIDIA API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    // Parse JSON from response
    try {
      try {
        const parsed = JSON.parse(content)
        if (parsed.title && parsed.pages) {
          const imagePositions = getImagePositions(pageCount, imageCount)
          parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
            ...p,
            hasImage: imagePositions.has(i),
          }))
          return Response.json(parsed)
        }
      } catch {
        // Try code block extraction
      }

      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        const parsed = JSON.parse(codeBlockMatch[1].trim())
        if (parsed.title && parsed.pages) {
          const imagePositions = getImagePositions(pageCount, imageCount)
          parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
            ...p,
            hasImage: imagePositions.has(i),
          }))
          return Response.json(parsed)
        }
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
          .replace(/'/g, '"')
          .replace(/(\w+)\s*:/g, '"$1":')
          .replace(/:\s*"([^"]*?)"\s*([,}\]])/g, ': "$1"$2')
        try {
          const parsed = JSON.parse(jsonStr)
          if (parsed.title && parsed.pages) {
            const imagePositions = getImagePositions(pageCount, imageCount)
            parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
              ...p,
              hasImage: imagePositions.has(i),
            }))
            return Response.json(parsed)
          }
        } catch {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.title && parsed.pages) {
            const imagePositions = getImagePositions(pageCount, imageCount)
            parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
              ...p,
              hasImage: imagePositions.has(i),
            }))
            return Response.json(parsed)
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse NVIDIA story JSON:', parseError)
    }

    // Fallback
    const imagePositions = getImagePositions(pageCount, imageCount)
    return Response.json({
      title: `${childName}'s ${genre} Adventure`,
      pages: Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        text: i === 0
          ? `Once upon a time, ${childName} discovered something wonderful...`
          : i === pageCount - 1
            ? `And ${childName} lived happily ever after, always remembering the adventure.`
            : `${childName} continued on the adventure, discovering new and exciting things along the way.`,
        imageDescription: `A colorful watercolor illustration of ${childName} on page ${i + 1} of their ${genre} adventure`,
        hasImage: imagePositions.has(i),
      })),
    })
  } catch (error) {
    console.error('NVIDIA story generation error:', error)
    return Response.json(
      { error: 'Failed to generate story with NVIDIA API. Please try again.' },
      { status: 500 }
    )
  }
}
