// Club Garuda — Dandiya Night 2026 Sponsorship Data
// All figures in Indian Rupees

export const CLUB = {
  name: "Club Garuda",
  event: "Dandiya Night '26",
  university: "Manipal University Jaipur",
  email: "garuda.club@muj.manipal.edu",
  instagram: "@clubgaruda_muj",
  target: 500000,        // ₹5,00,000
  attendees: 10000,
  socialReach: 200000,
}

export const MIN_SPONSORSHIP_AMOUNT = 75000

// Jivaansh is kept as a display-only member (no DB account); id "jc" won't be in the DB
export const TEAM = [
  { id: "u1",  name: "Om Shisodiya",            role: "Chairperson",               tier: "superadmin", color: "#C9A24B", initials: "OS"  },
  { id: "u2",  name: "Vatsal Sharma",            role: "Vice Chairperson",          tier: "admin",      color: "#60A5FA", initials: "VS"  },
  { id: "u3",  name: "Kushagrah Singh",          role: "General Secretary",         tier: "admin",      color: "#A78BFA", initials: "KS"  },
  { id: "u4",  name: "Harshvardhan Singh",       role: "Operational Director",      tier: "admin",      color: "#4ADE80", initials: "HS"  },
  { id: "u5",  name: "Ridhi Sharma",             role: "Operational Director",      tier: "admin",      color: "#F472B6", initials: "RS"  },
  { id: "u6",  name: "Rashiv Saran",             role: "Creative Director",         tier: "admin",      color: "#FB923C", initials: "RSa" },
  { id: "u7",  name: "Reet Rahul Bhanushali",   role: "Cultural Secretary",        tier: "admin",      color: "#34D399", initials: "RRB" },
  { id: "u8",  name: "Inesh Goyal",              role: "Technical Secretary",       tier: "admin",      color: "#F87171", initials: "IG"  },
  { id: "u9",  name: "Anvi Singla",              role: "Treasurer",                 tier: "admin",      color: "#818CF8", initials: "AS"  },
  { id: "u10", name: "Vansh Nandan",             role: "Communications Officer",    tier: "admin",      color: "#FBBF24", initials: "VN"  },
  { id: "u11", name: "Lakshya Thakur",           role: "Director of Events",        tier: "admin",      color: "#22D3EE", initials: "LT"  },
  { id: "u12", name: "Shambhavi Singh",          role: "Director - Finance",        tier: "admin",      color: "#E879F9", initials: "SS"  },
  { id: "u13", name: "Arpit Srivastava",         role: "Director of PR",            tier: "admin",      color: "#6EE7B7", initials: "ASr" },
  { id: "u14", name: "Kunj Kumar",               role: "Director of Social Media",  tier: "admin",      color: "#FCA5A5", initials: "KK"  },
  { id: "u15", name: "Shaurya Sharma",           role: "Editor in Chief",           tier: "admin",      color: "#93C5FD", initials: "SHS" },
  { id: "u16", name: "Ujjawal Chaudhary",        role: "Technical Director",        tier: "admin",      color: "#FDE68A", initials: "UC"  },
  { id: "u17", name: "Vedhitha Hariharan Iyer",  role: "Executive Associate",       tier: "admin",      color: "#DDD6FE", initials: "VH"  },
  { id: "u18", name: "Aneek Dutta",              role: "Executive Associate",       tier: "admin",      color: "#67E8F9", initials: "AD"  },
  { id: "u19", name: "Sai Ram Kathik Varma",     role: "Executive Associate",       tier: "admin",      color: "#FCD34D", initials: "SRK" },
  { id: "u20", name: "Piyush Khaitan",           role: "Head of Operations",        tier: "team",       color: "#60A5FA", initials: "PK"  },
  { id: "u21", name: "Palak Gupta",              role: "Jt. Head of Operations",    tier: "team",       color: "#A78BFA", initials: "PG"  },
  { id: "u22", name: "Ritwika Verma",            role: "Jt. Head of Operations",    tier: "team",       color: "#4ADE80", initials: "RV"  },
  { id: "u23", name: "Risham Kumar",             role: "Operations Team",           tier: "team",       color: "#F472B6", initials: "RiK" },
  { id: "u24", name: "Kushagra Sharma",          role: "Operations Team",           tier: "team",       color: "#FB923C", initials: "KSh" },
  { id: "u25", name: "Eshaan Sharma",            role: "Operations Team",           tier: "team",       color: "#34D399", initials: "ES"  },
  { id: "u26", name: "Adarsh Kumar",             role: "Operations Team",           tier: "team",       color: "#F87171", initials: "AK"  },
  { id: "u27", name: "Manit Garg",               role: "Operations Team",           tier: "team",       color: "#818CF8", initials: "MG"  },
  { id: "u28", name: "Aman Kumar Tiwari",        role: "Operations Team",           tier: "team",       color: "#FBBF24", initials: "AMT" },
  { id: "u29", name: "N.V. Vitul",               role: "Head of Events",            tier: "team",       color: "#22D3EE", initials: "NV"  },
  { id: "u30", name: "Angel",                    role: "Jt. Head of Events",        tier: "team",       color: "#E879F9", initials: "AN"  },
  { id: "u31", name: "Bhavya Shukla",            role: "Jt. Head of Events",        tier: "team",       color: "#6EE7B7", initials: "BS"  },
  { id: "u32", name: "Aaradhya Sharma",          role: "Events Team",               tier: "team",       color: "#FCA5A5", initials: "AA"  },
  { id: "u33", name: "Yogit",                    role: "Events Team",               tier: "team",       color: "#93C5FD", initials: "YO"  },
  { id: "u34", name: "Bhavya Gupta",             role: "Events Team",               tier: "team",       color: "#FDE68A", initials: "BG"  },
  { id: "u35", name: "Sagnik Kumar Dey",         role: "Events Team",               tier: "team",       color: "#DDD6FE", initials: "SD"  },
  { id: "u36", name: "Arya Paida",               role: "Head of Logistics",         tier: "team",       color: "#67E8F9", initials: "AP"  },
  { id: "u37", name: "Tanmay Kukreja",           role: "Jt. Head of Logistics",     tier: "team",       color: "#FCD34D", initials: "TK"  },
  { id: "u38", name: "Atharva Srivastava",       role: "Jt. Head of Logistics",     tier: "team",       color: "#60A5FA", initials: "ATS" },
  { id: "u39", name: "Anshika Agarwal",          role: "Marketing Team",            tier: "team",       color: "#A78BFA", initials: "ANA" },
  { id: "u40", name: "Krati Arora",              role: "Marketing Team",            tier: "team",       color: "#4ADE80", initials: "KA"  },
  { id: "u41", name: "Pragya Sinha",             role: "Marketing Team",            tier: "team",       color: "#F472B6", initials: "PS"  },
  { id: "u42", name: "Dhruv Talwar",             role: "Marketing Team",            tier: "team",       color: "#FB923C", initials: "DT"  },
  { id: "u43", name: "Kanishka",                 role: "Marketing Team",            tier: "team",       color: "#34D399", initials: "KN"  },
  { id: "u44", name: "Samridhi Choraria",        role: "Marketing Team",            tier: "team",       color: "#F87171", initials: "SC"  },
  { id: "u45", name: "Presha Gusain",            role: "Marketing Team",            tier: "team",       color: "#818CF8", initials: "PrG" },
  { id: "u46", name: "Aradhya",                  role: "Marketing Team",            tier: "team",       color: "#FBBF24", initials: "ArA" },
  { id: "u47", name: "Prisha Mittal",            role: "Technical Team",            tier: "team",       color: "#22D3EE", initials: "PM"  },
  { id: "u48", name: "Devanshu Yadav",           role: "Technical Team",            tier: "team",       color: "#E879F9", initials: "DY"  },
  { id: "u49", name: "Bhumi Shrivastav",         role: "Technical Team",            tier: "team",       color: "#6EE7B7", initials: "BhS" },
  { id: "u50", name: "Sharanya Shetty",          role: "Editorial Team",            tier: "team",       color: "#FCA5A5", initials: "ShrS"},
  { id: "u51", name: "Mayank Singh",             role: "Editorial Team",            tier: "team",       color: "#93C5FD", initials: "MS"  },
  { id: "u52", name: "Rashi Singh",              role: "Social Media Team",         tier: "team",       color: "#FDE68A", initials: "RSi" },
  { id: "u53", name: "Gaadha Amal Nair",         role: "Social Media Team",         tier: "team",       color: "#DDD6FE", initials: "GAN" },
  { id: "u54", name: "Shubham Jain",             role: "Social Media Team",         tier: "team",       color: "#67E8F9", initials: "SJ"  },
  { id: "u55", name: "Sarika Kashyap",           role: "Social Media Team",         tier: "team",       color: "#FCD34D", initials: "SaK" },
  { id: "u56", name: "Anvi Jindal",              role: "Graphic Design Team",       tier: "team",       color: "#60A5FA", initials: "AnJ" },
  { id: "u57", name: "Tavishii",                 role: "Graphic Design Team",       tier: "team",       color: "#A78BFA", initials: "TAV" },
  { id: "u58", name: "Shivam Kumar",             role: "Graphic Design Team",       tier: "team",       color: "#4ADE80", initials: "SK"  },
  // Jivaansh kept as display-only (no DB account — use u_jc id)
  { id: "jc",  name: "Jivaansh Chandna",         role: "Head of Sponsorships",      tier: "admin",      color: "#F472B6", initials: "JC"  },
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
  assigned_to: string | null
  assigned_by?: string | null
  assigned_by_role?: string | null
  deal_value: number    // in rupees
  probability: number   // 0-100
  notes: string
  last_activity: string // ISO date
  created_at: string
  created_by: string
  screenshots?: Record<string, string>
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

// ── DYNAMIC ALERTS (computed from live leads) ──
export type Alert = {
  id: string
  severity: "critical" | "warning" | "info" | "notice"
  title: string
  desc: string
  lead: string | null
  time: string
  ack: boolean
}

export function computeAlerts(leads: Lead[]): Alert[] {
  const alerts: Alert[] = []
  const today = new Date()

  const daysSince = (dateStr: string) =>
    Math.floor((today.getTime() - new Date(dateStr).getTime()) / 86400000)

  // Stalled negotiation leads
  const stalled = leads.filter(l =>
    l.stage === "negotiation" && l.probability < 60 &&
    !["confirmed","rejected"].includes(l.status)
  )
  stalled.slice(0, 3).forEach(l => {
    const d = daysSince(l.last_activity)
    alerts.push({
      id: `a_stall_${l.id}`,
      severity: d > 7 ? "critical" : "warning",
      title: `Stalled Negotiation: ${l.company}`,
      desc: `No activity for ${d} day${d !== 1 ? "s" : ""}. ${l.probability}% probability — follow up now.`,
      lead: l.id, time: `${d}d ago`, ack: false,
    })
  })

  // Overdue follow-ups (active leads, no touch in 5+ days)
  const overdue = leads.filter(l =>
    !["confirmed","rejected"].includes(l.status) &&
    l.assigned_to !== null &&
    daysSince(l.last_activity) >= 5 &&
    l.stage !== "prospect"
  )
  if (overdue.length > 0) {
    alerts.push({
      id: "a_overdue",
      severity: "warning",
      title: `${overdue.length} Follow-up${overdue.length !== 1 ? "s" : ""} Overdue`,
      desc: `${overdue.map(l => l.company).slice(0, 3).join(", ")}${overdue.length > 3 ? ` +${overdue.length - 3} more` : ""} — no activity in 5+ days.`,
      lead: null, time: "now", ack: false,
    })
  }

  // Unassigned leads
  const unassigned = leads.filter(l => l.assigned_to === null && !["confirmed","rejected"].includes(l.status))
  if (unassigned.length > 0) {
    alerts.push({
      id: "a_unassigned",
      severity: "notice",
      title: `${unassigned.length} Unassigned Lead${unassigned.length !== 1 ? "s" : ""}`,
      desc: `${unassigned.length} prospect${unassigned.length !== 1 ? "s" : ""} have no owner. Assign before outreach begins.`,
      lead: null, time: "now", ack: false,
    })
  }

  // Progress milestones
  const secured = leads.filter(l => l.status === "confirmed").reduce((s, l) => s + l.deal_value, 0)
  if (secured >= 150000) {
    alerts.push({
      id: "a_milestone",
      severity: "info",
      title: `Milestone: ₹${(secured / 100000).toFixed(1)}L Secured`,
      desc: "Great momentum! Keep pushing toward the ₹5L target.",
      lead: null, time: "today", ack: true,
    })
  }

  // High-value leads added recently
  const hotNew = leads.filter(l => l.deal_value >= 150000 && daysSince(l.created_at) <= 3 && l.status === "not_started")
  hotNew.slice(0, 2).forEach(l => {
    alerts.push({
      id: `a_hot_${l.id}`,
      severity: "notice",
      title: `High-Value Lead Added: ${l.company}`,
      desc: `₹${l.deal_value.toLocaleString("en-IN")} Title Sponsor prospect. Assign and contact within 24h.`,
      lead: l.id, time: `${daysSince(l.created_at)}d ago`, ack: true,
    })
  })

  return alerts
}

// ── DYNAMIC SIGNALS (computed from live leads) ──
export type Signal = {
  id: string
  type: "opportunity" | "risk" | "action"
  company: string
  title: string
  desc: string
  lead: string | null
  score: number
  time: string
}

export function computeSignals(leads: Lead[]): Signal[] {
  const signals: Signal[] = []
  const today = new Date()
  const daysSince = (dateStr: string) =>
    Math.floor((today.getTime() - new Date(dateStr).getTime()) / 86400000)

  // Hot leads — high probability, not yet confirmed
  const hot = leads
    .filter(l => l.probability >= 70 && !["confirmed","rejected","won","lost"].includes(l.status))
    .sort((a, b) => b.probability - a.probability)
  hot.slice(0, 3).forEach(l => {
    const tierLabel = l.deal_value >= 150000 ? "Title" : l.deal_value >= 95000 ? "Co" : "Partner"
    signals.push({
      id: `s_hot_${l.id}`,
      type: "opportunity",
      company: l.company,
      title: "High Win Probability",
      desc: `${l.probability}% close probability at ${l.stage} stage. ${tierLabel} Sponsor (₹${l.deal_value.toLocaleString("en-IN")}). Push to next stage.`,
      lead: l.id, score: l.probability, time: l.last_activity,
    })
  })

  // Cadence risk — response time slowing
  const slowRisk = leads.filter(l => {
    if (["confirmed","rejected"].includes(l.status)) return false
    const d = daysSince(l.last_activity)
    return d >= 4 && l.probability >= 50 && l.stage !== "prospect"
  }).sort((a, b) => b.deal_value - a.deal_value)
  slowRisk.slice(0, 2).forEach(l => {
    const d = daysSince(l.last_activity)
    signals.push({
      id: `s_risk_${l.id}`,
      type: "risk",
      company: l.company,
      title: "Cadence Slowing",
      desc: `No update in ${d} days. Response cadence dropping — deal may go cold. Re-engage now.`,
      lead: l.id, score: Math.max(30, l.probability - 20), time: l.last_activity,
    })
  })

  // Action signals — ready to move to next stage
  const readyProposal = leads.filter(l => l.stage === "qualified" && !["confirmed","rejected"].includes(l.status))
  readyProposal.slice(0, 2).forEach(l => {
    signals.push({
      id: `s_act_${l.id}`,
      type: "action",
      company: l.company,
      title: "Proposal Ready to Send",
      desc: `Lead is qualified. Send custom sponsorship deck to move to Proposal stage.`,
      lead: l.id, score: l.probability + 5, time: l.last_activity,
    })
  })

  // Category exclusivity
  const confirmedCats = new Set(leads.filter(l => l.status === "confirmed").map(l => l.category))
  const openByCat = leads.filter(l =>
    !["confirmed","rejected"].includes(l.status) &&
    !confirmedCats.has(l.category) &&
    l.probability >= 50
  ).sort((a, b) => b.deal_value - a.deal_value)
  openByCat.slice(0, 1).forEach(l => {
    signals.push({
      id: `s_excl_${l.id}`,
      type: "opportunity",
      company: l.company,
      title: "Category Exclusivity Available",
      desc: `No ${l.category} sponsor confirmed yet. Pitch exclusivity angle to ${l.company}.`,
      lead: l.id, score: Math.min(95, l.probability + 10), time: l.last_activity,
    })
  })

  return signals.slice(0, 5)
}

// ── BACKWARD COMPAT — static exports for pages that still import them ──
export const ALERTS = computeAlerts([])
export const SIGNALS = computeSignals([])

// ── SPONSORSHIP TIERS ──
export const TIERS = [
  { name: "Partner Sponsor", price: 75000,  perks: ["Logo on stage banner", "Brand mention during event", "Activation table", "8+ social posts"], color: "#FBBF24", fill: "#FBBF24" },
  { name: "Co Sponsor",      price: 95000,  perks: ["Logo on main banner", "15s brand slot", "Activation booth 10×10ft", "12+ social posts", "Email to 3K students"], color: "#60A5FA", fill: "#60A5FA" },
  { name: "Title Sponsor",   price: 150000, perks: ["Logo on all banners", "30s brand slot at opening", "Activation booth 15×15ft", "20+ social posts", "Email to 10K+ students", "Post-event report"], color: "#C9A24B", fill: "#C9A24B" },
]
