export type AlignmentIndex = 'DSM-5-TR' | 'ICD-11' | 'ICF'
export type Disorder = 'dyslexia' | 'dyscalculia' | 'functional-impact'
export type Construct = 'performance' | 'self_report' | 'functional_impact'
export type Modality = 'questionnaire' | 'voice' | 'writing'
export type SeverityLevel = 'Low' | 'Moderate' | 'Severe'
export type ClinicalSeverityLevel = 'Mild' | 'Moderate' | 'Severe'

export type AssessmentResponseItem = {
  itemId: string
  disorder: Disorder
  construct: Construct
  modality: Modality
  rawScore: number
  minScore: number
  maxScore: number
  weight: number
  normMean?: number
  normStdDev?: number
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
  frameworkAlignment: AlignmentIndex[]
  respondent: {
    employeeId: string
    ageBand?: '18-24' | '25-34' | '35-44' | '45-54' | '55+'
    language: 'english' | 'sinhala' | 'tamil'
    consentGiven: true
    consentScope?: {
      clinicalAssessment: true
      hrAccommodationSharing?: boolean
      researchUse?: boolean
      expiresAt?: string
    }
    submittedAt: string
  }
  clinicalContext?: {
    developmentalHistoryConfirmed?: boolean
    symptomsDurationMonths?: number
    priorAssessmentsCount?: number
  }
  exclusionChecks?: {
    intellectualDisabilityRuledOut?: boolean
    sensoryImpairmentRuledOut?: boolean
    inadequateInstructionRuledOut?: boolean
    languageProficiencyConcern?: boolean
    adhdConsidered?: boolean
  }
  responses: AssessmentResponseItem[]
  artifacts?: {
    voiceTasks?: VoiceTaskArtifact[]
    writing?: WritingArtifact
  }
}

export type DomainRisk = {
  disorder: 'dyslexia' | 'dyscalculia'
  itemCount: number
  riskScore: number
  severity: SeverityLevel
  clinicalSeverity: ClinicalSeverityLevel
  diagnosticCodes: {
    dsm5tr: string
    icd11: string
  }
}

export type StandardsAlignment = {
  dsm5tr: {
    criteriaACovered: boolean
    criteriaBFunctionalImpactCovered: boolean
    criteriaCDevelopmentalHistoryCaptured: boolean
    criteriaDExclusionChecksCaptured: boolean
  }
  icd11: {
    persistenceSignalPresent: boolean
    exclusionChecksCaptured: boolean
  }
}

export type ScoringResult = {
  assessmentId: string
  assessmentVersion: string
  formulaVersion: string
  frameworks: AlignmentIndex[]
  domains: {
    dyslexia: DomainRisk
    dyscalculia: DomainRisk
  }
  componentScores: {
    performanceRisk: number
    selfReportRisk: number
    functionalImpactRisk: number
    voiceRisk: number
    writingRisk: number
  }
  overallRiskScore: number
  overallSeverity: SeverityLevel
  overallClinicalSeverity: ClinicalSeverityLevel
  diagnosticCodes: {
    dyslexia: {
      dsm5tr: string
      icd11: string
    }
    dyscalculia: {
      dsm5tr: string
      icd11: string
    }
  }
  standardsAlignment: StandardsAlignment
  confidence: 'high' | 'medium' | 'low'
  notes: string[]
}

export const SEVERITY_BANDS = {
  lowMaxExclusive: 35,
  moderateMaxExclusive: 65,
} as const
