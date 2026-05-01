"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Lock, Unlock, Activity, Target, TrendingUp,
  PhoneCall, Mail, AlertTriangle, CheckCircle, Loader,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { useSecurityStore } from "../lib/securityStore"
import { TEAM, ALERTS, CLUB } from "../lib/data"
import type { Lead } from "../lib/data"
import type { AuditEntry } from "../lib/server/store"

function actionIcon(action: string) {
  if (action.includes("password"))     return <Lock    size={12} color="var(--warning)"  strokeWidth={1.6} />
  if (action.includes("lead_created")) return <Target  size={12} color="var(--info)"     strokeWidth={1.6} />
  if (action.includes("lead_updated")) return <Activity size={12} color="#A78BFA"          strokeWidth={1.6} />
  if (action.includes("login"))        return <Users    size={12} color="var(--success)"  strokeWidth={1.6} />
  if (action.includes("role"))         return <TrendingUp size={12} color="var(--warning)" strokeWidth={1.6} />
  return                                      <Mail     size={12} color="var(--text-3)"   strokeWidth={1.6} />
}

function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins  = Math.floor(diff / 60000)
  if (mins < 1)   return "just now"
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: unknown }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "rgba(7,7,10,0.97)", border: "1px solid var(--brand-edge)", borderRadius: 10, padding: "8px 14px" }}>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 4 }}>{label}</div>
      {payload.map(p => <div key={p.name} style={{ fontSize: 12, color: "#C9A24B", fontWeight: 700 }}>{String(p.value)} leads</div>)}
    </div>
  )
}

