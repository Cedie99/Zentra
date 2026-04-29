import type { AnalysisSection } from './engine'

export interface ScoreResult {
  total: number
  label: string
  color: string
  criticalCount: number
  warningCount: number
  infoCount: number
}

const CRITICAL_DEDUCTION = 8
const WARNING_DEDUCTION = 3
const INFO_DEDUCTION = 0.5
const MAX_CRITICAL_PER_CATEGORY = 30
const MAX_WARNING_PER_CATEGORY = 12

export function calculateScore(sections: AnalysisSection[]): ScoreResult {
  let score = 100
  let criticalCount = 0
  let warningCount = 0
  let infoCount = 0

  for (const section of sections) {
    const criticals = section.issues.filter((i) => i.severity === 'CRITICAL').length
    const warnings = section.issues.filter((i) => i.severity === 'WARNING').length
    const infos = section.issues.filter((i) => i.severity === 'INFO').length

    criticalCount += criticals
    warningCount += warnings
    infoCount += infos

    const categoryDeduction = Math.min(criticals * CRITICAL_DEDUCTION, MAX_CRITICAL_PER_CATEGORY) +
                              Math.min(warnings * WARNING_DEDUCTION, MAX_WARNING_PER_CATEGORY) +
                              infos * INFO_DEDUCTION

    score -= categoryDeduction
  }

  score = Math.max(0, Math.round(score))

  let label: string
  let color: string

  if (score >= 80) {
    label = 'Production Ready'
    color = 'green'
  } else if (score >= 60) {
    label = 'Needs Attention'
    color = 'yellow'
  } else if (score >= 40) {
    label = 'Significant Issues'
    color = 'orange'
  } else {
    label = 'Not Production Ready'
    color = 'red'
  }

  return { total: score, label, color, criticalCount, warningCount, infoCount }
}
