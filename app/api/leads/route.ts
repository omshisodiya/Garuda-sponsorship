import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllLeads, getLeadsByAssignee, createLead } from "@/app/lib/server/leadStore"
import { addAudit } from "@/app/lib/server/store"
import type { Lead } from "@/app/lib/data"

export async function GET(_req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const leads = session.role === "team"
    ? getLeadsByAssignee(session.sub)
    : getAllLeads()

  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role === "team") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  let body: Omit<Lead, "id" | "created_at">
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  if (!body.company?.trim()) return NextResponse.json({ error: "Company name is required" }, { status: 400 })

  const lead = createLead({ ...body, created_by: session.sub as Lead["created_by"] })
  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "lead_created",
    target_id:  lead.id,
    detail:     `Added lead: ${lead.company}`,
  })
  return NextResponse.json({ lead }, { status: 201 })
}
