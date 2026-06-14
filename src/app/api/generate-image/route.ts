import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json()

    const zai = await ZAI.create()

    const response = await zai.images.generations.create({
      prompt: `Children's book illustration, watercolor style, soft colors, whimsical and gentle: ${prompt}`,
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
