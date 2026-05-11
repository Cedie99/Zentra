import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/db/client'

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  hmac.update(rawBody)
  const digest = hmac.digest('hex')
  try {
    return timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(signature, 'hex'))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET ?? ''

  if (!verifySignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventName = payload.meta && typeof payload.meta === 'object'
    ? (payload.meta as Record<string, unknown>).event_name as string
    : ''
  const data = payload.data as Record<string, unknown> | undefined
  const meta = payload.meta as Record<string, unknown> | undefined

  switch (eventName) {
    case 'subscription_created':
    case 'subscription_resumed': {
      const customData = meta?.custom_data as Record<string, string> | undefined
      const userId = customData?.user_id
      if (!userId) break

      const attrs = data?.attributes as Record<string, unknown> | undefined
      const subscriptionId = String(data?.id ?? '')
      const customerId = String(attrs?.customer_id ?? '')

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: 'PRO',
          lemonSqueezySubscriptionId: subscriptionId,
          lemonSqueezyCustomerId: customerId,
        },
      })
      break
    }

    case 'subscription_updated': {
      const customData = meta?.custom_data as Record<string, string> | undefined
      const userId = customData?.user_id
      if (!userId) break

      const attrs = data?.attributes as Record<string, unknown> | undefined
      const status = attrs?.status as string | undefined
      const subscriptionId = String(data?.id ?? '')
      const customerId = String(attrs?.customer_id ?? '')

      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: status === 'active' ? 'PRO' : 'FREE',
          lemonSqueezySubscriptionId: subscriptionId,
          lemonSqueezyCustomerId: customerId,
        },
      })
      break
    }

    case 'subscription_cancelled': {
      // No immediate action — user retains access until period ends
      break
    }

    case 'subscription_expired': {
      const subscriptionId = String(data?.id ?? '')
      if (!subscriptionId) break

      await prisma.user.update({
        where: { lemonSqueezySubscriptionId: subscriptionId },
        data: { plan: 'FREE' },
      })
      break
    }

    default:
      // Unhandled event — return 200 to prevent LS retries
      break
  }

  return NextResponse.json({ received: true })
}
