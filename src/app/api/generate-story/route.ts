import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const { prompt, storyStyle, genre, ageRange, moral, pageCount, childName } = await request.json()

    const zai = await ZAI.create()

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
- Return exactly ${pageCount} pages`

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Create a ${storyStyle.toLowerCase()} ${genre} story about: ${prompt}. The main character's name is ${childName}.`,
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
          return Response.json(parsed)
        }
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        // Try to fix common JSON issues (single quotes -> double quotes)
        let jsonStr = jsonMatch[0]
          .replace(/'/g, '"')  // Replace single quotes with double quotes
          .replace(/(\w+)\s*:/g, '"$1":')  // Ensure keys are double-quoted
          .replace(/:\s*"([^"]*?)"\s*([,}\]])/g, ': "$1"$2') // Fix string values
        try {
          const parsed = JSON.parse(jsonStr)
          if (parsed.title && parsed.pages) {
            return Response.json(parsed)
          }
        } catch {
          // If still failing, try the original
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.title && parsed.pages) {
            return Response.json(parsed)
          }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse story JSON:', parseError)
    }

    // Fallback response
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
