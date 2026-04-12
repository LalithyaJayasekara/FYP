import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthSession } from '../auth/session'
import {
  getEmployeeDisclosure,
  saveEmployeeDisclosure,
  type EmployeeLearningDisclosure,
} from '../services/employeeDisclosureStore'

type AwarenessChoice = 'yes' | 'no' | ''

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Unable to read file.'))
    reader.readAsDataURL(file)
  })
}

export default function EmployeeDisclosurePage() {
  const navigate = useNavigate()
  const [session] = useState(() => getAuthSession())

  const [awareChoice, setAwareChoice] = useState<AwarenessChoice>('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [existingRecord, setExistingRecord] = useState<EmployeeLearningDisclosure | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!session) {
      navigate('/auth', { replace: true })
      return
    }
    if (session.role !== 'employee') {
      navigate('/unauthorized', { replace: true })
      return
    }

    const record = getEmployeeDisclosure(session.email)
    setExistingRecord(record)
    setAwareChoice(record ? (record.awareOfLearningDisorder ? 'yes' : 'no') : '')
  }, [navigate, session])

  if (!session || session.role !== 'employee') {
    return null
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setSelectedFile(null)
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WEBP).')
      setSelectedFile(null)
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('File is too large. Please upload an image under 5 MB.')
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!awareChoice) {
      setError('Please answer the awareness question first.')
      return
    }

    if (awareChoice === 'yes' && !selectedFile && !existingRecord?.reportImageDataUrl) {
      setError('Please upload a recent doctor report image before continuing.')
      return
    }

    setSaving(true)
    try {
      let reportImageDataUrl = existingRecord?.reportImageDataUrl
      let reportFileName = existingRecord?.reportFileName

      if (selectedFile) {
        reportImageDataUrl = await fileToDataUrl(selectedFile)
        reportFileName = selectedFile.name
      }

      saveEmployeeDisclosure({
        email: session.email,
        awareOfLearningDisorder: awareChoice === 'yes',
        reportFileName: awareChoice === 'yes' ? reportFileName : undefined,
        reportImageDataUrl: awareChoice === 'yes' ? reportImageDataUrl : undefined,
        submittedAt: new Date().toISOString(),
      })

      navigate('/employee', { replace: true })
    } catch {
      setError('Could not save your response. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-3xl px-6 py-14">
        <div className="sw-glass-card rounded-2xl p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Employee Intake</p>
          <h1 className="mt-3 text-2xl font-bold sm:text-3xl">Learning Disorder Disclosure</h1>
          <p className="mt-3 text-sm text-slate-700">
            If you are aware that you are already affected by any learning disorder, please upload a photo of your recent report from a doctor.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold text-slate-900">
                Are you aware that you are affected by a learning disorder?
              </legend>
              <div className="mt-3 flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="awareness"
                    value="yes"
                    checked={awareChoice === 'yes'}
                    onChange={() => setAwareChoice('yes')}
                  />
                  Yes
                </label>
                <label className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm">
                  <input
                    type="radio"
                    name="awareness"
                    value="no"
                    checked={awareChoice === 'no'}
                    onChange={() => setAwareChoice('no')}
                  />
                  No
                </label>
              </div>
            </fieldset>

            {awareChoice === 'yes' && (
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
                <label className="block text-sm font-semibold text-slate-900" htmlFor="doctor-report-upload">
                  Upload recent doctor report (image)
                </label>
                <input
                  id="doctor-report-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={onFileChange}
                  className="mt-3 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                />
                <p className="mt-2 text-xs text-slate-600">Accepted: JPG, PNG, WEBP. Max size: 5 MB.</p>
                {existingRecord?.reportFileName && !selectedFile && (
                  <p className="mt-2 text-xs text-slate-700">
                    Existing report on file: <span className="font-semibold">{existingRecord.reportFileName}</span>
                  </p>
                )}
                {selectedFile && (
                  <p className="mt-2 text-xs text-slate-700">
                    Selected file: <span className="font-semibold">{selectedFile.name}</span>
                  </p>
                )}
              </div>
            )}

            {error && <p className="text-sm font-semibold text-rose-700">{error}</p>}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                className="sw-btn-primary rounded-md px-4 py-2 text-sm font-semibold transition"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save and continue'}
              </button>
              <Link to="/home" className="text-sm font-semibold underline">
                Back to role selection
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}
