import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import type { AssessmentSubmission } from '../../../packages/api-contracts/src/scoring-contract'
import { scoreAssessmentHandler } from './score-assessment-handler'
import { exportPilotOutcomes, storeClinicianLabel, storeScoredSubmission, type ClinicianLabel } from './pilot-store'
import { tuneThresholds } from './threshold-tuning'
import { PromptTemplate } from '@langchain/core/prompts'
import { ChatVertexAI } from '@langchain/google-vertexai'

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

const instance = new ChatVertexAI({
  model: 'gemini-1.5-flash',
  temperature: 0.25,
})

const guestChatPrompt = new PromptTemplate({
  template:
    'You are the CareLink guest AI assistant. Answer guest questions with empathetic guidance, privacy-aware screening advice, and non-diagnostic context. Do not give medical diagnoses; encourage sign-in for full assessment when appropriate.\n\nConversation history:\n{history}\n\nUser question: {question}\n\nAssistant response:',
  inputVariables: ['history', 'question'],
})

type GuestChatHistoryEntry = {
  role: 'user' | 'assistant'
  content: string
}

async function generateGuestChatResponse(
  question: string,
  history: GuestChatHistoryEntry[] = []
): Promise<string> {
  const historyText = history
    .map((entry) => `${entry.role === 'assistant' ? 'Assistant' : 'User'}: ${entry.content}`)
    .join('\n')
  const prompt = await guestChatPrompt.format({
    history: historyText || 'None',
    question,
  })
  const response = await instance.invoke(prompt)
  const content = typeof response === 'string' ? response : response.content || ''
  return (typeof content === 'string' ? content : String(content)).trim()
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
  const chunks: Buffer[] = []

  request.on('data', (chunk) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  })

  request.on('end', async () => {
    try {
      if (request.method === 'POST' && requestPath === '/api/v1/guest-chat') {
        const parsed = parseJsonBody<{ question: string; history?: GuestChatHistoryEntry[] }>(chunks)

        if (!parsed.question || typeof parsed.question !== 'string') {
          sendJson(response, 400, { error: 'Missing or invalid question.' })
          return
        }

        const answer = await generateGuestChatResponse(parsed.question, parsed.history ?? [])
        sendJson(response, 200, { answer })
        return
      }

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

      if (request.method === 'GET' && requestPath === '/api/v1/pilot/export') {
        const outcomes = await exportPilotOutcomes()
        sendJson(response, 200, { count: outcomes.length, outcomes })
        return
      }

      if (request.method === 'GET' && requestPath === '/api/v1/pilot/tune') {
        const query = new URL(request.url ?? '', `http://${request.headers.host ?? 'localhost'}`).searchParams
        const minSpecificityPercent = Number(query.get('minSpecificity') ?? '70')

        const outcomes = await exportPilotOutcomes()
        if (outcomes.length === 0) {
          sendJson(response, 400, { error: 'No pilot outcomes available. Add submissions and clinician labels first.' })
          return
        }

        const tuning = tuneThresholds(outcomes, minSpecificityPercent)
        sendJson(response, 200, { count: outcomes.length, tuning })
        return
      }

      sendJson(response, 404, { error: 'Not found' })
    } catch (error) {
      console.error('Request failed:', error)
      sendJson(response, 400, { error: 'Invalid JSON request body.' })
    }
  })
})

server.listen(port, () => {
  console.log(`ai-screening-service listening on http://localhost:${port}`)
})
