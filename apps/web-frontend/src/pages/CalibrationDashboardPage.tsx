import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

type PilotCase = {
  employeeId: string
  dyslexiaRisk: number
  dyscalculiaRisk: number
  trueDyslexia: 0 | 1
  trueDyscalculia: 0 | 1
}

type DisorderKey = 'dyslexia' | 'dyscalculia'

type Metrics = {
  tp: number
  fp: number
  tn: number
  fn: number
  precision: number
  recall: number
  specificity: number
  accuracy: number
  f1: number
  predictedPositive: number
  predictedNegative: number
}

type TuningResult = {
  disorder: DisorderKey
  recommendedThreshold: number
  recall: number
  specificity: number
  precision: number
  f1: number
  tp: number
  fp: number
  tn: number
  fn: number
}

type TuningResponse = {
  count: number
  tuning: {
    minSpecificityPercent: number
    dyslexia: TuningResult
    dyscalculia: TuningResult
  }
}

type CalibrationDashboardPageProps = {
  readOnly?: boolean
}

const samplePilotData: PilotCase[] = [
  { employeeId: 'EMP-001', dyslexiaRisk: 78, dyscalculiaRisk: 41, trueDyslexia: 1, trueDyscalculia: 0 },
  { employeeId: 'EMP-002', dyslexiaRisk: 29, dyscalculiaRisk: 66, trueDyslexia: 0, trueDyscalculia: 1 },
  { employeeId: 'EMP-003', dyslexiaRisk: 61, dyscalculiaRisk: 58, trueDyslexia: 1, trueDyscalculia: 1 },
  { employeeId: 'EMP-004', dyslexiaRisk: 22, dyscalculiaRisk: 31, trueDyslexia: 0, trueDyscalculia: 0 },
  { employeeId: 'EMP-005', dyslexiaRisk: 44, dyscalculiaRisk: 27, trueDyslexia: 1, trueDyscalculia: 0 },
  { employeeId: 'EMP-006', dyslexiaRisk: 33, dyscalculiaRisk: 74, trueDyslexia: 0, trueDyscalculia: 1 },
  { employeeId: 'EMP-007', dyslexiaRisk: 67, dyscalculiaRisk: 69, trueDyslexia: 1, trueDyscalculia: 1 },
  { employeeId: 'EMP-008', dyslexiaRisk: 18, dyscalculiaRisk: 25, trueDyslexia: 0, trueDyscalculia: 0 },
  { employeeId: 'EMP-009', dyslexiaRisk: 53, dyscalculiaRisk: 39, trueDyslexia: 1, trueDyscalculia: 0 },
  { employeeId: 'EMP-010', dyslexiaRisk: 37, dyscalculiaRisk: 62, trueDyslexia: 0, trueDyscalculia: 1 },
]

function ratio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0
  }
  return numerator / denominator
}

function toPercent(value: number): number {
  return Math.round(value * 100)
}

function computeMetrics(records: PilotCase[], disorder: DisorderKey, threshold: number): Metrics {
  const scoreKey = disorder === 'dyslexia' ? 'dyslexiaRisk' : 'dyscalculiaRisk'
  const labelKey = disorder === 'dyslexia' ? 'trueDyslexia' : 'trueDyscalculia'

  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0

  for (const record of records) {
    const predicted = record[scoreKey] >= threshold ? 1 : 0
    const actual = record[labelKey]

    if (predicted === 1 && actual === 1) {
      tp += 1
    } else if (predicted === 1 && actual === 0) {
      fp += 1
    } else if (predicted === 0 && actual === 0) {
      tn += 1
    } else {
      fn += 1
    }
  }

  const precision = ratio(tp, tp + fp)
  const recall = ratio(tp, tp + fn)
  const specificity = ratio(tn, tn + fp)
  const accuracy = ratio(tp + tn, records.length)
  const f1 = ratio(2 * precision * recall, precision + recall)

  return {
    tp,
    fp,
    tn,
    fn,
    precision: toPercent(precision),
    recall: toPercent(recall),
    specificity: toPercent(specificity),
    accuracy: toPercent(accuracy),
    f1: toPercent(f1),
    predictedPositive: tp + fp,
    predictedNegative: tn + fn,
  }
}

