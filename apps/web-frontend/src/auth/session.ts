export type AppRole = 'clinician' | 'hr-manager' | 'employee' | 'admin'

export type AuthSession = {
  email: string
  role: AppRole
  fullName?: string
  authenticatedAt: string
}

const AUTH_SESSION_KEY = 'syncrowork.auth.session.v1'

export function getAuthSession(): AuthSession | null {
  const raw = window.localStorage.getItem(AUTH_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.email || !parsed.role || !parsed.authenticatedAt) {
      return null
    }

    return {
      email: parsed.email,
      role: parsed.role,
      fullName: parsed.fullName,
      authenticatedAt: parsed.authenticatedAt,
    }
  } catch {
    return null
  }
}

export function setAuthSession(session: AuthSession): void {
  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function clearAuthSession(): void {
  window.localStorage.removeItem(AUTH_SESSION_KEY)
}
