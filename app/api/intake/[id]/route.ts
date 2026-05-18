import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getIntakeLeadById, updateIntakeStatus, deleteIntakeLead } from "@/app/lib/server/intakeStore"
import { addAudit } from "@/app/lib/server/store"
import type { IntakeStatus } from "@/app/lib/server/intakeStore"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { id } = await params
  const lead = await getIntakeLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (session.role === "team" && lead.submitted_by !== session.sub)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: { status: IntakeStatus }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const allowed: IntakeStatus[] = ["new", "working", "dead"]
  if (!allowed.includes(body.status))
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })

  const updated = await updateIntakeStatus(id, body.status)
  return NextResponse.json({ ok: true, lead: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getSessionFromCookies()
  if (!session || session.role === "team")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const lead = await getIntakeLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await deleteIntakeLead(id)

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "intake_deleted",
    target_id:  id,
    detail:     `Deleted intake lead: ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
  })

  return NextResponse.json({ ok: true })
}
