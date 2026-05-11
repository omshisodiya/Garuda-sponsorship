import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { setForceLogout, addAudit } from "@/app/lib/server/store"

export async function POST() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await setForceLogout("force_logout_all")
  await addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "force_logout_all",
    target_id:  null,
    detail:     "Force-logged out all active sessions",
  })

  return NextResponse.json({ ok: true })
}
