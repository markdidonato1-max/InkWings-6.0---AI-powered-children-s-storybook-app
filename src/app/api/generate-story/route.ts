import ZAI from 'z-ai-web-dev-sdk'

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
    const { prompt, storyStyle, genre, ageRange, moral, pageCount, imageCount, childName } = await request.json()

    // Age-appropriate word count and vocabulary specifications
    const ageSpecs: Record<string, { wordsPerPage: string; sentencesPerPage: string; vocabulary: string; example: string }> = {
      '3-5': {
        wordsPerPage: '15-25 words',
        sentencesPerPage: '1-2 very short sentences',
        vocabulary: 'very simple everyday words, short sentences (3-6 words each), lots of repetition, onomatopoeia (buzz, splash, boom), rhyming is encouraged',
        example: 'The little fox went hop hop hop. "Look!" said Fox. "A big red flower!"'
      },
      '6-8': {
        wordsPerPage: '30-50 words',
        sentencesPerPage: '2-3 medium sentences',
        vocabulary: 'simple but varied vocabulary, medium-length sentences (5-10 words), some descriptive language and adjectives, occasional bigger words with context clues',
        example: 'Finn the fox tiptoed through the shimmering meadow. The golden flowers swayed in the gentle breeze. "I wonder what is beyond that hill?" he thought.'
      },
      '9-12': {
        wordsPerPage: '50-80 words',
        sentencesPerPage: '3-5 longer sentences',
        vocabulary: 'richer vocabulary, longer and more complex sentences (8-15 words), descriptive language, metaphors, and more sophisticated narrative structure',
        example: 'Professor Fox adjusted his brass spectacles and peered at the ancient map. The parchment was brittle with age, its edges crumbling like autumn leaves. According to the faded ink, the entrance to the Crystal Cavern lay just beyond the Whispering Falls.'
      },
    }

    const spec = ageSpecs[ageRange] || ageSpecs['3-5']

    const zai = await ZAI.create()

    const systemPrompt = `You are a talented children's book author who creates engaging, age-appropriate stories.

STORY PARAMETERS:
- Target age range: ${ageRange} years old
- Words per page: EXACTLY ${spec.wordsPerPage} — this is critical, each page must have ${spec.wordsPerPage}
- Sentences per page: ${spec.sentencesPerPage}
- Vocabulary level: ${spec.vocabulary}
- Story style: ${storyStyle}
- Genre: ${genre}
- Moral/lesson: ${moral === 'none' ? 'No specific moral required, just a fun story' : `The story should teach about ${moral}`}
- Number of pages: ${pageCount}
- Number of illustrations: ${imageCount}

EXAMPLE of correct text length for age ${ageRange}:
"${spec.example}"

You MUST return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
{
  "title": "A creative, engaging story title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The narrative text for this page - MUST be ${spec.wordsPerPage}.",
      "imageDescription": "A detailed description of what the illustration for this page should show"
    }
  ]
}

CRITICAL RULES:
- EACH page MUST have EXACTLY ${spec.wordsPerPage}. Count your words!
- Do NOT write too much text per page. ${ageRange === '3-5' ? 'Keep it VERY short and simple.' : ageRange === '6-8' ? 'Keep it moderate length.' : 'Write a rich paragraph but stay under 80 words.'}
- The child's name "${childName}" should appear as the main character
- Image descriptions should be vivid and specific for illustration generation
- Make the story engaging, fun, and appropriate for children
- The story should have a clear beginning, middle, and end
- If a moral is specified, weave it naturally into the story
- Return exactly ${pageCount} pages
- Provide an imageDescription for EVERY page
- NEVER wrap the JSON in markdown code blocks - return ONLY raw JSON`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a ${storyStyle.toLowerCase()} ${genre} story about: ${prompt}. The main character's name is ${childName}. Remember: each page MUST have ${spec.wordsPerPage}. This is for ${ageRange} year olds.`,
        },
      ],
    })

    const content = completion.choices[0]?.message?.content || ''

    // Try to parse JSON from the response
    try {
      // First try direct parse
      try {
        const parsed = JSON.parse(content)
        if (parsed.title && parsed.pages) {
          // Add hasImage field based on imageCount
          const imagePositions = getImagePositions(pageCount, imageCount)
          parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
            ...p,
            hasImage: imagePositions.has(i),
          }))
          return Response.json(parsed)
        }
      } catch {
        // Try to extract JSON from markdown code blocks or surrounding text
      }

      // Try to extract JSON from markdown code blocks
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
        // Try direct parse first
        try {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.title && parsed.pages) {
            const imagePositions = getImagePositions(pageCount, imageCount)
            parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
              ...p,
              hasImage: imagePositions.has(i),
            }))
            return Response.json(parsed)
          }
        } catch {
          // Try fixing common JSON issues
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
            // Give up
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse story JSON:', parseError)
    }

    // Fallback response
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
    console.error('Story generation error:', error)
    return Response.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    )
  }
}
