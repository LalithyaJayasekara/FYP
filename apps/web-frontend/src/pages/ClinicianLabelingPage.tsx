import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitClinicianLabel } from '../services/screeningApi'

export default function ClinicianLabelingPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [trueDyslexia, setTrueDyslexia] = useState<'0' | '1'>('0')
  const [trueDyscalculia, setTrueDyscalculia] = useState<'0' | '1'>('0')
  const [labeledAt, setLabeledAt] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const canSubmit = employeeId.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit) {
      return
    }

    setStatus('submitting')
    setMessage('')

    try {
      await submitClinicianLabel({
        employeeId: employeeId.trim(),
        trueDyslexia: Number(trueDyslexia) as 0 | 1,
        trueDyscalculia: Number(trueDyscalculia) as 0 | 1,
        labeledAt: labeledAt.trim().length > 0 ? new Date(labeledAt).toISOString() : undefined,
      })

      setStatus('success')
      setMessage('Clinician label saved. You can now use Calibration Dashboard -> Load Real Export.')
    } catch (error) {
      setStatus('error')
      const text = error instanceof Error ? error.message : 'Failed to save clinician label.'
      setMessage(text)
    }
  }

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-3xl px-6 py-12">
        <span className="sw-soft-panel rounded-full px-3 py-1 text-sm font-medium text-cyan-800">Clinician Labeling</span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Add Clinician Labels</h1>
        <p className="mt-3 text-slate-700">
          Enter final clinician labels for each employee screening so pilot outcomes can be exported and threshold tuning
          can use real records.
        </p>

        <div className="sw-glass-card mt-6 rounded-2xl p-6">
          <div className="space-y-4">
            <label className="block text-sm font-semibold">Employee ID</label>
            <input
              value={employeeId}
              onChange={(event) => setEmployeeId(event.target.value)}
              placeholder="EMP-001"
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm"
            />

            <label className="block text-sm font-semibold">True Dyslexia Label</label>
            <select
              value={trueDyslexia}
              onChange={(event) => setTrueDyslexia(event.target.value as '0' | '1')}
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm"
            >
              <option value="0">0 - No</option>
              <option value="1">1 - Yes</option>
            </select>

            <label className="block text-sm font-semibold">True Dyscalculia Label</label>
            <select
              value={trueDyscalculia}
              onChange={(event) => setTrueDyscalculia(event.target.value as '0' | '1')}
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm"
            >
              <option value="0">0 - No</option>
              <option value="1">1 - Yes</option>
            </select>

            <label className="block text-sm font-semibold">Labeled At (optional)</label>
            <input
              type="datetime-local"
              value={labeledAt}
              onChange={(event) => setLabeledAt(event.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm"
            />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                void handleSubmit()
              }}
              disabled={!canSubmit || status === 'submitting'}
              className="sw-btn-primary rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === 'submitting' ? 'Saving...' : 'Save Label'}
            </button>

            <Link to="/calibration-dashboard" className="text-sm font-semibold underline">
              Go to Calibration Dashboard
            </Link>
          </div>

          {message && (
            <p className={`mt-4 text-sm font-semibold ${status === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="mt-8">
          <Link to="/clinician" className="font-semibold underline">
            Back to Clinician Portal
          </Link>
        </div>
      </section>
    </main>
  )
}
