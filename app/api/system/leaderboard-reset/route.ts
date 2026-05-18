import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getLeaderboardReset, setLeaderboardReset, addAudit } from "@/app/lib/server/store"
import { resetLeaderboard } from "@/app/lib/server/missionStore"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const data = await getLeaderboardReset()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { message?: string }
  try { body = await req.json() } catch { body = {} }

  await Promise.all([
    resetLeaderboard(),
    setLeaderboardReset(body.message ?? ""),
  ])

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "leaderboard_reset",
    target_id:  null,
    detail:     body.message
      ? `Leaderboard reset with message: "${body.message}"`
      : "Leaderboard reset (no message)",
  })

  return NextResponse.json({ ok: true })
}
