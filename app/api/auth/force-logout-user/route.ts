import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { setForceLogout, addAudit } from "@/app/lib/server/store"

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { userId, userName } = await req.json() as { userId: string; userName: string }
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  await setForceLogout(`force_logout_user_${userId}`)
  await addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "force_logout_user",
    target_id:  userId,
    detail:     `Force-logged out ${userName ?? userId}`,
  })

  return NextResponse.json({ ok: true })
}
