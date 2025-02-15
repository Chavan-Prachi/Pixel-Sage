import { db } from './db'

export async function fetchWithKey(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const today = new Date()
  const plan = await db.getPlan(today)
  const openRouterKey = plan?.preferences?.openRouterKey
  const baseURL = plan?.preferences?.baseURL
  const model = plan?.preferences?.model
  const headers = new Headers(init?.headers)

  if (openRouterKey) {
    headers.set('x-openai-key', openRouterKey)
  }
  if (baseURL) {
    headers.set('x-base-url', baseURL)
  }
  if (model) {
    headers.set('x-model', model)
  }

  return fetch(input, {
    ...init,
    headers,
  })
}
