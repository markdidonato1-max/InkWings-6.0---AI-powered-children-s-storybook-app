import ZAI from 'z-ai-web-dev-sdk'

const STYLE_PROMPTS: Record<string, string> = {
  watercolor: "Children's book illustration, watercolor style, soft colors, whimsical and gentle",
  anime: "Children's book illustration, anime style, vibrant colors, expressive characters, clean lines",
  mythical: "Children's book illustration, mythical fantasy style, ethereal glow, enchanted atmosphere, magical lighting",
  cartoon: "Children's book illustration, cartoon style, bold outlines, bright saturated colors, fun and playful",
  realistic: "Children's book illustration, realistic style, detailed textures, natural lighting, lifelike characters",
}

export async function POST(request: Request) {
  try {
    const { prompt, style, referenceImage } = await request.json()

    const stylePrompt = STYLE_PROMPTS[style || 'watercolor'] || STYLE_PROMPTS.watercolor

    // If a reference image (child's drawing) is provided, enhance the prompt
    let fullPrompt: string
    if (referenceImage) {
      fullPrompt = `${stylePrompt}, inspired by a child's drawing: ${prompt}. Maintain a whimsical, child-friendly feeling. Keep the core subjects and composition described.`
    } else {
      fullPrompt = `${stylePrompt}: ${prompt}`
    }

    // Keep prompt within limits
    if (fullPrompt.length > 2000) {
      fullPrompt = fullPrompt.substring(0, 2000)
    }

    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt: fullPrompt,
      size: '1024x1024',
    })

    const base64 = response.data[0]?.base64

    if (!base64) {
      console.error('[generate-image] No base64 in response')
      return Response.json({ error: 'No image generated' }, { status: 500 })
    }

    console.log(`[generate-image] Success via ZAI SDK (length: ${base64.length})`)
    return Response.json({ base64 })
  } catch (error) {
    console.error('[generate-image] Error:', error)
    return Response.json(
      { error: 'Failed to generate image. Please try again.' },
      { status: 500 }
    )
  }
}
