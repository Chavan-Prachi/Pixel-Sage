import { getOpenAI } from '@/lib/ai'
import { AI_CONFIG } from '@/lib/config'
import { streamText } from 'ai'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  const { messages } = await req.json()
  const apiKey = req.headers.get('x-openai-key')
  const baseURL = req.headers.get('x-base-url')
  const model = req.headers.get('x-model') || AI_CONFIG.defaultModel
  const openai = getOpenAI(apiKey, baseURL)

  const result = await streamText({
    model: openai(model),
    messages,
  })

  return result.toDataStreamResponse()
}
