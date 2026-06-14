// NVIDIA API Image Generation Route
// Uses NVIDIA's Stable Diffusion XL endpoint for image generation

import ZAI from 'z-ai-web-dev-sdk'

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: 'children\'s book illustration, watercolor style, soft pastel colors, gentle brush strokes, whimsical and dreamy',
  anime: 'children\'s book illustration, anime style, vibrant colors, expressive characters, clean lines',
  mythical: 'children\'s book illustration, mythical fantasy style, ethereal glow, enchanted atmosphere, magical lighting',
  cartoon: 'children\'s book illustration, cartoon style, bold outlines, bright saturated colors, fun and playful',
  realistic: 'children\'s book illustration, realistic style, detailed textures, natural lighting, lifelike characters',
}

export async function POST(request: Request) {
  try {
    const { prompt, style, apiKey } = await request.json()

    const selectedStyle = style || 'watercolor'
    const stylePrompt = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.watercolor
    const fullPrompt = `${stylePrompt}: ${prompt}`

    // If NVIDIA API key is provided, try NVIDIA's image generation
    if (apiKey) {
      try {
        const response = await fetch('https://integrate.api.nvidia.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'stabilityai/stable-diffusion-xl',
            prompt: fullPrompt,
            size: '1024x1024',
            n: 1,
          }),
        })

        if (response.ok) {
          const data = await response.json()
          // NVIDIA returns base64 or URL
          if (data.data?.[0]?.b64_json) {
            return Response.json({ base64: data.data[0].b64_json })
          }
          if (data.data?.[0]?.url) {
            // If it returns a URL, we need to fetch and convert to base64
            const imgResponse = await fetch(data.data[0].url)
            if (imgResponse.ok) {
              const arrayBuffer = await imgResponse.arrayBuffer()
              const base64 = Buffer.from(arrayBuffer).toString('base64')
              return Response.json({ base64 })
            }
          }
        }
        // If NVIDIA fails, fall through to z-ai-web-dev-sdk
        console.log('NVIDIA image generation failed, falling back to z-ai-web-dev-sdk')
      } catch (nvidiaError) {
        console.error('NVIDIA image API error, falling back:', nvidiaError)
      }
    }

    // Fallback to z-ai-web-dev-sdk
    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt: fullPrompt,
      size: '1024x1024',
    })

    const base64 = response.data[0]?.base64

    if (!base64) {
      return Response.json({ error: 'No image generated' }, { status: 500 })
    }

    return Response.json({ base64 })
  } catch (error) {
    console.error('Image generation error:', error)
    return Response.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  }
}
