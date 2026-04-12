import type { PilotOutcome } from './pilot-store'

type Disorder = 'dyslexia' | 'dyscalculia'

export type TuningResult = {
  disorder: Disorder
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

function safeRatio(numerator: number, denominator: number): number {
  if (denominator === 0) {
    return 0
  }
  return numerator / denominator
}

function toPercent(value: number): number {
  return Math.round(value * 100)
}

function computeStats(outcomes: PilotOutcome[], disorder: Disorder, threshold: number) {
  const scoreKey = disorder === 'dyslexia' ? 'dyslexiaRisk' : 'dyscalculiaRisk'
  const labelKey = disorder === 'dyslexia' ? 'trueDyslexia' : 'trueDyscalculia'

  let tp = 0
  let fp = 0
  let tn = 0
  let fn = 0

  for (const outcome of outcomes) {
    const predicted = outcome[scoreKey] >= threshold ? 1 : 0
    const actual = outcome[labelKey]

    if (predicted === 1 && actual === 1) tp += 1
    else if (predicted === 1 && actual === 0) fp += 1
    else if (predicted === 0 && actual === 0) tn += 1
    else fn += 1
  }

  const recall = safeRatio(tp, tp + fn)
  const specificity = safeRatio(tn, tn + fp)
  const precision = safeRatio(tp, tp + fp)
  const f1 = safeRatio(2 * precision * recall, precision + recall)

  return {
    tp,
    fp,
    tn,
    fn,
    recall,
    specificity,
    precision,
    f1,
  }
}

function tuneForDisorder(outcomes: PilotOutcome[], disorder: Disorder, minSpecificityPercent: number): TuningResult {
  const minSpecificity = minSpecificityPercent / 100

  let bestThreshold = 35
  let bestStats = computeStats(outcomes, disorder, 35)

  for (let threshold = 20; threshold <= 80; threshold += 1) {
    const stats = computeStats(outcomes, disorder, threshold)
    const meetsSpecificity = stats.specificity >= minSpecificity

    if (!meetsSpecificity) {
      continue
    }

    const betterRecall = stats.recall > bestStats.recall
    const tieButBetterF1 = stats.recall === bestStats.recall && stats.f1 > bestStats.f1
    const tieButLowerThreshold = stats.recall === bestStats.recall && stats.f1 === bestStats.f1 && threshold < bestThreshold

    if (betterRecall || tieButBetterF1 || tieButLowerThreshold) {
      bestThreshold = threshold
      bestStats = stats
    }
  }

  return {
    disorder,
    recommendedThreshold: bestThreshold,
    recall: toPercent(bestStats.recall),
    specificity: toPercent(bestStats.specificity),
    precision: toPercent(bestStats.precision),
    f1: toPercent(bestStats.f1),
    tp: bestStats.tp,
    fp: bestStats.fp,
    tn: bestStats.tn,
    fn: bestStats.fn,
  }
}

export function tuneThresholds(outcomes: PilotOutcome[], minSpecificityPercent: number): { minSpecificityPercent: number; dyslexia: TuningResult; dyscalculia: TuningResult } {
  return {
    minSpecificityPercent,
    dyslexia: tuneForDisorder(outcomes, 'dyslexia', minSpecificityPercent),
    dyscalculia: tuneForDisorder(outcomes, 'dyscalculia', minSpecificityPercent),
  }
}
