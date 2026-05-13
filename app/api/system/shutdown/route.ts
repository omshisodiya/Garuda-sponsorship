import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { setSiteShutdown, getSiteShutdown } from "@/app/lib/server/store"
import { addAudit } from "@/app/lib/server/store"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const state = await getSiteShutdown()
  return NextResponse.json(state)
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { enabled: boolean; message?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  await setSiteShutdown(body.enabled, body.message ?? "")

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     body.enabled ? "site_shutdown_on" : "site_shutdown_off",
    target_id:  null,
    detail:     body.enabled
      ? `Site shut down${body.message ? ` with message: "${body.message}"` : ""}`
      : "Site brought back online",
  })

  return NextResponse.json({ ok: true, enabled: body.enabled })
}
