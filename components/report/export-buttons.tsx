'use client'

import { Lock, FileText, FileDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Report } from '@/app/(dashboard)/reports/[id]/page'

interface ExportButtonsProps {
  report: Report
  userPlan: 'FREE' | 'PRO'
}

function buildMarkdown(report: Report): string {
  const lines: string[] = []
  lines.push(`# Architecture Analysis: ${report.repository.fullName}`)
  lines.push('')
  lines.push(`**Health Score:** ${report.healthScore ?? 'N/A'} / 100`)
  lines.push(`**Files Analyzed:** ${report.filesAnalyzed}`)
  lines.push(`**Analyzed:** ${new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`)
  lines.push('')

  if (report.productionReadiness) {
    const pr = report.productionReadiness
    lines.push('## Production Readiness')
    lines.push('')
    lines.push(`**Verdict:** ${pr.verdict}`)
    lines.push(`**Confidence:** ${pr.confidence}%`)
    lines.push('')
    lines.push(pr.summary)
    lines.push('')
    if (pr.strengths.length > 0) {
      lines.push('### Strengths')
      pr.strengths.forEach((s) => lines.push(`- ${s}`))
      lines.push('')
    }
    if (pr.risks.length > 0) {
      lines.push('### Risks')
      pr.risks.forEach((r) => lines.push(`- ${r}`))
      lines.push('')
    }
    lines.push(`**Recommendation:** ${pr.recommendation}`)
    lines.push('')
  }

  if (report.aiSummary) {
    lines.push('## AI Summary')
    lines.push('')
    lines.push(report.aiSummary)
    lines.push('')
  }

  lines.push('## Issues by Category')
  lines.push('')
  for (const section of report.sections) {
    if (section.issueCount === 0) continue
    lines.push(`### ${section.title} (${section.severity})`)
    lines.push('')
    for (const issue of section.issues) {
      lines.push(`#### ${issue.title} — ${issue.severity}`)
      lines.push('')
      lines.push(issue.description)
      if (issue.filePath) lines.push(`\n**File:** \`${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''}\``)
      if (issue.evidence) lines.push(`\n**Evidence:** ${issue.evidence}`)
      lines.push(`\n**Suggestion:** ${issue.suggestion}`)
      if (issue.codeExample) {
        lines.push('')
        lines.push('```')
        lines.push(issue.codeExample)
        lines.push('```')
      }
      lines.push('')
    }
  }

  return lines.join('\n')
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportButtons({ report, userPlan }: ExportButtonsProps) {
  const router = useRouter()
  const slug = report.repository.fullName.replace('/', '-')

  function handleMarkdown() {
    if (userPlan !== 'PRO') {
      router.push('/pricing')
      return
    }
    const md = buildMarkdown(report)
    downloadBlob(md, `${slug}-analysis.md`, 'text/markdown')
  }

  async function handlePDF() {
    if (userPlan !== 'PRO') {
      router.push('/pricing')
      return
    }
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 40
    const maxWidth = pageWidth - margin * 2
    let y = 60

    function addText(text: string, fontSize: number, bold: boolean, color: [number, number, number] = [0, 0, 0]) {
      doc.setFontSize(fontSize)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(...color)
      const lines = doc.splitTextToSize(text, maxWidth)
      const lineHeight = fontSize * 1.4
      if (y + lines.length * lineHeight > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage()
        y = 60
      }
      doc.text(lines, margin, y)
      y += lines.length * lineHeight + 4
    }

    function spacer(px = 8) { y += px }

    addText(`Architecture Analysis: ${report.repository.fullName}`, 20, true)
    spacer()
    addText(`Health Score: ${report.healthScore ?? 'N/A'} / 100`, 12, false, [80, 80, 80])
    addText(`Files Analyzed: ${report.filesAnalyzed}`, 12, false, [80, 80, 80])
    addText(`Analyzed: ${new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, 12, false, [80, 80, 80])
    spacer(16)

    if (report.productionReadiness) {
      const pr = report.productionReadiness
      addText('Production Readiness', 16, true)
      spacer()
      addText(`Verdict: ${pr.verdict}  |  Confidence: ${pr.confidence}%`, 12, false)
      spacer(4)
      addText(pr.summary, 11, false, [60, 60, 60])
      spacer(4)
      if (pr.recommendation) addText(`Recommendation: ${pr.recommendation}`, 11, true)
      spacer(12)
    }

    if (report.aiSummary) {
      addText('AI Summary', 16, true)
      spacer()
      addText(report.aiSummary, 11, false, [60, 60, 60])
      spacer(12)
    }

    addText('Issues by Category', 16, true)
    spacer()

    for (const section of report.sections) {
      if (section.issueCount === 0) continue
      addText(`${section.title} (${section.severity})`, 13, true, [40, 40, 40])
      spacer(4)
      for (const issue of section.issues) {
        addText(`• ${issue.title} [${issue.severity}]`, 11, true)
        addText(issue.description, 10, false, [80, 80, 80])
        if (issue.filePath) addText(`File: ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ''}`, 10, false, [100, 100, 100])
        addText(`Suggestion: ${issue.suggestion}`, 10, false, [60, 80, 60])
        spacer(6)
      }
      spacer(8)
    }

    doc.save(`${slug}-analysis.pdf`)
  }

  const buttonBase = 'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors'
  const lockedStyle = `${buttonBase} border-border text-muted-foreground hover:border-amber-500/30 hover:text-foreground cursor-pointer`
  const activeStyle = `${buttonBase} border-border text-muted-foreground hover:border-amber-500/40 hover:text-foreground cursor-pointer`

  if (userPlan !== 'PRO') {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => router.push('/pricing')} className={lockedStyle} title="Pro feature — upgrade to export">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          Export Markdown
        </button>
        <button onClick={() => router.push('/pricing')} className={lockedStyle} title="Pro feature — upgrade to export">
          <Lock className="w-3.5 h-3.5 text-amber-500" />
          Export PDF
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleMarkdown} className={activeStyle}>
        <FileText className="w-3.5 h-3.5" />
        Export Markdown
      </button>
      <button onClick={handlePDF} className={activeStyle}>
        <FileDown className="w-3.5 h-3.5" />
        Export PDF
      </button>
    </div>
  )
}
