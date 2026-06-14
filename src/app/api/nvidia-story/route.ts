// NVIDIA API Story Generation Route
// Uses NVIDIA's LLM API (Nemotron) for creative story generation
// Supports Nemotron-specific parameters like reasoning_effort and reasoning_budget

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

    const selectedModel = model || 'nvidia/nemotron-3-ultra-550b-a55b'

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

    // Build request body - Nemotron supports reasoning_effort and reasoning_budget
    const requestBody: Record<string, unknown> = {
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a ${storyStyle.toLowerCase()} ${genre} story about: ${prompt}. The main character's name is ${childName}. Remember: each page MUST have ${spec.wordsPerPage}. This is for ${ageRange} year olds.`,
        },
      ],
      temperature: 0.8,
      top_p: 0.95,
      max_tokens: 16384,
      stream: false, // We need the full response at once for JSON parsing
    }

    // Add Nemotron-specific reasoning parameters if using a Nemotron model
    if (selectedModel.includes('nemotron')) {
      requestBody.reasoning_effort = 'high'
      requestBody.reasoning_budget = 16384
    }

    console.log(`[nvidia-story] Generating story with model: ${selectedModel}, age: ${ageRange}, pages: ${pageCount}`)

    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[nvidia-story] API error:', response.status, errorText.substring(0, 500))
      return Response.json(
        { error: `NVIDIA API error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()

    // For Nemotron, the content might include reasoning tokens in <think> tags
    let content = data.choices?.[0]?.message?.content || ''

    // Strip <think> tags from Nemotron reasoning output
    const thinkMatch = content.match(/<\/think>\s*([\s\S]*)/)
    if (thinkMatch) {
      content = thinkMatch[1].trim()
    }

    console.log(`[nvidia-story] Response length: ${content.length} chars`)

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
          console.log(`[nvidia-story] Success: "${parsed.title}" with ${parsed.pages.length} pages`)
          return Response.json(parsed)
        }
      } catch {
        // Try code block extraction
      }

      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        try {
          const parsed = JSON.parse(codeBlockMatch[1].trim())
          if (parsed.title && parsed.pages) {
            const imagePositions = getImagePositions(pageCount, imageCount)
            parsed.pages = parsed.pages.map((p: { pageNumber: number; text: string; imageDescription?: string }, i: number) => ({
              ...p,
              hasImage: imagePositions.has(i),
            }))
            console.log(`[nvidia-story] Success (from code block): "${parsed.title}" with ${parsed.pages.length} pages`)
            return Response.json(parsed)
          }
        } catch {
          // Code block content wasn't valid JSON either
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
            console.log(`[nvidia-story] Success (from regex match): "${parsed.title}" with ${parsed.pages.length} pages`)
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
            // Give up on parsing
          }
        }
      }
    } catch (parseError) {
      console.error('[nvidia-story] Failed to parse story JSON:', parseError)
    }

    // Fallback story with age-appropriate word counts
    console.log('[nvidia-story] Using fallback story')
    const imagePositions = getImagePositions(pageCount, imageCount)

    const fallbackTexts: Record<string, string[]> = {
      '3-5': [
        `Once upon a time, ${childName} found a magic door. "Wow!" said ${childName}. What could be inside?`,
        `${childName} opened the door. Pop! Out came a little star. "Hello!" said the star.`,
        `The star and ${childName} danced and played. "This is fun!" laughed ${childName}.`,
        `"I must go home now," said the star. "But we can play again tomorrow!"`,
        `${childName} waved goodbye. "See you soon, friend!" The end.`,
      ],
      '6-8': [
        `One sunny morning, ${childName} discovered a mysterious path through the whispering trees. The leaves shimmered like golden coins. "I wonder where this leads?" ${childName} thought.`,
        `Following the path, ${childName} found a sparkling stream. A friendly turtle sat on a rock. "Welcome, traveler!" said the turtle with a warm smile.`,
        `"I've been waiting for someone brave," the turtle explained. "The Crystal Flower has stopped glowing, and the forest needs its light."`,
        `${childName} nodded bravely. "I will help!" Together, they journeyed deeper into the enchanted woods, where fireflies danced like tiny lanterns.`,
        `At last, they found the Crystal Flower. ${childName} spoke kind words, and slowly it began to glow again. The whole forest sparkled with joy!`,
      ],
      '9-12': [
        `${childName} had always been curious about the old lighthouse on the cliff. Its beam hadn't shone in years, but tonight, something was different. A faint pulse of light flickered from the top, like a heartbeat.`,
        `Pushing open the rusted door, ${childName} climbed the spiral staircase. The walls were covered in maps of places that couldn't possibly exist — islands floating in clouds, forests made of crystal.`,
        `At the top, a small creature with luminous wings sat beside the broken lamp. "You came," it whispered. "The lighthouse doesn't guide ships anymore. It guides lost stories home."`,
        `${childName} carefully reconnected the crystals that powered the lamp. Each one hummed with a different color, and as they aligned, images of forgotten tales filled the room.`,
        `The lamp blazed to life, sending a rainbow beam across the sky. Somewhere, stories that had been lost were finally finding their way. ${childName} smiled, knowing they would always be welcome here.`,
      ],
    }

    const texts = fallbackTexts[ageRange] || fallbackTexts['3-5']

    return Response.json({
      title: `${childName}'s ${genre} Adventure`,
      pages: Array.from({ length: pageCount }, (_, i) => ({
        pageNumber: i + 1,
        text: texts[i % texts.length],
        imageDescription: `A colorful illustration of ${childName} on page ${i + 1} of their ${genre} adventure`,
        hasImage: imagePositions.has(i),
      })),
    })
  } catch (error) {
    console.error('[nvidia-story] Route error:', error)
    return Response.json(
      { error: 'Failed to generate story with NVIDIA API. Please try again.' },
      { status: 500 }
    )
  }
}
