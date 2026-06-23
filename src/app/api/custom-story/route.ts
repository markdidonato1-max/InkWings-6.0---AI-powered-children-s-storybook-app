import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      storyStyle,
      genre,
      ageRange,
      moral,
      pageCount = 10,
      imageCount = 5,
      childName,
    } = body;

    // Backend-only API configuration (never exposed to frontend)
    const apiKey = process.env.DEEPINFRA_API_KEY;
    const baseUrl = process.env.DEEPINFRA_BASE_URL || 'https://api.deepinfra.com/v1/openai';
    const model = process.env.DEEPINFRA_STORY_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured on server. Please contact the administrator.' },
        { status: 500 }
      );
    }

    const apiBaseUrl = baseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1';

    console.log(`[custom-story] Generating story via ${apiBaseUrl}`);
    console.log(`[custom-story] Model: ${model}, Pages: ${pageCount}, Images: ${imageCount}`);
    console.log(`[custom-story] Style: ${storyStyle}, Genre: ${genre}, Age: ${ageRange}`);

    // Build a detailed system prompt for children's story generation
    const systemPrompt = `You are an expert children's story author who writes engaging, age-appropriate stories. 
Your stories are structured as JSON with a title and an array of pages. Each page has a pageNumber, text, and imageDescription.

Writing rules:
- Use simple, clear language appropriate for the specified age range
- Each page should be 2-5 sentences (shorter for younger ages)
- Create vivid, engaging narratives that capture a child's imagination
- Include the child's name naturally in the story when provided
- The imageDescription should be a detailed visual prompt for an illustrator
- If a moral/lesson is specified, weave it naturally into the story (don't preach)`;

    const userPrompt = `Write a ${storyStyle || 'fun'} ${genre || 'adventure'} story for a child named ${childName || 'the reader'} aged ${ageRange || '6-8'}.

Story idea: ${prompt || 'A fun adventure with magical creatures'}
${moral && moral !== 'none' ? `Moral/lesson: ${moral}` : ''}

Requirements:
- Exactly ${pageCount} pages
- ${imageCount} pages should have illustrations (every 2nd page)
- Return ONLY valid JSON in this exact format:

{
  "title": "Story Title",
  "pages": [
    {
      "pageNumber": 1,
      "text": "The story text for this page...",
      "imageDescription": "Detailed visual description for the illustrator..."
    }
  ]
}

Make sure the JSON is valid and can be parsed. Do not include any markdown formatting or explanation text outside the JSON.`;

    const startTime = Date.now();

    const response = await fetch(`${apiBaseUrl}/chat/completions`, {
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
        temperature: 0.8,
        max_tokens: 4000,
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[custom-story] API error ${response.status}: ${errorText.substring(0, 500)}`);
      return Response.json(
        { error: `API returned ${response.status}: ${errorText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error('[custom-story] No content in response:', data);
      return Response.json(
        { error: 'No story content received from API' },
        { status: 500 }
      );
    }

    // Extract JSON from the response (in case it has markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1];
    } else {
      // Try to find JSON between curly braces
      const braceMatch = content.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonContent = braceMatch[0];
      }
    }

    let storyData;
    try {
      storyData = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('[custom-story] JSON parse error:', parseError);
      console.error('[custom-story] Raw content:', content.substring(0, 500));
      return Response.json(
        { error: 'Failed to parse story JSON. The API returned invalid JSON.', rawContent: content.substring(0, 500) },
        { status: 500 }
      );
    }

    // Validate the story structure
    if (!storyData.title || !Array.isArray(storyData.pages)) {
      return Response.json(
        { error: 'Invalid story structure. Missing title or pages array.', rawData: storyData },
        { status: 500 }
      );
    }

    // Ensure correct page count
    if (storyData.pages.length !== pageCount) {
      console.warn(`[custom-story] Page count mismatch: expected ${pageCount}, got ${storyData.pages.length}`);
    }

    // Add usage info if available
    const usage = data.usage || {};
    const totalTokens = usage.total_tokens || Math.floor(content.length / 4);

    console.log(`[custom-story] Success! Generated "${storyData.title}" (${storyData.pages.length} pages) in ${duration}ms, ${totalTokens} tokens`);

    return Response.json({
      title: storyData.title,
      pages: storyData.pages,
      usage: { total_tokens: totalTokens, duration_ms: duration },
    });

  } catch (error: unknown) {
    console.error('[custom-story] Route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: `Story generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
