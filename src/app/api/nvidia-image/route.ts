// NVIDIA API Image Generation Route
// Primary: Uses z-ai-web-dev-sdk for image generation (reliable)
// Secondary: Tries NVIDIA API if available image models are found
// When a referenceImage (child's drawing) is provided, enhances the prompt

import ZAI from 'z-ai-web-dev-sdk'

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: "children's book illustration, watercolor style, soft pastel colors, gentle brush strokes, whimsical and dreamy",
  anime: "children's book illustration, anime style, vibrant colors, expressive characters, clean lines",
  mythical: "children's book illustration, mythical fantasy style, ethereal glow, enchanted atmosphere, magical lighting",
  cartoon: "children's book illustration, cartoon style, bold outlines, bright saturated colors, fun and playful",
  realistic: "children's book illustration, realistic style, detailed textures, natural lighting, lifelike characters",
}

export async function POST(request: Request) {
  try {
    const { prompt, style, apiKey, referenceImage, model } = await request.json()

    const selectedStyle = style || 'watercolor'
    const stylePrompt = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.watercolor

    // Build the full prompt with style and reference drawing context
    let fullPrompt: string
    if (referenceImage) {
      // When a child's drawing is provided, enhance the prompt to incorporate it
      fullPrompt = `${stylePrompt}, inspired by a child's drawing: ${prompt}. Maintain a whimsical, child-friendly feeling. Keep the core subjects and composition described.`
    } else {
      fullPrompt = `${stylePrompt}: ${prompt}`
    }

    // Keep prompt within limits
    if (fullPrompt.length > 2000) {
      fullPrompt = fullPrompt.substring(0, 2000)
    }

    // Try NVIDIA image generation first only if a specific image model is provided
    // Note: Most NVIDIA API keys only have text/chat models, not image generation models
    // If no model is provided, skip NVIDIA and go straight to ZAI SDK
    if (apiKey && model && !model.includes('nemotron') && !model.includes('llama') && !model.includes('kimi') && !model.includes('glm')) {
      try {
        console.log(`[nvidia-image] Trying NVIDIA model: ${model}`)

        const nvidiaBody: Record<string, unknown> = {
          model: model,
          prompt: fullPrompt,
        }

        // Different models use different size parameters
        if (model.includes('flux')) {
          nvidiaBody.dimensions = '1024x1024'
          nvidiaBody.steps = 4
        } else {
          nvidiaBody.size = '1024x1024'
          nvidiaBody.cfg_scale = 7
          nvidiaBody.steps = 30
        }

        if (referenceImage) {
          nvidiaBody.image = referenceImage
          nvidiaBody.strength = 0.7
        }

        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 45000) // 45s timeout

        const response = await fetch('https://integrate.api.nvidia.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(nvidiaBody),
          signal: controller.signal,
        })

        clearTimeout(timeout)

        if (response.ok) {
          const data = await response.json()
          if (data.data?.[0]?.b64_json) {
            console.log(`[nvidia-image] Success via NVIDIA (${model})`)
            return Response.json({ base64: data.data[0].b64_json })
          }
          if (data.data?.[0]?.url) {
            const imgResponse = await fetch(data.data[0].url)
            if (imgResponse.ok) {
              const arrayBuffer = await imgResponse.arrayBuffer()
              const base64 = Buffer.from(arrayBuffer).toString('base64')
              return Response.json({ base64 })
            }
          }
        } else {
          console.log(`[nvidia-image] NVIDIA API returned ${response.status}, falling back to ZAI SDK`)
        }
      } catch (nvidiaError: unknown) {
        const msg = nvidiaError instanceof Error ? nvidiaError.message : String(nvidiaError)
        console.log(`[nvidia-image] NVIDIA attempt failed: ${msg}, falling back to ZAI SDK`)
      }
    }

    // Primary fallback: z-ai-web-dev-sdk (reliable image generation)
    try {
      console.log('[nvidia-image] Using ZAI SDK for image generation')
      const zai = await ZAI.create()

      const response = await zai.images.generations.create({
        prompt: fullPrompt,
        size: '1024x1024',
      })

      const base64 = response.data[0]?.base64

      if (!base64) {
        console.error('[nvidia-image] ZAI SDK returned no base64')
        return Response.json({ error: 'No image generated' }, { status: 500 })
      }

      console.log(`[nvidia-image] Success via ZAI SDK (length: ${base64.length})`)
      return Response.json({ base64 })
    } catch (zaiError) {
      console.error('[nvidia-image] ZAI SDK also failed:', zaiError)
      return Response.json(
        { error: 'Failed to generate image. Please try again.' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[nvidia-image] Route error:', error)
    return Response.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  }
}
