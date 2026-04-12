import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getGuestSession, upsertGuestSession } from '../services/guestSessionStore'

// ─── Scoring helpers ─────────────────────────────────────────────────────────

type DomainSignal = 'minimal' | 'low-moderate' | 'moderate' | 'elevated'

interface DomainResult {
  label: string
  linkIds: string[]
  avg: number
  signal: DomainSignal
  headline: string
  rationale: string
  colour: { bg: string; border: string; badge: string; text: string }
}

const DOMAIN_DEFS = [
  {
    key: 'dyslexia',
    label: 'Reading & Language (Dyslexia indicators)',
    linkIds: ['dx-reading-effort', 'dx-word-errors', 'dx-spelling-orthography', 'dx-verbal-memory'],
  },
  {
    key: 'dyscalculia',
    label: 'Numerical Processing (Dyscalculia indicators)',
    linkIds: ['dc-number-sense', 'dc-arithmetic-speed', 'dc-place-value', 'dc-sequencing'],
  },
  {
    key: 'functional-impact',
    label: 'Functional & Workplace Impact',
    linkIds: ['fi-confidence-impact', 'fi-deadline-impact'],
  },
]

const SIGNAL_META: Record<
  DomainSignal,
  { headline: (domain: string) => string; rationale: (domain: string) => string; colour: DomainResult['colour'] }
> = {
  minimal: {
    headline: (d) => `No notable pattern detected in ${d}`,
    rationale: (d) =>
      `Your responses across the ${d} items fall within the typical range (average score ≤ 1.0). No specific accommodations are anticipated for this domain based on current self-report, though circumstances can change over time.`,
    colour: { bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-100 text-green-800', text: 'text-green-900' },
  },
  'low-moderate': {
    headline: (d) => `Some indicators present in ${d} — monitoring recommended`,
    rationale: (d) =>
      `Your responses suggest occasional difficulty in ${d} areas (average score 1.1–2.0). While this does not constitute a diagnosis, it may warrant a structured conversation with HR or an occupational health professional to determine whether light-touch support would help.`,
    colour: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800', text: 'text-blue-900' },
  },
  moderate: {
    headline: (d) => `Moderate pattern detected in ${d} — further assessment advised`,
    rationale: (d) =>
      `A consistent pattern of difficulty was identified across your ${d} responses (average score 2.1–3.0). These indicators are meaningful and suggest that a formal workplace needs assessment or specialist referral may be appropriate to explore tailored adjustments under your organisation's reasonable-adjustment policy.`,
    colour: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-800', text: 'text-amber-900' },
  },
  elevated: {
    headline: (d) => `Elevated pattern detected in ${d} — formal assessment strongly recommended`,
    rationale: (d) =>
      `Your responses consistently reflect significant challenges in ${d} (average score 3.1–4.0). This level of self-reported difficulty aligns with patterns associated with specific learning differences that can be meaningfully addressed through workplace adjustments, specialist assessment, and HR support pathways. Early action generally leads to better outcomes.`,
    colour: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-800', text: 'text-red-900' },
  },
}

function classifySignal(avg: number): DomainSignal {
  if (avg <= 1.0) return 'minimal'
  if (avg <= 2.0) return 'low-moderate'
  if (avg <= 3.0) return 'moderate'
  return 'elevated'
}

function computeDomainResults(responses: Record<string, number>): DomainResult[] {
  return DOMAIN_DEFS.map(({ key, label, linkIds }) => {
    const scores = linkIds.map((id) => responses[id] ?? 0)
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length
    const signal = classifySignal(avg)
    const meta = SIGNAL_META[signal]
    return {
      label,
      linkIds,
      avg,
      signal,
      headline: meta.headline(label),
      rationale: meta.rationale(label),
      colour: meta.colour,
    }
  })
}

function overallNarrative(results: DomainResult[]): string {
  const elevated = results.filter((r) => r.signal === 'elevated')
  const moderate = results.filter((r) => r.signal === 'moderate')
  const allMinimal = results.every((r) => r.signal === 'minimal')

  if (allMinimal)
    return 'Across all three domains, your responses fall within the typical range. No immediate action is indicated from this preliminary screen. Signing in allows CareLink to store your baseline securely and run a more detailed adaptive assessment if you choose.'
  if (elevated.length > 0)
    return `This preliminary screen identified elevated indicators in ${elevated.map((r) => r.label).join(' and ')}. These results are not a diagnosis — they are signals that inform the next step of a structured assessment. Signing in enables a clinician-reviewed adaptive workflow and connects you to your organisation's support pathways.`
  if (moderate.length > 0)
    return `Moderate indicators were detected in ${moderate.map((r) => r.label).join(' and ')}. A full CareLink assessment will explore these patterns in depth, generating a well-reasoned outcome report that you and your HR team can act on together.`
  return 'Some indicators were noted across your responses. The full CareLink assessment offers adaptive follow-up questions, domain-specific scoring, and a personalised support plan — all available once you create an account.'
}

// ─── Visualization constants & components ───────────────────────────────────

const SIGNAL_COLORS: Record<DomainSignal, string> = {
  minimal: '#22c55e',
  'low-moderate': '#3b82f6',
  moderate: '#f59e0b',
  elevated: '#ef4444',
}

const SIGNAL_LABELS: Record<DomainSignal, string> = {
  minimal: 'Low',
  'low-moderate': 'Mild',
  moderate: 'Moderate',
  elevated: 'High',
}

const SIGNAL_ACTIONS: Record<DomainSignal, string> = {
  minimal: 'No immediate action needed',
  'low-moderate': 'Monitor and discuss if needed',
  moderate: 'Recommend follow-up assessment',
  elevated: 'Prioritise full assessment',
}

function getSimpleDomainLabel(label: string): string {
  if (label.startsWith('Reading & Language')) return 'Reading and Language'
  if (label.startsWith('Numerical Processing')) return 'Number and Calculation'
  if (label.startsWith('Functional & Workplace Impact')) return 'Daily Work Impact'
  return label
}

const VALUE_LABELS = ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] as const

