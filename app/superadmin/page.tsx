"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import * as XLSX from "xlsx"
import { motion, AnimatePresence } from "framer-motion"
import {
  TrendingUp, TrendingDown, Target,
  CheckCircle, Clock, BarChart3, Zap,
  AlertTriangle, ArrowUpRight, RefreshCw,
  Database, GitBranch, PhoneCall, MessageSquare,
  IndianRupee, ChevronRight, X, Bell, Send, Users2,
  LogOut, UserX,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie,
} from "recharts"
import { CLUB, MIN_SPONSORSHIP_AMOUNT } from "../lib/data"
import type { Lead } from "../lib/data"

const CATEGORY_COLORS = [
  "#C9A24B", "#60A5FA", "#A78BFA", "#4ADE80",
  "#F59E0B", "#F43F5E", "#34D399", "#FB923C",
  "#818CF8", "#FBBF24",
]

/* ─────────────────────────────────────────────
   ANIMATED COUNTER
───────────────────────────────────────────── */
function Counter({
  value,
  prefix = "",
  suffix = "",
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    const duration = 1200

    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [value])

  return (
    <>
      {prefix}
      {display.toLocaleString("en-IN")}
      {suffix}
    </>
  )
}

/* ─────────────────────────────────────────────
   FORMAT INR
───────────────────────────────────────────── */
function formatINR(n: number): string {
  return "₹" + n.toLocaleString("en-IN")
}

/* ─────────────────────────────────────────────
   CHART TOOLTIP
───────────────────────────────────────────── */
function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: unknown; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "rgba(7,7,10,0.97)",
        border: "1px solid var(--brand-edge)",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "var(--text-3)",
          marginBottom: 6,
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ fontSize: 13, color: p.color, fontWeight: 700, marginBottom: 2 }}
        >
          {p.name}:{" "}
          <span style={{ color: "var(--text-1)" }}>
            {typeof p.value === "number" ? formatINR(p.value) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

function StageTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: unknown }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "rgba(7,7,10,0.97)",
        border: "1px solid var(--brand-edge)",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div
          key={p.name}
          style={{ fontSize: 13, color: "var(--text-1)", fontWeight: 700 }}
        >
          {String(p.value)} leads
        </div>
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
type KpiCardProps = {
  label: string
  value: number
  prefix?: string
  suffix?: string
  trend: string
  trendUp: boolean
  accentColor: string
  icon: React.ReactNode
  delay?: number
  onDrill?: () => void
}

