import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllLeads } from "@/app/lib/server/leadStore"
import { getAllUsersXP } from "@/app/lib/server/missionStore"
import { getLeaderboardReset, getXpPenalty, getAllUsers } from "@/app/lib/server/store"
import { TEAM } from "@/app/lib/data"
import type { Lead } from "@/app/lib/data"

function xpForLead(lead: Lead): number {
  if (lead.status === "confirmed") {
    if (lead.deal_value >= 150000) return 400
    if (lead.deal_value >= 95000)  return 300
    if (lead.deal_value > 0)       return 200
    return 100
  }
  if (lead.status === "in_discussion") return 75
  if (lead.status === "followed_up")   return 50
  if (lead.status === "contacted")     return 30
  return 0
}

// Derive initials from a name string
function initials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 3).map(w => w[0].toUpperCase()).join("")
}

// Stable color from a string (same palette as missions page)
const PALETTE = [
  "#60A5FA","#A78BFA","#4ADE80","#F472B6","#FB923C","#34D399","#F87171",
  "#818CF8","#FBBF24","#22D3EE","#E879F9","#6EE7B7","#FCA5A5","#93C5FD",
  "#FDE68A","#DDD6FE","#67E8F9","#FCD34D","#C9A24B","#FBBF24",
]
function stableColor(id: string): string {
  const h = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTE[h % PALETTE.length]
}

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const [leads, dbUsers, xpMap, resetData, penaltyPct] = await Promise.all([
    getAllLeads(), getAllUsers(), getAllUsersXP(), getLeaderboardReset(), getXpPenalty(),
  ])

  // Name→TEAM entry lookup for color/initials override
  const teamByName = new Map(TEAM.map(m => [m.name.toLowerCase().trim(), m]))

  const multiplier = 1 - penaltyPct / 100

  const ranked = dbUsers
    .filter(u => u.role !== "superadmin")
    .map(u => {
      const nameLower  = u.name.toLowerCase().trim()
      const teamMember = teamByName.get(nameLower)
      const mLeads     = leads.filter(l => l.assigned_to === u.id)
      const leadXp     = mLeads.reduce((s, l) => s + xpForLead(l), 0)
      const missionXp  = xpMap[u.id] ?? 0
      const xp         = Math.floor((leadXp + missionXp) * multiplier)
      return {
        id:        u.id,
        name:      u.name,
        initials:  teamMember?.initials ?? initials(u.name),
        color:     teamMember?.color    ?? stableColor(u.id),
        role:      u.role,
        xp,
        leadXp,
        missionXp,
      }
    })
    .sort((a, b) => b.xp - a.xp)

  return NextResponse.json({ ranked, resetMessage: resetData.message, resetAt: resetData.resetAt })
}
