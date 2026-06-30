// middleware.ts
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests/minuto
})

export async function middleware(req: NextRequest) {
  const ip = req.ip ?? "anonymous"
  const { success } = await ratelimit.limit(ip)
  if (!success) return NextResponse.json(
    { error: "Too many requests" }, { status: 429 }
  )
}

export const config = {
  matcher: ["/api/report/:path*", "/api/classify/:path*"]
}
