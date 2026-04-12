import type {
  AssessmentResponseItem,
  AssessmentSubmission,
  ClinicalSeverityLevel,
  DomainRisk,
  ScoringResult,
  SeverityLevel,
  StandardsAlignment,
} from '../../../packages/api-contracts/src/scoring-contract'

const FORMULA_VERSION = 'risk-formula-v2'
const SEVERITY_BANDS = {
  lowMaxExclusive: 35,
  moderateMaxExclusive: 65,
} as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

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

function toSeverity(score: number): SeverityLevel {
  if (score < SEVERITY_BANDS.lowMaxExclusive) {
    return 'Low'
  }
  if (score < SEVERITY_BANDS.moderateMaxExclusive) {
    return 'Moderate'
  }
  return 'Severe'
}

function toClinicalSeverity(score: number): ClinicalSeverityLevel {
  if (score < SEVERITY_BANDS.lowMaxExclusive) {
    return 'Mild'
  }
  if (score < SEVERITY_BANDS.moderateMaxExclusive) {
    return 'Moderate'
  }
  return 'Severe'
}

function diagnosticCodes(disorder: 'dyslexia' | 'dyscalculia'): { dsm5tr: string; icd11: string } {
  if (disorder === 'dyslexia') {
    return {
      dsm5tr: 'Specific Learning Disorder with impairment in reading (315.00/F81.0)',
      icd11: 'Developmental learning disorder with impairment in reading (6A03.0)',
    }
  }

  return {
    dsm5tr: 'Specific Learning Disorder with impairment in mathematics (315.1/F81.2)',
    icd11: 'Developmental learning disorder with impairment in mathematics (6A03.2)',
  }
}

function computeStandardsAlignment(submission: AssessmentSubmission): StandardsAlignment {
  const hasPerformanceSignal = submission.responses.some((item) => item.construct === 'performance')
  const hasFunctionalSignal = submission.responses.some((item) => item.construct === 'functional_impact')
  const hasDevelopmentalHistory = submission.clinicalContext?.developmentalHistoryConfirmed === true

  const exclusionChecks = submission.exclusionChecks
  const hasExclusionChecks =
    exclusionChecks?.intellectualDisabilityRuledOut === true &&
    exclusionChecks?.sensoryImpairmentRuledOut === true &&
    exclusionChecks?.inadequateInstructionRuledOut === true

  const persistenceSignal =
    (submission.clinicalContext?.symptomsDurationMonths ?? 0) >= 6 ||
    (submission.clinicalContext?.priorAssessmentsCount ?? 0) >= 2

  return {
    dsm5tr: {
      criteriaACovered: hasPerformanceSignal,
      criteriaBFunctionalImpactCovered: hasFunctionalSignal,
      criteriaCDevelopmentalHistoryCaptured: hasDevelopmentalHistory,
      criteriaDExclusionChecksCaptured: hasExclusionChecks,
    },
    icd11: {
      persistenceSignalPresent: persistenceSignal,
      exclusionChecksCaptured: hasExclusionChecks,
    },
  }
}

function weightedAverage(values: Array<{ score: number; weight: number }>): number {
  if (values.length === 0) {
    return 0
  }

  const totalWeight = values.reduce((sum, value) => sum + value.weight, 0)
  if (totalWeight === 0) {
    return 0
  }

  const weightedSum = values.reduce((sum, value) => sum + value.score * value.weight, 0)
  return weightedSum / totalWeight
}

function scoreFromNorms(item: AssessmentResponseItem): number {
  if (item.normMean === undefined || item.normStdDev === undefined) {
    return Number.NaN
  }

  const zScore = (item.rawScore - item.normMean) / item.normStdDev

  if (zScore > -1.0) {
    return 20
  }
  if (zScore > -2.0) {
    return 55
  }
  return 85
}

