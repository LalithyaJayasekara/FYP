import { Link } from 'react-router-dom'

export default function HrManagerPage() {
  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <span className="sw-soft-panel rounded-full px-3 py-1 text-sm font-medium text-emerald-900">HR Manager View</span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Workplace Accommodation Dashboard</h1>
        <p className="mt-3 max-w-3xl text-slate-700">
          Role skeleton ready: accommodation planning, role-fit recommendations, and manager follow-up workflows.
        </p>

        <div className="sw-glass-card mt-6 rounded-xl p-5">
          <h2 className="text-lg font-semibold">Coordination Workspace</h2>
          <p className="mt-1 text-sm text-slate-700">
            Review accommodations, role-fit actions, and clinician-linked guidance in one aligned decision flow.
          </p>

          <Link
            to="/calibration-dashboard/hr-readonly"
            className="sw-btn-secondary mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold transition"
          >
            Open Calibration Dashboard (Read-Only)
          </Link>
        </div>

        <div className="mt-8 text-left">
          <Link to="/home" className="text-sm font-semibold underline">
            Back to role selection
          </Link>
        </div>
      </section>
    </main>
  )
}
