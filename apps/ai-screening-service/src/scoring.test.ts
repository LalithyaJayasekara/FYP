import test from 'node:test'
import assert from 'node:assert/strict'
import type { AssessmentSubmission } from '../../../packages/api-contracts/src/scoring-contract'
import { scoreAssessmentSubmission } from './scoring'

function buildBaseSubmission(): AssessmentSubmission {
  return {
    assessmentId: 'test-assessment',
    assessmentVersion: 'v1.2.0',
    frameworkAlignment: ['DSM-5-TR', 'ICD-11', 'ICF'],
    respondent: {
      employeeId: 'employee-1',
      language: 'english',
      consentGiven: true,
      submittedAt: new Date('2026-03-07T08:00:00.000Z').toISOString(),
    },
    responses: [
      {
        itemId: 'dx-performance-1',
        disorder: 'dyslexia',
        construct: 'performance',
        modality: 'questionnaire',
        rawScore: 60,
        minScore: 0,
        maxScore: 100,
        weight: 1,
      },
      {
        itemId: 'dc-performance-1',
        disorder: 'dyscalculia',
        construct: 'performance',
        modality: 'questionnaire',
        rawScore: 55,
        minScore: 0,
        maxScore: 100,
        weight: 1,
      },
      {
        itemId: 'dx-self-1',
        disorder: 'dyslexia',
        construct: 'self_report',
        modality: 'questionnaire',
        rawScore: 2,
        minScore: 0,
        maxScore: 4,
        weight: 1,
      },
      {
        itemId: 'dx-self-2',
        disorder: 'dyslexia',
        construct: 'self_report',
        modality: 'questionnaire',
        rawScore: 3,
        minScore: 0,
        maxScore: 4,
        weight: 1,
      },
      {
        itemId: 'dc-self-1',
        disorder: 'dyscalculia',
        construct: 'self_report',
        modality: 'questionnaire',
        rawScore: 2,
        minScore: 0,
        maxScore: 4,
        weight: 1,
      },
      {
        itemId: 'dc-self-2',
        disorder: 'dyscalculia',
        construct: 'self_report',
        modality: 'questionnaire',
        rawScore: 3,
        minScore: 0,
        maxScore: 4,
        weight: 1,
      },
      {
        itemId: 'fi-1',
        disorder: 'functional-impact',
        construct: 'functional_impact',
        modality: 'questionnaire',
        rawScore: 2,
        minScore: 0,
        maxScore: 4,
        weight: 1,
      },
      {
        itemId: 'fi-2',
        disorder: 'functional-impact',
        construct: 'functional_impact',
        modality: 'questionnaire',
        rawScore: 2,
        minScore: 0,
        maxScore: 4,
        weight: 1,
      },
    ],
    artifacts: {
      voiceTasks: [
        {
          taskId: 'voice-reading-passage',
          transcript: 'reviewed referral appointment updated summary completed',
          durationSeconds: 30,
          targetWpm: 120,
          keywordCoverage: 1,
        },
      ],
      writing: {
        referenceText:
          'I prepared a concise project summary, checked each data field for accuracy, and submitted the report with all required details before the deadline.',
        copiedText:
          'I prepared a concise project summary checked each data field for accuracy and submitted the report with all required details before the deadline.',
        uploadedParagraphText:
          'I reviewed the work queue and prioritized high-impact tasks first. Then I confirmed all records were complete and matched against source notes. I updated the dashboard with cleaned values and highlighted outliers for the team. Finally, I submitted the completed report before the end of day with comments about risk assumptions.',
      },
    },
  }
}

test('handles missing artifacts by using fallback risks and lowering confidence', () => {
  const submission = buildBaseSubmission()
  delete submission.artifacts

  const result = scoreAssessmentSubmission(submission)

  assert.equal(result.componentScores.voiceRisk, result.componentScores.performanceRisk)
  assert.equal(result.componentScores.writingRisk, result.componentScores.performanceRisk)
  assert.notEqual(result.confidence, 'high')
})

test('low-duration voice artifact yields high voice risk', () => {
  const submission = buildBaseSubmission()
  submission.artifacts = {
    ...submission.artifacts,
    voiceTasks: [
      {
        taskId: 'voice-reading-passage',
        transcript: 'reviewed',
        durationSeconds: 5,
        targetWpm: 120,
        keywordCoverage: 0.1,
      },
    ],
  }

  const result = scoreAssessmentSubmission(submission)

  assert.ok(result.componentScores.voiceRisk >= 65)
})

test('short uploaded paragraph yields high writing risk', () => {
  const submission = buildBaseSubmission()
  const writing = submission.artifacts?.writing
  assert.ok(writing)
  submission.artifacts = {
    ...submission.artifacts,
    writing: {
      ...writing,
      uploadedParagraphText: 'Short paragraph only few words.',
    },
  }

  const result = scoreAssessmentSubmission(submission)

  assert.ok(result.componentScores.writingRisk >= 65)
})

test('severity boundaries map 34 low, 35 moderate, 65 severe', () => {
  const low = buildBaseSubmission()
  low.responses = [
    {
      itemId: 'dx-boundary-low',
      disorder: 'dyslexia',
      construct: 'performance',
      modality: 'questionnaire',
      rawScore: 34,
      minScore: 0,
      maxScore: 100,
      weight: 1,
    },
    {
      itemId: 'dc-anchor-low',
      disorder: 'dyscalculia',
      construct: 'performance',
      modality: 'questionnaire',
      rawScore: 34,
      minScore: 0,
      maxScore: 100,
      weight: 1,
    },
  ]
  delete low.artifacts

  const moderate = buildBaseSubmission()
  moderate.responses = [
    {
      itemId: 'dx-boundary-moderate',
      disorder: 'dyslexia',
      construct: 'performance',
      modality: 'questionnaire',
      rawScore: 35,
      minScore: 0,
      maxScore: 100,
      weight: 1,
    },
    {
      itemId: 'dc-anchor-moderate',
      disorder: 'dyscalculia',
      construct: 'performance',
      modality: 'questionnaire',
      rawScore: 35,
      minScore: 0,
      maxScore: 100,
      weight: 1,
    },
  ]
  delete moderate.artifacts

  const severe = buildBaseSubmission()
  severe.responses = [
    {
      itemId: 'dx-boundary-severe',
      disorder: 'dyslexia',
      construct: 'performance',
      modality: 'questionnaire',
      rawScore: 65,
      minScore: 0,
      maxScore: 100,
      weight: 1,
    },
    {
      itemId: 'dc-anchor-severe',
      disorder: 'dyscalculia',
      construct: 'performance',
      modality: 'questionnaire',
      rawScore: 65,
      minScore: 0,
      maxScore: 100,
      weight: 1,
    },
  ]
  delete severe.artifacts

  const lowResult = scoreAssessmentSubmission(low)
  const moderateResult = scoreAssessmentSubmission(moderate)
  const severeResult = scoreAssessmentSubmission(severe)

  assert.equal(lowResult.domains.dyslexia.severity, 'Low')
  assert.equal(moderateResult.domains.dyslexia.severity, 'Moderate')
  assert.equal(severeResult.domains.dyslexia.severity, 'Severe')
})
