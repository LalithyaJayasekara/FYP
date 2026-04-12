import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAuthSession } from '../auth/session'
import {
  submitAssessment,
  type AssessmentResponseItem,
  type AssessmentSubmission,
  type ScoringResult,
} from '../services/screeningApi'
import { getEmployeeDisclosure } from '../services/employeeDisclosureStore'

type SeverityLevel = 'Low' | 'Moderate' | 'Severe'

type Question = {
  id: string
  text: string
  disorder: 'dyslexia' | 'dyscalculia' | 'functional-impact'
}

type VoiceTask = {
  id: string
  title: string
  prompt: string
  keywords: string[]
  targetWpm: number
}

type VoiceTaskState = {
  transcript: string
  durationSeconds: number
  error: string | null
}

type SpeechRecognitionConstructorLike = new () => {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructorLike
    webkitSpeechRecognition?: SpeechRecognitionConstructorLike
  }
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

const voiceTasks: VoiceTask[] = [
  {
    id: 'voice-reading-passage',
    title: 'Read-Aloud Fluency Task',
    prompt:
      'Today I reviewed the patient referral notes, cross-checked appointment timings, and updated the care summary before noon.',
    keywords: ['reviewed', 'referral', 'appointment', 'updated', 'summary'],
    targetWpm: 120,
  },
  {
    id: 'voice-rapid-naming',
    title: 'Rapid Naming Task',
    prompt:
      'Say these words clearly in sequence: clinic, dosage, summary, billing, schedule, therapy, support, baseline, report, follow-up.',
    keywords: ['clinic', 'dosage', 'summary', 'billing', 'schedule', 'therapy', 'support', 'baseline', 'report', 'follow-up'],
    targetWpm: 140,
  },
]

const copyReferenceParagraph =
  'I prepared a concise project summary, checked each data field for accuracy, and submitted the report with all required details before the deadline.'

function average(values: number[]): number {
  if (values.length === 0) {
    return 0
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0)
}

function keywordCoverage(transcript: string, keywords: string[]): number {
  const tokens = new Set(tokenize(transcript))
  if (keywords.length === 0) {
    return 1
  }

  const matched = keywords.filter((keyword) => tokens.has(keyword.toLowerCase())).length
  return matched / keywords.length
}

function sentenceCount(text: string): number {
  return text
    .split(/[.!?]+/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0).length
}

