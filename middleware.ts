// middleware.ts 
import { NextRequest, NextResponse } from 'next/server'

// Rate limiting en memoria — sin dependencias externas
const requestCounts = new Map<string, { count: number; resetAt: number }>()

const RATE_LIMITS: Record<string, { max: number; windowMs: number }> = {
  '/api/classify': { max: 10,  windowMs: 60_000 },
  '/api/report':   { max: 20,  windowMs: 60_000 },
  '/api/lugares':  { max: 100, windowMs: 60_000 },
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  )
}

function isRateLimited(ip: string, path: string): boolean {
  const limitKey = Object.keys(RATE_LIMITS).find(k => path.startsWith(k))
  if (!limitKey) return false

  const { max, windowMs } = RATE_LIMITS[limitKey]
  const key   = `${ip}:${limitKey}`
  const now   = Date.now()
  const entry = requestCounts.get(key)

  if (!entry || now > entry.resetAt) {
    requestCounts.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }

  entry.count++
  return entry.count > max
}

function hasSQLInjection(req: NextRequest): boolean {
  const params = req.nextUrl.searchParams.toString()
  const sqlPatterns = [
    /(\bOR\b|\bAND\b)\s+\d+=\d+/i,
    /UNION\s+SELECT/i,
    /DROP\s+TABLE/i,
    /INSERT\s+INTO/i,
    /DELETE\s+FROM/i,
    /;\s*--/,
    /xp_cmdshell/i,
  ]
  return sqlPatterns.some(p => p.test(params))
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname

  if (!path.startsWith('/api/')) return NextResponse.next()

  const ip = getIP(req)

  if (hasSQLInjection(req)) {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 })
  }

  if (isRateLimited(ip, path)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta en un momento.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const res = NextResponse.next()
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return res
}

export const config = {
  matcher: [
    '/api/classify/:path*',
    '/api/report/:path*',
    '/api/lugares/:path*',
  ],
    }
