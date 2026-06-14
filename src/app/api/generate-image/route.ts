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
      fullPrompt = `Transform this child's drawing into a professional ${stylePrompt}: ${prompt}. Maintain the core composition and subject matter from the original drawing while applying the ${style || 'watercolor'} artistic style. Keep it whimsical and child-friendly.`
    } else {
      fullPrompt = `${stylePrompt}: ${prompt}`
    }

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
