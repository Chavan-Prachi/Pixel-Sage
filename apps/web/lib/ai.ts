import { createOpenAI } from '@ai-sdk/openai'

export function getOpenAI(apiKey?: string | null, baseURL?: string | null) {
  return createOpenAI({
    apiKey: apiKey || process.env.OPENAI_API_KEY,
    baseURL: baseURL || 'https://api.openai.com/v1',
  })
}
