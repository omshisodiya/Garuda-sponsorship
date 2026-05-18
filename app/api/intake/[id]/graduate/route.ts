import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getIntakeLeadById, graduateIntakeLead } from "@/app/lib/server/intakeStore"
import { createLead } from "@/app/lib/server/leadStore"
import { addAudit } from "@/app/lib/server/store"

type Params = { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getSessionFromCookies()
  if (!session || session.role === "team")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const intake = await getIntakeLeadById(id)
  if (!intake) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (intake.status === "graduated")
    return NextResponse.json({ error: "Already graduated" }, { status: 400 })

  const today = new Date().toISOString().split("T")[0]

  const lead = await createLead({
    company:       intake.company || intake.name,
    poc_name:      intake.name,
    poc_email:     intake.email,
    poc_phone:     intake.phone,
    category:      "FMCG",
    status:        "not_started",
    stage:         "prospect",
    assigned_to:   null,
    deal_value:    75000,
    probability:   25,
    notes:         intake.notes || `Submitted by ${intake.submitted_by_name}`,
    last_activity: today,
    created_by:    session.sub,
    screenshots:   {},
    flag_type:     null,
    flag_note:     "",
    flagged_by:    null,
    flagged_at:    "",
  })

  await graduateIntakeLead(id, lead.id)

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "intake_graduated",
    target_id:  lead.id,
    detail:     `Graduated "${intake.name}" to Lead Vault as ${lead.company}`,
  })

  return NextResponse.json({ ok: true, lead })
}
