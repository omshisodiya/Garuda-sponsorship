import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getLeadById, updateLead, deleteLead } from "@/app/lib/server/leadStore"
import { addAudit } from "@/app/lib/server/store"
import type { Lead } from "@/app/lib/data"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (session.role === "team" && lead.assigned_to !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ lead })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (session.role === "team" && lead.assigned_to !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: Partial<Lead>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // Team members cannot reassign leads
  if (session.role === "team") {
    delete body.assigned_to
  }

  // Strip immutable fields
  const { id: _id, created_at: _ca, created_by: _cb, ...safePatch } =
    body as Partial<Lead> & { id?: string; created_at?: string; created_by?: string }

  // If reassigning, enforce superadmin lock and tag who is assigning
  if ('assigned_to' in safePatch && safePatch.assigned_to !== lead.assigned_to) {
    if (lead.assigned_by_role === "superadmin" && session.role !== "superadmin") {
      return NextResponse.json(
        { error: "This assignment was locked by a Superadmin and cannot be changed." },
        { status: 403 }
      )
    }
    ;(safePatch as Record<string, unknown>).assigned_by      = session.sub
    ;(safePatch as Record<string, unknown>).assigned_by_role = session.role
  }

  const updated = await updateLead(id, safePatch)
  if (!updated) return NextResponse.json({ error: "Update failed" }, { status: 500 })

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "lead_updated",
    target_id:  id,
    detail:     `Updated ${lead.company}: ${Object.keys(safePatch).join(", ")}`,
  })

  return NextResponse.json({ lead: updated })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "superadmin" && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const lead = await getLeadById(id)
  if (!lead) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await deleteLead(id)
  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "lead_deleted",
    target_id:  id,
    detail:     `Deleted lead: ${lead.company}`,
  })
  return NextResponse.json({ ok: true })
}
