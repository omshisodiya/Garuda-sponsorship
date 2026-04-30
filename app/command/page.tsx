"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Terminal, TrendingUp, Target, CheckCircle, Users, Activity, Zap, AlertTriangle, Clock, RefreshCw } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { LEADS, TEAM, getStats, MONTHLY_REVENUE, ALERTS, SIGNALS, CLUB } from "../lib/data"

function Ticker({ items }: { items: string[] }) {
  const doubled = [...items, ...items]
  return (
    <div style={{ overflow: "hidden", position: "relative" }}>
      <div style={{ display: "flex", gap: 40, animation: "ticker-scroll 28s linear infinite", width: "max-content" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ fontSize: 10, color: "var(--text-3)", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
            <span style={{ color: "var(--text-brand)", marginRight: 6 }}>·</span>{item}
          </span>
        ))}
      </div>
    </div>
  )
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: unknown; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "rgba(7,7,10,0.97)", border: "1px solid var(--brand-edge)", borderRadius: 10, padding: "8px 14px" }}>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 5 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>
          {p.name}: ₹{Number(p.value).toLocaleString("en-IN")}
        </div>
      ))}
    </div>
  )
}

export default function CommandPage() {
  const [time, setTime]     = useState("")
  const [seconds, setSeconds] = useState(0)
  const stats = getStats()

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }))
      setSeconds(now.getSeconds())
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [])

  const tickerItems = [
    `PIPELINE ₹${stats.pipeline.toLocaleString("en-IN")}`,
    `SECURED ₹${stats.secured.toLocaleString("en-IN")}`,
    `TARGET ₹${CLUB.target.toLocaleString("en-IN")}`,
    `PROGRESS ${stats.progressPct}%`,
    `TOTAL LEADS ${stats.total}`,
    `CONFIRMED ${stats.confirmed}`,
    `ASSIGNED ${stats.assigned}`,
    `CONVERSION ${stats.conversionRate}%`,
    ...ALERTS.filter(a => !a.ack && a.severity === "critical").map(a => `CRITICAL: ${a.title.toUpperCase()}`),
  ]

  return (
    <div style={{ padding: "16px 20px", maxWidth: 1700, margin: "0 auto", height: "calc(100vh - 72px)", display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Ticker */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        style={{ padding: "9px 16px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(201,162,75,0.12)", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-brand)", letterSpacing: "0.1em", flexShrink: 0 }}>LIVE</span>
        <div style={{ height: 10, width: 1, background: "rgba(255,255,255,0.1)" }} />
        <Ticker items={tickerItems} />
        <div style={{ flexShrink: 0, fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-brand)", letterSpacing: "0.06em" }}>{time}</div>
      </motion.div>

      {/* Main grid */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: 12, minHeight: 0 }}>

        {/* Left column — team */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} className="panel" style={{ padding: "14px 16px" }}>
            <div className="g-label" style={{ marginBottom: 12 }}>Team Status</div>
            {TEAM.filter(m => m.tier !== "superadmin").map((member, i) => {
              const myLeads   = LEADS.filter(l => l.assigned_to === member.id)
              const confirmed = myLeads.filter(l => l.status === "confirmed").length
              const active    = myLeads.filter(l => !["rejected"].includes(l.status)).length
              const lastSeen  = ["2m", "7m", "15m", "32m", "1h", "2h", "offline"][i % 7]
              const isOnline  = ["2m","7m","15m"].some(t => lastSeen === t)
              return (
                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                  <div style={{ position: "relative" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${member.color}18`, border: `1px solid ${member.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: member.color }}>
                      {member.initials}
                    </div>
                    <span style={{ position: "absolute", bottom: -2, right: -2, width: 7, height: 7, borderRadius: "50%", background: isOnline ? "var(--success)" : "var(--text-3)", border: "1.5px solid var(--bg-1)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 9, color: "var(--text-3)" }}>{active} leads · {confirmed} closed</div>
                  </div>
                  <span style={{ fontSize: 9, color: isOnline ? "var(--success)" : "var(--text-3)" }}>{lastSeen}</span>
                </div>
              )
            })}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="panel" style={{ padding: "14px 16px", flex: 1 }}>
            <div className="g-label" style={{ marginBottom: 12 }}>Alerts</div>
            {ALERTS.filter(a => !a.ack).slice(0, 4).map(alert => (
              <div key={alert.id} style={{ display: "flex", gap: 8, marginBottom: 8, padding: "8px 10px", background: alert.severity === "critical" ? "var(--danger-bg)" : "var(--warning-bg)", border: `1px solid ${alert.severity === "critical" ? "var(--danger-edge)" : "var(--warning-edge)"}`, borderRadius: "var(--r-sm)" }}>
                <AlertTriangle size={11} color={alert.severity === "critical" ? "var(--danger)" : "var(--warning)"} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-1)" }}>{alert.title}</div>
                  <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 2 }}>{alert.time}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Center — charts + KPIs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>

          {/* KPI row */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Secured",    value: `₹${(stats.secured/1000).toFixed(0)}K`,   color: "var(--success)", icon: CheckCircle },
              { label: "Pipeline",   value: `₹${(stats.pipeline/1000).toFixed(0)}K`,  color: "#C9A24B",        icon: TrendingUp  },
              { label: "Progress",   value: `${stats.progressPct}%`,                  color: "var(--info)",    icon: Target      },
              { label: "Confirmed",  value: `${stats.confirmed}`,                     color: "#A78BFA",        icon: Users       },
            ].map(kpi => {
              const Icon = kpi.icon
              return (
                <div key={kpi.label} style={{ padding: "12px 16px", background: "var(--glass-2)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${kpi.color}14`, border: `1px solid ${kpi.color}28`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color={kpi.color} strokeWidth={1.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: kpi.color, fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
                    <div className="g-label">{kpi.label}</div>
                  </div>
                </div>
              )
            })}
          </motion.div>

          {/* Revenue chart */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="panel" style={{ flex: 1, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="g-label">Revenue Trajectory</div>
              <div style={{ fontSize: 10, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 5 }}>
                <Activity size={11} strokeWidth={1.5} /> Real-time
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={MONTHLY_REVENUE}>
                <defs>
                  <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="pipGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A24B" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#C9A24B" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,75,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-3)", fontSize: 8 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="secured" name="Secured" stroke="#4ADE80" strokeWidth={2} fill="url(#secGrad)" />
                <Area type="monotone" dataKey="pipeline" name="Pipeline" stroke="#C9A24B" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#pipGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Progress bar */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{ padding: "14px 18px", background: "var(--glass-1)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span className="g-label">Target Progress — ₹{(CLUB.target/100000).toFixed(1)}L</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-brand)" }}>{stats.progressPct}% secured · {Math.min(100,stats.pipelinePct)}% with pipeline</span>
            </div>
            <div style={{ height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progressPct}%` }} transition={{ duration: 1.2, delay: 0.4 }}
                style={{ position: "absolute", inset: 0, width: `${stats.progressPct}%`, background: "linear-gradient(90deg, #15803D, #4ADE80)", borderRadius: 100 }} />
              <motion.div initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100,stats.pipelinePct) - stats.progressPct)}%` }} transition={{ duration: 1.4, delay: 0.6 }}
                style={{ position: "absolute", top: 0, left: `${stats.progressPct}%`, height: "100%", width: `${Math.max(0, Math.min(100,stats.pipelinePct) - stats.progressPct)}%`, background: "repeating-linear-gradient(45deg, rgba(201,162,75,0.4) 0px, rgba(201,162,75,0.4) 5px, transparent 5px, transparent 10px)", borderRadius: 100 }} />
            </div>
          </motion.div>
        </div>

        {/* Right column — signals + hot leads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} className="panel" style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
              <Zap size={12} color="var(--warning)" strokeWidth={1.5} />
              <div className="g-label">Live Signals</div>
              <span className="badge badge-orange" style={{ fontSize: 8 }}>AI</span>
            </div>
            {SIGNALS.slice(0, 4).map(sig => (
              <div key={sig.id} style={{ marginBottom: 8, padding: "9px 11px", background: "rgba(0,0,0,0.2)", border: `1px solid ${sig.type === "opportunity" ? "var(--success-edge)" : sig.type === "risk" ? "var(--danger-edge)" : "var(--warning-edge)"}`, borderLeft: `3px solid ${sig.type === "opportunity" ? "var(--success)" : sig.type === "risk" ? "var(--danger)" : "var(--warning)"}`, borderRadius: "var(--r-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>{sig.company}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: sig.type === "opportunity" ? "var(--success)" : sig.type === "risk" ? "var(--danger)" : "var(--warning)" }}>{sig.score}%</span>
                </div>
                <div style={{ fontSize: 9, color: "var(--text-3)" }}>{sig.title}</div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="panel" style={{ padding: "14px 16px", flex: 1 }}>
            <div className="g-label" style={{ marginBottom: 12 }}>Hot Pipeline</div>
            {LEADS.filter(l => l.probability >= 65 && !["won","lost"].includes(l.stage)).slice(0, 6).map(lead => (
              <div key={lead.id} style={{ marginBottom: 8, padding: "9px 11px", background: "rgba(0,0,0,0.2)", border: "1px solid rgba(201,162,75,0.1)", borderRadius: "var(--r-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)" }}>{lead.company}</span>
                  <span style={{ fontSize: 9, fontWeight: 800, color: lead.probability >= 75 ? "var(--success)" : "var(--warning)" }}>{lead.probability}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 9, color: "var(--text-3)" }}>{lead.stage}</span>
                  <span style={{ fontSize: 9, color: "#C9A24B", fontWeight: 700 }}>₹{(lead.deal_value/1000).toFixed(0)}K</span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
