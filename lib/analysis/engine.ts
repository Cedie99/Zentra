import type { FetchedFile } from '@/lib/github/file-fetcher'
import { cachingRules } from './rules/caching'
import { databaseRules } from './rules/database'
import { securityRules } from './rules/security'
import { errorHandlingRules } from './rules/error-handling'
import { scalabilityRules } from './rules/scalability'
import { architectureRules } from './rules/architecture'
import { deploymentRules } from './rules/deployment'

export type { FetchedFile }

export type SectionCategory =
  | 'CACHING'
  | 'DATABASE'
  | 'SECURITY'
  | 'ERROR_HANDLING'
  | 'SCALABILITY'
  | 'ARCHITECTURE'
  | 'DEPLOYMENT'

export interface RuleMatch {
  ruleId: string
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  filePath: string
  lineNumber?: number
  evidence: string
  suggestion: string
  codeExample?: string
  category: SectionCategory
}

export interface AnalysisRule {
  id: string
  category: SectionCategory
  title: string
  description: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  suggestion: string
  codeExample?: string
  detect(files: FetchedFile[]): RuleMatch[]
}

export interface AnalysisSection {
  category: SectionCategory
  title: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  issues: RuleMatch[]
  order: number
}

const SECTION_ORDER: Record<SectionCategory, number> = {
  SECURITY: 0,
  DATABASE: 1,
  CACHING: 2,
  ERROR_HANDLING: 3,
  SCALABILITY: 4,
  ARCHITECTURE: 5,
  DEPLOYMENT: 6,
}

const SECTION_TITLES: Record<SectionCategory, string> = {
  SECURITY: 'Security',
  DATABASE: 'Database',
  CACHING: 'Caching',
  ERROR_HANDLING: 'Error Handling',
  SCALABILITY: 'Scalability',
  ARCHITECTURE: 'Architecture',
  DEPLOYMENT: 'Deployment',
}

function getSectionSeverity(issues: RuleMatch[]): 'CRITICAL' | 'WARNING' | 'INFO' {
  if (issues.some((i) => i.severity === 'CRITICAL')) return 'CRITICAL'
  if (issues.some((i) => i.severity === 'WARNING')) return 'WARNING'
  return 'INFO'
}

export function runAnalysis(files: FetchedFile[]): AnalysisSection[] {
  const allRules: AnalysisRule[] = [
    ...cachingRules,
    ...databaseRules,
    ...securityRules,
    ...errorHandlingRules,
    ...scalabilityRules,
    ...architectureRules,
    ...deploymentRules,
  ]

  const issuesByCategory: Record<SectionCategory, RuleMatch[]> = {
    CACHING: [],
    DATABASE: [],
    SECURITY: [],
    ERROR_HANDLING: [],
    SCALABILITY: [],
    ARCHITECTURE: [],
    DEPLOYMENT: [],
  }

  // Run rules in parallel for better performance
  const ruleResults = allRules.map((rule) => {
    try {
      const matches = rule.detect(files)
      return { category: rule.category, matches }
    } catch {
      return { category: rule.category, matches: [] }
    }
  })

  // Collect results
  for (const result of ruleResults) {
    issuesByCategory[result.category].push(...result.matches)
  }

  const sections: AnalysisSection[] = (Object.keys(issuesByCategory) as SectionCategory[]).map(
    (category) => ({
      category,
      title: SECTION_TITLES[category],
      severity: getSectionSeverity(issuesByCategory[category]),
      issues: issuesByCategory[category],
      order: SECTION_ORDER[category],
    })
  )

  return sections.sort((a, b) => a.order - b.order)
}
