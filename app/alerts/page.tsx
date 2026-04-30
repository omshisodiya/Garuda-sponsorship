"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, AlertTriangle, Info, CheckCircle, Clock, X, Timer, ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react"
import { ALERTS, LEADS } from "../lib/data"

type Alert = typeof ALERTS[number]
type SeverityFilter = "all" | "critical" | "warning" | "info" | "notice"

const SEV_CONFIG = {
  critical: { label: "Critical", icon: AlertTriangle, color: "var(--danger)",  bg: "var(--danger-bg)",  edge: "var(--danger-edge)",  badge: "badge-red"    },
  warning:  { label: "Warning",  icon: Clock,         color: "var(--warning)", bg: "var(--warning-bg)", edge: "var(--warning-edge)", badge: "badge-orange" },
  info:     { label: "Info",     icon: Info,          color: "var(--info)",    bg: "var(--info-bg)",    edge: "var(--info-edge)",    badge: "badge-blue"   },
  notice:   { label: "Notice",   icon: Bell,          color: "var(--text-3)",  bg: "rgba(255,255,255,0.02)", edge: "rgba(255,255,255,0.07)", badge: "badge-blue" },
}

function AlertCard({ alert, onAck, onTimer }: { alert: Alert; onAck: (id: string) => void; onTimer: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const sev  = SEV_CONFIG[alert.severity as keyof typeof SEV_CONFIG]
  const Icon = sev.icon
  const lead = alert.lead ? LEADS.find(l => l.id === alert.lead) : null

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
      style={{ padding: "14px 16px", background: sev.bg, border: `1px solid ${sev.edge}`, borderLeft: `3px solid ${sev.color}`, borderRadius: "var(--r-md)", marginBottom: 8 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: `${sev.color}18`, border: `1px solid ${sev.edge}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
          <Icon size={14} color={sev.color} strokeWidth={1.5} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{alert.title}</span>
            <span className={`badge ${sev.badge}`} style={{ fontSize: 9 }}>{sev.label}</span>
            <span style={{ fontSize: 10, color: "var(--text-3)", marginLeft: "auto" }}>{alert.time}</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-2)", marginBottom: 8 }}>{alert.desc}</div>

          {lead && (
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 8 }}>
              {lead.company} · ₹{lead.deal_value.toLocaleString("en-IN")} · {lead.stage}
            </div>
          )}

          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button onClick={() => onAck(alert.id)} className="btn-ghost" style={{ padding: "5px 11px", fontSize: 10 }}>
              <CheckCircle size={10} strokeWidth={1.5} /> Resolve
            </button>
            <button onClick={() => onTimer(alert.id)} className="btn-ghost" style={{ padding: "5px 11px", fontSize: 10 }}>
              <Timer size={10} strokeWidth={1.5} /> Timer
            </button>
            {lead && (
              <button className="btn-ghost" style={{ padding: "5px 11px", fontSize: 10 }}>
                View Lead <ArrowUpRight size={10} strokeWidth={1.5} />
              </button>
            )}
            <button onClick={() => setExpanded(e => !e)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontFamily: "inherit", marginLeft: "auto" }}>
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                style={{ marginTop: 10, padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--r-sm)", fontSize: 11, color: "var(--text-3)" }}>
                Alert ID: {alert.id} · Generated at {alert.time} · {alert.severity.toUpperCase()} severity
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default function AlertsPage() {
  const [resolved, setResolved]   = useState<Set<string>>(new Set(ALERTS.filter(a => a.ack).map(a => a.id)))
  const [snoozed, setTimerd]     = useState<Set<string>>(new Set())
  const [filter, setFilter]       = useState<SeverityFilter>("all")
  const [showResolved, setShowResolved] = useState(false)

  function resolve(id: string) { setResolved(prev => new Set([...prev, id])) }
  function snooze(id: string)  { setTimerd(prev => new Set([...prev, id])) }

  const active   = ALERTS.filter(a => !resolved.has(a.id) && !snoozed.has(a.id) && (filter === "all" || a.severity === filter))
  const snoozedList = ALERTS.filter(a => snoozed.has(a.id))
  const resolvedList = ALERTS.filter(a => resolved.has(a.id))
  const criticalCount = ALERTS.filter(a => a.severity === "critical" && !resolved.has(a.id)).length

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1000, margin: "0 auto" }}>

      {/* Critical banner */}
      <AnimatePresence>
        {criticalCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginBottom: 16, padding: "12px 18px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", gap: 10 }}>
            <AlertTriangle size={14} color="var(--danger)" strokeWidth={1.5} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--danger)" }}>
              {criticalCount} critical alert{criticalCount > 1 ? "s" : ""} require immediate attention
            </span>
            <X size={13} color="var(--danger)" style={{ marginLeft: "auto", cursor: "pointer" }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Alert Center · Real-time</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Alert Center</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{active.length} active · {snoozedList.length} snoozed · {resolvedList.length} resolved</p>
        </div>
      </motion.div>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {(["all","critical","warning","info"] as SeverityFilter[]).map((sev, i) => {
          const count = sev === "all" ? ALERTS.filter(a => !resolved.has(a.id)).length : ALERTS.filter(a => a.severity === sev && !resolved.has(a.id)).length
          const cfg   = sev === "all" ? null : SEV_CONFIG[sev as keyof typeof SEV_CONFIG]
          return (
            <motion.div key={sev} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              onClick={() => setFilter(sev)}
              style={{ padding: "14px 16px", background: filter === sev ? (cfg ? cfg.bg : "rgba(201,162,75,0.07)") : "var(--glass-1)", border: `1px solid ${filter === sev ? (cfg ? cfg.edge : "var(--brand-edge)") : "var(--brand-edge)"}`, borderRadius: "var(--r-md)", cursor: "pointer", transition: "all 0.15s" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: sev === "all" ? "var(--text-1)" : (cfg?.color || "var(--text-1)"), fontVariantNumeric: "tabular-nums" }}>{count}</div>
              <div className="g-label" style={{ marginTop: 3 }}>{sev === "all" ? "All Active" : SEV_CONFIG[sev as keyof typeof SEV_CONFIG]?.label}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Active alerts */}
      <div style={{ marginBottom: 24 }}>
        <div className="g-label" style={{ marginBottom: 12 }}>Active Alerts</div>
        <AnimatePresence>
          {active.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: "32px", textAlign: "center", border: "1px dashed rgba(201,162,75,0.1)", borderRadius: "var(--r-md)", color: "var(--text-3)", fontSize: 12 }}>
              <CheckCircle size={28} strokeWidth={1} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
              All clear — no active alerts
            </motion.div>
          )}
          {active.map(alert => (
            <AlertCard key={alert.id} alert={alert} onAck={resolve} onTimer={snooze} />
          ))}
        </AnimatePresence>
      </div>

      {/* Timerd */}
      {snoozedList.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div className="g-label" style={{ marginBottom: 10, opacity: 0.6 }}>Timerd ({snoozedList.length})</div>
          {snoozedList.map(alert => (
            <div key={alert.id} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--r-sm)", marginBottom: 6, fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8 }}>
              <Timer size={12} strokeWidth={1.5} />
              {alert.title}
              <button onClick={() => setTimerd(prev => { const s = new Set(prev); s.delete(alert.id); return s })}
                style={{ marginLeft: "auto", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", fontSize: 10, fontFamily: "inherit" }}>
                Wake
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Toggle resolved */}
      <button onClick={() => setShowResolved(p => !p)}
        style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 11, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, marginBottom: showResolved ? 12 : 0 }}>
        {showResolved ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {showResolved ? "Hide" : "Show"} resolved ({resolvedList.length})
      </button>

      <AnimatePresence>
        {showResolved && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {resolvedList.map(alert => (
              <div key={alert.id} style={{ padding: "10px 14px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "var(--r-sm)", marginBottom: 5, fontSize: 11, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 8, opacity: 0.5 }}>
                <CheckCircle size={11} strokeWidth={1.5} color="var(--success)" />
                {alert.title}
                <span style={{ marginLeft: "auto", fontSize: 10 }}>{alert.time}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
