export type Modality = 'questionnaire' | 'voice' | 'writing'
export type Construct = 'performance' | 'self_report' | 'functional_impact'
export type Disorder = 'dyslexia' | 'dyscalculia' | 'functional-impact'

export type AssessmentResponseItem = {
  itemId: string
  disorder: Disorder
  construct: Construct
  modality: Modality
  rawScore: number
  minScore: number
  maxScore: number
  weight: number
}

export type VoiceTaskArtifact = {
  taskId: string
  transcript: string
  durationSeconds: number
  targetWpm: number
  keywordCoverage: number
}

export type WritingArtifact = {
  referenceText: string
  copiedText: string
  uploadedParagraphText: string
}

export type AssessmentSubmission = {
  assessmentId: string
  assessmentVersion: string
  frameworkAlignment: Array<'DSM-5-TR' | 'ICD-11' | 'ICF'>
  respondent: {
    employeeId: string
    language: 'english' | 'sinhala' | 'tamil'
    consentGiven: true
    submittedAt: string
  }
  responses: AssessmentResponseItem[]
  artifacts: {
    voiceTasks: VoiceTaskArtifact[]
    writing: WritingArtifact
  }
}

export type ScoringResult = {
  assessmentId: string
  assessmentVersion: string
  formulaVersion: string
  componentScores: {
    performanceRisk: number
    selfReportRisk: number
    functionalImpactRisk: number
    voiceRisk: number
    writingRisk: number
  }
  overallRiskScore: number
  overallSeverity: 'Low' | 'Moderate' | 'Severe'
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export type ClinicianLabelPayload = {
  employeeId: string
  trueDyslexia: 0 | 1
  trueDyscalculia: 0 | 1
  labeledAt?: string
}

const defaultBaseUrl = 'http://localhost:8082'

export async function submitAssessment(submission: AssessmentSubmission): Promise<ScoringResult> {
  const baseUrl = import.meta.env.VITE_AI_SCREENING_API_URL ?? defaultBaseUrl
  const response = await fetch(`${baseUrl}/api/v1/screening/score`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(submission),
  })

  const parsed = (await response.json()) as ScoringResult | { error: string }

  if (!response.ok) {
    throw new Error('error' in parsed ? parsed.error : 'Assessment scoring failed.')
  }

  if ('error' in parsed) {
    throw new Error(parsed.error)
  }

  return parsed
}

export async function submitClinicianLabel(payload: ClinicianLabelPayload): Promise<void> {
  const baseUrl = import.meta.env.VITE_AI_SCREENING_API_URL ?? defaultBaseUrl
  const response = await fetch(`${baseUrl}/api/v1/clinician-labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const parsed = (await response.json()) as { status?: string; error?: string }

  if (!response.ok || parsed.error) {
    throw new Error(parsed.error ?? 'Failed to submit clinician label.')
  }
}
