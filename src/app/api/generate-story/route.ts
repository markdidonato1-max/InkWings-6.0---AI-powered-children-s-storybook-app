import { NextRequest } from 'next/server';
import { getImagePositions } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const { prompt, storyStyle, genre, ageRange, moral, pageCount = 10, imageCount = 5, childName } = await request.json();

    // Backend-only API configuration (never exposed to frontend)
    const apiKey = process.env.DEEPINFRA_API_KEY;
    const baseUrl = process.env.DEEPINFRA_BASE_URL || 'https://api.deepinfra.com/v1/openai';
    const model = process.env.DEEPINFRA_STORY_MODEL || 'nvidia/Nemotron-3-Nano-Omni-30B-A3B-Reasoning';

    console.log(`[generate-story] API key loaded: ${apiKey ? apiKey.slice(0, 8) + '...' + apiKey.slice(-4) : 'MISSING'}`);
    console.log(`[generate-story] Base URL: ${baseUrl}`);
    console.log(`[generate-story] Model: ${model}`);

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured on server. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // Age-appropriate writing specs
    const ageSpecs: Record<string, { wordsPerPage: string; sentencesPerPage: string; vocabulary: string; example: string; imageDetail: string }> = {
      '3-5': {
        wordsPerPage: '30-60 words (about 4-6 sentences per page)',
        sentencesPerPage: '4-6 very short sentences',
        vocabulary: 'very simple everyday words, short sentences (3-5 words each), lots of repetition, onomatopoeia, rhyming encouraged, simple dialogue with exclamations',
        example: 'The little fox named Jamie went hop, hop, hop across the soft green grass. "Look!" said Jamie, pointing with her tiny paw. "A big red flower!" A happy bee buzzed by. "Hello, Bee!" said Jamie. The bee buzzed back. "Hello, little fox!"',
        imageDetail: 'Describe the exact scene with the character, their specific action, emotion, and the setting details (colors, objects, weather). Example: "A small red fox named Jamie hopping joyfully across a bright green meadow, pointing at a big red flower with her tiny paw, a happy yellow bee buzzing nearby, golden sunshine, soft clouds, colorful wildflowers"'
      },
      '6-8': {
        wordsPerPage: '80-150 words (about 5-8 sentences per page)',
        sentencesPerPage: '5-8 medium sentences',
        vocabulary: 'simple but varied vocabulary, medium-length sentences (6-10 words), descriptive language with adjectives, some dialogue, occasional bigger words with context clues, short paragraphs',
        example: 'Finn the fox tiptoed through the shimmering meadow, his ears perked up at every sound. The golden flowers swayed in the gentle breeze, releasing sweet fragrance into the warm afternoon air. "I wonder what is beyond that hill?" Finn thought, his tail swishing with excitement. A butterfly with wings like stained glass fluttered ahead, as if beckoning him forward.',
        imageDetail: 'Describe the exact scene with the character, their specific action, emotion, and the setting details. Include the character name, what they are doing, facial expression, and the environment. Example: "A young orange fox named Finn tiptoeing cautiously through a shimmering meadow dotted with golden wildflowers, his ears perked up curiously, tail swishing with excitement, a colorful butterfly with stained-glass wings fluttering ahead of him, warm afternoon sunlight, soft green grass, distant rolling hills"'
      },
      '9-12': {
        wordsPerPage: '200-250 words (about 8-12 sentences per page, 2-3 paragraphs)',
        sentencesPerPage: '8-12 sentences forming 2-3 short paragraphs',
        vocabulary: 'rich vocabulary, complex sentences (10-15 words), vivid descriptive language, metaphors and similes, sophisticated narrative with internal thoughts, dialogue that reveals character personality',
        example: 'Professor Fox adjusted his brass spectacles and peered at the ancient map spread across his oak desk. The parchment was brittle with age, its edges crumbling like autumn leaves beneath his careful touch. According to the faded ink, the entrance to the Crystal Cavern lay just beyond the Whispering Falls. "But someone must go," he whispered, feeling the weight of destiny settle upon his shoulders like a heavy cloak.',
        imageDetail: 'Describe the exact scene with the character, their specific action, emotion, and the setting details. Include rich visual details, character expressions, lighting, atmosphere, and specific objects. Example: "An elderly fox professor wearing round brass spectacles, leaning over an ancient oak desk, studying a yellowed parchment map with faded ink, his gray fur catching the warm candlelight, a heavy velvet cloak draped over his shoulders, dusty bookshelves in the background, a single candle flickering, dust motes dancing in the amber light"'
      },
      '9-12-advanced': {
        wordsPerPage: '200-250 words (about 8-12 sentences per page, 2-3 paragraphs)',
        sentencesPerPage: '8-12 sentences forming 2-3 paragraphs with rich world-building',
        vocabulary: 'advanced vocabulary (Harry Potter reading level), complex multi-clause sentences (12-18 words), rich world-building, nuanced character emotions, foreshadowing, sophisticated dialogue with distinct character voices, vivid sensory descriptions',
        example: 'The ancient library of Mistwood Hollow had stood for three centuries, its towering shelves stretching into the shadowy heights above. Young Marcus stood at the entrance, his heart thumping against his ribs as the musty scent of old parchment wafted toward him. He had waited eleven years for this moment. "The key is not in the lock, my boy," his grandmother had said, her eyes piercing with clarity. "It is in the story that the lock remembers." Now, as moonlight filtered through the stained-glass windows, Marcus realized that some doors opened not with force, but with understanding.',
        imageDetail: 'Describe the exact scene with rich, cinematic detail. Include the character name, their specific action, facial expression, body language, emotions, lighting, atmosphere, and specific environmental details. Use vivid sensory language. Example: "A young boy named Marcus standing in the grand entrance of an ancient library called Mistwood Hollow, towering shelves of leather-bound books stretching into shadowy heights above him, his heart visibly pounding with nervous excitement, moonlight streaming through colorful stained-glass windows casting emerald and sapphire patterns across the dusty wooden floor, an ornate brass key clutched in his trembling hand, ancient stone walls covered in creeping ivy, dust motes dancing in the moonbeams"'
      },
    };

    const specs = ageSpecs[ageRange || '6-8'] || ageSpecs['6-8'];

    const systemPrompt = `You are an expert children's book author. Write vivid, engaging stories.

CRITICAL: Return ONLY valid JSON with exactly this format:
{"title": "Story Title", "pages": [{"pageNumber": 1, "text": "Story text here...", "imageDescription": "Visual scene description for illustrator"}]}

Writing specs for age ${ageRange || '6-8'}:
- ${specs.wordsPerPage}
- ${specs.sentencesPerPage}
- Vocabulary: ${specs.vocabulary}
- Include child's name "${childName || 'the reader'}" naturally
- Make imageDescription vivid and scene-specific (40-60 words)
- If moral: weave it naturally, never preach

imageDescription rules: Describe the exact scene with character name, action, emotion, setting, colors, lighting. Example: "A young orange fox named Jamie tiptoeing through a shimmering meadow, ears perked curiously, golden wildflowers swaying, warm afternoon sunlight filtering through fluffy clouds"`;

    const userPrompt = `Write a ${storyStyle || 'fun'} ${genre || 'adventure'} story.

Idea: ${prompt || 'A magical adventure with friendly animals'}
${moral && moral !== 'none' ? `Moral: ${moral}` : ''}

Requirements:
- ${pageCount} pages total
- Each page has: text, imageDescription
- Return ONLY the JSON object, no markdown, no explanation`;

    console.log(`[generate-story] Calling DeepInfra OpenAI endpoint: ${baseUrl}/chat/completions`);
    console.log(`[generate-story] Age group: ${ageRange || '6-8'}`);

    const startTime = Date.now();

    // Add timeout to prevent hanging forever (5 minutes for local testing)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 300 second timeout

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-story] API error ${response.status}: ${errorText.substring(0, 500)}`);
      return Response.json(
        { error: `API returned ${response.status}: ${errorText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[generate-story] No content in response:', data);
      return Response.json(
        { error: 'No story content received from API' },
        { status: 500 }
      );
    }

    // Extract JSON from the response
    let jsonContent = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonContent = braceMatch[0];
      }
    }

    let storyData;
    try {
      storyData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('[generate-story] JSON parse error:', parseError);
      console.error('[generate-story] Raw content:', content.substring(0, 500));
      return Response.json(
        { error: 'Failed to parse story JSON. The API returned invalid JSON.', rawContent: content.substring(0, 500) },
        { status: 500 }
      );
    }

    if (!storyData.title || !Array.isArray(storyData.pages)) {
      return Response.json(
        { error: 'Invalid story structure. Missing title or pages array.', rawData: storyData },
        { status: 500 }
      );
    }

    console.log(`[generate-story] Success! "${storyData.title}" (${storyData.pages.length} pages) in ${duration}ms`);

    return Response.json({
      title: storyData.title,
      pages: storyData.pages,
    });

  } catch (error: unknown) {
    console.error('[generate-story] Route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: `Story generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
