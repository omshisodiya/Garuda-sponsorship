// Club Garuda — Dandiya Night 2026 Sponsorship Data
// All figures in Indian Rupees (paise-level stored as integers)

export const CLUB = {
  name: "Club Garuda",
  event: "Dandiya Night '26",
  university: "Manipal University Jaipur",
  email: "garuda.club@muj.manipal.edu",
  instagram: "@clubgaruda_muj",
  target: 500000,        // ₹5,00,000
  attendees: 3000,
  socialReach: 45000,
}

export const MIN_SPONSORSHIP_AMOUNT = 75000

export const TEAM = [
  { id: "u1",  name: "Om Shisodiya",          role: "Chairperson",          tier: "superadmin", color: "#C9A24B", initials: "OS" },
  { id: "u2",  name: "Vatsal Sharma",          role: "Vice Chairperson",     tier: "admin",      color: "#60A5FA", initials: "VS" },
  { id: "u3",  name: "Jivaansh Chandna",       role: "Head of Sponsorships", tier: "admin",      color: "#A78BFA", initials: "JC" },
  { id: "u4",  name: "Harshvardhan Singh",     role: "Operational Director", tier: "admin",      color: "#4ADE80", initials: "HS" },
  { id: "u5",  name: "Ridhi Sharma",           role: "Operational Director", tier: "team",       color: "#F472B6", initials: "RS" },
  { id: "u6",  name: "Rashiv Saran",           role: "Sponsorship Lead",     tier: "team",       color: "#FB923C", initials: "RSa" },
  { id: "u7",  name: "Reet Rahul Bhanushali",  role: "Outreach Executive",   tier: "team",       color: "#34D399", initials: "RRB" },
  { id: "u8",  name: "Inesh Goyal",            role: "Outreach Executive",   tier: "team",       color: "#F87171", initials: "IG" },
  { id: "u9",  name: "Anvi Singla",            role: "Partnerships Lead",    tier: "team",       color: "#818CF8", initials: "AS" },
  { id: "u10", name: "Kushagrah Singh",        role: "Partnerships Lead",    tier: "team",       color: "#FBBF24", initials: "KS" },
] as const

export type TeamMemberId = typeof TEAM[number]["id"]
export type TierName = "superadmin" | "admin" | "team"

export const CATEGORIES = ["FMCG", "Tech", "F&B", "Sports", "Lifestyle", "Automotive", "Finance", "EdTech", "Healthcare", "Media"] as const
export type Category = typeof CATEGORIES[number]

export type LeadStatus = "not_started" | "contacted" | "in_discussion" | "confirmed" | "rejected"
export type LeadStage  = "prospect" | "qualified" | "proposal" | "negotiation" | "won" | "lost"

export type Lead = {
  id: string
  company: string
  poc_name: string
  poc_email: string
  poc_phone: string
  category: Category
  status: LeadStatus
  stage: LeadStage
  assigned_to: TeamMemberId | null
  deal_value: number    // in rupees
  probability: number   // 0-100
  notes: string
  last_activity: string // ISO date
  created_at: string
  created_by: TeamMemberId
}

export const LEADS: Lead[] = []

// ── COMPUTED STATS ──
export function getStats() {
  const confirmed = LEADS.filter(l => l.status === "confirmed")
  const active    = LEADS.filter(l => !["rejected", "confirmed"].includes(l.status))
  const secured   = confirmed.reduce((s, l) => s + l.deal_value, 0)
  const pipeline  = active.reduce((s, l) => s + (l.deal_value * l.probability / 100), 0)
  const contacted = LEADS.filter(l => ["contacted","in_discussion","confirmed"].includes(l.status))
  const inDiscussion = LEADS.filter(l => l.status === "in_discussion")
  const won = LEADS.filter(l => l.stage === "won")
  const qualified = LEADS.filter(l => ["qualified","proposal","negotiation","won"].includes(l.stage))
  const conversionRate = qualified.length > 0 ? Math.round((won.length / qualified.length) * 100) : 0

  return {
    total:          LEADS.length,
    assigned:       LEADS.filter(l => l.assigned_to !== null).length,
    contacted:      contacted.length,
    inDiscussion:   inDiscussion.length,
    confirmed:      confirmed.length,
    pipeline:       Math.round(pipeline),
    secured,
    target:         CLUB.target,
    progressPct:    Math.round((secured / CLUB.target) * 100),
    pipelinePct:    Math.round(((secured + pipeline) / CLUB.target) * 100),
    conversionRate,
    unassigned:     LEADS.filter(l => l.assigned_to === null).length,
  }
}

// ── MONTHLY TREND ──
export const MONTHLY_REVENUE = [
  { month: "Jan", secured: 0,      pipeline: 75000  },
  { month: "Feb", secured: 0,      pipeline: 95000  },
  { month: "Mar", secured: 75000,  pipeline: 150000 },
  { month: "Apr", secured: 150000, pipeline: 245000 },
  { month: "May", secured: 0,      pipeline: 320000 },
  { month: "Jun", secured: 0,      pipeline: 500000 },
]

