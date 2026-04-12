import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AssessmentSubmission } from '../../../packages/api-contracts/src/scoring-contract'
import { scoreAssessmentHandler } from './score-assessment-handler'
import { exportPilotOutcomes, storeClinicianLabel, storeScoredSubmission, type ClinicianLabel } from './pilot-store'
import { tuneThresholds } from './threshold-tuning'

const port = Number(process.env.PORT ?? 8082)

function parseJsonBody<T>(buffer: Buffer[]): T {
  const raw = Buffer.concat(buffer).toString('utf8')
  return JSON.parse(raw) as T
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

function readRequestPath(request: IncomingMessage): string {
  return request.url?.split('?')[0] ?? ''
}

const server = createServer((request, response) => {
  const origin = request.headers.origin ?? '*'
  response.setHeader('Access-Control-Allow-Origin', origin)
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')

  if (request.method === 'OPTIONS') {
    response.writeHead(204)
    response.end()
    return
  }

  const requestPath = readRequestPath(request)

  if (request.method === 'GET' && requestPath === '/api/v1/pilot/export') {
    void exportPilotOutcomes()
      .then((outcomes) => {
        sendJson(response, 200, { count: outcomes.length, outcomes })
      })
      .catch(() => {
        sendJson(response, 500, { error: 'Failed to export pilot outcomes.' })
      })
    return
  }

  if (request.method === 'GET' && requestPath === '/api/v1/pilot/tune') {
    const query = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`).searchParams
    const minSpecificityPercent = Number(query.get('minSpecificity') ?? '70')

    void exportPilotOutcomes()
      .then((outcomes) => {
        if (outcomes.length === 0) {
          sendJson(response, 400, { error: 'No pilot outcomes available. Add submissions and clinician labels first.' })
          return
        }

        const tuning = tuneThresholds(outcomes, minSpecificityPercent)
        sendJson(response, 200, { count: outcomes.length, tuning })
      })
      .catch(() => {
        sendJson(response, 500, { error: 'Failed to tune thresholds.' })
      })
    return
  }

  const chunks: Buffer[] = []
  request.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })

  request.on('end', () => {
    try {
      if (request.method === 'POST' && requestPath === '/api/v1/screening/score') {
        const parsed = parseJsonBody<AssessmentSubmission>(chunks)
        const result = scoreAssessmentHandler({ body: parsed })

        if (result.status === 200 && !('error' in result.body)) {
          void storeScoredSubmission(parsed, result.body)
        }

        sendJson(response, result.status, result.body)
        return
      }

      if (request.method === 'POST' && requestPath === '/api/v1/clinician-labels') {
        const parsed = parseJsonBody<Partial<ClinicianLabel>>(chunks)
        if (!parsed.employeeId || ![0, 1].includes(Number(parsed.trueDyslexia)) || ![0, 1].includes(Number(parsed.trueDyscalculia))) {
          sendJson(response, 400, { error: 'Invalid clinician label payload.' })
          return
        }

        const label: ClinicianLabel = {
          employeeId: parsed.employeeId,
          trueDyslexia: Number(parsed.trueDyslexia) as 0 | 1,
          trueDyscalculia: Number(parsed.trueDyscalculia) as 0 | 1,
          labeledAt: parsed.labeledAt ?? new Date().toISOString(),
        }

        void storeClinicianLabel(label)
          .then(() => {
            sendJson(response, 200, { status: 'ok' })
          })
          .catch(() => {
            sendJson(response, 500, { error: 'Failed to save clinician label.' })
          })
        return
      }

      sendJson(response, 404, { error: 'Not found' })
    } catch {
      sendJson(response, 400, { error: 'Invalid JSON request body.' })
    }
  })
})

server.listen(port, () => {
  console.log(`ai-screening-service listening on http://localhost:${port}`)
})
