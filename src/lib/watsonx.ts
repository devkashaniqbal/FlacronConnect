import type { ChatMessage } from '@/types/ai.types'

const WATSONX_URL    = import.meta.env.VITE_WATSONX_URL
const WATSONX_APIKEY = import.meta.env.VITE_WATSONX_API_KEY
const PROJECT_ID     = import.meta.env.VITE_WATSONX_PROJECT_ID

// Exchange IBM Cloud API key for IAM Bearer token
async function getIAMToken(): Promise<string> {
  const res = await fetch('https://iam.cloud.ibm.com/identity/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${WATSONX_APIKEY}`,
  })
  if (!res.ok) throw new Error('Failed to get IAM token')
  const data = await res.json()
  return data.access_token as string
}

const BASE_SYSTEM_PROMPT = `You are FlacronAI, an expert business analyst assistant for FlacronControl.
You have full access to the business data provided — NEVER ask the owner for information you already have.
You provide deep analytical insights about business operations, revenue optimization, employee management, and strategic growth.
Be thorough, data-driven, and actionable in your responses. Respond in the same language as the user.
FORMATTING: Never use markdown. No hashtags (#), no asterisks (*), no bold, no italic, no bullet dashes. Write in plain sentences and numbered lists only. Use line breaks between sections.`

export async function sendWatsonXMessage(
  messages: ChatMessage[],
  onChunk?: (chunk: string) => void,
  businessContext?: string,
): Promise<string> {
  try {
    const token = await getIAMToken()

    const systemPrompt = businessContext
      ? `${BASE_SYSTEM_PROMPT}\n\n${businessContext}`
      : BASE_SYSTEM_PROMPT

    // Build prompt from message history
    const history = messages.map(m =>
      `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`
    ).join('\n')
    const prompt = `${systemPrompt}\n\n${history}\nAssistant:`

    const res = await fetch(
      `${WATSONX_URL}/ml/v1/text/generation?version=2024-03-14`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model_id:   'meta-llama/llama-3-3-70b-instruct',
          input:      prompt,
          project_id: PROJECT_ID,
          parameters: {
            decoding_method: 'greedy',
            max_new_tokens:  800,
            repetition_penalty: 1.1,
          },
        }),
      }
    )

    if (!res.ok) throw new Error(`WatsonX error ${res.status}`)
    const data = await res.json()
    const text: string = data?.results?.[0]?.generated_text || ''
    if (onChunk) onChunk(text)
    return text
  } catch (err) {
    console.error('WatsonX failed, falling back to OpenAI:', err)
    const { sendOpenAIMessage } = await import('./openai')
    return sendOpenAIMessage(messages, onChunk, businessContext)
  }
}
