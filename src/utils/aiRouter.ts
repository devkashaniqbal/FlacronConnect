import type { AIProvider } from '@/types/ai.types'

const COMPLEXITY_KEYWORDS = [
  'explain', 'analyze', 'analyse', 'compare', 'recommend', 'why', 'strategy',
  'optimize', 'improve', 'suggest', 'advise', 'plan', 'forecast', 'predict',
  'report', 'summarize', 'summarise', 'evaluate', 'assess',
]

/**
 * Routes AI queries to either WatsonX (complex/analytical) or OpenAI (quick/simple).
 * WatsonX handles longer, analytical queries. OpenAI handles conversational queries.
 */
export function routeAI(query: string): AIProvider {
  const lower = query.toLowerCase()
  const isComplex =
    COMPLEXITY_KEYWORDS.some(k => lower.includes(k)) || query.length > 200
  return isComplex ? 'watsonx' : 'openai'
}

export function getSystemPrompt(businessName: string, businessCategory: string): string {
  return `You are an intelligent business assistant for ${businessName}, a ${businessCategory} business.
Help customers with bookings, answer questions about services, provide business information, and assist with general inquiries.
Be professional, friendly, and concise. Always stay on topic related to the business.`
}
