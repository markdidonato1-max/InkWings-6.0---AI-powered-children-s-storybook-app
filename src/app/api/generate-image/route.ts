import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, style, referenceImage } = await request.json();

    // Backend-only API configuration (never exposed to frontend)
    const apiKey = process.env.DEEPINFRA_API_KEY;
    const baseUrl = process.env.DEEPINFRA_BASE_URL || 'https://api.deepinfra.com/v1/openai';
    const model = process.env.DEEPINFRA_IMAGE_MODEL || 'black-forest-labs/FLUX-1-schnell';

    if (!apiKey) {
      return Response.json(
        { error: 'API key not configured on server. Please contact the administrator.' },
        { status: 500 }
      );
    }

    // Build enhanced prompt with style
    const stylePrefixes: Record<string, string> = {
      'watercolor': 'A beautiful watercolor painting of',
      'cartoon': 'A colorful cartoon illustration of',
      'digital art': 'A vibrant digital art illustration of',
      'pencil sketch': 'A detailed pencil sketch of',
      'oil painting': 'A classical oil painting of',
      '3d render': 'A cute 3D rendered illustration of',
      'anime': 'A cute anime-style illustration of',
      'pixel art': 'A charming pixel art scene of',
    };
    const prefix = stylePrefixes[style] || stylePrefixes['watercolor'];
    const fullPrompt = `${prefix} ${prompt}. Soft lighting, pastel colors, children's book illustration style, no text, no watermarks, wholesome and magical.`;

    console.log(`[generate-image] Calling DeepInfra via ${baseUrl}`);
    console.log(`[generate-image] Model: ${model}, Style: ${style}`);

    const startTime = Date.now();

    const requestBody: Record<string, unknown> = {
      model: model,
      prompt: fullPrompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
    };

    if (referenceImage) {
      requestBody.image = referenceImage;
      requestBody.strength = 0.65; // How much to resemble the reference image (0.0-1.0)
      console.log(`[generate-image] Using reference image for img2img (strength: 0.65)`);
    }

    // Add timeout to prevent hanging forever
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45 second timeout

    const response = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[generate-image] API error ${response.status}: ${errorText.substring(0, 500)}`);
      
      // If img2img failed, retry without reference image (text-to-image only)
      if (referenceImage && response.status === 400) {
        console.log('[generate-image] img2img not supported, falling back to text-to-image...');
        const fallbackBody = {
          model: model,
          prompt: fullPrompt,
          n: 1,
          size: '1024x1024',
          response_format: 'b64_json',
        };
        
        const fallbackController = new AbortController();
        const fallbackTimeout = setTimeout(() => fallbackController.abort(), 45000);
        
        const fallbackResponse = await fetch(`${baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(fallbackBody),
          signal: fallbackController.signal,
        });

        clearTimeout(fallbackTimeout);
        
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.data?.[0]?.b64_json) {
            console.log(`[generate-image] Fallback success! Image generated in ${Date.now() - startTime}ms`);
            return Response.json({ base64: fallbackData.data[0].b64_json });
          }
        }
      }
      
      return Response.json(
        { error: `API returned ${response.status}: ${errorText.substring(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // DeepInfra returns b64_json in data[0].b64_json (OpenAI format)
    if (data.data?.[0]?.b64_json) {
      console.log(`[generate-image] Success! Image generated in ${duration}ms`);
      return Response.json({ base64: data.data[0].b64_json });
    }

    // Fallback: try URL format
    if (data.data?.[0]?.url) {
      const imgResponse = await fetch(data.data[0].url);
      if (imgResponse.ok) {
        const arrayBuffer = await imgResponse.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        console.log(`[generate-image] Success via URL! Image generated in ${duration}ms`);
        return Response.json({ base64 });
      }
    }

    console.error('[generate-image] Unexpected response format:', data);
    return Response.json(
      { error: 'Unexpected API response format' },
      { status: 500 }
    );

  } catch (error: unknown) {
    console.error('[generate-image] Route error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      { error: `Image generation failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
