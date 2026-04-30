"use client"

import React, { useState, useEffect, useRef, useMemo } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, Target,
  CheckCircle, Clock, BarChart3, Zap,
  AlertTriangle, ArrowUpRight, RefreshCw,
  Database, GitBranch, PhoneCall, MessageSquare,
  IndianRupee,
} from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie,
} from "recharts"
import { CLUB } from "../lib/data"
import type { Lead } from "../lib/data"

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
}: KpiCardProps) {
  return (
    <motion.div
      className="kpi-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "relative" }}
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
          background: trendUp
            ? "rgba(74,222,128,0.1)"
            : "rgba(244,63,94,0.1)",
          color: trendUp ? "var(--success)" : "var(--danger)",
          border: `1px solid ${trendUp ? "rgba(74,222,128,0.2)" : "rgba(244,63,94,0.2)"}`,
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
   MAIN PAGE
───────────────────────────────────────────── */
export default function SuperAdminDashboard() {
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState("")
  const [refreshing,  setRefreshing]  = useState(false)

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
      .filter(l => l.status === "not_started" && l.deal_value >= 50000)
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

  async function loadLeads() {
    try {
      const res = await fetch("/api/leads")
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads ?? [])
      }
    } catch { /* silent */ } finally {
      setDataLoading(false)
      setLastUpdated(
        new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      )
    }
  }

  useEffect(() => { loadLeads() }, [])

  function handleRefresh() {
    setRefreshing(true)
    loadLeads().finally(() => setRefreshing(false))
  }

  /* KPI cards data */
  const kpiCards: KpiCardProps[] = [
    {
      label: "Total Leads",
      value: stats.total,
      trend: `${stats.unassigned} unassigned`,
      trendUp: stats.unassigned === 0,
      accentColor: "#60A5FA",
      icon: <Database size={18} strokeWidth={1.5} />,
    },
    {
      label: "Assigned Leads",
      value: stats.assigned,
      trend: `${Math.round(stats.assigned / Math.max(stats.total, 1) * 100)}% coverage`,
      trendUp: stats.assigned > 0,
      accentColor: "#C9A24B",
      icon: <GitBranch size={18} strokeWidth={1.5} />,
    },
    {
      label: "Contacted",
      value: stats.contacted,
      trend: `${Math.round(stats.contacted / Math.max(stats.total, 1) * 100)}% outreach rate`,
      trendUp: stats.contacted > 0,
      accentColor: "#A78BFA",
      icon: <PhoneCall size={18} strokeWidth={1.5} />,
    },
    {
      label: "In Discussion",
      value: stats.inDiscussion,
      trend: `${Math.round(stats.inDiscussion / Math.max(stats.contacted, 1) * 100)}% of contacted`,
      trendUp: stats.inDiscussion > 0,
      accentColor: "#F59E0B",
      icon: <MessageSquare size={18} strokeWidth={1.5} />,
    },
    {
      label: "Confirmed Sponsors",
      value: stats.confirmed,
      trend: `₹${stats.secured.toLocaleString("en-IN")} locked`,
      trendUp: stats.confirmed > 0,
      accentColor: "#4ADE80",
      icon: <CheckCircle size={18} strokeWidth={1.5} />,
    },
    {
      label: "Revenue Secured",
      value: stats.secured,
      prefix: "₹",
      trend: `${stats.progressPct}% of ₹5L target`,
      trendUp: stats.progressPct > 0,
      accentColor: "#C9A24B",
      icon: <IndianRupee size={18} strokeWidth={1.5} />,
    },
    {
      label: "Pipeline Value",
      value: stats.pipeline,
      prefix: "₹",
      trend: `weighted probability`,
      trendUp: stats.pipeline > 0,
      accentColor: "#60A5FA",
      icon: <TrendingUp size={18} strokeWidth={1.5} />,
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
    },
    {
      label: "Conversion Rate",
      value: stats.conversionRate,
      suffix: "%",
      trend: `${stats.confirmed} of ${stats.total} deals closed`,
      trendUp: stats.conversionRate > 0,
      accentColor: "#4ADE80",
      icon: <BarChart3 size={18} strokeWidth={1.5} />,
    },
  ]

  /* Category dist computed from fetched leads */
  const CATEGORY_COLORS = [
    "#C9A24B", "#60A5FA", "#A78BFA", "#4ADE80",
    "#F59E0B", "#F43F5E", "#34D399", "#FB923C",
    "#818CF8", "#FBBF24",
  ]
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
          <button className="btn-gold" style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
    </div>
  )
}