function thresholdSweep(records: PilotCase[], disorder: DisorderKey): Array<{ threshold: number; recall: number; specificity: number; f1: number }> {
  const points: Array<{ threshold: number; recall: number; specificity: number; f1: number }> = []

  for (let threshold = 20; threshold <= 80; threshold += 10) {
    const metrics = computeMetrics(records, disorder, threshold)
    points.push({ threshold, recall: metrics.recall, specificity: metrics.specificity, f1: metrics.f1 })
  }

  return points
}

function severityBand(score: number, moderateMin: number, severeMin: number): 'Low' | 'Moderate' | 'Severe' {
  if (score < moderateMin) {
    return 'Low'
  }
  if (score < severeMin) {
    return 'Moderate'
  }
  return 'Severe'
}

function parsePilotData(raw: string): PilotCase[] {
  const parsed = JSON.parse(raw) as unknown

  if (!Array.isArray(parsed)) {
    throw new Error('Pilot data must be a JSON array.')
  }

  return parsed.map((entry, index) => {
    const record = entry as Partial<PilotCase>

    if (!record.employeeId || typeof record.employeeId !== 'string') {
      throw new Error(`Record ${index + 1}: employeeId is required.`)
    }

    const dyslexiaRisk = Number(record.dyslexiaRisk)
    const dyscalculiaRisk = Number(record.dyscalculiaRisk)
    const trueDyslexia = Number(record.trueDyslexia)
    const trueDyscalculia = Number(record.trueDyscalculia)

    if (Number.isNaN(dyslexiaRisk) || Number.isNaN(dyscalculiaRisk)) {
      throw new Error(`Record ${index + 1}: risk scores must be numbers.`)
    }

    if (![0, 1].includes(trueDyslexia) || ![0, 1].includes(trueDyscalculia)) {
      throw new Error(`Record ${index + 1}: true labels must be 0 or 1.`)
    }

    return {
      employeeId: record.employeeId,
      dyslexiaRisk,
      dyscalculiaRisk,
      trueDyslexia: trueDyslexia as 0 | 1,
      trueDyscalculia: trueDyscalculia as 0 | 1,
    }
  })
}