function overlapRatio(left: string, right: string): number {
  const leftTokens = new Set(tokenize(left))
  const rightTokens = tokenize(right)
  if (rightTokens.length === 0) {
    return 0
  }

  const overlap = rightTokens.filter((token) => leftTokens.has(token)).length
  return overlap / rightTokens.length
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function scoreVoiceTask(task: VoiceTask, state: VoiceTaskState): number {
  const words = tokenize(state.transcript).length
  const minutes = state.durationSeconds > 0 ? state.durationSeconds / 60 : 0
  const observedWpm = minutes > 0 ? words / minutes : 0
  const speedRatio = task.targetWpm > 0 ? observedWpm / task.targetWpm : 0

  let speedRisk = 85
  if (speedRatio >= 0.85) {
    speedRisk = 20
  } else if (speedRatio >= 0.65) {
    speedRisk = 50
  }

  const coverage = keywordCoverage(state.transcript, task.keywords)
  const coverageRisk = Math.round((1 - coverage) * 100)

  return Math.round(0.55 * speedRisk + 0.45 * coverageRisk)
}

function scoreWriting(copyText: string, freeText: string): number {
  const copyRisk = Math.round((1 - overlapRatio(copyText, copyReferenceParagraph)) * 100)

  const freeWordCount = tokenize(freeText).length
  let lengthRisk = 85
  if (freeWordCount >= 120 && freeWordCount <= 220) {
    lengthRisk = 20
  } else if (freeWordCount >= 90 && freeWordCount <= 260) {
    lengthRisk = 45
  }

  const freeSentenceCount = sentenceCount(freeText)
  let sentenceRisk = 85
  if (freeSentenceCount >= 5) {
    sentenceRisk = 20
  } else if (freeSentenceCount >= 3) {
    sentenceRisk = 50
  }

  const freeWritingRisk = Math.round(0.6 * lengthRisk + 0.4 * sentenceRisk)
  return Math.round(clamp(Math.max(copyRisk, freeWritingRisk), 0, 100))
}

function toPercent(scoreOutOfFour: number): number {
  return Math.round((scoreOutOfFour / 4) * 100)
}

function toLevel(score: number): SeverityLevel {
  if (score < 35) {
    return 'Low'
  }
  if (score < 65) {
    return 'Moderate'
  }
  return 'Severe'
}

function levelClass(level: SeverityLevel): string {
  if (level === 'Low') {
    return 'bg-emerald-100 text-emerald-800'
  }
  if (level === 'Moderate') {
    return 'bg-amber-100 text-amber-800'
  }
  return 'bg-rose-100 text-rose-800'
}

export default function EmployeePage() {
  const navigate = useNavigate()
  const session = getAuthSession()
  const disclosure = session ? getEmployeeDisclosure(session.email) : null

  useEffect(() => {
    if (session?.role === 'employee' && !disclosure) {
      navigate('/employee-disclosure', { replace: true })
    }
  }, [disclosure, navigate, session])

  const steps = [
    'Consent',
    'Dyslexia Screen',
    'Dyscalculia Screen',
    'Functional Impact',
    'Voice Activities',
    'Writing Activities',
    'Results',
  ]
  const [stepIndex, setStepIndex] = useState(0)
  const [consentChecked, setConsentChecked] = useState(false)
  const [language, setLanguage] = useState('')
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [voiceStates, setVoiceStates] = useState<Record<string, VoiceTaskState>>(() =>
    Object.fromEntries(voiceTasks.map((task) => [task.id, { transcript: '', durationSeconds: 0, error: null }])),
  )
  const [activeListeningTaskId, setActiveListeningTaskId] = useState<string | null>(null)
  const speechRecognitionRef = useRef<InstanceType<SpeechRecognitionConstructorLike> | null>(null)
  const [copyParagraph, setCopyParagraph] = useState('')
  const [uploadedParagraph, setUploadedParagraph] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [submissionState, setSubmissionState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [submissionError, setSubmissionError] = useState('')
  const [apiResult, setApiResult] = useState<ScoringResult | null>(null)

  const speechRecognitionCtor = window.SpeechRecognition ?? window.webkitSpeechRecognition

  const dyslexiaAnswered = dyslexiaQuestions.every((question) => responses[question.id] !== undefined)
  const dyscalculiaAnswered = dyscalculiaQuestions.every((question) => responses[question.id] !== undefined)
  const impactAnswered = impactQuestions.every((question) => responses[question.id] !== undefined)
  const voiceCompleted = voiceTasks.every((task) => {
    const state = voiceStates[task.id]
    return tokenize(state?.transcript ?? '').length >= 8 && (state?.durationSeconds ?? 0) >= 10
  })
  const voiceValidation = voiceTasks.map((task) => {
    const state = voiceStates[task.id]
    const wordCount = tokenize(state?.transcript ?? '').length
    const duration = state?.durationSeconds ?? 0
    return {
      taskId: task.id,
      title: task.title,
      wordCount,
      duration,
      wordsOk: wordCount >= 8,
      durationOk: duration >= 10,
    }
  })
  const writingCompleted = tokenize(copyParagraph).length >= 25 && tokenize(uploadedParagraph).length >= 80

  const canContinue =
    (stepIndex === 0 && consentChecked && language.length > 0) ||
    (stepIndex === 1 && dyslexiaAnswered) ||
    (stepIndex === 2 && dyscalculiaAnswered) ||
    (stepIndex === 3 && impactAnswered) ||
    (stepIndex === 4 && voiceCompleted) ||
    (stepIndex === 5 && writingCompleted) ||
    stepIndex === 6

  const scoreSummary = useMemo(() => {
    const dyslexiaValues = dyslexiaQuestions.map((question) => responses[question.id]).filter((value) => value !== undefined)
    const dyscalculiaValues = dyscalculiaQuestions
      .map((question) => responses[question.id])
      .filter((value) => value !== undefined)
    const impactValues = impactQuestions.map((question) => responses[question.id]).filter((value) => value !== undefined)

    const dyslexiaQuestionnaireRisk = toPercent(average(dyslexiaValues))
    const dyscalculiaQuestionnaireRisk = toPercent(average(dyscalculiaValues))
    const functionalRisk = toPercent(average(impactValues))
    const selfReportRisk = toPercent(average(allQuestions.map((question) => responses[question.id] ?? 0)))
    const voiceRisk = Math.round(
      average(
        voiceTasks.map((task) => {
          const state = voiceStates[task.id]
          return scoreVoiceTask(task, state)
        }),
      ),
    )
    const writingRisk = scoreWriting(copyParagraph, uploadedParagraph)

    const dyslexiaRisk = Math.round(0.6 * dyslexiaQuestionnaireRisk + 0.25 * voiceRisk + 0.15 * writingRisk)
    const dyscalculiaRisk = Math.round(0.6 * dyscalculiaQuestionnaireRisk + 0.25 * voiceRisk + 0.15 * writingRisk)
    const performanceRisk = Math.round((dyslexiaRisk + dyscalculiaRisk) / 2)

    const overallRisk = Math.round(
      0.5 * performanceRisk + 0.15 * selfReportRisk + 0.1 * functionalRisk + 0.15 * voiceRisk + 0.1 * writingRisk,
    )

    return {
      dyslexiaRisk,
      dyscalculiaRisk,
      voiceRisk,
      writingRisk,
      overallRisk,
      dyslexiaLevel: toLevel(dyslexiaRisk),
      dyscalculiaLevel: toLevel(dyscalculiaRisk),
      voiceLevel: toLevel(voiceRisk),
      writingLevel: toLevel(writingRisk),
      overallLevel: toLevel(overallRisk),
    }
  }, [copyParagraph, responses, uploadedParagraph, voiceStates])

  const updateResponse = (questionId: string, value: number) => {
    setResponses((current) => ({ ...current, [questionId]: value }))
  }

  const updateVoiceDuration = (taskId: string, durationSeconds: number) => {
    setVoiceStates((current) => ({
      ...current,
      [taskId]: {
        ...current[taskId],
        durationSeconds,
      },
    }))
  }

  const startListening = (taskId: string) => {
    const SpeechRecognition = speechRecognitionCtor
    if (!SpeechRecognition) {
      setVoiceStates((current) => ({
        ...current,
        [taskId]: {
          ...current[taskId],
          error: 'Speech recognition is not supported in this browser.',
        },
      }))
      return
    }

    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop()
      speechRecognitionRef.current = null
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language === 'sinhala' ? 'si-LK' : language === 'tamil' ? 'ta-LK' : 'en-US'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let mergedTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript ?? ''
        mergedTranscript += `${transcript} `
      }

      setVoiceStates((current) => ({
        ...current,
        [taskId]: {
          ...current[taskId],
          transcript: mergedTranscript.trim(),
          error: null,
        },
      }))
    }

    recognition.onerror = (event) => {
      setVoiceStates((current) => ({
        ...current,
        [taskId]: {
          ...current[taskId],
          error: event.error ?? 'Unable to capture voice input.',
        },
      }))
    }

    recognition.onend = () => {
      setActiveListeningTaskId((current) => (current === taskId ? null : current))
    }

    try {
      speechRecognitionRef.current = recognition
      setActiveListeningTaskId(taskId)
      recognition.start()
    } catch (error) {
      speechRecognitionRef.current = null
      setActiveListeningTaskId((current) => (current === taskId ? null : current))
      const message = error instanceof Error ? error.message : 'Unable to start voice capture.'
      setVoiceStates((current) => ({
        ...current,
        [taskId]: {
          ...current[taskId],
          error: message,
        },
      }))
    }
  }

  const stopListening = () => {
    speechRecognitionRef.current?.stop()
    speechRecognitionRef.current = null
    setActiveListeningTaskId(null)
  }

  const uploadParagraph = async (file: File | null) => {
    if (!file) {
      return
    }

    const text = await file.text()
    setUploadedParagraph(text)
    setUploadedFileName(file.name)
  }

  const buildSubmissionPayload = (): AssessmentSubmission => {
    const questionnaireItems: AssessmentResponseItem[] = allQuestions.map((question) => ({
      itemId: question.id,
      disorder: question.disorder,
      construct: question.disorder === 'functional-impact' ? 'functional_impact' : 'self_report',
      modality: 'questionnaire',
      rawScore: responses[question.id] ?? 0,
      minScore: 0,
      maxScore: 4,
      weight: 1,
    }))

    const voiceItems: AssessmentResponseItem[] = voiceTasks.flatMap((task) => {
      const state = voiceStates[task.id]
      const baseScore = scoreVoiceTask(task, state)

      return [
        {
          itemId: `${task.id}-risk-dyslexia`,
          disorder: 'dyslexia' as const,
          construct: 'performance' as const,
          modality: 'voice' as const,
          rawScore: baseScore,
          minScore: 0,
          maxScore: 100,
          weight: 0.5,
        },
        {
          itemId: `${task.id}-risk-dyscalculia`,
          disorder: 'dyscalculia' as const,
          construct: 'performance' as const,
          modality: 'voice' as const,
          rawScore: baseScore,
          minScore: 0,
          maxScore: 100,
          weight: 0.5,
        },
      ]
    })

    const writingScore = scoreWriting(copyParagraph, uploadedParagraph)
    const writingItems: AssessmentResponseItem[] = [
      {
        itemId: 'writing-upload-risk-dyslexia',
        disorder: 'dyslexia',
        construct: 'performance',
        modality: 'writing',
        rawScore: writingScore,
        minScore: 0,
        maxScore: 100,
        weight: 0.5,
      },
      {
        itemId: 'writing-upload-risk-dyscalculia',
        disorder: 'dyscalculia',
        construct: 'performance',
        modality: 'writing',
        rawScore: writingScore,
        minScore: 0,
        maxScore: 100,
        weight: 0.5,
      },
    ]

    return {
      assessmentId: `employee-screening-${Date.now()}`,
      assessmentVersion: 'v1.2.0',
      frameworkAlignment: ['DSM-5-TR', 'ICD-11', 'ICF'],
      respondent: {
        employeeId: 'employee-self-screening',
        language: language as 'english' | 'sinhala' | 'tamil',
        consentGiven: true,
        submittedAt: new Date().toISOString(),
      },
      responses: [...questionnaireItems, ...voiceItems, ...writingItems],
      artifacts: {
        voiceTasks: voiceTasks.map((task) => {
          const state = voiceStates[task.id]
          return {
            taskId: task.id,
            transcript: state.transcript,
            durationSeconds: state.durationSeconds,
            targetWpm: task.targetWpm,
            keywordCoverage: keywordCoverage(state.transcript, task.keywords),
          }
        }),
        writing: {
          referenceText: copyReferenceParagraph,
          copiedText: copyParagraph,
          uploadedParagraphText: uploadedParagraph,
        },
      },
    }
  }

  const handleSubmitToScreeningService = async () => {
    setSubmissionState('submitting')
    setSubmissionError('')

    try {
      const payload = buildSubmissionPayload()
      const scored = await submitAssessment(payload)
      setApiResult(scored)
      setSubmissionState('success')
    } catch (error) {
      setSubmissionState('error')
      const message = error instanceof Error ? error.message : 'Failed to submit assessment.'
      setSubmissionError(message)
    }
  }

  const renderQuestionBlock = (questions: Question[]) => (
    <div className="space-y-4">
      {questions.map((question) => (
        <div key={question.id} className="sw-soft-panel rounded-xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-amber-900">{question.text}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
            {[0, 1, 2, 3, 4].map((value) => (
              <label
                key={`${question.id}-${value}`}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-amber-200 px-3 py-2 text-sm"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={value}
                  checked={responses[question.id] === value}
                  onChange={() => updateResponse(question.id, value)}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-amber-700">0 = Never, 4 = Very Often</p>
        </div>
      ))}
    </div>
  )

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <span className="sw-soft-panel rounded-full px-3 py-1 text-sm font-medium text-amber-900">Employee Screening</span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Learning Disorder Risk Screening</h1>
        <p className="mt-3 max-w-3xl text-slate-700">
          This assessment proceeds under internationally finalized criteria aligned to DSM-5-TR, ICD-11, and ICF
          functional-impact guidance. It estimates risk for dyslexia and dyscalculia and highlights support priority.
        </p>

        {session && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Learning Disorder Disclosure</h2>
                {!disclosure ? (
                  <p className="mt-1 text-sm text-slate-700">
                    No disclosure submitted yet. Please complete the intake step before screening.
                  </p>
                ) : (
                  <>
                    <p className="mt-1 text-sm text-slate-700">
                      Awareness status:{' '}
                      <span className="font-semibold">
                        {disclosure.awareOfLearningDisorder ? 'Aware / affected' : 'Not aware'}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      Last updated: {new Date(disclosure.submittedAt).toLocaleString()}
                    </p>
                  </>
                )}
              </div>
              <Link to="/employee-disclosure" className="text-sm font-semibold underline">
                {disclosure ? 'Update disclosure' : 'Complete disclosure'}
              </Link>
            </div>

            {disclosure?.reportImageDataUrl && disclosure.awareOfLearningDisorder && (
              <div className="mt-3 rounded-lg border border-cyan-100 bg-cyan-50 p-3">
                <p className="text-sm font-semibold text-slate-900">
                  Uploaded report: {disclosure.reportFileName ?? 'Doctor report image'}
                </p>
                <img
                  src={disclosure.reportImageDataUrl}
                  alt="Uploaded doctor report"
                  className="mt-2 max-h-48 rounded-md border border-cyan-200 bg-white"
                />
              </div>
            )}
          </div>
        )}

        <div className="sw-glass-card mt-6 grid grid-cols-2 gap-2 rounded-xl p-4 sm:grid-cols-4 lg:grid-cols-7">
          {steps.map((step, index) => (
            <div
              key={step}
              className={`rounded-md px-3 py-2 text-center text-xs font-semibold sm:text-sm ${
                index <= stepIndex ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {index + 1}. {step}
            </div>
          ))}
        </div>

        <div className="sw-glass-card mt-6 rounded-2xl p-5 sm:p-8">
          {stepIndex === 0 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Consent and Setup</h2>
              <label className="block text-sm font-medium">Preferred assessment language</label>
              <select
                className="w-full rounded-md border border-amber-300 px-3 py-2"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                <option value="">Select language</option>
                <option value="english">English</option>
                <option value="sinhala">Sinhala</option>
                <option value="tamil">Tamil</option>
              </select>
              <label className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(event) => setConsentChecked(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I consent to complete this screening. I understand this is a risk screening, not a final clinical
                  diagnosis.
                </span>
              </label>
            </div>
          )}

          {stepIndex === 1 && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">Dyslexia Screening</h2>
              <p className="mb-4 text-sm text-amber-800">Answer each statement from 0 (Never) to 4 (Very Often).</p>
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                This dyslexia section includes questionnaire evidence and also receives objective signal contributions
                from Voice Activities and Writing Activities.
              </div>
              {renderQuestionBlock(dyslexiaQuestions)}
            </div>
          )}

          {stepIndex === 2 && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">Dyscalculia Screening</h2>
              <p className="mb-4 text-sm text-amber-800">Answer each statement from 0 (Never) to 4 (Very Often).</p>
              <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                This dyscalculia section includes questionnaire evidence and also receives objective signal
                contributions from Voice Activities and Writing Activities.
              </div>
              {renderQuestionBlock(dyscalculiaQuestions)}
            </div>
          )}

          {stepIndex === 3 && (
            <div>
              <h2 className="mb-1 text-xl font-semibold">Functional Impact</h2>
              <p className="mb-4 text-sm text-amber-800">This section captures workplace impact and support needs.</p>
              {renderQuestionBlock(impactQuestions)}
            </div>
          )}

          {stepIndex === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Voice-Based Activities</h2>
              <p className="text-sm text-amber-900">
                Complete both tasks with a clear voice sample and enter the duration in seconds. Voice tasks strengthen
                fluency and naming-risk signals beyond self-report only.
              </p>

              {!voiceCompleted && (
                <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">Continue is disabled until both tasks are complete.</p>
                  <p className="mt-1">Each task needs at least 8 words in transcript and at least 10 seconds duration.</p>
                  <ul className="mt-2 list-disc pl-5 text-xs">
                    {voiceValidation.map((check) => (
                      <li key={check.taskId}>
                        {check.title}: words {check.wordCount}/8, duration {check.duration}s/10s
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {voiceTasks.map((task) => {
                const state = voiceStates[task.id]
                const taskRisk = scoreVoiceTask(task, state)

                return (
                  <article key={task.id} className="rounded-xl border border-amber-200 p-4">
                    <h3 className="text-base font-semibold">{task.title}</h3>
                    <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{task.prompt}</p>
                    <p className="mt-2 text-xs text-amber-700">Target fluency: {task.targetWpm} words per minute</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startListening(task.id)}
                        disabled={activeListeningTaskId !== null && activeListeningTaskId !== task.id}
                        className="sw-btn-primary rounded-md px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
                      >
                        Start Voice Capture
                      </button>
                      <button
                        type="button"
                        onClick={stopListening}
                        disabled={activeListeningTaskId !== task.id}
                        className="sw-btn-secondary rounded-md px-3 py-2 text-xs font-semibold transition disabled:opacity-50"
                      >
                        Stop
                      </button>
                    </div>

                    <label className="mt-3 block text-xs font-semibold text-amber-800">Duration (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={state.durationSeconds || ''}
                      onChange={(event) => updateVoiceDuration(task.id, Number(event.target.value) || 0)}
                      className="mt-1 w-full rounded-md border border-amber-300 px-3 py-2 text-sm"
                    />

                    <label className="mt-3 block text-xs font-semibold text-amber-800">Transcript</label>
                    <textarea
                      value={state.transcript}
                      onChange={(event) =>
                        setVoiceStates((current) => ({
                          ...current,
                          [task.id]: { ...current[task.id], transcript: event.target.value },
                        }))
                      }
                      className="mt-1 min-h-24 w-full rounded-md border border-amber-300 px-3 py-2 text-sm"
                    />

                    {state.error && <p className="mt-2 text-xs font-semibold text-rose-700">{state.error}</p>}

                    {tokenize(state.transcript).length < 8 && (
                      <p className="mt-2 text-xs text-rose-700">Add at least 8 words to this transcript.</p>
                    )}
                    {state.durationSeconds < 10 && (
                      <p className="mt-1 text-xs text-rose-700">Set duration to at least 10 seconds.</p>
                    )}

                    <p className="mt-2 text-xs text-amber-700">Voice task risk score: {taskRisk} ({toLevel(taskRisk)})</p>
                  </article>
                )
              })}

              {!speechRecognitionCtor && (
                <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">
                  Browser speech recognition is unavailable. You can still manually paste transcripts from recorded
                  audio.
                </p>
              )}
            </div>
          )}

          {stepIndex === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Writing and Paragraph Upload</h2>
              <p className="text-sm text-amber-900">
                Provide a copy-typing sample and upload or paste a free paragraph. This section contributes to writing
                organization and transcription risk scoring.
              </p>

              <article className="rounded-xl border border-amber-200 p-4">
                <h3 className="text-base font-semibold">Task A: Copy Passage</h3>
                <p className="mt-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">{copyReferenceParagraph}</p>
                <textarea
                  value={copyParagraph}
                  onChange={(event) => setCopyParagraph(event.target.value)}
                  placeholder="Type the same passage here..."
                  className="mt-3 min-h-28 w-full rounded-md border border-amber-300 px-3 py-2 text-sm"
                />
              </article>

              <article className="rounded-xl border border-amber-200 p-4">
                <h3 className="text-base font-semibold">Task B: Upload or Paste a Work Paragraph</h3>
                <p className="mt-2 text-sm text-amber-900">
                  Upload a plain text file or paste a paragraph (minimum 120 words) describing a recent work process.
                </p>

                <input
                  type="file"
                  accept=".txt,.md"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    void uploadParagraph(file)
                  }}
                  className="mt-3 w-full text-sm"
                />
                {uploadedFileName && <p className="mt-2 text-xs text-amber-700">Loaded file: {uploadedFileName}</p>}

                <textarea
                  value={uploadedParagraph}
                  onChange={(event) => setUploadedParagraph(event.target.value)}
                  placeholder="Paste paragraph text here if you are not uploading a file..."
                  className="mt-3 min-h-32 w-full rounded-md border border-amber-300 px-3 py-2 text-sm"
                />
              </article>
            </div>
          )}

          {stepIndex === 6 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">Assessment Result</h2>
              <p className="text-sm text-amber-900">
                Severity levels are calculated from weighted screening domains with objective voice and writing
                activities, then grouped into Low, Moderate, or Severe risk.
              </p>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <article className="rounded-xl border border-amber-200 p-4">
                  <p className="text-sm text-amber-700">Dyslexia Risk</p>
                  <p className="mt-1 text-2xl font-bold">{scoreSummary.dyslexiaRisk}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelClass(scoreSummary.dyslexiaLevel)}`}>
                    {scoreSummary.dyslexiaLevel}
                  </span>
                </article>

                <article className="rounded-xl border border-amber-200 p-4">
                  <p className="text-sm text-amber-700">Dyscalculia Risk</p>
                  <p className="mt-1 text-2xl font-bold">{scoreSummary.dyscalculiaRisk}</p>
                  <span
                    className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelClass(scoreSummary.dyscalculiaLevel)}`}
                  >
                    {scoreSummary.dyscalculiaLevel}
                  </span>
                </article>

                <article className="rounded-xl border border-amber-200 p-4">
                  <p className="text-sm text-amber-700">Voice Activity Risk</p>
                  <p className="mt-1 text-2xl font-bold">{scoreSummary.voiceRisk}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelClass(scoreSummary.voiceLevel)}`}>
                    {scoreSummary.voiceLevel}
                  </span>
                </article>

                <article className="rounded-xl border border-amber-200 p-4">
                  <p className="text-sm text-amber-700">Writing Activity Risk</p>
                  <p className="mt-1 text-2xl font-bold">{scoreSummary.writingRisk}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelClass(scoreSummary.writingLevel)}`}>
                    {scoreSummary.writingLevel}
                  </span>
                </article>

                <article className="rounded-xl border border-amber-200 p-4">
                  <p className="text-sm text-amber-700">Overall Risk</p>
                  <p className="mt-1 text-2xl font-bold">{scoreSummary.overallRisk}</p>
                  <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${levelClass(scoreSummary.overallLevel)}`}>
                    {scoreSummary.overallLevel}
                  </span>
                </article>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="text-base font-semibold">Submit To AI Screening Service</h3>
                <p className="mt-2 text-sm text-amber-900">
                  This sends questionnaire responses, voice artifacts, and writing artifacts directly to
                  `ai-screening-service` for audited scoring.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      void handleSubmitToScreeningService()
                    }}
                    disabled={submissionState === 'submitting'}
                    className="sw-btn-primary rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submissionState === 'submitting' ? 'Submitting...' : 'Submit Assessment'}
                  </button>
                  {submissionState === 'success' && <span className="text-sm font-semibold text-emerald-700">Submitted successfully.</span>}
                  {submissionState === 'error' && <span className="text-sm font-semibold text-rose-700">{submissionError}</span>}
                </div>

                {apiResult && (
                  <div className="mt-4 rounded-lg border border-amber-300 bg-white p-3 text-sm">
                    <p className="font-semibold text-amber-900">Service Result</p>
                    <p className="mt-1">Overall: {apiResult.overallRiskScore} ({apiResult.overallSeverity})</p>
                    <p>Confidence: {apiResult.confidence}</p>
                    <p className="mt-1 text-amber-800">Formula: {apiResult.formulaVersion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              className="sw-btn-secondary rounded-md px-4 py-2 text-sm font-semibold transition"
              disabled={stepIndex === 0}
            >
              Previous
            </button>

            <div className="flex items-center gap-3">
              {stepIndex < steps.length - 1 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                  disabled={!canContinue}
                  className="sw-btn-primary rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continue
                </button>
              )}
              <Link to="/home" className="text-sm font-semibold underline">
                Back to role selection
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
