import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAudit } from "@/app/lib/server/store"

export async function GET(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role === "team") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const url   = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 100)
  return NextResponse.json({ entries: await getAudit(limit) })
}
