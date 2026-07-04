import { useEffect, useState } from 'react'
import { getLocalUserId } from '@/lib/localStore'

/**
 * Returns a stable per-browser anonymous user id, used in place of
 * the Blink auth user id. SSR-safe: the initial render uses a
 * placeholder, then we hydrate from localStorage on the client.
 */
export function useUserId(): string {
  const [userId, setUserId] = useState<string>('local')

  useEffect(() => {
    setUserId(getLocalUserId())
  }, [])

  return userId
}
