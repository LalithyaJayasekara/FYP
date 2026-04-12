import { Link } from 'react-router-dom'
import { clearAuthSession, getAuthSession, type AppRole } from '../auth/session'

const roles = [
  {
    title: 'Clinician Portal',
    path: '/clinician',
    description: 'Assessments, diagnostic review, intervention planning, and outcomes tracking.',
    palette: 'bg-cyan-50 border-cyan-200 text-cyan-900',
    allowedRoles: ['clinician', 'admin'] as AppRole[],
  },
  {
    title: 'HR Manager Portal',
    path: '/hr-manager',
    description: 'Accommodation plans, role-fit insights, and workforce support workflows.',
    palette: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    allowedRoles: ['hr-manager', 'admin'] as AppRole[],
  },
  {
    title: 'Employee Portal',
    path: '/employee',
    description: 'Consent settings, support plan visibility, and progress milestones.',
    palette: 'bg-amber-50 border-amber-200 text-amber-900',
    allowedRoles: ['employee', 'admin'] as AppRole[],
  },
  {
    title: 'Calibration Dashboard',
    path: '/calibration-dashboard',
    description: 'Threshold tuning, confusion-matrix metrics, and pilot-data calibration insights.',
    palette: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    allowedRoles: ['clinician'] as AppRole[],
  },
  {
    title: 'Calibration Dashboard (Read-Only)',
    path: '/calibration-dashboard/hr-readonly',
    description: 'Read-only view of calibration outcomes and threshold impact for HR governance review.',
    palette: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    allowedRoles: ['hr-manager'] as AppRole[],
  },
]

export default function HomePage() {
  const session = getAuthSession()
  const visibleRoles = roles.filter((role) => session && role.allowedRoles.includes(session.role))

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="sw-glass-card mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <p className="text-sm text-slate-600">
            Signed in as <span className="font-semibold text-slate-900">{session?.email}</span> ({session?.role})
          </p>
          <button
            type="button"
            onClick={() => {
              clearAuthSession()
              window.location.href = '/auth'
            }}
            className="text-sm font-semibold underline"
          >
            Log out
          </button>
        </div>
        <div className="mb-6 flex items-center gap-4">
          <img src="/carelink-icon.svg" alt="CareLink" className="h-12 w-12" />
          <div>
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">CareLink Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">Select a role portal to continue</p>
          </div>
        </div>
        <p className="mt-4 max-w-3xl text-base text-slate-700">
          Choose your portal. Each role dashboard has customized features and a matching color theme.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleRoles.map((role) => (
            <Link
              key={role.path}
              to={role.path}
              className={`sw-grid-card rounded-xl border p-5 shadow-sm ${role.palette}`}
            >
              <h2 className="text-xl font-semibold">{role.title}</h2>
              <p className="mt-2 text-sm leading-relaxed opacity-90">{role.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold underline">Open dashboard</span>
            </Link>
          ))}
        </div>

        {visibleRoles.length === 0 && (
          <p className="mt-6 text-sm text-slate-700">No dashboards are available for the current role assignment.</p>
        )}
      </section>
    </main>
  )
}
