import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getXpPenalty, setXpPenalty, addAudit } from "@/app/lib/server/store"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const percent = await getXpPenalty()
  return NextResponse.json({ percent })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { percent: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const clamped = Math.min(100, Math.max(0, Math.round(body.percent)))
  await setXpPenalty(clamped)

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "xp_penalty_set",
    target_id:  null,
    detail:     `Global XP adjustment set to ${clamped}% reduction`,
  })

  return NextResponse.json({ ok: true, percent: clamped })
}
