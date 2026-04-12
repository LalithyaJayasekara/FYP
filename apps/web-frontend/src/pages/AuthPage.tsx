import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getAuthSession, setAuthSession, type AppRole } from '../auth/session'
import { clearGuestSession, getGuestSession } from '../services/guestSessionStore'

type Mode = 'login' | 'signup'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<AppRole>('employee')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const redirectReason = (location.state as { reason?: string } | null)?.reason
  const showRedirectBanner = redirectReason === 'guest-chat-limit' || redirectReason === 'guest-questionnaire-complete'
  const bannerMessage =
    redirectReason === 'guest-chat-limit'
      ? 'Guest chat limit reached. You have been redirected to authentication to continue AI guidance and full screening.'
      : 'Guest questionnaire completed. Sign in to continue to full screening workflow and governed results.'
  const [bannerCountdown, setBannerCountdown] = useState(showRedirectBanner ? 5 : 0)

  useEffect(() => {
    if (!showRedirectBanner) {
      setBannerCountdown(0)
      return
    }

    setBannerCountdown(5)
    const intervalId = window.setInterval(() => {
      setBannerCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(intervalId)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [showRedirectBanner])

  useEffect(() => {
    const session = getAuthSession()
    if (session) {
      navigate('/home', { replace: true })
    }
  }, [navigate])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (mode === 'signup') {
      if (fullName.trim().length < 2) {
        setError('Please enter a valid full name.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        return
      }
    }

    if (email.trim().length < 3 || !email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setAuthSession({
      email: email.trim().toLowerCase(),
      role,
      fullName: fullName.trim() || undefined,
      authenticatedAt: new Date().toISOString(),
    })

    const guestSession = getGuestSession()
    const from = (location.state as { from?: string } | null)?.from
    const guestResumePath = guestSession?.intendedPath
    const prioritizedPath = from ?? guestResumePath
    const nextPath = prioritizedPath ?? (role === 'employee' ? '/employee-disclosure' : '/home')

    if (guestSession) {
      clearGuestSession()
    }

    navigate(nextPath, { replace: true })
  }

  return (
    <main className="min-h-screen px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <section className="sw-glass-card mx-auto w-full max-w-4xl rounded-3xl p-6 sm:p-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src="/carelink-icon.svg" alt="CareLink" className="h-14 w-14" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-700">CareLink</p>
              <h1 className="mt-1 text-3xl font-bold">Account Access</h1>
              <p className="mt-1 text-sm text-slate-600">Sign in or create your account</p>
            </div>
          </div>
          <Link to="/welcome" className="text-sm font-semibold underline">
            Back to splash
          </Link>
        </div>

        <div className="sw-soft-panel mb-6 inline-flex rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${mode === 'login' ? 'sw-btn-primary' : 'text-slate-700'}`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition ${mode === 'signup' ? 'sw-btn-primary' : 'text-slate-700'}`}
          >
            Sign Up
          </button>
        </div>

        {showRedirectBanner && bannerCountdown > 0 ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {bannerMessage} This message closes in {bannerCountdown}s.
          </div>
        ) : null}

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          {mode === 'signup' && (
            <label className="sm:col-span-2">
              <span className="mb-1 block text-sm font-semibold">Full Name</span>
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2"
                placeholder="Your full name"
              />
            </label>
          )}

          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2"
              placeholder="name@example.com"
            />
          </label>

          <label className="sm:col-span-2">
            <span className="mb-1 block text-sm font-semibold">Role</span>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value as AppRole)}
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2"
            >
              <option value="employee">Employee</option>
              <option value="clinician">Clinician</option>
              <option value="hr-manager">HR Manager</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2"
              placeholder="Password"
            />
          </label>

          {mode === 'signup' ? (
            <label>
              <span className="mb-1 block text-sm font-semibold">Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2"
                placeholder="Confirm password"
              />
            </label>
          ) : (
            <div className="flex items-end">
              <button type="button" className="text-sm font-semibold text-cyan-700 underline">
                Forgot password
              </button>
            </div>
          )}

          {error && <p className="sm:col-span-2 text-sm font-semibold text-rose-700">{error}</p>}

          <div className="sm:col-span-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <button type="submit" className="sw-btn-primary rounded-md px-4 py-2 text-sm font-semibold transition">
              {mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
