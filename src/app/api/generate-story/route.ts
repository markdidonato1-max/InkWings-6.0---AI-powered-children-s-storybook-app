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
    // Based on industry standards for children's books:
    //   Ages 3-5 (picture books): 15-35 words/page, ~400-500 total, every page illustrated
    //   Ages 6-8 (early readers/chapter books): 50-100 words/page, ~1000-2500 total
    //   Ages 9-12 (middle grade): 120-200 words/page, rich narrative paragraphs
    const ageSpecs: Record<string, { wordsPerPage: string; sentencesPerPage: string; vocabulary: string; example: string }> = {
      '3-5': {
        wordsPerPage: '20-40 words',
        sentencesPerPage: '2-4 short sentences',
        vocabulary: 'very simple everyday words, short sentences (3-7 words each), lots of repetition, onomatopoeia (buzz, splash, boom), rhyming is encouraged, simple dialogue with exclamations',
        example: 'The little fox went hop, hop, hop across the soft green grass. "Look!" said Fox, pointing with his paw. "A big red flower!" The bee buzzed by. "Hello, Bee!"'
      },
      '6-8': {
        wordsPerPage: '50-100 words',
        sentencesPerPage: '3-5 medium sentences',
        vocabulary: 'simple but varied vocabulary, medium-length sentences (6-12 words), descriptive language with adjectives, some dialogue, occasional bigger words with context clues, short paragraphs',
        example: 'Finn the fox tiptoed through the shimmering meadow, his ears perked up at every sound. The golden flowers swayed in the gentle breeze, releasing sweet fragrance into the air. "I wonder what is beyond that hill?" he thought, his tail swishing with excitement. A butterfly landed on his nose, and Finn giggled.'
      },
      '9-12': {
        wordsPerPage: '120-200 words',
        sentencesPerPage: '5-8 longer sentences forming a full paragraph',
        vocabulary: 'rich vocabulary, complex sentences (10-18 words), vivid descriptive language, metaphors and similes, sophisticated narrative with internal thoughts, dialogue that reveals character',
        example: 'Professor Fox adjusted his brass spectacles and peered at the ancient map spread across his oak desk. The parchment was brittle with age, its edges crumbling like autumn leaves beneath his careful touch. According to the faded ink, the entrance to the Crystal Cavern lay just beyond the Whispering Falls — a place no one from the village had dared to visit in over a hundred years. He traced the route with one clawed finger, his heart racing. "Tomorrow," he whispered to the empty room, "tomorrow I shall find it." The candle flickered as if in agreement, casting dancing shadows on the stone walls.'
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
- EACH page MUST have EXACTLY ${spec.wordsPerPage}. This is the MOST IMPORTANT rule — count your words carefully!
- ${ageRange === '3-5' ? 'Write 20-40 words per page. Keep it short and sweet with simple words, repetition, and fun sounds.' : ageRange === '6-8' ? 'Write 50-100 words per page. Include descriptive language, dialogue, and enough detail to paint a vivid picture.' : 'Write 120-200 words per page. Create rich, detailed paragraphs with vivid descriptions, character thoughts, and engaging dialogue. This is a chapter book — give the story depth!'}
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

    // Fallback response with age-appropriate word counts
    const imagePositions = getImagePositions(pageCount, imageCount)

    const fallbackTexts: Record<string, string[]> = {
      '3-5': [
        `Once upon a time, ${childName} found a magic door in the garden. "Wow!" said ${childName}, eyes wide with wonder. What could be inside? Knock, knock! The door creaked open slowly.`,
        `${childName} opened the door. Pop! Out came a little star, twinkling bright. "Hello!" said the star, dancing in the air. "I am Starry!" ${childName} clapped with joy.`,
        `The star and ${childName} danced and played in the garden. Spin, spin, spin! "This is so much fun!" laughed ${childName}. The flowers swayed to the music.`,
        `"I must go home now," said Starry, glowing softly. "But we can play again tomorrow!" ${childName} hugged the little star. "Promise?" asked ${childName}. "Promise!" said Starry.`,
        `${childName} waved goodbye as Starry floated up, up, up into the night sky. "See you soon, friend!" ${childName} whispered. And every night, the star twinkled just for them. The end.`,
      ],
      '6-8': [
        `One sunny morning, ${childName} discovered a mysterious path winding through the whispering trees. The leaves shimmered like golden coins in the sunlight, and tiny blue flowers dotted the trail. "I wonder where this leads?" ${childName} thought, stepping carefully along the mossy stones. A butterfly with wings like stained glass fluttered ahead, as if beckoning them forward.`,
        `Following the butterfly, ${childName} arrived at a sparkling stream where the water sang a gentle melody. A friendly turtle with emerald-green eyes sat on a smooth rock, wearing a tiny silver pendant. "Welcome, traveler!" said the turtle with a warm smile. "I've been expecting someone with a kind heart." ${childName} sat down beside the stream, curious about what the turtle might say next.`,
        `"The Crystal Flower that lights our forest has stopped glowing," the turtle explained, his voice full of worry. "Without its light, the forest creatures are lost in the shadows. Only someone brave and kind can restore it." ${childName} looked at the dark patches between the trees and felt a surge of determination. "I will help!" ${childName} declared, standing tall.`,
        `Together, ${childName} and the turtle journeyed deeper into the enchanted woods, where fireflies danced like tiny lanterns and mushrooms glowed in soft blues and purples. The path grew narrow and twisty, but ${childName} wasn't afraid. "The forest is counting on us," ${childName} whispered, and the turtle nodded bravely by their side.`,
        `At last, they found the Crystal Flower in a hidden glade, its petals dull and gray. ${childName} knelt beside it and spoke the kindest words they knew — words about hope and friendship and never giving up. Slowly, the petals began to shimmer, then burst into brilliant rainbow light! The whole forest sparkled with joy, and every creature cheered. ${childName} had saved the day!`,
      ],
      '9-12': [
        `${childName} had always been curious about the old lighthouse perched on the cliff above the harbor. Its beam hadn't shone in years, not since the old keeper disappeared one stormy night. But tonight, something was different. A faint pulse of light flickered from the lantern room at the top — not the bright beam it once was, but a weak, rhythmic glow, like a heartbeat. ${childName} pressed a hand against the cold window, watching the light blink on and off in an unmistakable pattern. Three short, two long, three short. It was a signal. Someone — or something — was calling for help.`,
        `Pushing open the rusted door, ${childName} stepped into the damp, salt-tinged air of the lighthouse interior. A spiral staircase wound upward into darkness, its iron railings slick with moisture. The walls were covered in maps and charts of places that couldn't possibly exist — islands floating in clouds, forests made entirely of crystal, seas that glowed phosphorescent green. ${childName} paused at one map that showed the coastline as it looked a hundred years ago, with landmarks that had long since crumbled into the sea. "Who drew all these?" ${childName} wondered aloud, running a finger along the faded ink.`,
        `At the top of the staircase, ${childName} found the lantern room — and a small creature with luminous wings perched beside the broken lamp. It was no bigger than a cat, with eyes like polished amber and wings that shed tiny motes of golden light. "You came," it whispered, its voice like wind chimes. "The lighthouse doesn't guide ships anymore, ${childName}. It guides lost stories home — stories that have been forgotten, tales that have been abandoned. And the lamp is dying." The creature's wings flickered anxiously, casting dancing shadows across the curved glass walls.`,
        `${childName} knelt beside the ancient lamp and saw that its power source — a ring of crystals arranged in a circle — had been knocked out of alignment. Each crystal hummed with a different color when touched: sapphire blue, ruby red, emerald green, amethyst purple. Working carefully, ${childName} reconnected each crystal, listening to the tone it made and adjusting until the harmonics aligned. As the final crystal clicked into place, images of forgotten tales filled the room — pirate adventures, dragon flights, underwater kingdoms — all swirling like living paintings in the lamp's rekindled glow.`,
        `The lamp blazed to life, sending a brilliant rainbow beam sweeping across the dark sky. Somewhere far away, stories that had been lost for generations were finally finding their way back to the world, appearing as books on dusty shelves and songs on quiet lips. ${childName} smiled, watching the beam rotate steadily, knowing the lighthouse would never go dark again. The winged creature perched on ${childName}'s shoulder, its wings glowing brighter than ever. "Thank you," it said softly. "And ${childName} — you are always welcome here." The night had never looked so full of stories.`,
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
    console.error('Story generation error:', error)
    return Response.json(
      { error: 'Failed to generate story. Please try again.' },
      { status: 500 }
    )
  }
}