export default function CalibrationDashboardPage({ readOnly = false }: CalibrationDashboardPageProps) {
  const [pilotData, setPilotData] = useState<PilotCase[]>(samplePilotData)
  const [moderateMin, setModerateMin] = useState(35)
  const [severeMin, setSevereMin] = useState(65)
  const [jsonInput, setJsonInput] = useState('')
  const [importError, setImportError] = useState('')
  const [loadingExport, setLoadingExport] = useState(false)
  const [exportInfo, setExportInfo] = useState('')
  const [minSpecificityTarget, setMinSpecificityTarget] = useState(70)
  const [tuningError, setTuningError] = useState('')
  const [tuningResult, setTuningResult] = useState<TuningResponse['tuning'] | null>(null)

  const baseUrl = import.meta.env.VITE_AI_SCREENING_API_URL ?? 'http://localhost:8082'

  const dyslexiaMetrics = useMemo(() => computeMetrics(pilotData, 'dyslexia', moderateMin), [pilotData, moderateMin])
  const dyscalculiaMetrics = useMemo(() => computeMetrics(pilotData, 'dyscalculia', moderateMin), [pilotData, moderateMin])

  const severitySummary = useMemo(() => {
    let dyslexiaLow = 0
    let dyslexiaModerate = 0
    let dyslexiaSevere = 0
    let dyscalculiaLow = 0
    let dyscalculiaModerate = 0
    let dyscalculiaSevere = 0

    for (const record of pilotData) {
      const dyslexiaBand = severityBand(record.dyslexiaRisk, moderateMin, severeMin)
      const dyscalculiaBand = severityBand(record.dyscalculiaRisk, moderateMin, severeMin)

      if (dyslexiaBand === 'Low') dyslexiaLow += 1
      if (dyslexiaBand === 'Moderate') dyslexiaModerate += 1
      if (dyslexiaBand === 'Severe') dyslexiaSevere += 1

      if (dyscalculiaBand === 'Low') dyscalculiaLow += 1
      if (dyscalculiaBand === 'Moderate') dyscalculiaModerate += 1
      if (dyscalculiaBand === 'Severe') dyscalculiaSevere += 1
    }

    return {
      dyslexiaLow,
      dyslexiaModerate,
      dyslexiaSevere,
      dyscalculiaLow,
      dyscalculiaModerate,
      dyscalculiaSevere,
    }
  }, [pilotData, moderateMin, severeMin])

  const dyslexiaSweep = useMemo(() => thresholdSweep(pilotData, 'dyslexia'), [pilotData])
  const dyscalculiaSweep = useMemo(() => thresholdSweep(pilotData, 'dyscalculia'), [pilotData])

  // --- HR helpers ---
  function reliabilityLevel(recall: number, specificity: number): 'high' | 'moderate' | 'low' {
    if (recall >= 80 && specificity >= 80) return 'high'
    if (recall >= 60 && specificity >= 60) return 'moderate'
    return 'low'
  }

  function trafficColor(level: 'high' | 'moderate' | 'low'): string {
    if (level === 'high') return 'bg-emerald-500'
    if (level === 'moderate') return 'bg-amber-400'
    return 'bg-rose-500'
  }

  function trafficBorder(level: 'high' | 'moderate' | 'low'): string {
    if (level === 'high') return 'border-emerald-200 bg-emerald-50'
    if (level === 'moderate') return 'border-amber-200 bg-amber-50'
    return 'border-rose-200 bg-rose-50'
  }

  function reliabilityMessage(label: string, recall: number, specificity: number): string {
    const level = reliabilityLevel(recall, specificity)
    if (level === 'high')
      return `${label} screening reliability is high — suitable for workforce planning.`
    if (level === 'moderate')
      return `${label} screening reliability is moderate — use with clinical oversight.`
    return `${label} screening reliability is low — discuss with clinician before acting on results.`
  }

  const dyslexiaReliability = reliabilityLevel(dyslexiaMetrics.recall, dyslexiaMetrics.specificity)
  const dyscalculiaReliability = reliabilityLevel(dyscalculiaMetrics.recall, dyscalculiaMetrics.specificity)

  function SummaryCard({ title, metrics, reliability, message }: { title: string; metrics: Metrics; reliability: 'high' | 'moderate' | 'low'; message: string }): ReactNode {
    return (
      <article className={`rounded-2xl border p-5 ${trafficBorder(reliability)}`}>
        <div className="flex items-center gap-3">
          <span className={`inline-block h-4 w-4 rounded-full ${trafficColor(reliability)}`} />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-slate-700">{message}</p>
        <p className="mt-3 text-sm">
          The screening correctly catches <strong>{metrics.recall}%</strong> of affected employees and correctly clears <strong>{metrics.specificity}%</strong> of unaffected ones.
        </p>
      </article>
    )
  }

  function WorkforceCard({ title, metrics }: { title: string; metrics: Metrics }): ReactNode {
    return (
      <article className="sw-glass-card rounded-2xl p-5">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center">
            <p className="text-3xl font-bold text-indigo-900">{metrics.predictedPositive}</p>
            <p className="mt-1 text-sm text-slate-700">Employees flagged for support</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-3xl font-bold text-slate-800">{metrics.predictedNegative}</p>
            <p className="mt-1 text-sm text-slate-700">Employees cleared</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-3xl font-bold text-amber-800">{metrics.fp}</p>
            <p className="mt-1 text-sm text-slate-700">Expected false referrals</p>
            <p className="mt-0.5 text-xs text-slate-500">Flagged but likely unaffected</p>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
            <p className="text-3xl font-bold text-rose-800">{metrics.fn}</p>
            <p className="mt-1 text-sm text-slate-700">Expected missed employees</p>
            <p className="mt-0.5 text-xs text-slate-500">Affected but not flagged — may need manual follow-up</p>
          </div>
        </div>
      </article>
    )
  }

  // --- HR read-only layout ---
  if (readOnly) {
    return (
      <main className="min-h-screen text-slate-900">
        <section className="mx-auto w-full max-w-5xl px-6 py-10">
          <span className="sw-soft-panel rounded-full px-3 py-1 text-sm font-medium text-indigo-900">HR Governance View</span>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Screening Reliability &amp; Workforce Impact</h1>
          <p className="mt-3 max-w-3xl text-slate-700">
            This dashboard shows how reliable the current screening is and what it means for workforce planning.
            Threshold settings are managed by the clinical team.
          </p>

          {/* Executive Summary — traffic lights */}
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SummaryCard
              title="Dyslexia Screening"
              metrics={dyslexiaMetrics}
              reliability={dyslexiaReliability}
              message={reliabilityMessage('Dyslexia', dyslexiaMetrics.recall, dyslexiaMetrics.specificity)}
            />
            <SummaryCard
              title="Dyscalculia Screening"
              metrics={dyscalculiaMetrics}
              reliability={dyscalculiaReliability}
              message={reliabilityMessage('Dyscalculia', dyscalculiaMetrics.recall, dyscalculiaMetrics.specificity)}
            />
          </div>

          {/* Workforce Impact */}
          <h2 className="mt-10 text-2xl font-bold">Workforce Impact</h2>
          <p className="mt-1 text-sm text-slate-600">
            Based on {pilotData.length} screened employees at current cutoff score of {moderateMin}.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <WorkforceCard title="Dyslexia" metrics={dyslexiaMetrics} />
            <WorkforceCard title="Dyscalculia" metrics={dyscalculiaMetrics} />
          </div>

          {/* Risk Groups */}
          <h2 className="mt-10 text-2xl font-bold">Risk Group Distribution</h2>
          <p className="mt-1 text-sm text-slate-600">Employee counts by risk level at current thresholds.</p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <article className="sw-glass-card rounded-2xl p-5">
              <h3 className="font-semibold">Dyslexia</h3>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 rounded-lg bg-slate-100 p-3 text-center">
                  <p className="text-2xl font-bold">{severitySummary.dyslexiaLow}</p>
                  <p className="text-xs text-slate-600">Low risk</p>
                </div>
                <div className="flex-1 rounded-lg bg-amber-100 p-3 text-center">
                  <p className="text-2xl font-bold">{severitySummary.dyslexiaModerate}</p>
                  <p className="text-xs text-slate-600">Moderate</p>
                </div>
                <div className="flex-1 rounded-lg bg-rose-100 p-3 text-center">
                  <p className="text-2xl font-bold">{severitySummary.dyslexiaSevere}</p>
                  <p className="text-xs text-slate-600">Severe</p>
                </div>
              </div>
            </article>
            <article className="sw-glass-card rounded-2xl p-5">
              <h3 className="font-semibold">Dyscalculia</h3>
              <div className="mt-3 flex gap-2">
                <div className="flex-1 rounded-lg bg-slate-100 p-3 text-center">
                  <p className="text-2xl font-bold">{severitySummary.dyscalculiaLow}</p>
                  <p className="text-xs text-slate-600">Low risk</p>
                </div>
                <div className="flex-1 rounded-lg bg-amber-100 p-3 text-center">
                  <p className="text-2xl font-bold">{severitySummary.dyscalculiaModerate}</p>
                  <p className="text-xs text-slate-600">Moderate</p>
                </div>
                <div className="flex-1 rounded-lg bg-rose-100 p-3 text-center">
                  <p className="text-2xl font-bold">{severitySummary.dyscalculiaSevere}</p>
                  <p className="text-xs text-slate-600">Severe</p>
                </div>
              </div>
            </article>
          </div>

          {/* Expandable detailed metrics */}
          <details className="mt-10">
            <summary className="cursor-pointer text-sm font-semibold text-indigo-700 underline">
              View detailed screening metrics
            </summary>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <article className="sw-glass-card rounded-2xl p-5">
                <h3 className="font-semibold">Dyslexia — Detailed Breakdown</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-emerald-50 p-3">Correctly identified: {dyslexiaMetrics.tp}</div>
                  <div className="rounded-lg bg-amber-50 p-3">False alarms: {dyslexiaMetrics.fp}</div>
                  <div className="rounded-lg bg-slate-100 p-3">Correctly cleared: {dyslexiaMetrics.tn}</div>
                  <div className="rounded-lg bg-rose-50 p-3">Missed cases: {dyslexiaMetrics.fn}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>Of those flagged, % actually affected: {dyslexiaMetrics.precision}%</div>
                  <div>Of affected employees, % caught: {dyslexiaMetrics.recall}%</div>
                  <div>Of unaffected employees, % correctly cleared: {dyslexiaMetrics.specificity}%</div>
                  <div>Overall balance score: {dyslexiaMetrics.f1}%</div>
                </div>
              </article>
              <article className="sw-glass-card rounded-2xl p-5">
                <h3 className="font-semibold">Dyscalculia — Detailed Breakdown</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-emerald-50 p-3">Correctly identified: {dyscalculiaMetrics.tp}</div>
                  <div className="rounded-lg bg-amber-50 p-3">False alarms: {dyscalculiaMetrics.fp}</div>
                  <div className="rounded-lg bg-slate-100 p-3">Correctly cleared: {dyscalculiaMetrics.tn}</div>
                  <div className="rounded-lg bg-rose-50 p-3">Missed cases: {dyscalculiaMetrics.fn}</div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <div>Of those flagged, % actually affected: {dyscalculiaMetrics.precision}%</div>
                  <div>Of affected employees, % caught: {dyscalculiaMetrics.recall}%</div>
                  <div>Of unaffected employees, % correctly cleared: {dyscalculiaMetrics.specificity}%</div>
                  <div>Overall balance score: {dyscalculiaMetrics.f1}%</div>
                </div>
              </article>
            </div>
          </details>

          <div className="mt-10 flex gap-4">
            <Link to="/hr-manager" className="font-semibold underline">
              Back to HR Dashboard
            </Link>
            <Link to="/home" className="font-semibold underline">
              Back to role selection
            </Link>
          </div>
        </section>
      </main>
    )
  }

  const loadSampleData = () => {
    setPilotData(samplePilotData)
    setImportError('')
  }

  const importFromJson = () => {
    try {
      const parsed = parsePilotData(jsonInput)
      setPilotData(parsed)
      setImportError('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse pilot data.'
      setImportError(message)
    }
  }

  const importFromFile = async (file: File | null) => {
    if (!file) {
      return
    }

    try {
      const content = await file.text()
      const parsed = parsePilotData(content)
      setPilotData(parsed)
      setImportError('')
      setJsonInput(content)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to parse pilot file.'
      setImportError(message)
    }
  }

  const loadFromBackendExport = async () => {
    setLoadingExport(true)
    setImportError('')

    try {
      const response = await fetch(`${baseUrl}/api/v1/pilot/export`)
      const parsed = (await response.json()) as { count?: number; outcomes?: PilotCase[]; error?: string }

      if (!response.ok || parsed.error) {
        throw new Error(parsed.error ?? 'Failed to export pilot outcomes from service.')
      }

      const outcomes = parsed.outcomes ?? []
      setPilotData(outcomes)
      setJsonInput(JSON.stringify(outcomes, null, 2))
      setExportInfo(`Loaded ${parsed.count ?? outcomes.length} records from ai-screening-service export.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load backend export.'
      setImportError(message)
    } finally {
      setLoadingExport(false)
    }
  }

  const autoTuneThresholds = async () => {
    setTuningError('')

    try {
      const response = await fetch(`${baseUrl}/api/v1/pilot/tune?minSpecificity=${minSpecificityTarget}`)
      const parsed = (await response.json()) as TuningResponse | { error: string }

      if (!response.ok || 'error' in parsed) {
        throw new Error('error' in parsed ? parsed.error : 'Threshold tuning failed.')
      }

      setTuningResult(parsed.tuning)
      setModerateMin(parsed.tuning.dyslexia.recommendedThreshold)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to auto-tune thresholds.'
      setTuningError(message)
    }
  }

  return (
    <main className="min-h-screen text-slate-900">
      <section className="mx-auto w-full max-w-7xl px-6 py-10">
        <span className="sw-soft-panel rounded-full px-3 py-1 text-sm font-medium text-indigo-900">Calibration Dashboard</span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Pilot Threshold Calibration</h1>
        <p className="mt-3 max-w-4xl text-slate-700">
          Use clinician-labeled pilot outcomes to tune threshold impact and confusion-matrix performance. This supports
          screening alignment under DSM-5-TR, ICD-11, and ICF reporting language.
        </p>

        {readOnly && (
          <div className="sw-glass-card mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            Read-only mode for HR review. Threshold editing, pilot data overrides, and auto-tuning are restricted to
            clinician access.
          </div>
        )}

        <div className="sw-glass-card mt-6 grid gap-4 rounded-2xl p-5 md:grid-cols-2">
          <article className="sw-soft-panel rounded-xl p-4">
            <h2 className="text-lg font-semibold">Threshold Controls</h2>
            <p className="mt-1 text-sm text-slate-600">Moderate threshold is used as screen-positive cutoff in confusion metrics.</p>

            <label className="mt-4 block text-sm font-medium">Moderate starts at: {moderateMin}</label>
            <input
              type="range"
              min={20}
              max={60}
              value={moderateMin}
              disabled={readOnly}
              onChange={(event) => {
                const nextModerate = Number(event.target.value)
                setModerateMin(nextModerate)
                if (severeMin <= nextModerate) {
                  setSevereMin(nextModerate + 5)
                }
              }}
              className="mt-2 w-full"
            />

            <label className="mt-4 block text-sm font-medium">Severe starts at: {severeMin}</label>
            <input
              type="range"
              min={40}
              max={90}
              value={severeMin}
              disabled={readOnly}
              onChange={(event) => {
                const nextSevere = Number(event.target.value)
                setSevereMin(Math.max(nextSevere, moderateMin + 5))
              }}
              className="mt-2 w-full"
            />

            {readOnly && <p className="mt-2 text-xs text-slate-500">Threshold controls are read-only for HR role.</p>}
          </article>

          <article className="sw-soft-panel rounded-xl p-4">
            <h2 className="text-lg font-semibold">Pilot Data Import</h2>
            <p className="mt-1 text-sm text-slate-600">Provide JSON array with fields employeeId, dyslexiaRisk, dyscalculiaRisk, trueDyslexia, trueDyscalculia.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {!readOnly && (
                <>
                  <button type="button" onClick={loadSampleData} className="sw-btn-secondary rounded-md px-3 py-2 text-sm font-semibold transition">
                    Load Sample Data
                  </button>
                  <button type="button" onClick={importFromJson} className="sw-btn-primary rounded-md px-3 py-2 text-sm font-semibold transition">
                    Apply JSON
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  void loadFromBackendExport()
                }}
                className="sw-btn-secondary rounded-md px-3 py-2 text-sm font-semibold transition"
                disabled={loadingExport}
              >
                {loadingExport ? 'Loading Export...' : 'Load Real Export'}
              </button>
            </div>

            {!readOnly && (
              <>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null
                    void importFromFile(file)
                  }}
                  className="mt-3 w-full text-sm"
                />

                <textarea
                  value={jsonInput}
                  onChange={(event) => setJsonInput(event.target.value)}
                  placeholder='[{"employeeId":"EMP-001","dyslexiaRisk":70,"dyscalculiaRisk":40,"trueDyslexia":1,"trueDyscalculia":0}]'
                  className="mt-3 min-h-28 w-full rounded-md border border-slate-300 bg-white/90 px-3 py-2 text-sm"
                />
              </>
            )}

            {importError && <p className="mt-2 text-sm font-medium text-rose-700">{importError}</p>}
            {exportInfo && <p className="mt-2 text-sm font-medium text-emerald-700">{exportInfo}</p>}
            <p className="mt-2 text-xs text-slate-500">Current records: {pilotData.length}</p>
          </article>
        </div>

        <div className="sw-glass-card mt-6 rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Auto Tune Thresholds</h2>
          <p className="mt-1 text-sm text-slate-600">
            Maximize recall while maintaining minimum specificity from real pilot outcomes.
          </p>

          <label className="mt-3 block text-sm font-medium">Minimum specificity target: {minSpecificityTarget}%</label>
          <input
            type="range"
            min={50}
            max={95}
            value={minSpecificityTarget}
            disabled={readOnly}
            onChange={(event) => setMinSpecificityTarget(Number(event.target.value))}
            className="mt-2 w-full"
          />

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void autoTuneThresholds()
              }}
              disabled={readOnly}
              className="sw-btn-primary rounded-md px-3 py-2 text-sm font-semibold transition"
            >
              Run Auto-Tuning
            </button>
          </div>

          {readOnly && <p className="mt-2 text-xs text-slate-500">Auto-tuning is disabled in HR read-only mode.</p>}

          {tuningError && <p className="mt-2 text-sm font-medium text-rose-700">{tuningError}</p>}
          {tuningResult && (
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
              <div className="sw-soft-panel rounded-lg p-3">
                <p className="font-semibold">Dyslexia Recommendation</p>
                <p>Suggested cutoff score: {tuningResult.dyslexia.recommendedThreshold}</p>
                <p>Cases caught: {tuningResult.dyslexia.recall}%</p>
                <p>Non-cases correctly cleared: {tuningResult.dyslexia.specificity}%</p>
                <p>Overall balance: {tuningResult.dyslexia.f1}%</p>
              </div>
              <div className="sw-soft-panel rounded-lg p-3">
                <p className="font-semibold">Dyscalculia Recommendation</p>
                <p>Suggested cutoff score: {tuningResult.dyscalculia.recommendedThreshold}</p>
                <p>Cases caught: {tuningResult.dyscalculia.recall}%</p>
                <p>Non-cases correctly cleared: {tuningResult.dyscalculia.specificity}%</p>
                <p>Overall balance: {tuningResult.dyscalculia.f1}%</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <article className="sw-glass-card rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Dyslexia Screening Accuracy</h2>
            <p className="mt-1 text-sm text-slate-600">Cutoff score for flagging: {moderateMin}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3">Correctly identified: {dyslexiaMetrics.tp}</div>
              <div className="rounded-lg bg-amber-50 p-3">False alarms: {dyslexiaMetrics.fp}</div>
              <div className="rounded-lg bg-slate-100 p-3">Correctly cleared: {dyslexiaMetrics.tn}</div>
              <div className="rounded-lg bg-rose-50 p-3">Missed cases: {dyslexiaMetrics.fn}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>Of those flagged, % actually affected: {dyslexiaMetrics.precision}%</div>
              <div>Of affected employees, % caught: {dyslexiaMetrics.recall}%</div>
              <div>Of unaffected employees, % correctly cleared: {dyslexiaMetrics.specificity}%</div>
              <div>Overall balance score: {dyslexiaMetrics.f1}%</div>
            </div>
          </article>

          <article className="sw-glass-card rounded-2xl p-5">
            <h2 className="text-xl font-semibold">Dyscalculia Screening Accuracy</h2>
            <p className="mt-1 text-sm text-slate-600">Cutoff score for flagging: {moderateMin}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-emerald-50 p-3">Correctly identified: {dyscalculiaMetrics.tp}</div>
              <div className="rounded-lg bg-amber-50 p-3">False alarms: {dyscalculiaMetrics.fp}</div>
              <div className="rounded-lg bg-slate-100 p-3">Correctly cleared: {dyscalculiaMetrics.tn}</div>
              <div className="rounded-lg bg-rose-50 p-3">Missed cases: {dyscalculiaMetrics.fn}</div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>Of those flagged, % actually affected: {dyscalculiaMetrics.precision}%</div>
              <div>Of affected employees, % caught: {dyscalculiaMetrics.recall}%</div>
              <div>Of unaffected employees, % correctly cleared: {dyscalculiaMetrics.specificity}%</div>
              <div>Overall balance score: {dyscalculiaMetrics.f1}%</div>
            </div>
          </article>
        </div>

        <div className="sw-glass-card mt-6 grid gap-4 rounded-2xl p-5 lg:grid-cols-2">
          <article className="sw-soft-panel rounded-xl p-4">
            <h2 className="text-lg font-semibold">Risk Group Distribution</h2>
            <p className="mt-1 text-sm text-slate-600">How employees are grouped when you change the cutoff levels.</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded bg-slate-100 p-2">Dyslexia Low: {severitySummary.dyslexiaLow}</div>
              <div className="rounded bg-amber-100 p-2">Dyslexia Moderate: {severitySummary.dyslexiaModerate}</div>
              <div className="rounded bg-rose-100 p-2">Dyslexia Severe: {severitySummary.dyslexiaSevere}</div>
              <div className="rounded bg-slate-100 p-2">Dyscalculia Low: {severitySummary.dyscalculiaLow}</div>
              <div className="rounded bg-amber-100 p-2">Dyscalculia Moderate: {severitySummary.dyscalculiaModerate}</div>
              <div className="rounded bg-rose-100 p-2">Dyscalculia Severe: {severitySummary.dyscalculiaSevere}</div>
            </div>
          </article>

          <article className="sw-soft-panel rounded-xl p-4">
            <h2 className="text-lg font-semibold">What-If: Different Cutoff Scores</h2>
            <p className="mt-1 text-sm text-slate-600">See how detection and false alarm rates change at different cutoff levels.</p>
            <div className="mt-3 grid gap-3 text-xs sm:grid-cols-2">
              <div>
                <p className="mb-1 font-semibold">Dyslexia</p>
                <div className="space-y-1">
                  {dyslexiaSweep.map((row) => (
                    <p key={`dx-${row.threshold}`}>
                      Cutoff {row.threshold}: Caught {row.recall}% | Cleared {row.specificity}% | Balance {row.f1}%
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 font-semibold">Dyscalculia</p>
                <div className="space-y-1">
                  {dyscalculiaSweep.map((row) => (
                    <p key={`dc-${row.threshold}`}>
                      Cutoff {row.threshold}: Caught {row.recall}% | Cleared {row.specificity}% | Balance {row.f1}%
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mt-8">
          <Link to="/home" className="font-semibold underline">
            Back to role selection
          </Link>
        </div>
      </section>
    </main>
  )
}