// ── CATEGORY DISTRIBUTION ──
export const CATEGORY_DIST = CATEGORIES.map(cat => ({
  name: cat,
  value: LEADS.filter(l => l.category === cat).length,
  revenue: LEADS.filter(l => l.category === cat).reduce((s, l) => s + l.deal_value, 0),
})).filter(c => c.value > 0)

// ── STAGE PIPELINE ──
export const STAGE_DIST = [
  { stage: "Prospect",     count: LEADS.filter(l => l.stage === "prospect").length,    fill: "#6E695F" },
  { stage: "Qualified",    count: LEADS.filter(l => l.stage === "qualified").length,   fill: "#60A5FA" },
  { stage: "Proposal",     count: LEADS.filter(l => l.stage === "proposal").length,    fill: "#A78BFA" },
  { stage: "Negotiation",  count: LEADS.filter(l => l.stage === "negotiation").length, fill: "#F59E0B" },
  { stage: "Won",          count: LEADS.filter(l => l.stage === "won").length,         fill: "#4ADE80" },
  { stage: "Lost",         count: LEADS.filter(l => l.stage === "lost").length,        fill: "#F43F5E" },
]

// ── TEAM PERFORMANCE ──
export function getTeamStats() {
  return TEAM.filter(m => m.tier !== "superadmin").map(member => {
    const myLeads   = LEADS.filter(l => l.assigned_to === member.id)
    const confirmed = myLeads.filter(l => l.status === "confirmed")
    const active    = myLeads.filter(l => !["rejected"].includes(l.status))
    const secured   = confirmed.reduce((s, l) => s + l.deal_value, 0)
    return {
      ...member,
      totalLeads:  myLeads.length,
      active:      active.length,
      confirmed:   confirmed.length,
      secured,
      pipeline:    active.reduce((s, l) => s + (l.deal_value * l.probability / 100), 0),
    }
  })
}

// ── ALERTS ──
export const ALERTS = [
  { id: "a1", severity: "critical" as const, title: "Negotiation Deadline: Red Bull India", desc: "Deal deadline in 48 hours. Escalate if no response.", lead: "L001", time: "2 hours ago", ack: false },
  { id: "a2", severity: "warning"  as const, title: "Stalled Lead: Zomato", desc: "No activity for 7 days. Follow-up overdue.", lead: "L006", time: "5 hours ago", ack: false },
  { id: "a3", severity: "warning"  as const, title: "Follow-up Overdue: Samsung India", desc: "No contact made since lead was created.", lead: "L014", time: "1 day ago", ack: false },
  { id: "a4", severity: "info"     as const, title: "Milestone: 30% of target secured", desc: "₹1,50,000 secured. Team is on track.", lead: null, time: "2 days ago", ack: true },
  { id: "a5", severity: "notice"   as const, title: "High-Value Lead Added: Nike India", desc: "₹1,50,000 Title Sponsor prospect added to pipeline.", lead: "L015", time: "3 days ago", ack: true },
]

// ── SIGNALS ──
export const SIGNALS = [
  { id: "s1", type: "opportunity" as const, company: "boAt", title: "Buying Intent Signal", desc: "Third follow-up acknowledged within 2h. 3x faster response than median — strong buying signal.", lead: "L005", score: 87, time: "1 hour ago" },
  { id: "s2", type: "risk"        as const, company: "ASUS India", title: "Cadence Slowing", desc: "Response time increased from 6h to 31h over last 3 touches. Risk of deal going cold.", lead: "L002", score: 62, time: "3 hours ago" },
  { id: "s3", type: "action"      as const, company: "Decathlon", title: "Proposal Ready to Send", desc: "Sponsor brief collected. Custom deck recommended before Wednesday.", lead: "L004", score: 75, time: "6 hours ago" },
  { id: "s4", type: "opportunity" as const, company: "Ola Electric", title: "Category Exclusivity Available", desc: "No other Automotive sponsor confirmed. Pitch exclusivity angle.", lead: "L011", score: 72, time: "12 hours ago" },
  { id: "s5", type: "action"      as const, company: "PhysicsWallah", title: "Strike While Hot", desc: "3 interactions in 5 days. Move to negotiation this week.", lead: "L018", score: 80, time: "1 day ago" },
]

// ── SPONSORSHIP TIERS ──
export const TIERS = [
  { name: "Partner Sponsor", price: 75000,  perks: ["Logo on stage banner", "Brand mention during event", "Activation table", "8+ social posts"], color: "#FBBF24", fill: "#FBBF24" },
  { name: "Co Sponsor",      price: 95000,  perks: ["Logo on main banner", "15s brand slot", "Activation booth 10×10ft", "12+ social posts", "Email to 3K students"], color: "#60A5FA", fill: "#60A5FA" },
  { name: "Title Sponsor",   price: 150000, perks: ["Logo on all banners", "30s brand slot at opening", "Activation booth 15×15ft", "20+ social posts", "Email to 5K+ students", "Post-event report"], color: "#C9A24B", fill: "#C9A24B" },
]
