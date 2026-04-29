import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { createOctokit, listUserRepos } from '@/lib/github/client'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user?.githubToken) {
    return NextResponse.json({ error: 'No GitHub token found' }, { status: 400 })
  }

  try {
    const octokit = createOctokit(user.githubToken)
    const repos = await listUserRepos(octokit)
    return NextResponse.json({ repos })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 })
  }
}
