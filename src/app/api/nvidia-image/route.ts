// Image Generation Route
// Primary: Uses z-ai-web-dev-sdk for image generation (most reliable, built into platform)
// Secondary: Tries NVIDIA API if a valid image model API key is provided
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
    const { prompt, style, referenceImage } = await request.json()

    // Backend-only API configuration (never exposed to frontend)
    const apiKey = process.env.DEEPINFRA_API_KEY
    const baseUrl = process.env.DEEPINFRA_BASE_URL || 'https://api.deepinfra.com/v1/openai'
    const model = process.env.DEEPINFRA_IMAGE_MODEL || 'black-forest-labs/FLUX-1-schnell'

    const selectedStyle = style || 'watercolor'
    const stylePrompt = STYLE_PROMPTS[selectedStyle] || STYLE_PROMPTS.watercolor

    // Build the full prompt with style and reference drawing context
    let fullPrompt: string
    if (referenceImage) {
      // When a child's drawing is provided, enhance the prompt to incorporate the drawing's style
      // ZAI SDK doesn't support image-to-image natively, so we describe the drawing influence in text
      fullPrompt = `${stylePrompt}, inspired by a child's drawing with playful and imaginative style: ${prompt}. Maintain a whimsical, child-friendly feeling that captures the spirit of a child's artwork. Keep the core subjects and composition described. Use bright, cheerful colors and simple, expressive shapes.`
    } else {
      fullPrompt = `${stylePrompt}: ${prompt}`
    }

    // Keep prompt within limits
    if (fullPrompt.length > 2000) {
      fullPrompt = fullPrompt.substring(0, 2000)
    }

    // ── Primary: ZAI SDK image generation (most reliable, always available) ──
    try {
      console.log('[nvidia-image] Using ZAI SDK for image generation (primary)')
      const zai = await ZAI.create()

      const response = await zai.images.generations.create({
        prompt: fullPrompt,
        size: '1024x1024',
      })

      const base64 = response.data[0]?.base64

      if (base64) {
        console.log(`[nvidia-image] Success via ZAI SDK (length: ${base64.length})`)
        return Response.json({ base64 })
      }

      console.log('[nvidia-image] ZAI SDK returned no base64, trying NVIDIA fallback...')
    } catch (zaiError) {
      console.log('[nvidia-image] ZAI SDK failed, trying NVIDIA fallback:', zaiError instanceof Error ? zaiError.message : String(zaiError))
    }

    // ── Secondary: NVIDIA API image generation (only if API key + valid image model provided) ──
    // Most NVIDIA API keys only have text/chat models, not image generation models
    // Only attempt NVIDIA if a specific image model is provided (not text models)
    if (apiKey && model && !model.includes('nemotron') && !model.includes('llama') && !model.includes('kimi') && !model.includes('glm')) {
      console.log(`[nvidia-image] Trying NVIDIA model as fallback: ${model}`)

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

      try {
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
              console.log(`[nvidia-image] Success via NVIDIA fallback (${model})`)
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
            const errorText = await response.text().catch(() => '')
            console.log(`[nvidia-image] NVIDIA API returned ${response.status}: ${errorText.substring(0, 200)}`)
          }
        } catch (nvidiaError: unknown) {
          clearTimeout(timeout)
          const msg = nvidiaError instanceof Error ? nvidiaError.message : String(nvidiaError)
          console.log(`[nvidia-image] NVIDIA fallback failed: ${msg}`)
        }
    }

    // ── Dev fallback: generate a colored placeholder image if all APIs fail ──
    // This ensures the app works even without API keys configured
    try {
      const { createPlaceholderImage } = await import('@/lib/placeholder-image')
      const base64 = await createPlaceholderImage(prompt, selectedStyle)
      console.log(`[nvidia-image] Dev fallback: generated placeholder image (${base64.length} chars)`)
      return Response.json({ imageUrl: `data:image/svg+xml;base64,${base64}` })
    } catch (placeholderError) {
      console.error('[nvidia-image] Placeholder fallback also failed:', placeholderError)
    }

    // All methods failed
    console.error('[nvidia-image] All image generation methods failed')
    return Response.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('[nvidia-image] Route error:', error)
    return Response.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  }
}
