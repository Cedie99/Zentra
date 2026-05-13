import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { rateLimit } from '@/lib/utils/rate-limit'

// Rate limit configs per route group
const AUTH_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 }   // 10 per 15 min
const API_LIMIT  = { maxRequests: 60, windowMs: 60 * 1000 }        // 60 per minute
const ANALYSIS_LIMIT = { maxRequests: 5, windowMs: 60 * 1000 }     // 5 per minute

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  // Rate limit auth endpoints aggressively (login, signup)
  if (pathname.startsWith('/api/auth/signup') || pathname === '/api/auth/callback/credentials') {
    const result = rateLimit(`auth:${ip}`, AUTH_LIMIT)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  // Rate limit analysis endpoint (expensive operation)
  if (pathname === '/api/analysis' && request.method === 'POST') {
    const result = rateLimit(`analysis:${ip}`, ANALYSIS_LIMIT)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many analysis requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  // General API rate limit
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/webhooks/')) {
    const result = rateLimit(`api:${ip}`, API_LIMIT)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
