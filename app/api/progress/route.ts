import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllLeads } from "@/app/lib/server/leadStore"
import { getAllUsers } from "@/app/lib/server/store"
import { getIntakeTargets } from "@/app/lib/server/intakeStore"
import { db, type Row } from "@/app/lib/server/db"
import { TEAM } from "@/app/lib/data"

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")
}
const PALETTE = [
  "#60A5FA","#A78BFA","#4ADE80","#F472B6","#FB923C","#34D399","#F87171",
  "#818CF8","#FBBF24","#22D3EE","#E879F9","#6EE7B7","#FCA5A5","#93C5FD",
]
function stableColor(id: string) {
  const h = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTE[h % PALETTE.length]
}

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [allLeads, allUsers, targets] = await Promise.all([getAllLeads(), getAllUsers(), getIntakeTargets()])

  // Fetch all intake rows (status + submitted_by)
  let intakeRows: Row[] = []
  try {
    intakeRows = await db()`SELECT submitted_by, status FROM garuda_intake`
  } catch { intakeRows = [] }

  const teamByName = new Map(TEAM.map(m => [m.name.toLowerCase().trim(), m]))

  // Which users to include
  const targets = session.role === "team"
    ? allUsers.filter(u => u.id === session.sub)
    : allUsers.filter(u => u.role !== "superadmin")

  const stats = targets.map(u => {
    const nameLower  = u.name.toLowerCase().trim()
    const teamMember = teamByName.get(nameLower)

    // Intake stats
    const myIntake = intakeRows.filter(r => String(r.submitted_by) === u.id)
    const intakeTotal      = myIntake.length
    const intakeNew        = myIntake.filter(r => r.status === "new").length
    const intakeWorking    = myIntake.filter(r => r.status === "working").length
    const intakeDead       = myIntake.filter(r => r.status === "dead").length
    const intakeGraduated  = myIntake.filter(r => r.status === "graduated").length

    // Lead assignment stats
    const myLeads = allLeads.filter(l => l.assigned_to === u.id)
    const leadsTotal       = myLeads.length
    const leadsNotStarted  = myLeads.filter(l => l.status === "not_started").length
    const leadsContacted   = myLeads.filter(l => l.status === "contacted").length
    const leadsFollowedUp  = myLeads.filter(l => l.status === "followed_up").length
    const leadsInDiscussion = myLeads.filter(l => l.status === "in_discussion").length
    const leadsConfirmed   = myLeads.filter(l => l.status === "confirmed").length
    const leadsRejected    = myLeads.filter(l => l.status === "rejected").length
    const leadsWorked = leadsTotal - leadsNotStarted

    // XP from intake
    const intakeXp = myIntake.reduce((s, r) => s + (r.status === "graduated" ? 25 : 10), 0)

    return {
      id:              u.id,
      name:            u.name,
      role:            u.role,
      intakeTarget:    targets[u.id] ?? 0,
      initials:        teamMember?.initials ?? initials(u.name),
      color:           teamMember?.color    ?? stableColor(u.id),
      intakeTotal,
      intakeNew,
      intakeWorking,
      intakeDead,
      intakeGraduated,
      intakeXp,
      leadsTotal,
      leadsNotStarted,
      leadsContacted,
      leadsFollowedUp,
      leadsInDiscussion,
      leadsConfirmed,
      leadsRejected,
      leadsWorked,
    }
  })

  return NextResponse.json({ stats })
}
