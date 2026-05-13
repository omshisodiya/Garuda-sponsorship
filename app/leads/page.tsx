"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search, Upload, Plus, X, Mail, Phone, ChevronRight,
  LayoutGrid, List, SlidersHorizontal, Download, Loader, Camera, Save, Check, Copy,
} from "lucide-react"
import * as XLSX from "xlsx"
import {
  CATEGORIES, CLUB, TIERS, type Lead, type LeadStatus, type LeadStage, type Category,
} from "../lib/data"

// ── DisplayUser helpers ──────────────────────────────────────────────────────
type DisplayUser = {
  id: string
  name: string
  role: "superadmin" | "admin" | "team"
  color: string
  initials: string
}

const PALETTE = [
  "#60A5FA","#A78BFA","#4ADE80","#F472B6","#FB923C","#34D399","#F87171",
  "#818CF8","#FBBF24","#22D3EE","#E879F9","#6EE7B7","#FCA5A5","#93C5FD",
  "#FDE68A","#DDD6FE","#67E8F9","#FCD34D","#C9A24B","#FBBF24",
]

function userColor(id: string): string {
  const h = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return PALETTE[h % PALETTE.length]
}

function userInitials(name: string): string {
  return name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")
}

function toDisplayUser(u: { id: string; name: string; role: string }): DisplayUser {
  return {
    id: u.id,
    name: u.name,
    role: u.role as DisplayUser["role"],
    color: userColor(u.id),
    initials: userInitials(u.name),
  }
}

// ── Deal options ─────────────────────────────────────────────────────────────
const DEAL_OPTIONS = [
  { label: "Partner Sponsor — ₹75,000", value: 75000  },
  { label: "Co Sponsor — ₹95,000",      value: 95000  },
  { label: "Title Sponsor — ₹1,50,000", value: 150000 },
  { label: "In-kind (₹0)",              value: 0      },
  { label: "Other (custom amount)",      value: -1     },
]

const STATUS_COLORS: Record<LeadStatus, string> = {
  not_started:  "badge-blue",
  contacted:    "badge-purple",
  in_discussion:"badge-gold",
  confirmed:    "badge-green",
  rejected:     "badge-red",
}

const STAGE_COLORS: Record<LeadStage, string> = {
  prospect:    "badge-blue",
  qualified:   "badge-purple",
  proposal:    "badge-gold",
  negotiation: "badge-orange",
  won:         "badge-green",
  lost:        "badge-red",
}

const STATUS_OPTIONS: LeadStatus[] = ["not_started","contacted","in_discussion","confirmed","rejected"]
const ALL_STATUSES: Array<LeadStatus | "all"> = ["all", ...STATUS_OPTIONS]

function getUserName(users: DisplayUser[], id: string | null) {
  if (!id) return "Unassigned"
  return users.find(m => m.id === id)?.name || "—"
}

function getUserColor(users: DisplayUser[], id: string | null) {
  if (!id) return "var(--text-3)"
  return users.find(m => m.id === id)?.color || "var(--text-3)"
}