function KpiCard({
  label,
  value,
  prefix = "",
  suffix = "",
  trend,
  trendUp,
  accentColor,
  icon,
  delay = 0,
  onDrill,
}: KpiCardProps) {
  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={onDrill ? { scale: 1.02 } : undefined}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      onClick={onDrill}
      title={onDrill ? "Click to view leads" : undefined}
      style={{ position: "relative", cursor: onDrill ? "pointer" : undefined }}
    >
      {/* accent bar top-left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 48,
          height: 3,
          background: accentColor,
          borderRadius: "22px 0 4px 0",
        }}
      />

      {/* drill chevron top-right */}
      {onDrill && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            color: "var(--text-3)",
            opacity: 0.6,
          }}
        >
          <ChevronRight size={13} strokeWidth={2} />
        </div>
      )}

      {/* icon */}
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}35`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          color: accentColor,
        }}
      >
        {icon}
      </div>

      <div className="g-label" style={{ marginBottom: 6 }}>
        {label}
      </div>

      <div
        className="g-value"
        style={{ fontSize: 26, marginBottom: 10, color: "var(--text-1)" }}
      >
        <Counter value={value} prefix={prefix} suffix={suffix} />
      </div>

      <div
        className="badge"
        style={{
          background: `var(${trendUp ? "--kpi-up-bg" : "--kpi-dn-bg"})`,
          color: trendUp ? "var(--success)" : "var(--danger)",
          border: `1px solid var(${trendUp ? "--kpi-up-border" : "--kpi-dn-border"})`,
          gap: 3,
        }}
      >
        {trendUp ? (
          <TrendingUp size={10} strokeWidth={2} />
        ) : (
          <TrendingDown size={10} strokeWidth={2} />
        )}
        {trend}
      </div>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   ALERT SEVERITY CONFIG
───────────────────────────────────────────── */
function alertConfig(severity: string): {
  badgeClass: string
  iconColor: string
} {
  if (severity === "critical")
    return { badgeClass: "badge-red", iconColor: "var(--danger)" }
  if (severity === "warning")
    return { badgeClass: "badge-orange", iconColor: "var(--warning)" }
  return { badgeClass: "badge-blue", iconColor: "var(--info)" }
}

function signalConfig(type: string): {
  badgeClass: string
  label: string
} {
  if (type === "opportunity")
    return { badgeClass: "badge-green", label: "Opportunity" }
  if (type === "risk") return { badgeClass: "badge-red", label: "Risk" }
  return { badgeClass: "badge-gold", label: "Action" }
}

function computeStats(leads: Lead[]) {
  const today        = new Date()
  const threeDaysAgo = new Date(today)
  threeDaysAgo.setDate(today.getDate() - 3)
  const confirmed     = leads.filter(l => l.status === "confirmed")
  const active        = leads.filter(l => !["rejected", "confirmed"].includes(l.status))
  const secured       = confirmed.reduce((s, l) => s + l.deal_value, 0)
  const pipeline      = active.reduce((s, l) => s + (l.deal_value * l.probability / 100), 0)
  const contacted     = leads.filter(l => ["contacted", "in_discussion", "confirmed"].includes(l.status))
  const inDiscussion  = leads.filter(l => l.status === "in_discussion")
  const won           = leads.filter(l => l.stage === "won")
  const qualified     = leads.filter(l => ["qualified", "proposal", "negotiation", "won"].includes(l.stage))
  const followUpsDue  = leads.filter(l => !["confirmed", "rejected"].includes(l.status) && new Date(l.last_activity) < threeDaysAgo)
  const conversionRate = qualified.length > 0 ? Math.round((won.length / qualified.length) * 100) : 0
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

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* ─────────────────────────────────────────────
   LEAD DRILL PANEL
───────────────────────────────────────────── */
const STATUS_BADGE: Record<string, string> = {
  not_started:   "badge-blue",
  contacted:     "badge-purple",
  in_discussion: "badge-gold",
  confirmed:     "badge-green",
  rejected:      "badge-red",
}
const STAGE_BADGE: Record<string, string> = {
  prospect:    "badge-blue",
  qualified:   "badge-purple",
  proposal:    "badge-gold",
  negotiation: "badge-orange",
  won:         "badge-green",
  lost:        "badge-red",
}

function LeadDrillPanel({
  label,
  leads,
  users,
  onClose,
}: {
  label: string
  leads: Lead[]
  users: Array<{ id: string; name: string; role: string }>
  onClose: () => void
}) {
  function userName(id: string | null) {
    if (!id) return "Unassigned"
    return users.find(u => u.id === id)?.name ?? id
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          zIndex: 1000, backdropFilter: "blur(2px)",
        }}
      />
      {/* Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 36 }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: "min(680px, 95vw)",
          background: "var(--surface-1)",
          border: "1px solid var(--brand-edge)",
          borderRight: "none",
          zIndex: 1001,
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px",
          borderBottom: "1px solid rgba(201,162,75,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div>
            <div className="g-label" style={{ marginBottom: 3 }}>Lead Drill-down</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)" }}>{label}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 600 }}>{leads.length} leads</span>
            <button className="btn-ghost" onClick={onClose} style={{ padding: "7px 10px" }}>
              <X size={15} />
            </button>
          </div>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
          {leads.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: 13 }}>
              No leads in this category.
            </div>
          ) : leads.map(lead => (
            <div
              key={lead.id}
              style={{
                padding: "12px 14px",
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
                display: "grid",
                gridTemplateColumns: "1fr auto",
                gap: 8,
                alignItems: "start",
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 5 }}>
                  {lead.company}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 6 }}>
                  {lead.poc_name}{lead.poc_email ? ` · ${lead.poc_email}` : ""}{lead.poc_phone ? ` · ${lead.poc_phone}` : ""}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <span className={`badge ${STATUS_BADGE[lead.status] ?? "badge-blue"}`} style={{ fontSize: 9 }}>
                    {lead.status.replace(/_/g, " ")}
                  </span>
                  <span className={`badge ${STAGE_BADGE[lead.stage] ?? "badge-blue"}`} style={{ fontSize: 9 }}>
                    {lead.stage}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{lead.category}</span>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                    Assigned: <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{userName(lead.assigned_to)}</span>
                  </span>
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "var(--brand-2)", fontVariantNumeric: "tabular-nums" }}>
                  ₹{lead.deal_value.toLocaleString("en-IN")}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 3 }}>
                  {lead.probability}% · {lead.last_activity || "—"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  )
}

/* ─────────────────────────────────────────────
   EXPORT REPORT
───────────────────────────────────────────── */
function exportDashboardReport(
  leads: Lead[],
  users: Array<{ id: string; name: string; role: string }>,
  stats: ReturnType<typeof computeStats>
) {
  const wb = XLSX.utils.book_new()
  const date = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })

  // ── Summary ──
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
    { "Metric": "Report Date",            "Value": date },
    { "Metric": "Total Leads",            "Value": stats.total },
    { "Metric": "Assigned",               "Value": stats.assigned },
    { "Metric": "Unassigned",             "Value": stats.unassigned },
    { "Metric": "Contacted",              "Value": stats.contacted },
    { "Metric": "In Discussion",          "Value": stats.inDiscussion },
    { "Metric": "Confirmed Sponsors",     "Value": stats.confirmed },
    { "Metric": "Revenue Secured (₹)",    "Value": stats.secured },
    { "Metric": "Weighted Pipeline (₹)",  "Value": stats.pipeline },
    { "Metric": "Target (₹)",             "Value": stats.target },
    { "Metric": "Progress (%)",           "Value": stats.progressPct },
    { "Metric": "Conversion Rate (%)",    "Value": stats.conversionRate },
    { "Metric": "Follow-ups Overdue",     "Value": stats.followUpsDue },
  ]), "Summary")

  // ── Status Breakdown ──
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    ["not_started","contacted","in_discussion","confirmed","rejected"].map(s => ({
      "Status":       s.replace(/_/g, " "),
      "Count":        leads.filter(l => l.status === s).length,
      "Total Value (₹)": leads.filter(l => l.status === s).reduce((sum, l) => sum + l.deal_value, 0),
    }))
  ), "Status Breakdown")

  // ── Category Breakdown ──
  const cats = new Map<string, { count: number; revenue: number }>()
  for (const l of leads) {
    const c = cats.get(l.category) ?? { count: 0, revenue: 0 }
    cats.set(l.category, { count: c.count + 1, revenue: c.revenue + l.deal_value })
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    [...cats.entries()].map(([name, v]) => ({
      "Category":            name,
      "Lead Count":          v.count,
      "Total Deal Value (₹)": v.revenue,
      "Avg Deal Value (₹)":  Math.round(v.revenue / v.count),
    }))
  ), "Category Breakdown")

  // ── Team Performance ──
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    users.filter(u => u.role !== "superadmin").map(u => {
      const ml  = leads.filter(l => l.assigned_to === u.id)
      const con = ml.filter(l => l.status === "confirmed")
      return {
        "Member":               u.name,
        "Role":                 u.role,
        "Assigned Leads":       ml.length,
        "Contacted":            ml.filter(l => ["contacted","in_discussion","confirmed"].includes(l.status)).length,
        "In Discussion":        ml.filter(l => l.status === "in_discussion").length,
        "Confirmed":            con.length,
        "Revenue Secured (₹)":  con.reduce((s, l) => s + l.deal_value, 0),
        "Pipeline Value (₹)":   Math.round(ml.filter(l => !["rejected","confirmed"].includes(l.status)).reduce((s, l) => s + l.deal_value * l.probability / 100, 0)),
      }
    })
  ), "Team Performance")

  // ── All Leads ──
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(
    leads.map(l => ({
      "Company":        l.company,
      "POC Name":       l.poc_name,
      "Email":          l.poc_email,
      "Phone":          l.poc_phone,
      "Category":       l.category,
      "Status":         l.status.replace(/_/g, " "),
      "Stage":          l.stage,
      "Assigned To":    users.find(u => u.id === l.assigned_to)?.name ?? "Unassigned",
      "Deal Value (₹)": l.deal_value,
      "Probability (%)":l.probability,
      "Last Activity":  l.last_activity,
      "Notes":          l.notes,
    }))
  ), "All Leads")

  const buf  = XLSX.write(wb, { bookType: "xlsx", type: "array" })
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement("a")
  a.href     = url
  a.download = `Garuda_Report_${new Date().toISOString().split("T")[0]}.xlsx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("")
  const [refreshing,  setRefreshing]  = useState(false)
  const [drill,       setDrill]       = useState<{ label: string; leads: Lead[] } | null>(null)
  const [users,       setUsers]       = useState<Array<{ id: string; name: string; role: string }>>([])

  type SessionEntry = {
    userId: string; userName: string; loginAt: string;
    logoutAt: string | null; durationMins: number | null; ip: string
  }
  const [sessions, setSessions] = useState<SessionEntry[]>([])
  const [forceLogoutingAll,  setForceLogoutingAll]  = useState(false)
  const [forceLogoutingUser, setForceLogoutingUser] = useState<string | null>(null)

  type NotifHistory = {
    id: number; title: string; body: string; url?: string
    importance: string; target_type: string; target_value?: string
    sent_by: string; sent_at: string; recipient_count: number
  }
  const [notifTitle,       setNotifTitle]       = useState("")
  const [notifBody,        setNotifBody]         = useState("")
  const [notifImportance,  setNotifImportance]   = useState<"info"|"warning"|"critical">("info")
  const [notifTarget,      setNotifTarget]       = useState<"all"|"role"|"user">("all")
  const [notifTargetValue, setNotifTargetValue]  = useState("")
  const [notifUrl,         setNotifUrl]          = useState("")
  const [notifSending,     setNotifSending]      = useState(false)
  const [notifHistory,     setNotifHistory]      = useState<NotifHistory[]>([])
  const [notifError,       setNotifError]        = useState("")
  const [notifSubCount,    setNotifSubCount]     = useState<{ total: number; byRole: Record<string, number> } | null>(null)

  const stats = useMemo(() => computeStats(leads), [leads])

  /* Monthly revenue computed from live leads (Jan → current month) */
  const monthlyData = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    const now = new Date()
    const yr  = now.getFullYear()
    const mo  = now.getMonth()
    return MONTHS.slice(0, mo + 1).map((month, idx) => ({
      month,
      secured:  leads
        .filter(l => l.status === "confirmed"
          && new Date(l.last_activity).getFullYear() === yr
          && new Date(l.last_activity).getMonth()    === idx)
        .reduce((s, l) => s + l.deal_value, 0),
      pipeline: Math.round(leads
        .filter(l => !["confirmed","rejected"].includes(l.status)
          && new Date(l.created_at).getFullYear() === yr
          && new Date(l.created_at).getMonth()    === idx)
        .reduce((s, l) => s + l.deal_value * l.probability / 100, 0)),
    }))
  }, [leads])

  /* Alerts computed from live lead state */
  type ComputedAlert = { id: string; severity: "critical"|"warning"|"info"; title: string; desc: string; ack: boolean; time: string }
  const computedAlerts = useMemo((): ComputedAlert[] => {
    const today       = new Date()
    const sevenAgo    = new Date(today); sevenAgo.setDate(today.getDate() - 7)
    const out: ComputedAlert[] = []

    // High-value leads never contacted
    leads
      .filter(l => l.status === "not_started" && l.deal_value >= MIN_SPONSORSHIP_AMOUNT)
      .sort((a, b) => b.deal_value - a.deal_value)
      .slice(0, 2)
      .forEach(l => out.push({
        id: `unc-${l.id}`, severity: "critical",
        title: `Uncalled high-value: ${l.company}`,
        desc:  `₹${l.deal_value.toLocaleString("en-IN")} prospect — no contact made yet`,
        ack: false, time: relativeTime(l.created_at),
      }))

    // Stalled leads (no activity ≥7 days)
    leads
      .filter(l => !["confirmed","rejected"].includes(l.status) && new Date(l.last_activity) < sevenAgo)
      .sort((a, b) => new Date(a.last_activity).getTime() - new Date(b.last_activity).getTime())
      .slice(0, 2)
      .forEach(l => {
        const days = Math.floor((today.getTime() - new Date(l.last_activity).getTime()) / 86400000)
        out.push({
          id: `stall-${l.id}`, severity: "warning",
          title: `Stalled: ${l.company}`,
          desc:  `No activity for ${days} day${days !== 1 ? "s" : ""}. Follow-up overdue.`,
          ack: false, time: relativeTime(l.last_activity),
        })
      })

    // Milestone: confirmed sponsors
    const confirmed = leads.filter(l => l.status === "confirmed")
    if (confirmed.length > 0) {
      const secured = confirmed.reduce((s, l) => s + l.deal_value, 0)
      out.push({
        id: "milestone", severity: "info",
        title: `${confirmed.length} sponsor${confirmed.length > 1 ? "s" : ""} confirmed`,
        desc:  `₹${secured.toLocaleString("en-IN")} secured so far`,
        ack: confirmed.length > 1, time: "ongoing",
      })
    }

    return out.slice(0, 5)
  }, [leads])

  /* Signals computed from live lead state */
  type ComputedSignal = { id: string; type: "opportunity"|"risk"|"action"; company: string; title: string; desc: string; score: number; time: string }
  const computedSignals = useMemo((): ComputedSignal[] => {
    const out: ComputedSignal[] = []

    // Hot leads (probability ≥70, not closed)
    leads
      .filter(l => l.probability >= 70 && !["confirmed","rejected"].includes(l.status))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 2)
      .forEach(l => out.push({
        id: `hot-${l.id}`, type: "opportunity",
        company: l.company, title: "High Probability Lead",
        desc: `${l.probability}% close probability — push to confirm`,
        score: l.probability, time: relativeTime(l.last_activity),
      }))

    // At-risk negotiations
    leads
      .filter(l => l.stage === "negotiation" && l.probability < 60 && !["confirmed","rejected"].includes(l.status))
      .slice(0, 1)
      .forEach(l => out.push({
        id: `risk-${l.id}`, type: "risk",
        company: l.company, title: "Negotiation at Risk",
        desc: `Only ${l.probability}% probability — consider escalating`,
        score: l.probability, time: relativeTime(l.last_activity),
      }))

    // Ready to advance (contacted, ≥50% probability)
    leads
      .filter(l => l.status === "contacted" && l.probability >= 50)
      .slice(0, 1)
      .forEach(l => out.push({
        id: `adv-${l.id}`, type: "action",
        company: l.company, title: "Ready to Advance",
        desc: `${l.probability}% probability — move to proposal stage`,
        score: l.probability, time: relativeTime(l.last_activity),
      }))

    return out.slice(0, 3)
  }, [leads])

  async function handleForceLogoutAll() {
    if (!confirm("Force-logout ALL active sessions across every device?")) return
    setForceLogoutingAll(true)
    try {
      await fetch("/api/auth/force-logout-all", { method: "POST" })
    } finally {
      setForceLogoutingAll(false)
    }
  }

  async function handleForceLogoutUser(userId: string, userName: string) {
    if (!confirm(`Force-logout ${userName}?`)) return
    setForceLogoutingUser(userId)
    try {
      await fetch("/api/auth/force-logout-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userName }),
      })
    } finally {
      setForceLogoutingUser(null)
    }
  }

  async function loadLeads() {
    try {
      const [leadsRes, usersRes, sessionsData, historyData, statusData] = await Promise.all([
        fetch("/api/leads").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/users").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/audit/sessions").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/push/history").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/push/status").then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      if (leadsRes)    setLeads(leadsRes.leads ?? [])
      if (usersRes)    setUsers(usersRes.users ?? [])
      if (sessionsData) setSessions(sessionsData.sessions ?? [])
      if (historyData)  setNotifHistory(historyData.notifications ?? [])
      if (statusData)   setNotifSubCount(statusData)
    } catch { /* silent */ } finally {
      setDataLoading(false)
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      )
    }
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/leads").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/users").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/audit/sessions").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/push/history").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/push/status").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([leadsData, usersData, sessionsData, historyData, statusData]) => {
      if (leadsData)    setLeads(leadsData.leads ?? [])
      if (usersData)    setUsers(usersData.users ?? [])
      if (sessionsData) setSessions(sessionsData.sessions ?? [])
      if (historyData)  setNotifHistory(historyData.notifications ?? [])
      if (statusData)   setNotifSubCount(statusData)
    }).catch(() => {}).finally(() => {
      setDataLoading(false)
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      )
    })
  }, [])

  async function sendNotification() {
    if (!notifTitle.trim() || !notifBody.trim()) return
    if (notifTarget === "user" && !notifTargetValue) { setNotifError("Please select a specific user to send to."); return }
    if (notifTarget === "role" && !notifTargetValue) { setNotifError("Please select a role to send to."); return }
    setNotifError("")
    setNotifSending(true)
    try {
      // Normalise URL: ensure leading slash if relative
      let url = notifUrl.trim()
      if (url && !url.startsWith("/") && !url.startsWith("http")) url = "/" + url

      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: notifTitle.trim(), body: notifBody.trim(),
          importance: notifImportance,
          targetType: notifTarget,
          targetValue: notifTargetValue || undefined,
          url: url || undefined,
        }),
      })
      const result = await res.json()
      if (!res.ok) { setNotifError(result.error ?? "Send failed"); return }

      const [h, s] = await Promise.all([
        fetch("/api/push/history").then(r => r.ok ? r.json() : { notifications: [] }),
        fetch("/api/push/status").then(r => r.ok ? r.json() : null),
      ])
      setNotifHistory(h.notifications ?? [])
      if (s) setNotifSubCount(s)
      setNotifTitle(""); setNotifBody(""); setNotifUrl(""); setNotifTargetValue("")
    } finally {
      setNotifSending(false)
    }
  }

  async function sendLeadReminder(uid: string, uName: string) {
    await fetch("/api/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Lead Action Required",
        body: `${uName}, please review and update your assigned leads.`,
        importance: "warning",
        targetType: "user",
        targetValue: uid,
        url: "/leads",
      }),
    })
    const h = await fetch("/api/push/history").then(r => r.ok ? r.json() : { notifications: [] })
    setNotifHistory(h.notifications ?? [])
  }

  function handleRefresh() {
    setRefreshing(true)
    loadLeads().finally(() => setRefreshing(false))
  }

  /* threeDaysAgo for follow-up drill filter */
  const threeDaysAgo = useMemo(() => { const d = new Date(); d.setDate(d.getDate() - 3); return d }, [])

  /* KPI cards data */
  const kpiCards: KpiCardProps[] = [
    {
      label: "Total Leads",
      value: stats.total,
      trend: `${stats.unassigned} unassigned`,
      trendUp: stats.unassigned === 0,
      accentColor: "#60A5FA",
      icon: <Database size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "All Leads", leads }),
    },
    {
      label: "Assigned Leads",
      value: stats.assigned,
      trend: `${Math.round(stats.assigned / Math.max(stats.total, 1) * 100)}% coverage`,
      trendUp: stats.assigned > 0,
      accentColor: "#C9A24B",
      icon: <GitBranch size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Assigned Leads", leads: leads.filter(l => l.assigned_to !== null) }),
    },
    {
      label: "Contacted",
      value: stats.contacted,
      trend: `${Math.round(stats.contacted / Math.max(stats.total, 1) * 100)}% outreach rate`,
      trendUp: stats.contacted > 0,
      accentColor: "#A78BFA",
      icon: <PhoneCall size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Contacted Leads", leads: leads.filter(l => ["contacted","in_discussion","confirmed"].includes(l.status)) }),
    },
    {
      label: "In Discussion",
      value: stats.inDiscussion,
      trend: `${Math.round(stats.inDiscussion / Math.max(stats.contacted, 1) * 100)}% of contacted`,
      trendUp: stats.inDiscussion > 0,
      accentColor: "#F59E0B",
      icon: <MessageSquare size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "In Discussion", leads: leads.filter(l => l.status === "in_discussion") }),
    },
    {
      label: "Confirmed Sponsors",
      value: stats.confirmed,
      trend: `₹${stats.secured.toLocaleString("en-IN")} locked`,
      trendUp: stats.confirmed > 0,
      accentColor: "#4ADE80",
      icon: <CheckCircle size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Confirmed Sponsors", leads: leads.filter(l => l.status === "confirmed") }),
    },
    {
      label: "Revenue Secured",
      value: stats.secured,
      prefix: "₹",
      trend: `${stats.progressPct}% of ₹5L target`,
      trendUp: stats.progressPct > 0,
      accentColor: "#C9A24B",
      icon: <IndianRupee size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Confirmed Sponsors", leads: leads.filter(l => l.status === "confirmed") }),
    },
    {
      label: "Pipeline Value",
      value: stats.pipeline,
      prefix: "₹",
      trend: `weighted probability`,
      trendUp: stats.pipeline > 0,
      accentColor: "#60A5FA",
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Pipeline Leads", leads: leads.filter(l => !["confirmed","rejected"].includes(l.status)) }),
    },
    {
      label: "Target Progress",
      value: stats.progressPct,
      suffix: "%",
      trend: `₹${Math.max(0, stats.target - stats.secured).toLocaleString("en-IN")} remaining`,
      trendUp: stats.progressPct > 0,
      accentColor: "#C9A24B",
      icon: <Target size={18} strokeWidth={1.5} />,
    },
    {
      label: "Follow-ups Overdue",
      value: stats.followUpsDue,
      trend: stats.followUpsDue === 0 ? "All leads on track" : "no activity >3 days",
      trendUp: stats.followUpsDue === 0,
      accentColor: "#F59E0B",
      icon: <Clock size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Follow-ups Overdue", leads: leads.filter(l => !["confirmed","rejected"].includes(l.status) && new Date(l.last_activity) < threeDaysAgo) }),
    },
    {
      label: "Conversion Rate",
      value: stats.conversionRate,
      suffix: "%",
      trend: `${stats.confirmed} of ${stats.total} deals closed`,
      trendUp: stats.conversionRate > 0,
      accentColor: "#4ADE80",
      icon: <BarChart3 size={18} strokeWidth={1.5} />,
      onDrill: () => setDrill({ label: "Qualified Leads", leads: leads.filter(l => ["qualified","proposal","negotiation","won"].includes(l.stage)) }),
    },
  ]

  /* Category dist computed from fetched leads */
  const categoryWithColor = useMemo(() => {
    const cats = new Map<string, { count: number; revenue: number }>()
    for (const l of leads) {
      const cur = cats.get(l.category) ?? { count: 0, revenue: 0 }
      cats.set(l.category, { count: cur.count + 1, revenue: cur.revenue + l.deal_value })
    }
    return [...cats.entries()].map(([name, v], i) => ({
      name, value: v.count, revenue: v.revenue,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))
  }, [leads])

  /* Stage dist computed from fetched leads */
  const stageDist = useMemo(() => [
    { stage: "Prospect",    count: leads.filter(l => l.stage === "prospect").length,    fill: "#6E695F" },
    { stage: "Qualified",   count: leads.filter(l => l.stage === "qualified").length,   fill: "#60A5FA" },
    { stage: "Proposal",    count: leads.filter(l => l.stage === "proposal").length,    fill: "#A78BFA" },
    { stage: "Negotiation", count: leads.filter(l => l.stage === "negotiation").length, fill: "#F59E0B" },
    { stage: "Won",         count: leads.filter(l => l.stage === "won").length,         fill: "#4ADE80" },
    { stage: "Lost",        count: leads.filter(l => l.stage === "lost").length,        fill: "#F43F5E" },
  ], [leads])

  /* target bar */
  const securedPct = Math.min(stats.progressPct, 100)
  const pipelineOnTopPct = Math.min(stats.pipelinePct, 100) - securedPct
  const remainingPct = Math.max(0, 100 - securedPct - pipelineOnTopPct)

  function fmtTime(ts: string) {
    return new Date(ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true })
  }
  function fmtDuration(mins: number | null) {
    if (mins === null) return "—"
    if (mins < 1) return "<1 min"
    if (mins < 60) return `${mins} min`
    return `${Math.floor(mins / 60)}h ${mins % 60}m`
  }

  if (dataLoading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 24, height: 24, border: "2px solid rgba(201,162,75,0.25)", borderTop: "2px solid #C9A24B", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading intelligence data…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {drill && (
          <LeadDrillPanel
            key={drill.label}
            label={drill.label}
            leads={drill.leads}
            users={users}
            onClose={() => setDrill(null)}
          />
        )}
      </AnimatePresence>
    <div
      style={{
        padding: "28px 32px",
        maxWidth: 1600,
        margin: "0 auto",
        minHeight: "100vh",
      }}
    >
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--brand-2)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div className="status-dot live" />
            Garuda OS · Command Center
          </div>
          <h1
            style={{
              fontSize: "clamp(24px, 3vw, 36px)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              color: "var(--text-1)",
              lineHeight: 1.1,
              margin: 0,
              marginBottom: 8,
            }}
          >
            Intelligence Dashboard
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}>
            Target{" "}
            <span style={{ color: "var(--brand-2)", fontWeight: 700 }}>
              {formatINR(CLUB.target)}
            </span>{" "}
            &middot; {stats.total} total leads &middot;{" "}
            <span style={{ color: "var(--success)", fontWeight: 600 }}>
              {stats.confirmed} confirmed sponsors
            </span>
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {lastUpdated && (
            <span
              style={{
                fontSize: 11,
                color: "var(--text-3)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              Updated {lastUpdated}
            </span>
          )}
          <button
            className="btn-ghost"
            onClick={handleRefresh}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw
              size={13}
              strokeWidth={2}
              style={{
                transition: "transform 0.6s",
                transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
              }}
            />
            Refresh
          </button>
          <button className="btn-gold" onClick={() => exportDashboardReport(leads, users, stats)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowUpRight size={13} strokeWidth={2} />
            Export
          </button>
        </div>
      </motion.div>

      {/* ── KPI GRID ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {kpiCards.map((card, i) => (
          <KpiCard key={card.label} {...card} delay={i * 0.045} />
        ))}
      </div>

      {/* ── TWO-COLUMN LAYOUT ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* LEFT: charts stacked */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
        >
          {/* Monthly Revenue Area Chart */}
          <div className="panel">
            <div style={{ marginBottom: 16 }}>
              <div className="g-label" style={{ marginBottom: 4 }}>
                Revenue Trend
              </div>
              <div
                style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}
              >
                Monthly Performance
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <AreaChart
                data={monthlyData}
                margin={{ top: 4, right: 0, left: -10, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradSecured" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ADE80" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradPipeline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C9A24B" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#C9A24B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(201,162,75,0.06)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "var(--text-3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "var(--text-3)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: unknown) =>
                    typeof v === "number"
                      ? "₹" + (v / 1000).toFixed(0) + "K"
                      : String(v)
                  }
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <RevenueTooltip
                      active={active}
                      payload={
                        (payload as unknown) as Array<{
                          name: string
                          value: unknown
                          color: string
                        }>
                      }
                      label={label as string}
                    />
                  )}
                />
                <Area
                  type="monotone"
                  dataKey="secured"
                  name="Secured"
                  stroke="#4ADE80"
                  strokeWidth={2}
                  fill="url(#gradSecured)"
                  dot={{ fill: "#4ADE80", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#4ADE80", strokeWidth: 0 }}
                />
                <Area
                  type="monotone"
                  dataKey="pipeline"
                  name="Pipeline"
                  stroke="#C9A24B"
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  fill="url(#gradPipeline)"
                  dot={{ fill: "#C9A24B", r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: "#C9A24B", strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div
              style={{
                display: "flex",
                gap: 20,
                marginTop: 10,
                paddingTop: 12,
                borderTop: "1px solid rgba(201,162,75,0.07)",
              }}
            >
              {[
                { color: "#4ADE80", label: "Secured Revenue" },
                { color: "#C9A24B", label: "Pipeline (Weighted)", dashed: true },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{ display: "flex", alignItems: "center", gap: 7 }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 2,
                      borderRadius: 2,
                      borderTop: item.dashed
                        ? `2px dashed ${item.color}`
                        : `2px solid ${item.color}`,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      fontWeight: 600,
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Target Progress Bar */}
          <div className="panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <div className="g-label" style={{ marginBottom: 4 }}>
                  Target Progress
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text-1)",
                  }}
                >
                  Secured vs Pipeline vs Target
                </div>
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 900,
                  color: "var(--brand-2)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stats.progressPct}%
              </div>
            </div>

            {/* Three-segment bar */}
            <div
              style={{
                height: 14,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 100,
                overflow: "hidden",
                display: "flex",
                marginBottom: 14,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${securedPct}%` }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
                style={{
                  height: "100%",
                  background:
                    "linear-gradient(90deg, #34D399, #4ADE80)",
                  boxShadow: "0 0 8px rgba(74,222,128,0.4)",
                  flexShrink: 0,
                }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pipelineOnTopPct}%` }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.75 }}
                style={{
                  height: "100%",
                  background:
                    "repeating-linear-gradient(90deg, #C9A24B 0px, #C9A24B 8px, transparent 8px, transparent 14px)",
                  opacity: 0.7,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  height: "100%",
                  flex: 1,
                  background: "rgba(255,255,255,0.04)",
                }}
              />
            </div>

            {/* Labels row */}
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {[
                {
                  color: "#4ADE80",
                  label: "Secured",
                  amount: formatINR(stats.secured),
                  pct: securedPct,
                },
                {
                  color: "#C9A24B",
                  label: "Pipeline",
                  amount: formatINR(stats.pipeline),
                  pct: pipelineOnTopPct,
                },
                {
                  color: "var(--text-3)",
                  label: "Remaining",
                  amount: formatINR(
                    Math.max(0, CLUB.target - stats.secured - stats.pipeline)
                  ),
                  pct: remainingPct,
                },
              ].map((seg) => (
                <div
                  key={seg.label}
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: seg.color,
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {seg.label}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: seg.color,
                      }}
                    >
                      {seg.amount}{" "}
                      <span
                        style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}
                      >
                        ({seg.pct.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* RIGHT: Pie + Legend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5 }}
          className="panel"
          style={{ display: "flex", flexDirection: "column" }}
        >
          <div style={{ marginBottom: 12 }}>
            <div className="g-label" style={{ marginBottom: 4 }}>
              Category Mix
            </div>
            <div
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}
            >
              Lead Distribution
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={categoryWithColor}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                animationBegin={200}
                animationDuration={900}
              />
              <Tooltip
                formatter={(v: unknown) => [
                  typeof v === "number" ? `${v} leads` : String(v),
                  "",
                ]}
                contentStyle={{
                  background: "rgba(7,7,10,0.97)",
                  border: "1px solid var(--brand-edge)",
                  borderRadius: 10,
                  fontSize: 12,
                  color: "var(--text-1)",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="g-divider" style={{ margin: "12px 0" }} />

          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              flex: 1,
              overflowY: "auto",
            }}
          >
            {categoryWithColor.map((cat) => (
              <div
                key={cat.name}
                style={{ display: "flex", alignItems: "center", gap: 10 }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                    background: cat.fill,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{ flex: 1, fontSize: 12, color: "var(--text-2)" }}
                >
                  {cat.name}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--text-1)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {cat.value}
                </span>
                <div style={{ width: 48 }}>
                  <div className="g-bar-bg">
                    <div
                      className="g-bar-fill"
                      style={{
                        width: `${Math.round(
                          (cat.value / Math.max(...categoryWithColor.map((c) => c.value))) * 100
                        )}%`,
                        background: cat.fill,
                        boxShadow: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── THREE-COLUMN BOTTOM ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 20,
        }}
      >
        {/* Stage Pipeline Bar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.5 }}
          className="panel"
        >
          <div style={{ marginBottom: 16 }}>
            <div className="g-label" style={{ marginBottom: 4 }}>
              Sales Funnel
            </div>
            <div
              style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}
            >
              Stage Pipeline
            </div>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={stageDist}
              layout="vertical"
              margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(201,162,75,0.06)"
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fill: "var(--text-3)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                dataKey="stage"
                type="category"
                tick={{ fill: "var(--text-2)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={76}
              />
              <Tooltip
                content={({ active, payload, label }) => (
                  <StageTooltip
                    active={active}
                    payload={
                      (payload as unknown) as Array<{ name: string; value: unknown }>
                    }
                    label={label as string}
                  />
                )}
              />
              <Bar
                dataKey="count"
                name="Leads"
                radius={[0, 6, 6, 0]}
                animationDuration={900}
                animationBegin={300}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recent Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="panel"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div className="g-label" style={{ marginBottom: 4 }}>
                System Alerts
              </div>
              <div
                style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}
              >
                Recent Alerts
              </div>
            </div>
            {computedAlerts.filter(a => !a.ack).length > 0
              ? <span className="badge badge-red">{computedAlerts.filter(a => !a.ack).length} New</span>
              : <span className="badge badge-green">All clear</span>}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {computedAlerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-3)", fontSize: 12 }}>
                No alerts. Add leads to start tracking.
              </div>
            ) : computedAlerts.slice(0, 3).map((alert, i) => {
              const cfg = alertConfig(alert.severity)
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 + i * 0.07 }}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "10px 12px",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 12,
                  }}
                >
                  <div style={{ color: cfg.iconColor, flexShrink: 0, marginTop: 1 }}>
                    <AlertTriangle size={15} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 5, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {alert.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span className={`badge ${cfg.badgeClass}`}>{alert.severity}</span>
                      <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {alert.time}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* AI Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.5 }}
          className="panel"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div>
              <div className="g-label" style={{ marginBottom: 4 }}>
                AI Intelligence
              </div>
              <div
                style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}
              >
                Active Signals
              </div>
            </div>
            <div style={{ color: "var(--brand-2)" }}>
              <Zap size={16} strokeWidth={1.5} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {computedSignals.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-3)", fontSize: 12 }}>
                Add leads with probability scores to see signals.
              </div>
            ) : computedSignals.map((signal, i) => {
              const cfg = signalConfig(signal.type)
              return (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.07 }}
                  style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12 }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{signal.company}</span>
                      <span className={`badge ${cfg.badgeClass}`}>{cfg.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {signal.title}
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>{signal.time}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, borderRadius: 10, background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.2)", flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "var(--brand-2)", fontVariantNumeric: "tabular-nums" }}>{signal.score}</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* ── PUSH NOTIFICATIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.80, duration: 0.5 }}
        className="panel"
        style={{ marginBottom: 28 }}
      >
        {/* Header + subscription status */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(201,162,75,0.14)", border: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={15} style={{ color: "var(--brand-2)" }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Push Notifications</div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>Reaches users even when the app is closed</div>
            </div>
          </div>
          {/* Subscription count pill */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {notifSubCount !== null ? (
              notifSubCount.total === 0
                ? <span className="badge badge-red" style={{ fontSize: 10 }}>0 devices subscribed — users must allow notifications first</span>
                : <>
                    <span className="badge badge-green" style={{ fontSize: 10 }}>{notifSubCount.total} device{notifSubCount.total !== 1 ? "s" : ""} subscribed</span>
                    {Object.entries(notifSubCount.byRole).map(([role, cnt]) => (
                      <span key={role} className="badge badge-blue" style={{ fontSize: 9 }}>{role}: {cnt}</span>
                    ))}
                  </>
            ) : (
              <span className="badge badge-gold" style={{ fontSize: 10 }}>Checking…</span>
            )}
          </div>
        </div>

        {/* Step 1 — Who to send to */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Step 1 — Choose target</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          {(["all","role","user"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setNotifTarget(t); setNotifTargetValue(""); setNotifError("") }}
              style={{
                padding: "8px 16px", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600,
                border: `1px solid ${notifTarget === t ? "var(--brand-edge-bright)" : "var(--brand-edge)"}`,
                background: notifTarget === t ? "rgba(201,162,75,0.12)" : "var(--glass-1)",
                color: notifTarget === t ? "var(--brand-2)" : "var(--text-2)",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              {t === "all" ? "📢 All Users" : t === "role" ? "🎭 By Role" : "👤 Specific User"}
            </button>
          ))}
        </div>

        {notifTarget === "role" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 6 }}>Select role to notify</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["admin","team","superadmin"].map(r => (
                <button
                  key={r}
                  onClick={() => { setNotifTargetValue(r); setNotifError("") }}
                  style={{
                    padding: "7px 14px", borderRadius: "var(--r-md)", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${notifTargetValue === r ? "var(--brand-edge-bright)" : "var(--brand-edge)"}`,
                    background: notifTargetValue === r ? "rgba(201,162,75,0.12)" : "var(--glass-1)",
                    color: notifTargetValue === r ? "var(--brand-2)" : "var(--text-2)",
                    cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize",
                  }}
                >
                  {r === "superadmin" ? "Super Admin" : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}

        {notifTarget === "user" && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 6 }}>Select the user to notify</div>
            <select
              className="g-select"
              value={notifTargetValue}
              onChange={e => { setNotifTargetValue(e.target.value); setNotifError("") }}
              style={{ width: "100%", maxWidth: 340 }}
            >
              <option value="">— Choose a user —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}  ({u.role})</option>
              ))}
            </select>
          </div>
        )}

        {/* Step 2 — Message */}
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>Step 2 — Compose message</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12, marginBottom: 12 }}>
          <input
            className="g-input"
            placeholder="Notification title…"
            value={notifTitle}
            onChange={e => { setNotifTitle(e.target.value); setNotifError("") }}
            style={{ fontSize: 13 }}
          />
          <select
            className="g-select"
            value={notifImportance}
            onChange={e => setNotifImportance(e.target.value as "info"|"warning"|"critical")}
            style={{ width: "100%" }}
          >
            <option value="info">ℹ Info</option>
            <option value="warning">⚠ Warning</option>
            <option value="critical">🔴 Critical</option>
          </select>
        </div>
        <textarea
          className="g-input"
          placeholder="Message body…"
          value={notifBody}
          onChange={e => { setNotifBody(e.target.value); setNotifError("") }}
          style={{ marginBottom: 12, minHeight: 80, resize: "vertical", fontSize: 13 }}
        />
        <input
          className="g-input"
          placeholder="Link to open on click — optional (e.g. /leads)"
          value={notifUrl}
          onChange={e => setNotifUrl(e.target.value)}
          style={{ marginBottom: 16 }}
        />

        {/* Error */}
        {notifError && (
          <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-md)", fontSize: 12, color: "var(--danger)" }}>
            {notifError}
          </div>
        )}

        {/* Send */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            className="btn-gold"
            onClick={sendNotification}
            disabled={notifSending || !notifTitle.trim() || !notifBody.trim()}
            style={{ opacity: (notifSending || !notifTitle.trim() || !notifBody.trim()) ? 0.55 : 1 }}
          >
            <Send size={12} />
            {notifSending ? "Sending…" : "Send Notification"}
          </button>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            {notifTarget === "all"
              ? `Will push to all ${notifSubCount?.total ?? "?"} subscribed devices`
              : notifTarget === "role" && notifTargetValue
              ? `Will push to all ${notifTargetValue} users (${notifSubCount?.byRole?.[notifTargetValue] ?? 0} subscribed)`
              : notifTarget === "user" && notifTargetValue
              ? `Will push to: ${users.find(u => u.id === notifTargetValue)?.name ?? notifTargetValue}`
              : "Select a target above"}
          </span>
        </div>

        {/* Lead reminder quick-send */}
        {users.filter(u => u.role !== "superadmin").length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--brand-edge)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Lead Reminder — One-click send
            </div>
            <div style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 10 }}>
              Sends a warning notification that opens /leads when clicked
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {users.filter(u => u.role !== "superadmin").map(u => (
                <motion.button
                  key={u.id}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  className="btn-ghost"
                  onClick={() => sendLeadReminder(u.id, u.name)}
                  style={{ padding: "6px 13px", fontSize: 11, gap: 6 }}
                >
                  <Users2 size={11} />
                  {u.name}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {notifHistory.length > 0 && (
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: "1px solid var(--brand-edge)" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-3)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
              Sent History ({notifHistory.length})
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="g-table">
                <thead>
                  <tr>
                    <th>Title / Body</th>
                    <th>Importance</th>
                    <th>Sent To</th>
                    <th>Delivered</th>
                    <th>Link</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {notifHistory.slice(0, 20).map(n => {
                    const targetLabel =
                      n.target_type === "all"  ? "Everyone" :
                      n.target_type === "role" ? `Role: ${n.target_value ?? ""}` :
                      users.find(u => u.id === n.target_value)?.name ?? n.target_value ?? "Unknown user"
                    return (
                      <tr key={n.id}>
                        <td style={{ maxWidth: 220 }}>
                          <div style={{ fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</div>
                          <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>
                        </td>
                        <td>
                          <span className={`badge ${n.importance === "critical" ? "badge-red" : n.importance === "warning" ? "badge-orange" : "badge-blue"}`} style={{ fontSize: 9 }}>
                            {n.importance}
                          </span>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--text-2)", whiteSpace: "nowrap" }}>{targetLabel}</td>
                        <td style={{ fontSize: 12, fontWeight: 700, color: n.recipient_count > 0 ? "var(--success)" : "var(--text-3)", textAlign: "center" }}>
                          {n.recipient_count}
                        </td>
                        <td style={{ fontSize: 11, color: "var(--info)", fontFamily: "'JetBrains Mono', monospace" }}>{n.url || "—"}</td>
                        <td style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
                          {new Date(n.sent_at).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── SESSION HISTORY ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="panel"
        style={{ marginTop: 20 }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <div className="g-label" style={{ marginBottom: 4 }}>Superadmin Only</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)" }}>Login History</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
              {sessions.length} sessions recorded
            </span>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleForceLogoutAll}
              disabled={forceLogoutingAll}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: "var(--r-md)", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", color: "var(--danger)", fontSize: 11, fontWeight: 700, cursor: forceLogoutingAll ? "not-allowed" : "pointer", opacity: forceLogoutingAll ? 0.6 : 1, fontFamily: "inherit" }}
              title="Force-logout every active session on all devices"
            >
              <LogOut size={12} />
              {forceLogoutingAll ? "Logging out…" : "Force Logout All"}
            </motion.button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-3)", fontSize: 12 }}>
            No session history yet.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="g-table" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                  <th>Duration</th>
                  <th>IP / Source</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => {
                  const isActive = !s.logoutAt
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: "var(--text-1)" }}>{s.userName}</td>
                      <td style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-2)" }}>
                        {fmtTime(s.loginAt)}
                      </td>
                      <td style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-2)" }}>
                        {s.logoutAt ? fmtTime(s.logoutAt) : "—"}
                      </td>
                      <td style={{ fontWeight: 600, color: s.durationMins !== null ? "var(--text-1)" : "var(--text-3)" }}>
                        {fmtDuration(s.durationMins)}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace" }}>
                        {s.ip || "unknown"}
                      </td>
                      <td>
                        {s.logoutAt
                          ? <span className="badge badge-green" style={{ fontSize: 9 }}>Logged out</span>
                          : <span className="badge badge-orange" style={{ fontSize: 9 }}>Active</span>}
                      </td>
                      <td>
                        {isActive && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleForceLogoutUser(s.userId, s.userName)}
                            disabled={forceLogoutingUser === s.userId}
                            title={`Force-logout ${s.userName}`}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: "var(--r-sm)", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", color: "var(--danger)", fontSize: 10, fontWeight: 700, cursor: forceLogoutingUser === s.userId ? "not-allowed" : "pointer", opacity: forceLogoutingUser === s.userId ? 0.5 : 1, fontFamily: "inherit" }}
                          >
                            <UserX size={11} />
                            {forceLogoutingUser === s.userId ? "…" : "Logout"}
                          </motion.button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
    </>
  )
}
