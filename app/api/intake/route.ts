import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllIntakeLeads, getIntakeBySubmitter, createIntakeLeads } from "@/app/lib/server/intakeStore"
import { addAudit } from "@/app/lib/server/store"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const leads = session.role === "team"
    ? await getIntakeBySubmitter(session.sub)
    : await getAllIntakeLeads()

  return NextResponse.json({ leads })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { leads: Array<{ name: string; company?: string; phone?: string; email?: string; notes?: string }> }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  if (!Array.isArray(body.leads) || body.leads.length === 0)
    return NextResponse.json({ error: "No leads provided" }, { status: 400 })

  if (body.leads.length > 200)
    return NextResponse.json({ error: "Max 200 leads per submission" }, { status: 400 })

  const valid = body.leads.filter(l => typeof l.name === "string" && l.name.trim())
  if (valid.length === 0)
    return NextResponse.json({ error: "All leads must have a name" }, { status: 400 })

  const count = await createIntakeLeads(valid.map(l => ({
    name:              l.name.trim(),
    company:           l.company?.trim() ?? "",
    phone:             l.phone?.trim() ?? "",
    email:             l.email?.trim() ?? "",
    notes:             l.notes?.trim() ?? "",
    submitted_by:      session.sub,
    submitted_by_name: session.name,
  })))

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "intake_submitted",
    target_id:  null,
    detail:     `Submitted ${count} lead${count !== 1 ? "s" : ""} to intake queue`,
  })

  return NextResponse.json({ ok: true, count })
}