function scoreFromRawRange(item: AssessmentResponseItem): number {
  const span = item.maxScore - item.minScore
  if (span <= 0) {
    return 0
  }

  const normalized = (item.rawScore - item.minScore) / span
  return Math.round(clamp(normalized, 0, 1) * 100)
}

function itemRiskScore(item: AssessmentResponseItem): number {
  const normScore = scoreFromNorms(item)
  if (!Number.isNaN(normScore)) {
    return normScore
  }
  return scoreFromRawRange(item)
}

function computeDomainRisk(items: AssessmentResponseItem[], disorder: 'dyslexia' | 'dyscalculia'): DomainRisk {
  const relevant = items.filter((item) => item.disorder === disorder)
  const riskScore = Math.round(
    weightedAverage(relevant.map((item) => ({ score: itemRiskScore(item), weight: item.weight }))),
  )
  const codes = diagnosticCodes(disorder)

  return {
    disorder,
    itemCount: relevant.length,
    riskScore,
    severity: toSeverity(riskScore),
    clinicalSeverity: toClinicalSeverity(riskScore),
    diagnosticCodes: codes,
  }
}

function computeVoiceRisk(submission: AssessmentSubmission, fallbackRisk: number): number {
  const artifacts = submission.artifacts?.voiceTasks
  if (!artifacts || artifacts.length === 0) {
    return fallbackRisk
  }

  const perTaskRisk = artifacts.map((task) => {
    const wordCount = tokenize(task.transcript).length
    const minutes = task.durationSeconds > 0 ? task.durationSeconds / 60 : 0
    const observedWpm = minutes > 0 ? wordCount / minutes : 0
    const speedRatio = task.targetWpm > 0 ? observedWpm / task.targetWpm : 0

    let speedRisk = 85
    if (speedRatio >= 0.85) {
      speedRisk = 20
    } else if (speedRatio >= 0.65) {
      speedRisk = 50
    }

    const coverageRisk = Math.round((1 - clamp(task.keywordCoverage, 0, 1)) * 100)
    return 0.55 * speedRisk + 0.45 * coverageRisk
  })

  return Math.round(average(perTaskRisk))
}

function computeWritingRisk(submission: AssessmentSubmission, fallbackRisk: number): number {
  const writing = submission.artifacts?.writing
  if (!writing) {
    return fallbackRisk
  }

  const copyRisk = Math.round((1 - overlapRatio(writing.copiedText, writing.referenceText)) * 100)

  const freeWordCount = tokenize(writing.uploadedParagraphText).length
  let lengthRisk = 85
  if (freeWordCount >= 120 && freeWordCount <= 220) {
    lengthRisk = 20
  } else if (freeWordCount >= 90 && freeWordCount <= 260) {
    lengthRisk = 45
  }

  const freeSentenceCount = sentenceCount(writing.uploadedParagraphText)
  let structureRisk = 85
  if (freeSentenceCount >= 5) {
    structureRisk = 20
  } else if (freeSentenceCount >= 3) {
    structureRisk = 50
  }

  const freeWritingRisk = Math.round(0.6 * lengthRisk + 0.4 * structureRisk)
  return Math.round(clamp(Math.max(copyRisk, freeWritingRisk), 0, 100))
}

function confidenceFromCompletion(submission: AssessmentSubmission): 'high' | 'medium' | 'low' {
  const expectedMinimumItems = 8
  const answered = submission.responses.length
  const hasVoiceArtifact = (submission.artifacts?.voiceTasks?.length ?? 0) > 0
  const hasWritingArtifact = Boolean(submission.artifacts?.writing)

  if (answered >= expectedMinimumItems + 3 && hasVoiceArtifact && hasWritingArtifact) {
    return 'high'
  }
  if (answered >= expectedMinimumItems) {
    return 'medium'
  }
  return 'low'
}

