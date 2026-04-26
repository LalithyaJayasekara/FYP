export type GuestChatHistoryEntry = {
  role: 'user' | 'assistant'
  content: string
}

export interface GuestChatRequest {
  question: string
  history?: GuestChatHistoryEntry[]
}

export interface GuestChatResponse {
  answer: string
}

const defaultBaseUrl = 'http://localhost:8082'

export async function requestGuestChatAnswer(
  question: string,
  history: GuestChatHistoryEntry[] = []
): Promise<string> {
  const baseUrl = import.meta.env.VITE_AI_SCREENING_API_URL ?? defaultBaseUrl
  const response = await fetch(`${baseUrl}/api/v1/guest-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, history }),
  })

  const parsed = (await response.json()) as GuestChatResponse | { error?: string }

  if (!response.ok) {
    const errorMessage = 'error' in parsed && parsed.error ? parsed.error : 'Guest chat request failed.'
    throw new Error(errorMessage)
  }

  if ('answer' in parsed) {
    return parsed.answer
  }

  throw new Error('Guest chat request failed.')
}
