import { useState, useEffect } from 'react'

/**
 * Stub auth hook. The app runs fully local — no sign-in required —
 * but we keep a compatible shape (user / isLoading / isAuthenticated)
 * so any import site compiles unchanged. `user` is a synthetic
 * local user populated once we've read our anonymous id.
 */
export function useAuth() {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let id: string
    try {
      id = window.localStorage.getItem('tv_local_user_id') || 'local'
      if (!window.localStorage.getItem('tv_local_user_id')) {
        id = 'local-' + (typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36))
        window.localStorage.setItem('tv_local_user_id', id)
      }
    } catch {
      id = 'local'
    }
    setUser({ id, email: 'local@tales.app', name: 'Local Storyteller' })
    setIsLoading(false)
  }, [])

  return { user, isLoading, isAuthenticated: !!user }
}
