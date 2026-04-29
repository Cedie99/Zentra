import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET() {
  try {
    const reports = await prisma.analysisReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        repository: true,
        sections: {
          orderBy: { order: 'asc' },
          include: {
            issues: {
              orderBy: [{ severity: 'asc' }],
            },
          },
        },
      },
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Failed to fetch reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}