export function scoreAssessmentSubmission(submission: AssessmentSubmission): ScoringResult {
  const domainDyslexia = computeDomainRisk(submission.responses, 'dyslexia')
  const domainDyscalculia = computeDomainRisk(submission.responses, 'dyscalculia')

  const performanceItems = submission.responses.filter((item) => item.construct === 'performance')
  const selfReportItems = submission.responses.filter((item) => item.construct === 'self_report')
  const functionalItems = submission.responses.filter((item) => item.construct === 'functional_impact')

  const performanceRisk = Math.round(
    weightedAverage(performanceItems.map((item) => ({ score: itemRiskScore(item), weight: item.weight }))),
  )
  const selfReportRisk = Math.round(
    weightedAverage(selfReportItems.map((item) => ({ score: itemRiskScore(item), weight: item.weight }))),
  )
  const functionalImpactRisk = Math.round(
    weightedAverage(functionalItems.map((item) => ({ score: itemRiskScore(item), weight: item.weight }))),
  )

  const voiceItems = submission.responses.filter((item) => item.modality === 'voice')
  const writingItems = submission.responses.filter((item) => item.modality === 'writing')
  const fallbackVoiceRisk = Math.round(
    weightedAverage(voiceItems.map((item) => ({ score: itemRiskScore(item), weight: item.weight }))),
  )
  const fallbackWritingRisk = Math.round(
    weightedAverage(writingItems.map((item) => ({ score: itemRiskScore(item), weight: item.weight }))),
  )

  const voiceRisk = computeVoiceRisk(submission, fallbackVoiceRisk || performanceRisk)
  const writingRisk = computeWritingRisk(submission, fallbackWritingRisk || performanceRisk)

  const overallRiskScore = Math.round(
    0.5 * performanceRisk +
      0.15 * selfReportRisk +
      0.1 * functionalImpactRisk +
      0.15 * voiceRisk +
      0.1 * writingRisk,
  )
  const overallSeverity = toSeverity(overallRiskScore)
  const overallClinicalSeverity = toClinicalSeverity(overallRiskScore)
  const confidence = confidenceFromCompletion(submission)
  const standardsAlignment = computeStandardsAlignment(submission)
  const codes = {
    dyslexia: diagnosticCodes('dyslexia'),
    dyscalculia: diagnosticCodes('dyscalculia'),
  }

  const notes: string[] = [
    'Risk score combines questionnaire data with objective voice and writing activities for stronger screening signal quality.',
  ]

  if (!standardsAlignment.dsm5tr.criteriaCDevelopmentalHistoryCaptured) {
    notes.push('DSM-5-TR criterion C signal is incomplete: developmental history has not been explicitly captured.')
  }
  if (!standardsAlignment.dsm5tr.criteriaDExclusionChecksCaptured) {
    notes.push('DSM-5-TR/ICD-11 exclusion checks are incomplete. Clinician should rule out sensory, intellectual, and instruction-related factors.')
  }
  if (!standardsAlignment.icd11.persistenceSignalPresent) {
    notes.push('ICD-11 persistence signal is incomplete. Capture symptom duration >= 6 months or at least two historical assessments.')
  }

  if (confidence !== 'high') {
    notes.push('Confidence is reduced due to limited completion or missing activity artifacts. Consider follow-up testing.')
  }

  return {
    assessmentId: submission.assessmentId,
    assessmentVersion: submission.assessmentVersion,
    formulaVersion: FORMULA_VERSION,
    frameworks: submission.frameworkAlignment,
    domains: {
      dyslexia: domainDyslexia,
      dyscalculia: domainDyscalculia,
    },
    componentScores: {
      performanceRisk,
      selfReportRisk,
      functionalImpactRisk,
      voiceRisk,
      writingRisk,
    },
    overallRiskScore,
    overallSeverity,
    overallClinicalSeverity,
    diagnosticCodes: codes,
    standardsAlignment,
    confidence,
    notes,
  }
}

export type ScoreAssessmentSubmission = typeof scoreAssessmentSubmission
