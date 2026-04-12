import type { AssessmentSubmission, ScoringResult } from '../../../packages/api-contracts/src/scoring-contract'
import { scoreAssessmentSubmission } from './scoring'

export type ScoreAssessmentRequest = {
  body: AssessmentSubmission
}

export type ScoreAssessmentResponse = {
  status: number
  body: ScoringResult | { error: string }
}

export function scoreAssessmentHandler(request: ScoreAssessmentRequest): ScoreAssessmentResponse {
  if (!request.body.respondent.consentGiven) {
    return {
      status: 400,
      body: { error: 'Consent is required before screening can be scored.' },
    }
  }

  if (request.body.responses.length === 0) {
    return {
      status: 400,
      body: { error: 'At least one response is required.' },
    }
  }

  if (
    request.body.respondent.consentScope &&
    request.body.respondent.consentScope.clinicalAssessment !== true
  ) {
    return {
      status: 400,
      body: { error: 'Clinical assessment consent scope must be true when consentScope is provided.' },
    }
  }

  return {
    status: 200,
    body: scoreAssessmentSubmission(request.body),
  }
}
