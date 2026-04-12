import { Link } from 'react-router-dom'
import { getAllEmployeeDisclosures } from '../services/employeeDisclosureStore'

export default function ClinicianPage() {
  const disclosures = getAllEmployeeDisclosures()

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 py-14">
        <span className="sw-soft-panel rounded-full px-3 py-1 text-sm font-medium text-cyan-900">Clinician View</span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Clinical Assessment Dashboard</h1>
        <p className="mt-3 max-w-3xl text-slate-700">
          Role skeleton ready: assessment queue, AI interpretation review, intervention planning, and follow-up outcomes.
        </p>

        <div className="sw-glass-card mt-6 rounded-xl p-5">
          <h2 className="text-lg font-semibold">Pilot Labeling</h2>
          <p className="mt-1 text-sm text-slate-700">
            Add clinician-confirmed dyslexia and dyscalculia labels so calibration can use real outcomes.
          </p>
          <Link to="/clinician-labeling" className="sw-btn-primary mt-4 inline-block rounded-md px-4 py-2 text-sm font-semibold transition">
            Open clinician labeling form
          </Link>
        </div>

        <div className="sw-glass-card mt-6 rounded-xl p-5">
          <h2 className="text-lg font-semibold">Employee Disclosure Records</h2>
          <p className="mt-1 text-sm text-slate-700">
            Uploaded doctor reports shared by employees are listed here for clinical review.
          </p>

          {disclosures.length === 0 ? (
            <p className="mt-4 text-sm text-slate-700">No employee disclosure records are available yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {disclosures.map((record) => (
                <article key={record.email} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-900">{record.email}</p>
                  <p className="mt-1 text-xs text-slate-700">
                    Status:{' '}
                    <span className="font-semibold">
                      {record.awareOfLearningDisorder ? 'Aware / affected' : 'Not aware'}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Submitted: {new Date(record.submittedAt).toLocaleString()}
                  </p>

                  {record.reportImageDataUrl && record.awareOfLearningDisorder && (
                    <div className="mt-3 rounded-md border border-cyan-100 bg-cyan-50 p-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {record.reportFileName ?? 'Doctor report image'}
                      </p>
                      <img
                        src={record.reportImageDataUrl}
                        alt={`Doctor report uploaded by ${record.email}`}
                        className="mt-2 max-h-44 rounded border border-cyan-200 bg-white"
                      />
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
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
