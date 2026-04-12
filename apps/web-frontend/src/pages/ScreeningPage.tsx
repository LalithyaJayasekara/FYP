import { useState } from 'react'
import { Link } from 'react-router-dom'

type Question = {
  id: string
  text: string
  disorder: 'dyslexia' | 'dyscalculia' | 'functional-impact'
}

const dyslexiaQuestions: Question[] = [
  { id: 'dx-reading-speed', text: 'I need more time than peers to read workplace documents.', disorder: 'dyslexia' },
  { id: 'dx-spelling', text: 'I frequently notice spelling mistakes in emails or reports after sending.', disorder: 'dyslexia' },
  { id: 'dx-phonology', text: 'I confuse similar sounding words when reading or writing quickly.', disorder: 'dyslexia' },
  { id: 'dx-memory', text: 'I find it difficult to remember instructions that were only spoken once.', disorder: 'dyslexia' },
]

const dyscalculiaQuestions: Question[] = [
  { id: 'dc-number-sense', text: 'I struggle to estimate quantities, durations, or costs mentally.', disorder: 'dyscalculia' },
  { id: 'dc-arithmetic', text: 'Simple calculations take me much longer than expected.', disorder: 'dyscalculia' },
  { id: 'dc-symbols', text: 'I mix up numeric symbols, place values, or operation signs under pressure.', disorder: 'dyscalculia' },
  { id: 'dc-sequencing', text: 'I often lose track of steps in number-based tasks.', disorder: 'dyscalculia' },
]

const impactQuestions: Question[] = [
  { id: 'fi-workload', text: 'These difficulties noticeably reduce my confidence at work.', disorder: 'functional-impact' },
  { id: 'fi-deadlines', text: 'These difficulties affect my ability to meet deadlines.', disorder: 'functional-impact' },
  { id: 'fi-support', text: 'I need regular support from others for reading or number-heavy tasks.', disorder: 'functional-impact' },
]

const allQuestions = [...dyslexiaQuestions, ...dyscalculiaQuestions, ...impactQuestions]

export default function ScreeningPage() {
  const [currentStep, setCurrentStep] = useState<'consent' | 'questionnaire' | 'results'>('consent')
  const [consentGiven, setConsentGiven] = useState(false)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  const handleConsent = () => {
    if (consentGiven) {
      setCurrentStep('questionnaire')
    }
  }

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setCurrentStep('results')
    setSubmitting(false)
  }

  const isQuestionnaireComplete = allQuestions.every(q => responses[q.id] !== undefined)

  if (currentStep === 'consent') {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <img src="/carelink-icon.svg" alt="CareLink" className="mx-auto h-16 w-16" />
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Learning Disability Screening</h1>
            <p className="mt-2 text-slate-600">Complete this questionnaire to get personalized insights</p>
          </div>

          <div className="sw-glass-card rounded-xl p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Consent and Privacy</h2>
            <div className="space-y-4 text-sm text-slate-700">
              <p>
                This screening uses AI to analyze your responses and provide insights about potential learning disabilities.
                Your responses are processed securely and anonymously.
              </p>
              <p>
                <strong>Clinical assessment consent:</strong> I agree to participate in this screening assessment.
              </p>
              <p>
                <strong>Research consent (optional):</strong> I agree to allow my anonymized data to be used for improving the screening system.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className="text-sm text-slate-700">
                  I have read and agree to the consent terms above
                </span>
              </label>
            </div>

            <div className="mt-8 flex gap-3">
              <Link
                to="/welcome"
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Home
              </Link>
              <button
                onClick={handleConsent}
                disabled={!consentGiven}
                className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Start Screening
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (currentStep === 'questionnaire') {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <img src="/carelink-icon.svg" alt="CareLink" className="mx-auto h-16 w-16" />
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Screening Questionnaire</h1>
            <p className="mt-2 text-slate-600">Please answer each question on a scale from 0 to 4</p>
            <p className="mt-1 text-xs text-slate-500">
              0 = Never, 1 = Rarely, 2 = Sometimes, 3 = Often, 4 = Always
            </p>
          </div>

          <div className="space-y-6">
            {allQuestions.map((question, index) => (
              <div key={question.id} className="sw-glass-card rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-semibold text-cyan-900">
                    {index + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-900">{question.text}</p>
                    <div className="mt-4 flex gap-2">
                      {[0, 1, 2, 3, 4].map((value) => (
                        <label key={value} className="flex-1 text-center">
                          <input
                            type="radio"
                            name={question.id}
                            value={value}
                            checked={responses[question.id] === value}
                            onChange={() => handleResponseChange(question.id, value)}
                            className="sr-only"
                          />
                          <span className={`inline-block w-full cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                            responses[question.id] === value
                              ? 'border-cyan-600 bg-cyan-600 text-white'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}>
                            {value}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setCurrentStep('consent')}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={!isQuestionnaireComplete || submitting}
              className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (currentStep === 'results') {
    // Calculate basic risk scores (simplified)
    const dyslexiaResponses = dyslexiaQuestions.map(q => responses[q.id] || 0)
    const dyscalculiaResponses = dyscalculiaQuestions.map(q => responses[q.id] || 0)
    const dyslexiaRisk = Math.round((dyslexiaResponses.reduce((a, b) => a + b, 0) / dyslexiaResponses.length) * 25)
    const dyscalculiaRisk = Math.round((dyscalculiaResponses.reduce((a, b) => a + b, 0) / dyscalculiaResponses.length) * 25)

    return (
      <main className="min-h-screen bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <img src="/carelink-icon.svg" alt="CareLink" className="mx-auto h-16 w-16" />
            <h1 className="mt-4 text-3xl font-bold text-slate-900">Screening Results</h1>
            <p className="mt-2 text-slate-600">Your assessment has been processed</p>
          </div>

          <div className="space-y-6">
            <div className="sw-glass-card rounded-xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Risk Assessment</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-amber-900">Dyslexia Risk</span>
                    <span className="text-2xl font-bold text-amber-900">{dyslexiaRisk}%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: `${dyslexiaRisk}%` }}></div>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">Dyscalculia Risk</span>
                    <span className="text-2xl font-bold text-blue-900">{dyscalculiaRisk}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${dyscalculiaRisk}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sw-glass-card rounded-xl p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">Next Steps</h2>
              <div className="space-y-3 text-sm text-slate-700">
                <p>
                  This screening provides initial insights but is not a clinical diagnosis.
                  For personalized support and accommodations, we recommend consulting with a healthcare professional.
                </p>
                <p>
                  If you'd like to explore workplace accommodations or connect with support services,
                  consider registering for a full account.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              to="/welcome"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Home
            </Link>
            <Link
              to="/auth"
              className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-cyan-700"
            >
              Register for Full Access
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return null
}