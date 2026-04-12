export type GuestSessionState = {
  startedAt: string
  updatedAt: string
  chatTurnsUsed: number
  intendedPath: '/screening'
}

const GUEST_SESSION_KEY = 'carelink.guest.session.v1'
const GUEST_SESSION_TTL_MS = 24 * 60 * 60 * 1000

function parseIsoDate(value: string): number | null {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : timestamp
}

export function getGuestSession(): GuestSessionState | null {
  const raw = window.localStorage.getItem(GUEST_SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GuestSessionState>
    if (!parsed.startedAt || !parsed.updatedAt || parsed.chatTurnsUsed === undefined || !parsed.intendedPath) {
      return null
    }

    const updatedAtMs = parseIsoDate(parsed.updatedAt)
    if (updatedAtMs === null) {
      window.localStorage.removeItem(GUEST_SESSION_KEY)
      return null
    }

    const isExpired = Date.now() - updatedAtMs > GUEST_SESSION_TTL_MS
    if (isExpired) {
      window.localStorage.removeItem(GUEST_SESSION_KEY)
      return null
    }

    return {
      startedAt: parsed.startedAt,
      updatedAt: parsed.updatedAt,
      chatTurnsUsed: parsed.chatTurnsUsed,
      intendedPath: parsed.intendedPath,
    }
  } catch {
    return null
  }
}

export function upsertGuestSession(partial: Pick<GuestSessionState, 'chatTurnsUsed' | 'intendedPath'>): void {
  const existing = getGuestSession()
  const now = new Date().toISOString()

  const next: GuestSessionState = {
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
    chatTurnsUsed: partial.chatTurnsUsed,
    intendedPath: partial.intendedPath,
  }

  window.localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(next))
}

export function clearGuestSession(): void {
  window.localStorage.removeItem(GUEST_SESSION_KEY)
}
