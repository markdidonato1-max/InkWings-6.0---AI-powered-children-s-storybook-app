import { NextRequest } from 'next/server';
import { getImagePositions } from '@/lib/image-utils';

export async function POST(request: NextRequest) {
  try {
    const { prompt, storyStyle, genre, ageRange, moral, pageCount = 10, imageCount = 5, childName } = await request.json();

    // Backend-only API configuration (never exposed to frontend)
    const apiKey = process.env.DEEPINFRA_API_KEY;
    const inferenceUrl = process.env.DEEPINFRA_STORY_INFERENCE_URL || 'https://api.deepinfra.com/v1/inference/meta-llama/Meta-Llama-3-8B-Instruct';

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured on server. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // Age-appropriate writing specs
    const ageSpecs: Record<string, { wordsPerPage: string; sentencesPerPage: string; vocabulary: string; example: string }> = {
      '3-5': {
        wordsPerPage: '20-40 words',
        sentencesPerPage: '2-4 short sentences',
        vocabulary: 'very simple everyday words, short sentences (3-7 words each), lots of repetition, onomatopoeia',
        example: 'The little fox went hop, hop, hop across the soft green grass. "Look!" said Fox. "A big red flower!"'
      },
      '6-8': {
        wordsPerPage: '50-100 words',
        sentencesPerPage: '3-5 medium sentences',
        vocabulary: 'simple but varied vocabulary, medium-length sentences (6-12 words), descriptive language',
        example: 'Finn the fox tiptoed through the shimmering meadow. The golden flowers swayed in the gentle breeze. "I wonder what is beyond that hill?" he thought.'
      },
      '9-12': {
        wordsPerPage: '120-200 words',
        sentencesPerPage: '5-8 longer sentences',
        vocabulary: 'rich vocabulary, complex sentences (10-18 words), vivid descriptions, metaphors',
        example: 'Professor Fox adjusted his brass spectacles and peered at the ancient map. The parchment was brittle with age, its edges crumbling like autumn leaves.'
      },
    };

    const specs = ageSpecs[ageRange || '6-8'] || ageSpecs['6-8'];

    // Build the combined prompt for Llama 3
    const systemPrompt = `You are an expert children's story author. Write engaging, age-appropriate stories.

Rules:
- Words per page: ${specs.wordsPerPage}
- Sentences per page: ${specs.sentencesPerPage}
- Vocabulary: ${specs.vocabulary}
- Include the child's name naturally in the story
- If a moral is specified, weave it naturally (don't preach)
- Return ONLY valid JSON with a "title" string and "pages" array
- Each page has: pageNumber (int), text (string), imageDescription (string for an illustrator)
- Example format: {"title": "Story Title", "pages": [{"pageNumber": 1, "text": "Once upon a time...", "imageDescription": "A fox in a sunny meadow"}]}`;

    const userPrompt = `Write a ${storyStyle || 'fun'} ${genre || 'adventure'} story for a child named ${childName || 'the reader'} aged ${ageRange || '6-8'}.

Story idea: ${prompt || 'A magical adventure with friendly animals'}
${moral && moral !== 'none' ? `Moral to weave in: ${moral}` : ''}

Requirements:
- Exactly ${pageCount} pages
- ${imageCount} pages should have illustrations (space them evenly)
- Return ONLY the JSON object, no markdown, no extra text`;

    // Llama 3 chat format
    const fullInput = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>

${systemPrompt}<|eot_id|><|start_header_id|>user<|end_header_id|>

${userPrompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>

`;

    console.log(`[generate-story] Calling DeepInfra inference: ${inferenceUrl}`);

    const startTime = Date.now();

    const response = await fetch(inferenceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: fullInput,
        stream: false,
      }),
    });

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
    const content = data.results?.[0]?.generated_text;

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
