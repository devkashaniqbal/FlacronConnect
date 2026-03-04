/**
 * useRealtimeCollection — wraps Firestore onSnapshot in React state.
 * Drop-in replacement for useQuery + fetchCollection patterns.
 * Data updates in real-time without polling.
 */
import { useState, useEffect, useRef } from 'react'
import { subscribeToCollection } from '@/lib/firestore'
import type { QueryConstraint } from 'firebase/firestore'

export function useRealtimeCollection<T>(
  path: string,
  constraints: QueryConstraint[] = [],
  enabled = true,
) {
  const [data, setData]       = useState<T[]>([])
  const [isLoading, setLoading] = useState(true)
  const [error, setError]     = useState<Error | null>(null)

  // Stable ref for constraints so we don't re-subscribe on every render
  const constraintsRef = useRef(constraints)

  useEffect(() => {
    if (!enabled || !path) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const unsubscribe = subscribeToCollection<T>(
      path,
      constraintsRef.current,
      items => {
        setData(items)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [path, enabled])

  return { data, isLoading, error }
}
