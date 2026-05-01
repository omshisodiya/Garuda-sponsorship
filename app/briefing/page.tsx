"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BookOpen, Brain, TrendingUp, AlertTriangle, Target, CheckCircle, Clock, ChevronRight, Flame, Zap } from "lucide-react"
import { LEADS, TEAM, getStats, ALERTS, SIGNALS, CLUB } from "../lib/data"

function getDayPart() {
  const h = new Date().getHours()
  return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"
}

export default function BriefingPage() {
  const [user, setUser]         = useState("Commander")
  const [time, setTime]         = useState("")
  const [date, setDate]         = useState("")
  const stats = getStats()

  useEffect(() => {
    const t = window.setTimeout(() => {
      setUser(localStorage.getItem("user") || "Commander")
      const now = new Date()
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }))
      setDate(now.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" }))
    }, 0)
    return () => window.clearTimeout(t)
  }, [])

  const hotLeads   = LEADS.filter(l => l.probability >= 75 && !["won","lost"].includes(l.stage))
  const stalledDeals = LEADS.filter(l => l.stage === "negotiation" && l.probability < 60)
  const unassigned = LEADS.filter(l => l.assigned_to === null)
  const critAlerts = ALERTS.filter(a => a.severity === "critical" && !a.ack)
  const topSignals = SIGNALS.slice(0, 3)

  const priorities = [
    hotLeads.length > 0    && { icon: Flame,          color: "var(--success)", label: `Close ${hotLeads[0].company}`,        sub: `${hotLeads[0].probability}% — highest chance deal today` },
    critAlerts.length > 0  && { icon: AlertTriangle,  color: "var(--danger)",  label: `Resolve critical alert`,              sub: critAlerts[0]?.title || "" },
    stalledDeals.length > 0 && { icon: Clock,         color: "var(--warning)", label: `Unblock ${stalledDeals[0].company}`, sub: "Negotiation stalled — needs fresh approach" },
    unassigned.length > 0  && { icon: Target,         color: "var(--info)",    label: `Assign ${unassigned.length} leads`,   sub: "Unassigned leads losing velocity" },
  ].filter(Boolean)

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000, margin: "0 auto" }}>

      {/* Morning greeting hero */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, padding: "32px 36px", background: "linear-gradient(135deg, rgba(107,15,26,0.25), rgba(201,162,75,0.07), rgba(7,7,10,0))", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-xl)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: 300, background: "radial-gradient(circle, rgba(201,162,75,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
        <div className="g-label" style={{ marginBottom: 8, color: "var(--text-brand)" }}>Daily Intelligence Briefing</div>
        <h1 style={{ fontSize: "clamp(22px,3vw,34px)", fontWeight: 900, color: "var(--text-1)", letterSpacing: "-0.02em", marginBottom: 6 }}>
          Good {getDayPart()}, {user}.
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)" }}>{date} · {time}</p>
        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <span className="status-dot live" />
          <span style={{ fontSize: 11, color: "rgba(74,222,128,0.7)", fontWeight: 600 }}>LIVE BRIEFING</span>
          <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>Garuda OS · Dandiya Night &apos;26</span>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

        {/* Mission status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel">
          <div className="g-label" style={{ marginBottom: 14 }}>Mission Status</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Total Leads",    value: stats.total,       color: "var(--text-2)",  icon: Target },
              { label: "Confirmed",      value: stats.confirmed,   color: "var(--success)", icon: CheckCircle },
              { label: "Active",         value: stats.assigned,    color: "var(--info)",    icon: Flame },
              { label: "Progress",       value: `${stats.progressPct}%`, color: "#C9A24B", icon: TrendingUp },
            ].map(s => {
              const Icon = s.icon
              return (
                <div key={s.label} style={{ padding: "12px 14px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--r-md)", border: "1px solid var(--brand-edge)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Icon size={12} color={s.color} strokeWidth={1.5} />
                    <span className="g-label">{s.label}</span>
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>₹{stats.secured.toLocaleString("en-IN")} secured</span>
              <span style={{ fontSize: 11, color: "var(--text-brand)", fontWeight: 700 }}>{stats.progressPct}% of ₹{(CLUB.target/100000).toFixed(1)}L target</span>
            </div>
            <div className="g-bar-bg">
              <motion.div className="g-bar-fill" initial={{ width: 0 }} animate={{ width: `${stats.progressPct}%` }} transition={{ duration: 1.2, ease: [0.4,0,0.2,1], delay: 0.3 }} />
            </div>
          </div>
        </motion.div>

        {/* Priority actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Brain size={14} color="#C9A24B" strokeWidth={1.5} />
            <div className="g-label">Top Priorities Today</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(priorities as Array<{ icon: React.ElementType; color: string; label: string; sub: string }>).map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", background: `${p.color}08`, border: `1px solid ${p.color}18`, borderLeft: `3px solid ${p.color}`, borderRadius: "var(--r-sm)", cursor: "pointer" }}>
                  <Icon size={14} color={p.color} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>{p.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{p.sub}</div>
                  </div>
                  <ChevronRight size={12} color="var(--text-3)" />
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Top signals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="panel" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Zap size={14} color="var(--warning)" strokeWidth={1.5} />
          <div className="g-label">Overnight Signals</div>
          <span className="badge badge-orange" style={{ fontSize: 9 }}>AI</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {topSignals.map((sig, i) => (
            <motion.div key={sig.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.07 }}
              style={{ padding: "12px 14px", background: "rgba(0,0,0,0.2)", border: `1px solid ${sig.type === "opportunity" ? "var(--success-edge)" : sig.type === "risk" ? "var(--danger-edge)" : "var(--warning-edge)"}`, borderLeft: `3px solid ${sig.type === "opportunity" ? "var(--success)" : sig.type === "risk" ? "var(--danger)" : "var(--warning)"}`, borderRadius: "var(--r-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)" }}>{sig.company}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: sig.type === "opportunity" ? "var(--success)" : sig.type === "risk" ? "var(--danger)" : "var(--warning)" }}>{sig.score}%</span>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)" }}>{sig.title}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Hot leads today */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", gap: 8 }}>
          <Flame size={14} color="var(--success)" strokeWidth={1.5} />
          <div className="g-label">Hot Leads — Action Required</div>
        </div>
        <table className="g-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Stage</th>
              <th>Deal Value</th>
              <th>Probability</th>
              <th>Assigned To</th>
              <th>Last Touch</th>
            </tr>
          </thead>
          <tbody>
            {hotLeads.slice(0, 5).map(lead => {
              const owner = TEAM.find(m => m.id === lead.assigned_to)
              return (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-1)", fontSize: 13 }}>{lead.company}</td>
                  <td><span className="badge badge-orange" style={{ fontSize: 9 }}>{lead.stage}</span></td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: "#C9A24B" }}>₹{lead.deal_value.toLocaleString("en-IN")}</td>
                  <td style={{ fontSize: 12, color: lead.probability >= 75 ? "var(--success)" : "var(--warning)", fontWeight: 700 }}>{lead.probability}%</td>
                  <td style={{ fontSize: 11, color: "var(--text-2)" }}>{owner?.name.split(" ")[0] || "—"}</td>
                  <td style={{ fontSize: 11, color: "var(--text-3)" }}>{lead.last_activity}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
