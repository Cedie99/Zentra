import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/client'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const report = await prisma.analysisReport.findFirst({
      where: {
        repositoryId: id,
      },
      orderBy: { createdAt: 'desc' },
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

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error('Failed to fetch report:', error)
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
  }
}
