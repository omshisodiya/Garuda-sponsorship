import { NextResponse } from "next/server"
import { getSessionFromCookies, clearSessionCookie } from "@/app/lib/server/auth"
import { addAudit } from "@/app/lib/server/store"

export async function POST() {
  const session = await getSessionFromCookies()
  if (session) {
    addAudit({
      actor_id:   session.sub,
      actor_name: session.name,
      action:     "logout",
      target_id:  null,
      detail:     "User logged out",
    })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearSessionCookie())
  return res
}
