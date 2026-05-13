import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db/client'
import { rateLimit } from '@/lib/utils/rate-limit'

const VALID_CATEGORIES = ['BUG', 'FEATURE', 'IMPROVEMENT', 'OTHER'] as const
const MAX_MESSAGE_LENGTH = 2000
const FEEDBACK_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 } // 5 per hour

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Per-user rate limit to prevent spam
  const rl = rateLimit(`feedback:${session.user.id}`, FEEDBACK_LIMIT)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'You can only submit 5 feedback items per hour.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const category = typeof body.category === 'string' ? body.category : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!VALID_CATEGORIES.includes(category as typeof VALID_CATEGORIES[number])) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  if (!message || message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is required (max ${MAX_MESSAGE_LENGTH} characters)` },
      { status: 400 }
    )
  }

  await prisma.feedback.create({
    data: {
      userId: session.user.id,
      category: category as typeof VALID_CATEGORIES[number],
      message,
    },
  })

  return NextResponse.json({ success: true })
}
