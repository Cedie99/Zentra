import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storeSlug = process.env.LEMONSQUEEZY_STORE_SLUG
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutUrl = new URL(`https://${storeSlug}.lemonsqueezy.com/buy/${variantId}`)
  checkoutUrl.searchParams.set('checkout[email]', session.user.email ?? '')
  checkoutUrl.searchParams.set('checkout[custom][user_id]', session.user.id)
  checkoutUrl.searchParams.set('checkout[redirect_url]', `${appUrl}/dashboard?upgraded=1`)

  return NextResponse.json({ url: checkoutUrl.toString() })
}