// Passive cell colours (muted) and active cell colours per scale step
const CELL_PASSIVE = ['#dcfce7', '#dbeafe', '#fef9c3', '#ffedd5', '#fee2e2']
const CELL_ACTIVE = ['#22c55e', '#3b82f6', '#eab308', '#f97316', '#ef4444']

/** Animated SVG donut / ring gauge for a single domain score */
function DonutGauge({ avg, signal }: { avg: number; signal: DomainSignal }) {
  const r = 38
  const sw = 11
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - avg / 4)
  const col = SIGNAL_COLORS[signal]
  return (
    <svg width={110} height={110} viewBox="0 0 110 110" aria-label={`Domain score ${avg.toFixed(1)} out of 4`}>
      {/* Track ring */}
      <circle cx={55} cy={55} r={r} fill="none" stroke="#e2e8f0" strokeWidth={sw} />
      {/* Scored arc — animates on mount */}
      <circle
        cx={55} cy={55} r={r}
        fill="none" stroke={col} strokeWidth={sw}
        strokeDasharray={`${circ} ${circ}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {/* Centre score text */}
      <text x={55} y={50} textAnchor="middle" fontSize={17} fontWeight={800} fill="#0f172a">{avg.toFixed(1)}</text>
      <text x={55} y={64} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight={500}>/ 4.0</text>
    </svg>
  )
}

/** Likert heatmap strip — one row per FHIR question, cells colour-coded by selected value */
function QuestionResponseStrip({ linkIds, responses }: { linkIds: string[]; responses: Record<string, number> }) {
  return (
    <div className="space-y-2">
      {linkIds.map((id) => {
        const item = questionnaire.item.find((q) => q.linkId === id)
        const val = responses[id] ?? -1
        const label = item?.code[0]?.coding[0]?.display ?? id
        return (
          <div key={id} className="flex items-center gap-2 min-w-0">
            <span
              className="shrink-0 truncate text-xs text-slate-600"
              style={{ width: '10.5rem' }}
              title={item?.text}
            >
              {label}
            </span>
            <div className="flex flex-1 gap-0.5">
              {[0, 1, 2, 3, 4].map((v) => (
                <div
                  key={v}
                  title={`${v} — ${VALUE_LABELS[v]}`}
                  className="h-6 flex-1 rounded transition-all duration-200"
                  style={{
                    backgroundColor: v === val ? CELL_ACTIVE[v] : CELL_PASSIVE[v],
                    opacity: v === val ? 1 : 0.3,
                    outline: v === val ? `2px solid ${CELL_ACTIVE[v]}` : 'none',
                    outlineOffset: '1px',
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
      {/* Scale legend */}
      <div className="flex gap-0.5 pt-1" style={{ paddingLeft: '10.5rem' }}>
        {VALUE_LABELS.map((lbl, v) => (
          <div key={v} className="flex-1 text-center text-[10px] font-medium text-slate-500">
            {lbl}
          </div>
        ))}
      </div>
    </div>
  )
}

/** SVG spider / radar chart — equilateral triangle arrangement for three domains */
function RadarChart({ results }: { results: DomainResult[] }) {
  const cx = 160
  const cy = 160
  const r = 92
  const n = results.length
  const angles = Array.from({ length: n }, (_, i) => (2 * Math.PI * i) / n - Math.PI / 2)
  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  const signalOrder: DomainSignal[] = ['minimal', 'low-moderate', 'moderate', 'elevated']
  const worstSignal = results.reduce(
    (w, res) => (signalOrder.indexOf(res.signal) > signalOrder.indexOf(w) ? res.signal : w),
    'minimal' as DomainSignal,
  )
  const col = SIGNAL_COLORS[worstSignal]

  const pt = (ratio: number, i: number) => ({
    x: cx + r * ratio * Math.cos(angles[i]),
    y: cy + r * ratio * Math.sin(angles[i]),
  })

  const labelRadius = r + 40
  const axisLabels = [
    { lines: ['Reading &', 'Language'], score: results[0]?.avg ?? 0 },
    { lines: ['Numerical', 'Processing'], score: results[1]?.avg ?? 0 },
    { lines: ['Functional', 'Impact'], score: results[2]?.avg ?? 0 },
  ]

  const zonePolygons = [
    { ratio: 1.0, fill: '#fee2e2', label: 'High concern' },
    { ratio: 0.67, fill: '#ffedd5', label: 'Moderate concern' },
    { ratio: 0.34, fill: '#dcfce7', label: 'Low concern' },
  ]

  return (
    <svg width="100%" viewBox="0 0 320 320" role="img" aria-label="Cross-domain triangle chart showing low, moderate, and high concern zones">
      <defs>
        <radialGradient id="radarFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={col} stopOpacity={0.3} />
          <stop offset="100%" stopColor={col} stopOpacity={0.06} />
        </radialGradient>
      </defs>

      {/* Meaningful zone bands so non-technical users can interpret severity quickly */}
      {zonePolygons.map((zone, i) => (
        <polygon
          key={`zone-${i}`}
          points={angles.map((a) => `${cx + r * zone.ratio * Math.cos(a)},${cy + r * zone.ratio * Math.sin(a)}`).join(' ')}
          fill={zone.fill}
          stroke="none"
          opacity={0.55}
        />
      ))}

      {/* Grid polygons */}
      {gridLevels.map((level, gi) => (
        <polygon
          key={gi}
          points={angles.map((a) => `${cx + r * level * Math.cos(a)},${cy + r * level * Math.sin(a)}`).join(' ')}
          fill={gi < gridLevels.length - 1 ? '#f8fafc' : 'none'}
          stroke="#cbd5e1"
          strokeWidth={gi === gridLevels.length - 1 ? 1.5 : 0.7}
          strokeDasharray={gi < gridLevels.length - 1 ? '4 3' : undefined}
        />
      ))}

      {/* Axis spokes */}
      {angles.map((a, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#cbd5e1" strokeWidth={1} />
      ))}

      {/* Axis endpoint markers */}
      {angles.map((a, i) => (
        <circle key={`axis-end-${i}`} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={3} fill="#94a3b8" />
      ))}

      {/* Scale tick labels along first axis */}
      {gridLevels.map((level, gi) => {
        const p = pt(level, 0)
        return (
          <text key={gi} x={p.x + 5} y={p.y} dominantBaseline="central" fontSize={8.5} fill="#94a3b8">
            {(level * 4).toFixed(1)}
          </text>
        )
      })}

      {/* Zone legend directly on chart */}
      <g>
        <rect x={215} y={36} width={88} height={52} rx={8} fill="white" stroke="#e2e8f0" />
        <circle cx={224} cy={50} r={4} fill="#dcfce7" stroke="#86efac" />
        <text x={233} y={53} fontSize={9.5} fill="#334155">Low concern</text>
        <circle cx={224} cy={65} r={4} fill="#ffedd5" stroke="#fdba74" />
        <text x={233} y={68} fontSize={9.5} fill="#334155">Moderate</text>
        <circle cx={224} cy={80} r={4} fill="#fee2e2" stroke="#fca5a5" />
        <text x={233} y={83} fontSize={9.5} fill="#334155">High concern</text>
      </g>

      {/* Centre anchor */}
      <circle cx={cx} cy={cy} r={2.5} fill="#64748b" />
      <text x={cx} y={cy + 15} textAnchor="middle" fontSize={8.5} fill="#64748b">Overall profile</text>

      {/* Data polygon with gradient fill */}
      <polygon
        points={results.map((res, i) => { const p = pt(res.avg / 4, i); return `${p.x},${p.y}` }).join(' ')}
        fill="url(#radarFill)"
        stroke={col}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {/* Vertex dots + score badge */}
      {results.map((res, i) => {
        const p = pt(res.avg / 4, i)
        const vc = SIGNAL_COLORS[res.signal]
        return (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={6} fill={vc} stroke="white" strokeWidth={2} />
            <rect x={p.x - 13} y={p.y - 25} width="26" height="16" rx="4" fill={vc} />
            <text x={p.x} y={p.y - 17} textAnchor="middle" dominantBaseline="central" fontSize={9.5} fontWeight={700} fill="white">
              {res.avg.toFixed(1)}
            </text>
          </g>
        )
      })}

      {/* Axis labels */}
      {axisLabels.map((lbl, i) => {
        const lx = cx + labelRadius * Math.cos(angles[i])
        const baseLy = cy + labelRadius * Math.sin(angles[i]) - (lbl.lines.length - 1) * 7
        return (
          <g key={i}>
            <text textAnchor="middle" fontSize={11} fontWeight={700} fill="#1e293b">
              {lbl.lines.map((line, li) => (
                <tspan key={li} x={lx} y={baseLy + li * 14}>{line}</tspan>
              ))}
            </text>
            <text x={lx} y={baseLy + lbl.lines.length * 14 + 2} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0f172a">
              {lbl.score.toFixed(1)} / 4
            </text>
          </g>
        )
      })}
    </svg>
  )
}

type FhirCodeableConcept = {
  coding: Array<{
    system: string
    code: string
    display: string
  }>
}

type FhirQuestionnaireItem = {
  linkId: string
  text: string
  type: 'integer'
  required: boolean
  code: FhirCodeableConcept[]
  extension: Array<{
    url: string
    valueCode: string
  }>
}

type FhirQuestionnaire = {
  resourceType: 'Questionnaire'
  id: string
  version: string
  status: 'active'
  date: string
  subjectType: string[]
  item: FhirQuestionnaireItem[]
}

type FhirQuestionnaireResponse = {
  resourceType: 'QuestionnaireResponse'
  questionnaire: string
  status: 'completed'
  authored: string
  subject: {
    reference: string
    display: string
  }
  item: Array<{
    linkId: string
    text: string
    answer: Array<{ valueInteger: number }>
  }>
}

const questionnaire: FhirQuestionnaire = {
  resourceType: 'Questionnaire',
  id: 'carelink-guest-ld-screen-v1',
  version: '1.0.0',
  status: 'active',
  date: '2026-04-11',
  subjectType: ['Person'],
  item: [
    {
      linkId: 'dx-reading-effort',
      text: 'I read workplace documents more slowly than peers, even when I understand the topic.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dx-reading-fluency', display: 'Dyslexia reading fluency' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyslexia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'performance' },
      ],
    },
    {
      linkId: 'dx-word-errors',
      text: 'I misread or skip words when reading quickly under pressure.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dx-reading-errors', display: 'Dyslexia reading errors' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyslexia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'self-report' },
      ],
    },
    {
      linkId: 'dx-spelling-orthography',
      text: 'I notice spelling or letter-order mistakes in my writing after sending.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dx-spelling', display: 'Dyslexia spelling and orthography' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyslexia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'performance' },
      ],
    },
    {
      linkId: 'dx-verbal-memory',
      text: 'I find it hard to retain spoken instructions unless they are repeated or written down.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dx-language-memory', display: 'Dyslexia language-memory indicator' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyslexia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'self-report' },
      ],
    },
    {
      linkId: 'dc-number-sense',
      text: 'I struggle to estimate quantities, durations, or costs without a calculator.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dc-number-sense', display: 'Dyscalculia number sense' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyscalculia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'self-report' },
      ],
    },
    {
      linkId: 'dc-arithmetic-speed',
      text: 'Simple calculations take me noticeably longer than expected.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dc-arithmetic-retrieval', display: 'Dyscalculia arithmetic retrieval' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyscalculia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'performance' },
      ],
    },
    {
      linkId: 'dc-place-value',
      text: 'I mix up place values, symbols, or operation signs when solving numeric tasks quickly.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dc-procedural-calculation', display: 'Dyscalculia procedural calculation' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyscalculia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'performance' },
      ],
    },
    {
      linkId: 'dc-sequencing',
      text: 'I lose track of multi-step number tasks and need to restart frequently.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'dc-task-sequencing', display: 'Dyscalculia task sequencing' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'dyscalculia' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'self-report' },
      ],
    },
    {
      linkId: 'fi-confidence-impact',
      text: 'These reading or number challenges reduce my confidence in work or study settings.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'fi-confidence', display: 'Functional impact on confidence' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'functional-impact' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'functional-impact' },
      ],
    },
    {
      linkId: 'fi-deadline-impact',
      text: 'These challenges affect my ability to finish tasks on time.',
      type: 'integer',
      required: true,
      code: [{ coding: [{ system: 'https://carelink.org/fhir/CodeSystem/ld-constructs', code: 'fi-deadline', display: 'Functional impact on deadlines' }] }],
      extension: [
        { url: 'https://carelink.org/fhir/StructureDefinition/disorder-domain', valueCode: 'functional-impact' },
        { url: 'https://carelink.org/fhir/StructureDefinition/construct-domain', valueCode: 'functional-impact' },
      ],
    },
  ],
}

const GUEST_QUESTIONNAIRE_RESPONSE_KEY = 'carelink.guest.questionnaire.response.v1'

export default function GuestQuestionnairePage() {
  const navigate = useNavigate()
  const [consentGiven, setConsentGiven] = useState(false)
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [domainResults, setDomainResults] = useState<DomainResult[]>([])

  const completedCount = useMemo(
    () => questionnaire.item.filter((question) => responses[question.linkId] !== undefined).length,
    [responses],
  )

  const isComplete = completedCount === questionnaire.item.length

  const handleSubmit = async () => {
    if (!consentGiven || !isComplete) return

    setSubmitting(true)

    const fhirResponse: FhirQuestionnaireResponse = {
      resourceType: 'QuestionnaireResponse',
      questionnaire: `Questionnaire/${questionnaire.id}|${questionnaire.version}`,
      status: 'completed',
      authored: new Date().toISOString(),
      subject: { reference: 'Person/guest-user', display: 'Guest User' },
      item: questionnaire.item.map((question) => ({
        linkId: question.linkId,
        text: question.text,
        answer: [{ valueInteger: responses[question.linkId] ?? 0 }],
      })),
    }

    window.localStorage.setItem(GUEST_QUESTIONNAIRE_RESPONSE_KEY, JSON.stringify(fhirResponse))

    const existingSession = getGuestSession()
    upsertGuestSession({ chatTurnsUsed: existingSession?.chatTurnsUsed ?? 0, intendedPath: '/screening' })

    setTimeout(() => {
      setDomainResults(computeDomainResults(responses))
      setSubmitting(false)
      setShowResults(true)
      // Scroll results into view
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 600)
  }

  const goToSignIn = () => {
    navigate('/auth', { state: { from: '/screening', reason: 'guest-questionnaire-complete' } })
  }

  // ── Results view ────────────────────────────────────────────────────────────
  if (showResults) {
    const narrative = overallNarrative(domainResults)
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-3xl space-y-6">

          {/* Page header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Preliminary Screening Results</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Your Initial Assessment Signals</h1>
              <p className="mt-1.5 text-xs text-slate-500">
                DSM-5-TR &amp; ICD-11 aligned · FHIR R4 Questionnaire · Preliminary only — not a diagnosis
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              You are browsing as a guest
            </span>
          </div>

          {/* ── 1. Radar / spider overview card ── */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-sm font-semibold text-slate-700">Cross-Domain Overview</h2>
            <p className="mb-4 text-xs text-slate-500">The triangle expands outward where support needs are stronger. Green zone is lower concern, orange is moderate, and red indicates higher concern.</p>
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              {/* Radar chart */}
              <div className="w-full shrink-0 sm:w-64">
                <RadarChart results={domainResults} />
              </div>
              {/* Narrative + legend chips */}
              <div className="flex-1">
                <p className="mb-2 text-sm font-semibold text-slate-900">Overall Interpretation</p>
                <p className="text-sm leading-relaxed text-slate-600">{narrative}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {domainResults.map((res) => (
                    <span
                      key={res.label}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor: SIGNAL_COLORS[res.signal] + '18',
                        color: SIGNAL_COLORS[res.signal],
                        borderColor: SIGNAL_COLORS[res.signal] + '44',
                      }}
                    >
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SIGNAL_COLORS[res.signal] }} />
                      {getSimpleDomainLabel(res.label)} - {SIGNAL_LABELS[res.signal]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">How to read this</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(Object.keys(SIGNAL_LABELS) as DomainSignal[]).map((signal) => (
                <div key={signal} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SIGNAL_COLORS[signal] }} />
                  <span className="font-semibold text-slate-700">{SIGNAL_LABELS[signal]}:</span>
                  <span className="text-slate-600">{SIGNAL_ACTIONS[signal]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. Per-domain detail cards (donut gauge + heatmap + text) ── */}
          {domainResults.map((result) => (
            <section
              key={result.label}
              className={`rounded-xl border p-5 shadow-sm ${result.colour.bg} ${result.colour.border}`}
            >
              {/* Card header */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className={`text-base font-bold ${result.colour.text}`}>{getSimpleDomainLabel(result.label)}</h2>
                <span className={`rounded-full px-3 py-0.5 text-xs font-bold uppercase tracking-wide ${result.colour.badge}`}>
                  {SIGNAL_LABELS[result.signal]}
                </span>
              </div>

              {/* Gauge + heatmap row */}
              <div className="mb-4 flex flex-col items-start gap-4 sm:flex-row">
                {/* Donut gauge */}
                <div className="flex shrink-0 flex-col items-center gap-1">
                  <DonutGauge avg={result.avg} signal={result.signal} />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Domain avg</span>
                </div>
                {/* Likert heatmap */}
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Per-question responses (0 to 4 scale)</p>
                  <QuestionResponseStrip linkIds={result.linkIds} responses={responses} />
                </div>
              </div>

              {/* Interpretation text */}
              <div className={`rounded-lg border p-4 ${result.colour.bg} ${result.colour.border}`}>
                <p className={`mb-1 text-xs font-semibold uppercase tracking-wide ${result.colour.text}`}>
                  Suggested next step: {SIGNAL_ACTIONS[result.signal]}
                </p>
                <p className={`mb-1 text-sm font-semibold ${result.colour.text}`}>{result.headline}</p>
                <p className={`text-sm leading-relaxed opacity-90 ${result.colour.text}`}>{result.rationale}</p>
              </div>
            </section>
          ))}

          {/* ── 3. Disclaimer ── */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-500">
            <strong className="text-slate-700">Important: </strong>
            These preliminary results are generated from self-reported data only and are not a clinical diagnosis.
            They are intended to inform a conversation with a qualified professional and HR. A full CareLink assessment
            includes adaptive follow-up, clinician review, and a personalised support plan.
          </div>

          {/* ── 4. Sign-in CTA ── */}
          <div className="rounded-xl border border-cyan-200 bg-white p-6 text-center shadow-sm">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Get your full personalised report</h3>
            <p className="mb-5 text-sm text-slate-600">
              Sign in to continue your adaptive assessment, receive a clinician-reviewed outcome, and connect
              to your organisation's workplace adjustment pathways. Your preliminary responses will be preserved.
            </p>
            <button
              type="button"
              onClick={goToSignIn}
              className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-cyan-700"
            >
              Sign in for your full assessment →
            </button>
            <p className="mt-3 text-xs text-slate-400">
              Your preliminary responses are stored locally and will be submitted automatically after sign-in.
            </p>
          </div>

        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">Guest Questionnaire</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Basic Screening (FHIR Questionnaire)</h1>
            <p className="mt-2 text-sm text-slate-600">Rate each statement from 0 to 4. This is preliminary screening guidance, not a diagnosis.</p>
          </div>
          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            You are browsing as a guest
          </span>
        </div>

        <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
          Completion: <strong>{completedCount}/{questionnaire.item.length}</strong> answered.
          <span className="ml-2 text-cyan-700">Scale: 0 Never, 1 Rarely, 2 Sometimes, 3 Often, 4 Always.</span>
        </div>

        <div className="space-y-4">
          {questionnaire.item.map((question, index) => (
            <section key={question.linkId} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-cyan-100 text-xs font-semibold text-cyan-900">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm text-slate-500">FHIR linkId: {question.linkId}</p>
                  <h2 className="text-base font-semibold text-slate-900">{question.text}</h2>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[0, 1, 2, 3, 4].map((value) => (
                  <button
                    key={`${question.linkId}-${value}`}
                    type="button"
                    onClick={() => setResponses((prev) => ({ ...prev, [question.linkId]: value }))}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      responses[question.linkId] === value
                        ? 'border-cyan-600 bg-cyan-600 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Consent</h2>
          <p className="mt-2 text-sm text-slate-700">
            I consent to this preliminary screening questionnaire and understand authentication is required for full workflow continuation.
          </p>
          <label className="mt-4 flex items-center gap-3">
            <input
              type="checkbox"
              checked={consentGiven}
              onChange={(event) => setConsentGiven(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-cyan-600"
            />
            <span className="text-sm text-slate-700">I agree to continue.</span>
          </label>
        </section>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/guest"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Guest Page
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!consentGiven || !isComplete || submitting}
            className="inline-flex items-center justify-center rounded-lg bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Analysing your responses…' : 'View my preliminary results'}
          </button>
        </div>
      </div>
    </main>
  )
}
