import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getLeadById, flagLead, unflagLead } from "@/app/lib/server/leadStore"
import { addAudit } from "@/app/lib/server/store"
import type { FlagType } from "@/app/lib/data"

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // superadmin can flag any lead; admin/team can only flag their own assigned lead
  if (session.role !== "superadmin" && lead.assigned_to !== session.sub) {
    return NextResponse.json({ error: "Forbidden — you can only flag your own leads" }, { status: 403 })
  }

  let body: { flag_type: FlagType; flag_note?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  if (!["wrong_details", "no_reply"].includes(body.flag_type)) {
    return NextResponse.json({ error: "Invalid flag_type" }, { status: 400 })
  }

  const updated = await flagLead(id, body.flag_type, body.flag_note ?? "", session.sub)
  if (!updated) return NextResponse.json({ error: "Flag failed" }, { status: 500 })

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "lead_flagged",
    target_id:  id,
    detail:     `Flagged ${lead.company} as ${body.flag_type}`,
  })

  return NextResponse.json({ lead: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Only superadmin can remove any flag; others can only remove flags they set
  if (session.role !== "superadmin" && lead.flagged_by !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await unflagLead(id)
  if (!updated) return NextResponse.json({ error: "Unflag failed" }, { status: 500 })

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "lead_unflagged",
    target_id:  id,
    detail:     `Removed flag from ${lead.company}`,
  })

  return NextResponse.json({ lead: updated })
}