// ── Export (Blob approach — reliable in Next.js) ──────────────────────────────
function exportPerMember(leads: Lead[], users: DisplayUser[]) {
  const wb = XLSX.utils.book_new()

  const nonSuperadmin = users.filter(u => u.role !== "superadmin")

  // Summary sheet
  const summaryRows = nonSuperadmin.map(m => {
    const myLeads   = leads.filter(l => l.assigned_to === m.id)
    const confirmed = myLeads.filter(l => l.status === "confirmed")
    const contacted = myLeads.filter(l => ["contacted","in_discussion","confirmed"].includes(l.status))
    return {
      "Name":             m.name,
      "Role":             m.role,
      "Total Leads":      myLeads.length,
      "Contacted":        contacted.length,
      "In Discussion":    myLeads.filter(l => l.status === "in_discussion").length,
      "Confirmed":        confirmed.length,
      "Revenue Secured":  confirmed.reduce((s, l) => s + l.deal_value, 0),
      "Pipeline Value":   myLeads.filter(l => !["rejected","confirmed"].includes(l.status))
                                  .reduce((s, l) => s + (l.deal_value * l.probability / 100), 0),
    }
  })
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), "Team Summary")

  // Per-member sheets (top 10 active members)
  const activeMembers = nonSuperadmin.filter(m => leads.some(l => l.assigned_to === m.id))
  for (const m of activeMembers.slice(0, 10)) {
    const myLeads = leads.filter(l => l.assigned_to === m.id).map(l => ({
      "Company":        l.company,
      "Contact":        l.poc_name,
      "Email":          l.poc_email,
      "Phone":          l.poc_phone,
      "Category":       l.category,
      "Status":         l.status.replace(/_/g, " "),
      "Stage":          l.stage,
      "Deal Value":     l.deal_value,
      "Probability %":  l.probability,
      "Last Activity":  l.last_activity,
      "Notes":          l.notes,
    }))
    const sheetName = m.name.split(" ")[0].slice(0, 28)
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(myLeads), sheetName)
  }

  // All leads sheet
  const allRows = leads.map(l => ({
    "Company":      l.company,
    "Contact":      l.poc_name,
    "Email":        l.poc_email,
    "Phone":        l.poc_phone,
    "Category":     l.category,
    "Status":       l.status.replace(/_/g, " "),
    "Stage":        l.stage,
    "Assigned To":  getUserName(users, l.assigned_to),
    "Deal Value":   l.deal_value,
    "Probability %":l.probability,
    "Last Activity":l.last_activity,
    "Notes":        l.notes,
  }))
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allRows), "All Leads")

  // Blob + anchor approach (reliable in Next.js / browsers)
  const buf  = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `Garuda_Sponsorship_Report_${new Date().toISOString().split("T")[0]}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// ── Email templates ───────────────────────────────────────────────────────────
const EMAIL_TEMPLATES = {
  initial: {
    label: "Initial Outreach",
    subject: `Sponsorship Collaboration | Dandiya Night '26 | Club Garuda, MUJ`,
    body: `Dear [Contact Name],

Greetings from Club Garuda, Manipal University Jaipur!

I hope this message finds you well.

I am writing to present an exclusive high-impact sponsorship opportunity for our flagship cultural event — Garuda Dandiya Night 2026, one of the largest and most anticipated celebrations on campus, designed at a mega scale with 10,000+ expected footfall and 2,00,000+ consolidated digital and on-ground reach.

This is not just an event — it is a large-scale cultural production, blending tradition, entertainment, and strategic brand engagement.

About Garuda Dandiya Night 2026

Garuda Dandiya Night is a grand Navratri celebration built around Garba and Dandiya Raas, live music, immersive decor, and a vibrant youth atmosphere. The event is designed to deliver a premium, festival-like experience with high production quality, structured crowd flow, and engaging zones.

Key highlights:

• Professionally curated Garba and Dandiya arena
• High-end sound, lighting, and stage setup
• Themed cultural ambience and decor
• Performances, competitions, and crowd engagement activities
• Organized security, entry management, and crowd control system


Scale and Impact Metrics

Physical Footfall
• 10,000+ attendees
• Students and faculties of different age groups
• Highly active, socially engaged youth audience

Digital and Promotional Reach
• 2,00,000+ total consolidated reach
• Instagram campaigns including reels, collaborations, and paid promotions
• WhatsApp marketing chains
• Influencer and campus ambassador promotions
• Posters, banners, and offline branding across Jaipur

Engagement Lifecycle
• Pre-event hype campaign running 15 to 20 days prior
• Live event engagement
• Post-event digital amplification through after-movies and highlights

Strategic Value for [Company]

1. Massive Brand Exposure
• Logo integration across all digital and offline creatives
• Visibility on tickets, banners, entry gates, and stage backdrop
• Mentions in every promotional campaign and announcement

2. Direct Youth Market Access
• Engage directly with 10,000+ young consumers
• Ideal for brand awareness, product trials, and conversions

3. Experiential Marketing
• On-ground stall and booth setup
• Product demonstrations, sampling, and live activations
• Interactive brand experiences within the event space

4. Premium Cultural Association
• Align [Company] with a high-energy festive experience at MUJ
• Strong emotional connection leading to higher recall value

5. Data and Lead Generation Opportunities
• QR-based engagement systems
• Contests, giveaways, and registrations
• Direct audience data capture as per optional integrations

Sponsorship Structure

Title Sponsor — Rs. 1,50,000 (Exclusive)
• "Garuda Dandiya Night 2026 Powered by [Company]"
• Maximum visibility across all platforms
• Prime branding on stage, entry gate, and main arena
• Dedicated speaking and announcement slots
• Premium stall location with exclusive activation rights

Co-Sponsor — Rs. 95,000
• Strong co-branding across all creatives
• High-visibility placements across digital and offline channels
• On-ground engagement rights

Partner Sponsor — Rs. 75,000
• Logo placement across major promotions
• On-stage mentions throughout the event
• Branding at key event locations

Associate Sponsor / Zone Sponsor
Sponsor specific areas such as the Dance Arena, Selfie Booth, Entry Gate, Merchandise Zone, or Competition Prizes with selective visibility packages.

Unique Branding Opportunities

• Branded Dandiya sticks distributed to all attendees — a high recall item
• LED screen advertisements during the event
• Photo booths with full brand integration
• Exclusive branded zones within the event
• Live stage integration and host mentions
• Customized contests powered by [Company]

Execution Excellence

Club Garuda ensures:
• Structured event management system with dedicated vertical leads
• Separate teams for operations, marketing, and logistics
• Strict security and discipline protocols coordinated with university administration
• Smooth sponsor coordination for all deliverables with regular updates


Why Partner with Club Garuda?

• Proven track record of successful large-scale events at Manipal University Jaipur
• Strong organizational structure with 50+ active core members
• High execution discipline and brand professionalism
• Focus on long-term partnerships, not one-time sponsorships


Next Steps

We would be delighted to share a customized sponsorship deck and discuss how we can align this opportunity with your brand objectives. Please let us know a convenient time for a quick call or meeting.

Thank you for considering this collaboration. We look forward to partnering with [Company] to create a grand, impactful, and unforgettable Garuda Dandiya Night 2026.

Warm regards,
[Your Name]
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu

"10,000 people. One night. Infinite energy. Maximum brand impact."`,
  },
  followup: {
    label: "Follow-Up",
    subject: `Following Up | Sponsorship Proposal | Dandiya Night '26`,
    body: `Dear [Contact Name],

I hope you are doing well.

I wanted to follow up on my earlier message regarding a sponsorship collaboration for Dandiya Night '26.

I understand you are busy, so I will keep this brief — we have a few sponsorship slots remaining and I wanted to make sure [Company] has the opportunity to be part of this event before they fill up.

Quick reminder of what makes this a standout opportunity:
• 10,000+ attendees — Jaipur's top engineering and management students at a single venue
• 2,00,000+ cumulative reach on Dandiya Night reels and social media promotions
• [Company]'s category exclusivity is still available
• Flexible sponsorship packages and payment terms

Would you be open to a quick 15-minute call this week?

Alternatively, I can send our sponsorship deck directly to your WhatsApp for a quicker review.

Thank you for your time.

Warm regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
  proposal: {
    label: "Proposal Send",
    subject: `Sponsorship Proposal | [Company] x Dandiya Night '26`,
    body: `Dear [Contact Name],

Thank you for your interest in partnering with Club Garuda.

As discussed, please find attached our custom sponsorship proposal prepared specifically for [Company].

EVENT SNAPSHOT
• 10,000+ attendees — concentrated Gen Z audience of engineering and management students
• 2,00,000+ cumulative social media reach on Dandiya Night reels and digital campaigns
• Live DJ, celebrity performances, and curated cultural showcases
• Dedicated on-ground brand activation zones

PROPOSED PACKAGE: [TIER NAME] Sponsorship (₹[Amount])

KEY DELIVERABLES
• Logo on all event banners and backdrops
• 30-second brand slot at opening ceremony
• Dedicated activation booth (10x10 ft)
• Social media mentions across 3 platforms (15+ posts)
• Featured branding across all Dandiya Night reels and digital content
• Post-event report with reach and engagement metrics

NEXT STEPS
1. Review the attached proposal
2. Share any customization requests
3. Sign LOI to confirm partnership
4. Share brand assets for design team

I am available for a call at your convenience to walk you through the proposal.

Best regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
  negotiation: {
    label: "Negotiation Close",
    subject: `Finalising Partnership | [Company] x Dandiya Night '26`,
    body: `Dear [Contact Name],

Thank you for the productive conversation earlier.

I wanted to follow up with a revised package that reflects our discussion:

REVISED OFFER FOR [Company]
• Sponsorship Tier: [TIER NAME] at ₹[Amount]
• Payment: 50% advance, 50% post-event
• Category Exclusivity: Included

As a reminder of the platform you will be associating with:
• 10,000+ attendees at a single high-energy venue
• 2,00,000+ cumulative reach on Dandiya Night reels and event promotions
• Authentic campus association with MUJ's most anticipated cultural event

We are confident this partnership will deliver exceptional ROI for [Company]. To move forward, I just need your confirmation by [DATE] to reserve your slot before the deadline.

Looking forward to welcoming [Company] as our valued partner.

Warm regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
} as const

type EmailTemplateKey = keyof typeof EMAIL_TEMPLATES

function buildTemplatedEmail(
  key: EmailTemplateKey,
  lead: Lead,
  senderName: string
): { subject: string; body: string } {
  const t = EMAIL_TEMPLATES[key]
  const tier = lead.deal_value >= 150000 ? "Title Sponsor"
    : lead.deal_value >= 95000  ? "Co-Sponsor"
    : lead.deal_value >= 75000  ? "Partner Sponsor"
    : "Associate Sponsor"
  const amount = lead.deal_value > 0 ? lead.deal_value.toLocaleString("en-IN") : "Custom"
  const deadline = new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

  const pairs: [string, string][] = [
    ["[Contact Name]",  lead.poc_name  || "Sir/Ma'am"],
    ["[Company]",       lead.company],
    ["[Your Name]",     senderName],
    ["[Contact Number]",lead.poc_phone || "[Contact Number]"],
    ["[TIER NAME]",     tier],
    ["[TIER]",          tier],
    ["[Amount]",        amount],
    ["[DATE]",          deadline],
  ]

  let subject: string = t.subject
  let body:    string = t.body
  for (const [placeholder, value] of pairs) {
    subject = subject.replaceAll(placeholder, value)
    body    = body.replaceAll(placeholder, value)
  }
  return { subject, body }
}

// ── Email compose modal ───────────────────────────────────────────────────────
function EmailComposeModal({
  lead, senderName, onClose,
}: { lead: Lead; senderName: string; onClose: () => void }) {
  const [activeTemplate, setActiveTemplate] = useState<EmailTemplateKey>("initial")
  const init = buildTemplatedEmail("initial", lead, senderName)
  const [subject, setSubject] = useState(init.subject)
  const [body,    setBody]    = useState(init.body)
  const [copied,  setCopied]  = useState(false)

  function selectTemplate(key: EmailTemplateKey) {
    setActiveTemplate(key)
    const { subject: s, body: b } = buildTemplatedEmail(key, lead, senderName)
    setSubject(s)
    setBody(b)
  }

  function sendGmail() {
    window.open(
      `https://mail.google.com/mail/?view=cm&fs=1` +
      `&to=${encodeURIComponent(lead.poc_email)}` +
      `&cc=${encodeURIComponent(CLUB.email)}` +
      `&su=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(body)}`,
      "_blank"
    )
  }

  function sendOutlook() {
    const a = document.createElement("a")
    a.href = `mailto:${lead.poc_email}?cc=${encodeURIComponent(CLUB.email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    a.click()
  }

  function copy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(12px)", zIndex: 9996, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, boxSizing: "border-box" }}
      onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }} transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="panel"
        style={{ width: "100%", maxWidth: 820, maxHeight: "92vh", display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-1)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>Compose Sponsorship Email</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
              To&nbsp;<span style={{ color: "var(--text-2)" }}>{lead.poc_name}</span>
              &nbsp;·&nbsp;<span style={{ color: "#C9A24B" }}>{lead.company}</span>
              &nbsp;·&nbsp;CC: <span style={{ color: "#C9A24B" }}>{CLUB.email}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", padding: 4 }}><X size={15} /></button>
        </div>

        {/* Template selector */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border-1)", display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
          <span style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", alignSelf: "center", marginRight: 4, fontWeight: 600 }}>Template</span>
          {(Object.keys(EMAIL_TEMPLATES) as EmailTemplateKey[]).map(key => (
            <button key={key} onClick={() => selectTemplate(key)}
              style={{ padding: "5px 12px", borderRadius: "var(--r-sm)", border: `1px solid ${activeTemplate === key ? "rgba(201,162,75,0.45)" : "rgba(201,162,75,0.12)"}`, background: activeTemplate === key ? "rgba(201,162,75,0.1)" : "transparent", color: activeTemplate === key ? "#C9A24B" : "var(--text-3)", fontSize: 10, fontWeight: activeTemplate === key ? 700 : 400, cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s" }}>
              {EMAIL_TEMPLATES[key].label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ padding: "10px 20px", borderBottom: "1px solid var(--border-1)", display: "flex", flexDirection: "column", gap: 7, flexShrink: 0 }}>
          {[
            { label: "To", value: lead.poc_email, gold: false },
            { label: "CC", value: CLUB.email,     gold: true  },
          ].map(({ label, value, gold }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, color: "var(--text-3)", width: 22, flexShrink: 0, fontWeight: 600 }}>{label}</span>
              <div style={{ fontSize: 11, color: gold ? "#C9A24B" : "var(--text-2)", background: gold ? "rgba(201,162,75,0.06)" : "rgba(255,255,255,0.03)", padding: "5px 10px", borderRadius: "var(--r-sm)", flex: 1, border: `1px solid ${gold ? "rgba(201,162,75,0.25)" : "var(--border-1)"}` }}>
                {value}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 10, color: "var(--text-3)", width: 22, flexShrink: 0, fontWeight: 600 }}>Sub</span>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              style={{ fontSize: 11, color: "var(--text-1)", background: "rgba(255,255,255,0.03)", padding: "5px 10px", borderRadius: "var(--r-sm)", flex: 1, border: "1px solid var(--border-1)", outline: "none", fontFamily: "inherit" }} />
          </div>
        </div>

        {/* Body */}
        <textarea value={body} onChange={e => setBody(e.target.value)}
          style={{ flex: 1, padding: "14px 20px", background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 12, color: "var(--text-2)", lineHeight: 1.75, fontFamily: "inherit", minHeight: 0, overflowY: "auto" }} />

        {/* Footer */}
        <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-1)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap" }}>
          <a href="/PDF/Dandiya Sponsorship (1)_compressed.pdf" download
            style={{ fontSize: 10, color: "#C9A24B", display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 11px", border: "1px solid rgba(201,162,75,0.3)", borderRadius: "var(--r-sm)", background: "rgba(201,162,75,0.06)", textDecoration: "none", flexShrink: 0, fontWeight: 600 }}>
            <Download size={10} /> Download PDF — attach before sending
          </a>
          <div style={{ flex: 1 }} />
          <button onClick={copy} className="btn-ghost" style={{ fontSize: 10, padding: "6px 11px", display: "inline-flex", alignItems: "center", gap: 5 }}>
            {copied ? <><Check size={10} /> Copied!</> : <><Copy size={10} /> Copy</>}
          </button>
          <button onClick={sendOutlook} className="btn-ghost" style={{ fontSize: 10, padding: "6px 11px" }}>
            Outlook
          </button>
          <button onClick={sendGmail} className="btn-gold" style={{ fontSize: 10, padding: "6px 13px", display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Mail size={10} /> Send via Gmail
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Detail slide-over ─────────────────────────────────────────────────────────
function DetailPanel({
  lead,
  users,
  currentUser,
  onClose,
  onUpdate,
  onCompose,
}: {
  lead: Lead
  users: DisplayUser[]
  currentUser: { id: string; role: string } | null
  onClose: () => void
  onUpdate: (updated: Lead) => void
  onCompose: (lead: Lead) => void
}) {
  const [editStatus,     setEditStatus]     = useState<LeadStatus>(lead.status)
  const [dealPreset,     setDealPreset]     = useState<number>(
    DEAL_OPTIONS.find(o => o.value === lead.deal_value) ? lead.deal_value : -1
  )
  const [dealCustom,     setDealCustom]     = useState<string>(
    DEAL_OPTIONS.find(o => o.value === lead.deal_value) ? "" : String(lead.deal_value)
  )
  const [saving,         setSaving]         = useState(false)
  const [flash,          setFlash]          = useState("")
  const [fullScreenshots, setFullScreenshots] = useState<Record<string, string>>(lead.screenshots ?? {})
  const screenshotRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch(`/api/leads/${lead.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.lead?.screenshots) setFullScreenshots(data.lead.screenshots) })
      .catch(() => {})
  }, [lead.id])

  // Determine if current user can edit this lead
  const canEdit = currentUser
    ? currentUser.role === "superadmin" || currentUser.role === "admin" ||
      (currentUser.role === "team" && lead.assigned_to === currentUser.id)
    : false

  const resolvedDealValue = dealPreset === -1
    ? (parseInt(dealCustom) || 0)
    : dealPreset

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          status:     editStatus,
          deal_value: resolvedDealValue,
        }),
      })
      if (res.ok) {
        const { lead: updated } = await res.json()
        onUpdate(updated)
        setFlash("Saved!")
        setTimeout(() => setFlash(""), 2000)
      } else {
        setFlash("Save failed")
        setTimeout(() => setFlash(""), 2000)
      }
    } catch {
      setFlash("Save failed")
      setTimeout(() => setFlash(""), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function handleScreenshotChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await new Promise<string>(resolve => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const MAX = 1920
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        const canvas = document.createElement("canvas")
        canvas.width  = Math.round(img.width  * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL("image/jpeg", 0.85))
      }
      img.src = url
    })
    const statusKey   = editStatus
    const screenshots = { ...fullScreenshots, [statusKey]: base64 }
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ screenshots }),
      })
      if (res.ok) {
        const { lead: updated } = await res.json()
        setFullScreenshots(updated.screenshots ?? screenshots)
        onUpdate(updated)
        setFlash("Screenshot uploaded!")
        setTimeout(() => setFlash(""), 2500)
      }
    } catch { /* silent */ }
  }

  const screenshotEntries = Object.entries(fullScreenshots)

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9990 }}
        onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: "var(--bg-1)", borderLeft: "1px solid var(--brand-edge)", zIndex: 9991, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{lead.company}</div>
            <span className={`badge ${STATUS_COLORS[lead.status]}`} style={{ fontSize: 9, marginTop: 6, display: "inline-flex" }}>
              {lead.status.replace(/_/g, " ")}
            </span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><X size={18} /></button>
        </div>

        {/* Editable Status */}
        {canEdit && (
          <div>
            <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Status</label>
            <select className="g-select" style={{ width: "100%" }} value={editStatus}
              onChange={e => setEditStatus(e.target.value as LeadStatus)}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        )}

        {/* Editable Deal Value */}
        {canEdit && (
          <div>
            <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Deal Value / Tier</label>
            <select className="g-select" style={{ width: "100%" }} value={dealPreset}
              onChange={e => setDealPreset(parseInt(e.target.value))}>
              {DEAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {dealPreset === -1 && (
              <input className="g-input" style={{ marginTop: 6 }} value={dealCustom}
                onChange={e => setDealCustom(e.target.value)}
                placeholder="Custom amount (₹)" type="number" min="0" />
            )}
            {dealPreset !== -1 && (
              <div style={{ marginTop: 6, padding: "6px 10px", background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)", borderRadius: "var(--r-sm)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                  {TIERS.find(t => t.price === dealPreset)?.name ?? (dealPreset === 0 ? "In-kind" : "Custom")}
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A24B" }}>
                  {dealPreset === 0 ? "In-kind" : `₹${dealPreset.toLocaleString("en-IN")}`}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Static info grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Deal Value",   value: lead.deal_value === 0 ? "In-kind" : `₹${lead.deal_value.toLocaleString("en-IN")}` },
            { label: "Tier",         value: lead.deal_value >= 150000 ? "Title Sponsor" : lead.deal_value >= 95000 ? "Co Sponsor" : lead.deal_value >= 75000 ? "Partner Sponsor" : lead.deal_value === 0 ? "In-kind" : "Custom" },
            { label: "Probability",  value: `${lead.probability}%` },
            { label: "Category",     value: lead.category },
            { label: "Stage",        value: lead.stage },
            { label: "Assigned To",  value: getUserName(users, lead.assigned_to) },
            { label: "Last Activity",value: lead.last_activity },
          ].map(r => (
            <div key={r.label} style={{ padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--r-md)", border: "1px solid var(--brand-edge)" }}>
              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{r.label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{r.value}</div>
            </div>
          ))}
        </div>

        <div className="g-divider" style={{ margin: "4px 0" }} />

        {/* Contact */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div>
            <div className="g-label" style={{ marginBottom: 5 }}>Point of Contact</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{lead.poc_name}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={13} color="var(--text-3)" />
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{lead.poc_email}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Phone size={13} color="var(--text-3)" />
            <span style={{ fontSize: 12, color: "var(--text-2)" }}>{lead.poc_phone}</span>
          </div>
        </div>

        {lead.notes && (
          <>
            <div className="g-divider" style={{ margin: "4px 0" }} />
            <div>
              <div className="g-label" style={{ marginBottom: 6 }}>Notes</div>
              <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--r-md)", border: "1px solid var(--brand-edge)" }}>{lead.notes}</div>
            </div>
          </>
        )}

        {/* Screenshot section */}
        <div className="g-divider" style={{ margin: "4px 0" }} />
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div className="g-label">Screenshot Proof</div>
            {canEdit && (
              <>
                <button className="btn-ghost" style={{ padding: "5px 10px", fontSize: 10 }}
                  onClick={() => screenshotRef.current?.click()}>
                  <Camera size={11} /> Upload
                </button>
                <input ref={screenshotRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleScreenshotChange} />
              </>
            )}
          </div>

          {screenshotEntries.length === 0 ? (
            <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", padding: "16px 0", border: "1px dashed rgba(201,162,75,0.15)", borderRadius: "var(--r-md)" }}>
              No screenshots yet
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {screenshotEntries.map(([statusKey, dataUrl]) => (
                <div key={statusKey}>
                  <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>
                    {statusKey.replace(/_/g, " ")}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={dataUrl} alt={`Screenshot for ${statusKey}`}
                    style={{ width: "100%", borderRadius: "var(--r-sm)", border: "1px solid var(--brand-edge)", objectFit: "cover", maxHeight: 200 }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Flash feedback */}
        {flash && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ padding: "8px 12px", background: "var(--success-bg)", border: "1px solid var(--success-edge)", borderRadius: "var(--r-sm)", fontSize: 11, color: "var(--success)", fontWeight: 700 }}>
            {flash}
          </motion.div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {canEdit && (
            <button className="btn-gold" onClick={handleSave} disabled={saving}
              style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>
              <Save size={12} /> {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
          <button className="btn-ghost"
            onClick={() => onCompose(lead)}
            style={{ flex: canEdit ? 0 : 1, justifyContent: "center", fontSize: 11, padding: "11px 14px" }}>
            <Mail size={12} />
          </button>
          <button className="btn-ghost" style={{ padding: "11px 14px" }}><Phone size={13} /></button>
        </div>
      </motion.div>
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [leads,          setLeads]          = useState<Lead[]>([])
  const [users,          setUsers]          = useState<DisplayUser[]>([])
  const [currentUser,    setCurrentUser]    = useState<{ id: string; role: string } | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [search,         setSearch]         = useState("")
  const [statusFilter,   setStatusFilter]   = useState<LeadStatus | "all">("all")
  const [categoryFilter, setCategoryFilter] = useState<Category | "All">("All")
  const [selected,       setSelected]       = useState<Lead | null>(null)
  const [viewMode,       setViewMode]       = useState<"table" | "kanban">("table")
  const [myLeadsOnly,    setMyLeadsOnly]    = useState(false)
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all")
  const [showImport,     setShowImport]     = useState(false)
  const [showAddForm,    setShowAddForm]    = useState(false)
  const [importFlash,    setImportFlash]    = useState("")
  const [addingLead,     setAddingLead]     = useState(false)
  const [mailLead,       setMailLead]       = useState<Lead | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // new lead form state
  const [form, setForm] = useState({
    company: "", poc_name: "", poc_email: "", poc_phone: "",
    category: "FMCG" as Category,
    deal_preset: 75000 as number,
    deal_custom: "",
    notes: "",
  })

  useEffect(() => {
    Promise.all([
      fetch("/api/leads").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/users").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/auth/me").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([leadsData, usersData, meData]) => {
      if (leadsData) setLeads(leadsData.leads ?? [])
      if (usersData) setUsers((usersData.users ?? []).map(toDisplayUser))
      if (meData?.user) setCurrentUser({ id: meData.user.id, role: meData.user.role })
    }).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch   = !search || [l.company, l.poc_name, l.poc_email, l.category, l.notes].some(f => f.toLowerCase().includes(search.toLowerCase()))
      const matchStatus   = statusFilter === "all" || l.status === statusFilter
      const matchCat      = categoryFilter === "All" || l.category === categoryFilter
      const matchMine     = !myLeadsOnly || l.assigned_to === currentUser?.id
      const matchAssignee = assigneeFilter === "all"
        ? true
        : assigneeFilter === "unassigned"
          ? l.assigned_to === null
          : l.assigned_to === assigneeFilter
      return matchSearch && matchStatus && matchCat && matchMine && matchAssignee
    })
  }, [leads, search, statusFilter, categoryFilter, myLeadsOnly, currentUser, assigneeFilter])

  function resolvedDealValue() {
    if (form.deal_preset === -1) return parseInt(form.deal_custom) || 0
    return form.deal_preset
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" })
        const rows = XLSX.utils.sheet_to_json<Record<string,string>>(wb.Sheets[wb.SheetNames[0]], { defval: "" })
        const today = new Date().toISOString().split("T")[0]
        const payloads = rows.slice(0, 50).map(r => ({
          company:      r["Company"] || r["Company Name"] || Object.values(r)[0] || "Unknown",
          poc_name:     r["POC Name"] || r["Contact"] || r["Name"] || "—",
          poc_email:    r["Email"] || r["Email ID"] || "—",
          poc_phone:    r["Phone"] || r["Mobile"] || "—",
          category:     (r["Category"] as Category) || "FMCG",
          status:       "not_started" as LeadStatus,
          stage:        "prospect" as LeadStage,
          assigned_to:  null,
          deal_value:   parseInt(r["Deal Value"] || r["Amount"] || "75000") || 75000,
          probability:  25,
          notes:        r["Notes"] || "",
          last_activity: today,
          created_by:   currentUser?.id ?? "u1",
        }))
        const results = await Promise.all(
          payloads.map(p =>
            fetch("/api/leads", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(p),
            })
              .then(r => r.ok ? r.json() : null)
              .catch(() => null)
          )
        )
        const created = results.filter(Boolean).map((r: { lead: Lead }) => r.lead)
        if (created.length > 0) setLeads(prev => [...created, ...prev])
        setImportFlash(`${created.length} of ${payloads.length} leads imported`)
        setTimeout(() => setImportFlash(""), 3000)
        setShowImport(false)
      } catch { setImportFlash("Import failed — check file format") }
    }
    reader.readAsArrayBuffer(file)
  }

  async function addLead() {
    if (!form.company || !form.poc_name) return
    setAddingLead(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: form.company, poc_name: form.poc_name,
          poc_email: form.poc_email, poc_phone: form.poc_phone,
          category: form.category, status: "not_started", stage: "prospect",
          assigned_to: null, deal_value: resolvedDealValue(),
          probability: 25, notes: form.notes,
          last_activity: today, created_by: currentUser?.id ?? "u1",
        }),
      })
      if (res.ok) {
        const { lead } = await res.json()
        setLeads(prev => [lead, ...prev])
      }
    } catch { /* silent */ } finally {
      setAddingLead(false)
    }
    setForm({ company: "", poc_name: "", poc_email: "", poc_phone: "", category: "FMCG", deal_preset: 75000, deal_custom: "", notes: "" })
    setShowAddForm(false)
  }

  function handleLeadUpdate(updated: Lead) {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l))
    setSelected(updated)
  }

  const kanbanStages: LeadStage[] = ["prospect", "qualified", "proposal", "negotiation", "won", "lost"]

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader size={24} color="var(--text-3)" strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading leads…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1600, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>CRM · Lead Vault</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Lead Vault</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{filtered.length} of {leads.length} leads</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowImport(true)} style={{ fontSize: 11 }}><Upload size={13} /> Import Excel</button>
          <button className="btn-ghost" onClick={() => exportPerMember(leads, users)} style={{ fontSize: 11 }}><Download size={13} /> Export Report</button>
          <button className="btn-gold" onClick={() => setShowAddForm(true)} style={{ fontSize: 11 }}><Plus size={13} /> Add Lead</button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>

        <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 9, padding: "0 13px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)" }}>
          <Search size={14} color="var(--text-3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sponsors, contacts…"
            style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", color: "var(--text-1)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex" }}><X size={13} /></button>}
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {ALL_STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: "6px 12px", borderRadius: "var(--r-sm)", border: `1px solid ${statusFilter === s ? "rgba(201,162,75,0.4)" : "rgba(201,162,75,0.1)"}`, background: statusFilter === s ? "rgba(201,162,75,0.1)" : "transparent", color: statusFilter === s ? "#C9A24B" : "var(--text-3)", fontSize: 10, fontWeight: statusFilter === s ? 700 : 400, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", transition: "all 0.14s" }}>
              {s === "all" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <SlidersHorizontal size={12} color="var(--text-3)" />
          <select className="g-select" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as Category | "All")}>
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {currentUser && currentUser.role !== "team" && (
          <select className="g-select" value={assigneeFilter} onChange={e => { setAssigneeFilter(e.target.value); setMyLeadsOnly(false) }}
            style={{ minWidth: 140, borderColor: assigneeFilter !== "all" ? "rgba(201,162,75,0.5)" : undefined, color: assigneeFilter !== "all" ? "#C9A24B" : undefined }}>
            <option value="all">All Members</option>
            <option value="unassigned">Unassigned</option>
            {users.filter(u => u.role !== "superadmin").map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}

        {currentUser && currentUser.role !== "team" && (
          <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-sm)", overflow: "hidden", flexShrink: 0 }}>
            {(["all","mine"] as const).map(v => (
              <button key={v} onClick={() => { setMyLeadsOnly(v === "mine"); if (v === "mine") setAssigneeFilter("all") }}
                style={{ padding: "7px 14px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer",
                  background: (v === "mine") === myLeadsOnly ? "rgba(201,162,75,0.15)" : "transparent",
                  color: (v === "mine") === myLeadsOnly ? "#C9A24B" : "var(--text-3)",
                  transition: "all 0.15s" }}>
                {v === "mine" ? "My Leads" : "All Leads"}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", background: "rgba(0,0,0,0.25)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-sm)", overflow: "hidden" }}>
          {(["table","kanban"] as const).map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              style={{ padding: "7px 12px", border: "none", background: viewMode === m ? "rgba(201,162,75,0.1)" : "transparent", color: viewMode === m ? "#C9A24B" : "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {m === "table" ? <List size={13} /> : <LayoutGrid size={13} />}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table view */}
      {viewMode === "table" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="g-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Assigned</th>
                  <th>Deal Value</th>
                  <th>Prob</th>
                  <th style={{ paddingRight: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.018, 0.3) }}
                    style={{ cursor: "pointer" }} onClick={() => setSelected(lead)}>
                    <td style={{ fontWeight: 700, color: "var(--text-1)", fontSize: 13 }}>{lead.company}</td>
                    <td style={{ fontSize: 11, color: "var(--text-2)" }}>
                      <div>{lead.poc_name}</div>
                      <div style={{ color: "var(--text-3)", marginTop: 1 }}>{lead.poc_email}</div>
                    </td>
                    <td><span className="badge badge-purple" style={{ fontSize: 9 }}>{lead.category}</span></td>
                    <td><span className={`badge ${STATUS_COLORS[lead.status]}`} style={{ fontSize: 9 }}>{lead.status.replace("_"," ")}</span></td>
                    <td><span className={`badge ${STAGE_COLORS[lead.stage]}`} style={{ fontSize: 9 }}>{lead.stage}</span></td>
                    <td>
                      {lead.assigned_to ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 20, height: 20, borderRadius: 5, background: `${getUserColor(users, lead.assigned_to)}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: getUserColor(users, lead.assigned_to) }}>
                            {users.find(m => m.id === lead.assigned_to)?.initials ?? "?"}
                          </div>
                          <span style={{ fontSize: 11, color: getUserColor(users, lead.assigned_to), fontWeight: 600 }}>
                            {users.find(m => m.id === lead.assigned_to)?.name.split(" ")[0] ?? lead.assigned_to}
                          </span>
                        </div>
                      ) : <span style={{ fontSize: 11, color: "var(--text-3)" }}>Unassigned</span>}
                    </td>
                    <td>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "#C9A24B" }}>
                          {lead.deal_value === 0 ? "In-kind" : `₹${lead.deal_value.toLocaleString("en-IN")}`}
                        </div>
                        <div style={{ fontSize: 9, color: "var(--text-3)" }}>
                          {lead.deal_value >= 150000 ? "Title" : lead.deal_value >= 95000 ? "Co" : lead.deal_value >= 75000 ? "Partner" : lead.deal_value === 0 ? "" : "Custom"}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 40, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ width: `${lead.probability}%`, height: "100%", background: lead.probability >= 70 ? "var(--success)" : lead.probability >= 40 ? "var(--warning)" : "var(--info)", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>{lead.probability}%</span>
                      </div>
                    </td>
                    <td style={{ paddingRight: 16 }}>
                      <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                        <button className="btn-ghost" style={{ padding: "4px 9px", fontSize: 10 }} onClick={() => setMailLead(lead)}>
                          <Mail size={11} />
                        </button>
                        <button className="btn-ghost" style={{ padding: "4px 9px", fontSize: 10 }} onClick={() => setSelected(lead)}>
                          <ChevronRight size={11} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
              No leads match your filters.
            </div>
          )}
        </motion.div>
      )}

      {/* Kanban view */}
      {viewMode === "kanban" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
          {kanbanStages.map(stage => {
            const stageLeads = filtered.filter(l => l.stage === stage)
            return (
              <div key={stage} style={{ minWidth: 240, flex: 1 }}>
                <div style={{ padding: "10px 12px", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className={`badge ${STAGE_COLORS[stage]}`} style={{ fontSize: 9 }}>{stage}</span>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>{stageLeads.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {stageLeads.map(lead => (
                    <motion.div key={lead.id} whileHover={{ y: -2 }} onClick={() => setSelected(lead)} className="panel"
                      style={{ padding: "12px 14px", cursor: "pointer", borderLeft: `3px solid ${stage === "won" ? "var(--success)" : stage === "lost" ? "var(--danger)" : stage === "negotiation" ? "var(--warning)" : "var(--brand-edge)"}` }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>{lead.company}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8 }}>{lead.poc_name} · {lead.category}</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A24B" }}>
                          {lead.deal_value === 0 ? "In-kind" : `₹${lead.deal_value.toLocaleString("en-IN")}`}
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-3)" }}>{lead.probability}%</span>
                      </div>
                    </motion.div>
                  ))}
                  {stageLeads.length === 0 && (
                    <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)", fontSize: 11, border: "1px dashed rgba(201,162,75,0.1)", borderRadius: "var(--r-md)" }}>Empty</div>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Detail slide-over */}
      <AnimatePresence>
        {selected && (
          <DetailPanel
            key={selected.id}
            lead={selected}
            users={users}
            currentUser={currentUser}
            onClose={() => setSelected(null)}
            onUpdate={handleLeadUpdate}
            onCompose={setMailLead}
          />
        )}
      </AnimatePresence>

      {/* Add Lead Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowAddForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} className="panel"
              style={{ width: 440, padding: 26, maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>Add New Lead</div>
                <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><X size={16} /></button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "Company Name", key: "company",   placeholder: "e.g. Red Bull India", required: true },
                  { label: "POC Name",     key: "poc_name",  placeholder: "e.g. Arjun Mehta",    required: true },
                  { label: "Email",        key: "poc_email", placeholder: "contact@company.com"               },
                  { label: "Phone",        key: "poc_phone", placeholder: "+91 XXXXX XXXXX"                   },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}{f.required && " *"}</label>
                    <input className="g-input" value={String((form as Record<string, unknown>)[f.key] ?? "")} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  </div>
                ))}

                {/* Deal Value Dropdown */}
                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Deal Value / Tier</label>
                  <select className="g-select" style={{ width: "100%" }} value={form.deal_preset}
                    onChange={e => setForm(p => ({ ...p, deal_preset: parseInt(e.target.value) }))}>
                    {DEAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {form.deal_preset === -1 && (
                  <div>
                    <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Custom Amount (₹)</label>
                    <input className="g-input" value={form.deal_custom} onChange={e => setForm(p => ({ ...p, deal_custom: e.target.value }))} placeholder="e.g. 120000" type="number" min="0" />
                  </div>
                )}

                {form.deal_preset !== -1 && (
                  <div style={{ padding: "8px 12px", background: "rgba(201,162,75,0.06)", border: "1px solid rgba(201,162,75,0.15)", borderRadius: "var(--r-sm)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      {TIERS.find(t => t.price === form.deal_preset)?.name || (form.deal_preset === 0 ? "In-kind" : "Custom")}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A24B" }}>
                      {form.deal_preset === 0 ? "In-kind" : `₹${form.deal_preset.toLocaleString("en-IN")}`}
                    </span>
                  </div>
                )}

                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
                  <select className="g-select" style={{ width: "100%" }} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Notes</label>
                  <textarea className="g-input" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Initial notes…" style={{ minHeight: 70, resize: "vertical" }} />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn-ghost" onClick={() => setShowAddForm(false)} style={{ flex: 1, justifyContent: "center", fontSize: 11 }} disabled={addingLead}>Cancel</button>
                  <button className="btn-gold" onClick={addLead} style={{ flex: 1, justifyContent: "center", fontSize: 11 }} disabled={addingLead}>
                    {addingLead ? "Saving…" : "Add Lead"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import modal */}
      <AnimatePresence>
        {showImport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowImport(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className="panel"
              style={{ width: 420, padding: 26 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>Bulk Import Leads</div>
                <button onClick={() => setShowImport(false)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><X size={16} /></button>
              </div>
              <div
                style={{ border: "2px dashed var(--brand-edge)", borderRadius: "var(--r-lg)", padding: "32px 24px", textAlign: "center", cursor: "pointer", marginBottom: 14 }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={28} color="var(--text-3)" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>Drop .xlsx / .csv or click to browse</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Required columns: Company Name, POC Name, Email</div>
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleImport} />
              <div style={{ fontSize: 10, color: "var(--text-3)", textAlign: "center" }}>Up to 200 rows per import. Duplicates kept.</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Compose Modal */}
      <AnimatePresence>
        {mailLead && (
          <EmailComposeModal
            lead={mailLead}
            senderName={users.find(u => u.id === currentUser?.id)?.name ?? "Club Garuda Team"}
            onClose={() => setMailLead(null)}
          />
        )}
      </AnimatePresence>

      {/* Flash notification */}
      <AnimatePresence>
        {importFlash && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            style={{ position: "fixed", bottom: 24, right: 24, padding: "12px 18px", background: "var(--success-bg)", border: "1px solid var(--success-edge)", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 700, color: "var(--success)", backdropFilter: "blur(10px)", zIndex: 9999 }}>
            {importFlash}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
