import { CLUB, type Lead } from "../data"
import SEED_JSON from "./seedLeads.json"
const SEED_LEADS = SEED_JSON as unknown as Lead[]

declare global {
  var __garuda_leads: Lead[] | undefined
}

const LEADS: Lead[] = globalThis.__garuda_leads ?? SEED_LEADS.map(l => ({ ...l }))
globalThis.__garuda_leads = LEADS

let _idCounter = LEADS.length

export function getAllLeads(): Lead[] {
  return LEADS
}

export function getLeadById(id: string): Lead | null {
  return LEADS.find(l => l.id === id) ?? null
}

export function getLeadsByAssignee(userId: string): Lead[] {
  return LEADS.filter(l => l.assigned_to === userId)
}

export function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "created_at" | "created_by">>
): Lead | null {
  const idx = LEADS.findIndex(l => l.id === id)
  if (idx === -1) return null
  LEADS[idx] = {
    ...LEADS[idx],
    ...patch,
    last_activity: new Date().toISOString().split("T")[0],
  }
  return LEADS[idx]
}

export function createLead(lead: Omit<Lead, "id" | "created_at">): Lead {
  _idCounter++
  const newLead: Lead = {
    ...lead,
    id: `L${String(_idCounter).padStart(3, "0")}`,
    created_at: new Date().toISOString().split("T")[0],
  }
  LEADS.push(newLead)
  return newLead
}

export function computeStats(leads: Lead[]) {
  const today = new Date()
  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(today.getDate() - 3)

  const confirmed    = leads.filter(l => l.status === "confirmed")
  const active       = leads.filter(l => !["rejected", "confirmed"].includes(l.status))
  const secured      = confirmed.reduce((s, l) => s + l.deal_value, 0)
  const pipeline     = active.reduce((s, l) => s + (l.deal_value * l.probability / 100), 0)
  const contacted    = leads.filter(l => ["contacted", "in_discussion", "confirmed"].includes(l.status))
  const inDiscussion = leads.filter(l => l.status === "in_discussion")
  const won          = leads.filter(l => l.stage === "won")
  const qualified    = leads.filter(l => ["qualified", "proposal", "negotiation", "won"].includes(l.stage))
  const conversionRate = qualified.length > 0 ? Math.round((won.length / qualified.length) * 100) : 0
  const followUpsDue = leads.filter(l =>
    !["confirmed", "rejected"].includes(l.status) &&
    new Date(l.last_activity) < threeDaysAgo
  )

  return {
    total:          leads.length,
    assigned:       leads.filter(l => l.assigned_to !== null).length,
    unassigned:     leads.filter(l => l.assigned_to === null).length,
    contacted:      contacted.length,
    inDiscussion:   inDiscussion.length,
    confirmed:      confirmed.length,
    pipeline:       Math.round(pipeline),
    secured,
    target:         CLUB.target,
    progressPct:    Math.round((secured / CLUB.target) * 100),
    pipelinePct:    Math.round(((secured + pipeline) / CLUB.target) * 100),
    conversionRate,
    followUpsDue:   followUpsDue.length,
  }
}
