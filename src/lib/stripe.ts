import { loadStripe } from '@stripe/stripe-js'
import { getFunctions, httpsCallable } from 'firebase/functions'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : null

export async function createCheckoutSession(
  priceId: string,
  businessId: string,
  plan: string,
): Promise<{ url: string } | null> {
  try {
    const functions = getFunctions()
    const fn = httpsCallable<
      { priceId: string; businessId: string; plan: string },
      { url: string }
    >(functions, 'createCheckoutSession')
    const result = await fn({ priceId, businessId, plan })
    return result.data
  } catch (err) {
    console.error('createCheckoutSession error:', err)
    return null
  }
}

export async function createPortalSession(
  businessId: string,
): Promise<{ url: string } | null> {
  try {
    const functions = getFunctions()
    const fn = httpsCallable<{ businessId: string }, { url: string }>(
      functions,
      'createPortalSession',
    )
    const result = await fn({ businessId })
    return result.data
  } catch (err) {
    console.error('createPortalSession error:', err)
    return null
  }
}
