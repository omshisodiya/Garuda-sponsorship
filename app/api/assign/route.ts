import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllLeads, updateLead } from "@/app/lib/server/leadStore"
import { getAllUsers, addAudit } from "@/app/lib/server/store"
import { sendUserNotification } from "@/app/lib/server/notify"

const LEGACY_CUTOFF = "2026-05-18"

// How many leads each role gets relative to team members.
// team=1.0 (full), admin=0.35 (gets some, fewer than team), superadmin=0 (no leads).
const ROLE_WEIGHT: Record<string, number> = {
  team:       1.0,
  admin:      0.35,
  superadmin: 0,
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "admin" && session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let leadView: "new" | "old" = "new"
  try {
    const body = await req.json()
    if (body.leadView === "old") leadView = "old"
  } catch { /* default to new */ }

  const [allLeads, allUsers] = await Promise.all([getAllLeads(), getAllUsers()])

  // Only unassigned leads in the current view (exclude terminal statuses)
  const unassigned = allLeads.filter(l =>
    l.assigned_to === null &&
    !["confirmed", "rejected"].includes(l.status) &&
    (leadView === "new" ? l.created_at >= LEGACY_CUTOFF : l.created_at < LEGACY_CUTOFF)
  )

  if (unassigned.length === 0) {
    return NextResponse.json({ assignments: [], total: 0, message: "No unassigned leads in this view" })
  }

  // Eligible members: active users with weight > 0 (excludes superadmin)
  const eligible = allUsers
    .filter(u => u.status === "active" && (ROLE_WEIGHT[u.role] ?? 0) > 0)
    .map(u => ({
      id:          u.id,
      name:        u.name,
      role:        u.role,
      weight:      ROLE_WEIGHT[u.role] ?? 0,
      currentLoad: allLeads.filter(l => l.assigned_to === u.id).length,
    }))

  if (eligible.length === 0) {
    return NextResponse.json({ error: "No eligible assignees (need at least one active admin or team member)" }, { status: 400 })
  }

  // Weighted proportional distribution
  // Each user gets: floor(total * weight / totalWeight) leads.
  // Any remainder leads go to the least-loaded users.
  const totalWeight = eligible.reduce((s, u) => s + u.weight, 0)
  const quotas      = eligible.map(u => ({
    ...u,
    quota: Math.floor(unassigned.length * u.weight / totalWeight),
  }))

  const allocated   = quotas.reduce((s, u) => s + u.quota, 0)
  const remainder   = unassigned.length - allocated

  // Sort by (currentLoad asc, weight desc) for remainder distribution
  const sorted = [...quotas].sort((a, b) =>
    a.currentLoad !== b.currentLoad ? a.currentLoad - b.currentLoad : b.weight - a.weight
  )
  for (let i = 0; i < remainder; i++) sorted[i % sorted.length].quota++

  // Build assignments, honouring the same sort order (least-loaded first)
  const assignments: { leadId: string; userId: string; userName: string; company: string }[] = []
  let idx = 0
  for (const user of sorted) {
    for (let i = 0; i < user.quota && idx < unassigned.length; i++, idx++) {
      const lead = unassigned[idx]
      assignments.push({ leadId: lead.id, userId: user.id, userName: user.name, company: lead.company })
    }
  }

  // Persist all assignments in parallel
  await Promise.all(
    assignments.map(({ leadId, userId }) =>
      updateLead(leadId, {
        assigned_to:      userId,
        assigned_by:      session.sub,
        assigned_by_role: session.role,
      })
    )
  )

  addAudit({
    actor_id:   session.sub,
    actor_name: session.name,
    action:     "leads_auto_distributed",
    target_id:  null,
    detail:     `Auto-distributed ${assignments.length} ${leadView} leads across ${eligible.length} member(s)`,
  })

  // Group by user for notifications + summary
  const byUser = new Map<string, { name: string; role: string; companies: string[] }>()
  for (const a of assignments) {
    if (!byUser.has(a.userId)) byUser.set(a.userId, { name: a.userName, role: "", companies: [] })
    byUser.get(a.userId)!.companies.push(a.company)
  }
  // Fill role from eligible list
  for (const u of eligible) {
    if (byUser.has(u.id)) byUser.get(u.id)!.role = u.role
  }

  // Notify each assignee (fire-and-forget — don't block response)
  void Promise.all(
    [...byUser.entries()].map(([userId, { companies }]) => {
      const count   = companies.length
      const preview = companies.slice(0, 3).join(", ") + (count > 3 ? ` +${count - 3} more` : "")
      return sendUserNotification(
        userId,
        `You've been assigned ${count} new lead${count > 1 ? "s" : ""}`,
        preview,
        "/leads",
        "info"
      )
    })
  )

  const summary = [...byUser.entries()].map(([userId, { name, role, companies }]) => ({
    userId,
    name,
    role,
    count: companies.length,
    companies,
  }))

  return NextResponse.json({ assignments: summary, total: assignments.length })
}