export default function AdminPage() {
  const { teamLocked, setTeamLocked } = useSecurityStore()
  const [showConfirm, setShowConfirm] = useState(false)
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [audit,       setAudit]       = useState<AuditEntry[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, auditRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/audit?limit=10"),
        ])
        if (leadsRes.ok)  setLeads((await leadsRes.json()).leads ?? [])
        if (auditRes.ok)  setAudit((await auditRes.json()).entries ?? [])
      } catch { /* silent */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const confirmed    = leads.filter(l => l.status === "confirmed")
    const secured      = confirmed.reduce((s, l) => s + l.deal_value, 0)
    return {
      total:     leads.length,
      assigned:  leads.filter(l => l.assigned_to !== null).length,
      confirmed: confirmed.length,
      secured,
    }
  }, [leads])

  const adminTeam = TEAM.filter(m => m.tier !== "superadmin")

  const team = useMemo(() =>
    adminTeam.map(member => {
      const myLeads   = leads.filter(l => l.assigned_to === member.id)
      const confirmed = myLeads.filter(l => l.status === "confirmed")
      return {
        ...member,
        totalLeads: myLeads.length,
        confirmed:  confirmed.length,
        secured:    confirmed.reduce((s, l) => s + l.deal_value, 0),
      }
    }), [leads, adminTeam]
  )

  const chartData = adminTeam.map(m => {
    const mine = leads.filter(l => l.assigned_to === m.id)
    return {
      name:      m.name.split(" ")[0],
      leads:     mine.length,
      confirmed: mine.filter(l => l.status === "confirmed").length,
    }
  })

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader size={24} color="var(--text-3)" strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading console…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1500, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Admin · Operations Console</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Operations Console</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{stats.assigned} of {stats.total} leads assigned · {stats.confirmed} confirmed</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: teamLocked ? "var(--danger-bg)" : "var(--success-bg)", border: `1px solid ${teamLocked ? "var(--danger-edge)" : "var(--success-edge)"}`, borderRadius: "var(--r-md)" }}>
            {teamLocked ? <Lock size={12} color="var(--danger)" /> : <Unlock size={12} color="var(--success)" />}
            <span style={{ fontSize: 11, fontWeight: 700, color: teamLocked ? "var(--danger)" : "var(--success)" }}>{teamLocked ? "Team Locked" : "Team Active"}</span>
          </div>
          <button className={teamLocked ? "btn-gold" : "btn-danger"} onClick={() => setShowConfirm(true)} style={{ fontSize: 11 }}>
            {teamLocked ? <Unlock size={13} /> : <Lock size={13} />}
            {teamLocked ? "Unlock Team" : "Lock Team"}
          </button>
        </div>
      </motion.div>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Leads",     value: stats.total,     icon: <Target size={16} strokeWidth={1.5} />,     color: "#60A5FA", sub: `${stats.total - stats.assigned} unassigned` },
          { label: "Assigned",        value: stats.assigned,  icon: <Users size={16} strokeWidth={1.5} />,      color: "#C9A24B", sub: `${Math.round(stats.assigned / Math.max(stats.total, 1) * 100)}% coverage` },
          { label: "Confirmed",       value: stats.confirmed, icon: <CheckCircle size={16} strokeWidth={1.5} />, color: "#4ADE80", sub: `${Math.round(stats.confirmed / Math.max(stats.total, 1) * 100)}% win rate` },
          { label: "Revenue Secured", value: stats.secured,   icon: <TrendingUp size={16} strokeWidth={1.5} />, color: "#A78BFA", prefix: "₹", format: (v: number) => v.toLocaleString("en-IN"), sub: `of ₹${CLUB.target.toLocaleString("en-IN")} target` },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="kpi-card">
            <div style={{ position: "absolute", top: 0, left: 0, width: 36, height: 2.5, background: kpi.color, borderRadius: "18px 0 3px 0" }} />
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${kpi.color}18`, border: `1px solid ${kpi.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: kpi.color, marginBottom: 12 }}>{kpi.icon}</div>
            <div className="g-label" style={{ marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>
              {kpi.prefix}{kpi.format ? kpi.format(kpi.value) : kpi.value.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 4 }}>{kpi.sub}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Team Performance Table */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--brand-edge)" }}>
              <div className="g-label">Team Performance</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="g-table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Leads</th>
                    <th>Confirmed</th>
                    <th>Secured</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {team.map((m, i) => (
                    <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${m.color}18`, border: `1px solid ${m.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: m.color }}>{m.initials}</div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{m.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-3)" }}>{m.role}</td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{m.totalLeads}</td>
                      <td><span className="badge badge-green" style={{ fontSize: 9 }}>{m.confirmed}</span></td>
                      <td style={{ fontSize: 12, color: "#C9A24B", fontWeight: 700 }}>₹{m.secured.toLocaleString("en-IN")}</td>
                      <td style={{ minWidth: 100 }}>
                        <div className="g-bar-bg">
                          <motion.div className="g-bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(100, (m.totalLeads / Math.max(...team.map(t => t.totalLeads), 1)) * 100)}%` }} transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1], delay: i * 0.05 }} />
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel">
            <div className="g-label" style={{ marginBottom: 14 }}>Leads per Team Member</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,75,0.06)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "var(--text-3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="leads"     fill="#C9A24B" radius={[5, 5, 0, 0]} name="Leads" />
                <Bar dataKey="confirmed" fill="#4ADE80" radius={[5, 5, 0, 0]} name="Confirmed" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Right */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Real Activity Feed from Audit Log */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="panel" style={{ flex: 1 }}>
            <div className="g-label" style={{ marginBottom: 14 }}>Activity Log</div>
            {audit.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>No activity recorded yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {audit.map((entry, i) => (
                  <motion.div key={entry.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 + 0.3 }}
                    style={{ padding: "11px 0", borderBottom: i < audit.length - 1 ? "1px solid rgba(201,162,75,0.06)" : "none", display: "flex", gap: 11, alignItems: "flex-start" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--glass-2)", border: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {actionIcon(entry.action)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 500, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.detail}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>{entry.actor_name} · {relativeTime(entry.ts)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Alerts */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>Active Alerts</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ALERTS.filter(a => !a.ack).slice(0, 3).map(alert => (
                <div key={alert.id} style={{ padding: "10px 12px", background: alert.severity === "critical" ? "var(--danger-bg)" : alert.severity === "warning" ? "var(--warning-bg)" : "var(--info-bg)", border: `1px solid ${alert.severity === "critical" ? "var(--danger-edge)" : alert.severity === "warning" ? "var(--warning-edge)" : "var(--info-edge)"}`, borderRadius: "var(--r-md)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <AlertTriangle size={13} color={alert.severity === "critical" ? "var(--danger)" : alert.severity === "warning" ? "var(--warning)" : "var(--info)"} strokeWidth={1.6} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)" }}>{alert.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{alert.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lock Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowConfirm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} className="panel" style={{ width: 360, padding: 26 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                {teamLocked ? <Unlock size={20} color="#C9A24B" /> : <Lock size={20} color="var(--danger)" />}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{teamLocked ? "Unlock Team Dashboard?" : "Lock Team Dashboard?"}</div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4, lineHeight: 1.6 }}>{teamLocked ? "Team members will regain access immediately." : "All team members will see a locked screen."}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setShowConfirm(false)} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>Cancel</button>
                <button className={teamLocked ? "btn-gold" : "btn-danger"} onClick={() => { setTeamLocked(!teamLocked); setShowConfirm(false) }} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>
                  {teamLocked ? "Unlock" : "Lock"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
