import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { changePassword, addAudit } from "@/app/lib/server/store"

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { password: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  if (!body.password || body.password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 })
  }

  const updated = await changePassword(session.sub, body.password)
  if (!updated) return NextResponse.json({ error: "User not found" }, { status: 404 })

  await addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "password_changed",
    target_id:  session.sub,
    detail:     "User set new password via forced reset flow",
  })

  return NextResponse.json({ ok: true })
}
