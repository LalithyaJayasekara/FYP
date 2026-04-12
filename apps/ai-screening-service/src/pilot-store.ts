import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { AssessmentSubmission, ScoringResult } from '../../../packages/api-contracts/src/scoring-contract'

export type ClinicianLabel = {
  employeeId: string
  trueDyslexia: 0 | 1
  trueDyscalculia: 0 | 1
  labeledAt: string
}

type StoredScoredSubmission = {
  employeeId: string
  scoredAt: string
  dyslexiaRisk: number
  dyscalculiaRisk: number
}

export type PilotOutcome = {
  employeeId: string
  dyslexiaRisk: number
  dyscalculiaRisk: number
  trueDyslexia: 0 | 1
  trueDyscalculia: 0 | 1
}

const dataDir = path.resolve(process.cwd(), 'data')
const submissionsFile = path.join(dataDir, 'scored-submissions.ndjson')
const labelsFile = path.join(dataDir, 'clinician-labels.ndjson')

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true })
}

async function appendJsonLine(filePath: string, value: unknown): Promise<void> {
  await ensureDataDir()
  await fs.appendFile(filePath, `${JSON.stringify(value)}\n`, 'utf8')
}

async function readJsonLines<T>(filePath: string): Promise<T[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as T)
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException
    if (nodeError.code === 'ENOENT') {
      return []
    }
    throw error
  }
}

export async function storeScoredSubmission(submission: AssessmentSubmission, result: ScoringResult): Promise<void> {
  const row: StoredScoredSubmission = {
    employeeId: submission.respondent.employeeId,
    scoredAt: new Date().toISOString(),
    dyslexiaRisk: result.domains.dyslexia.riskScore,
    dyscalculiaRisk: result.domains.dyscalculia.riskScore,
  }

  await appendJsonLine(submissionsFile, row)
}

export async function storeClinicianLabel(label: ClinicianLabel): Promise<void> {
  await appendJsonLine(labelsFile, label)
}

export async function exportPilotOutcomes(): Promise<PilotOutcome[]> {
  const submissions = await readJsonLines<StoredScoredSubmission>(submissionsFile)
  const labels = await readJsonLines<ClinicianLabel>(labelsFile)

  const latestSubmissionByEmployee = new Map<string, StoredScoredSubmission>()
  for (const submission of submissions) {
    const existing = latestSubmissionByEmployee.get(submission.employeeId)
    if (!existing || submission.scoredAt > existing.scoredAt) {
      latestSubmissionByEmployee.set(submission.employeeId, submission)
    }
  }

  const latestLabelByEmployee = new Map<string, ClinicianLabel>()
  for (const label of labels) {
    const existing = latestLabelByEmployee.get(label.employeeId)
    if (!existing || label.labeledAt > existing.labeledAt) {
      latestLabelByEmployee.set(label.employeeId, label)
    }
  }

  const merged: PilotOutcome[] = []
  for (const [employeeId, submission] of latestSubmissionByEmployee) {
    const label = latestLabelByEmployee.get(employeeId)
    if (!label) {
      continue
    }

    merged.push({
      employeeId,
      dyslexiaRisk: submission.dyslexiaRisk,
      dyscalculiaRisk: submission.dyscalculiaRisk,
      trueDyslexia: label.trueDyslexia,
      trueDyscalculia: label.trueDyscalculia,
    })
  }

  return merged
}
