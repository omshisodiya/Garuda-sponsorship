"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, Lock, Unlock, Activity, Target, TrendingUp,
  PhoneCall, Mail, AlertTriangle, CheckCircle, Loader, Trophy,
  Inbox, Trash2, ArrowUpRight, Plus,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts"
import { useSecurityStore } from "../lib/securityStore"
import { TEAM, ALERTS, CLUB } from "../lib/data"
import type { Lead } from "../lib/data"
import type { AuditEntry } from "../lib/server/store"

type LbEntry  = { id: string; name: string; initials: string; color: string; xp: number; leadXp: number; missionXp: number }
type LbMeta   = { resetMessage: string; resetAt: string | null }
type IntakeLead = {
  id: string; name: string; company: string; phone: string; email: string
  notes: string; submitted_by: string; submitted_by_name: string
  status: "new" | "working" | "dead" | "graduated"
  graduated_lead_id: string | null; created_at: string
}

const INTAKE_BADGE: Record<string, string> = {
  new: "badge-blue", working: "badge-gold", dead: "badge-red", graduated: "badge-green",
}

function actionIcon(action: string) {
  if (action.includes("password"))     return <Lock      size={12} color="var(--warning)"  strokeWidth={1.6} />
  if (action.includes("lead_created")) return <Target    size={12} color="var(--info)"     strokeWidth={1.6} />
  if (action.includes("lead_updated")) return <Activity  size={12} color="#A78BFA"          strokeWidth={1.6} />
  if (action.includes("login"))        return <Users     size={12} color="var(--success)"  strokeWidth={1.6} />
  if (action.includes("role"))         return <TrendingUp size={12} color="var(--warning)" strokeWidth={1.6} />
  if (action.includes("intake"))       return <Inbox     size={12} color="#60A5FA"          strokeWidth={1.6} />
  return                                      <Mail      size={12} color="var(--text-3)"   strokeWidth={1.6} />
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
  const router = useRouter()
  const { teamLocked, setTeamLocked } = useSecurityStore()

  const [showConfirm,   setShowConfirm]   = useState(false)
  const [leads,         setLeads]         = useState<Lead[]>([])
  const [audit,         setAudit]         = useState<AuditEntry[]>([])
  const [leaderboard,   setLeaderboard]   = useState<LbEntry[]>([])
  const [lbMeta,        setLbMeta]        = useState<LbMeta>({ resetMessage: "", resetAt: null })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading,       setLoading]       = useState(true)

  // intake
  const [intakeLeads,    setIntakeLeads]    = useState<IntakeLead[]>([])
  const [intakeTarget,   setIntakeTarget]   = useState(0)
  const [myIntakeCount,  setMyIntakeCount]  = useState(0)
  const [intakeFilter,   setIntakeFilter]   = useState<"all" | "new" | "working" | "dead" | "graduated">("all")
  const [graduateConfirm, setGraduateConfirm] = useState<string | null>(null)
  const [deleteConfirm,   setDeleteConfirm]   = useState<string | null>(null)
  const [intakeWorking,   setIntakeWorking]   = useState<string | null>(null)
  const [leadView,        setLeadView]        = useState<"new" | "old">("new")

  const LEGACY_CUTOFF = "2026-05-18"

  const viewLeads = useMemo(() =>
    leads.filter(l => leadView === "new" ? l.created_at >= LEGACY_CUTOFF : l.created_at < LEGACY_CUTOFF)
  , [leads, leadView, LEGACY_CUTOFF])

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, auditRes, lbRes, meRes, intakeRes, targetsRes] = await Promise.all([
          fetch("/api/leads"),
          fetch("/api/audit?limit=10"),
          fetch("/api/leaderboard"),
          fetch("/api/auth/me"),
          fetch("/api/intake"),
          fetch("/api/intake/targets"),
        ])
        if (leadsRes.ok)   setLeads((await leadsRes.json()).leads ?? [])
        if (auditRes.ok)   setAudit((await auditRes.json()).entries ?? [])
        if (lbRes.ok) {
          const d = await lbRes.json()
          setLeaderboard(d.ranked ?? [])
          setLbMeta({ resetMessage: d.resetMessage ?? "", resetAt: d.resetAt ?? null })
        }
        let uid: string | null = null
        if (meRes.ok) { uid = (await meRes.json()).user?.id ?? null; setCurrentUserId(uid) }
        let allIntake: IntakeLead[] = []
        if (intakeRes.ok) { allIntake = (await intakeRes.json()).leads ?? []; setIntakeLeads(allIntake) }
        if (uid) {
          setMyIntakeCount(allIntake.filter(l => l.submitted_by === uid).length)
          if (targetsRes.ok) { const { targets } = await targetsRes.json(); setIntakeTarget(targets?.[uid] ?? 0) }
        }
      } catch { /* silent */ } finally { setLoading(false) }
    }
    load()
  }, [])

  const stats = useMemo(() => {
    const confirmed = viewLeads.filter(l => l.status === "confirmed")
    return {
      total:     viewLeads.length,
      assigned:  viewLeads.filter(l => l.assigned_to !== null).length,
      confirmed: confirmed.length,
      secured:   confirmed.reduce((s, l) => s + l.deal_value, 0),
    }
  }, [viewLeads])

  const adminTeam = TEAM.filter(m => m.tier !== "superadmin")

  const team = useMemo(() =>
    adminTeam.map(member => {
      const myLeads   = viewLeads.filter(l => l.assigned_to === member.id)
      const confirmed = myLeads.filter(l => l.status === "confirmed")
      return { ...member, totalLeads: myLeads.length, confirmed: confirmed.length, secured: confirmed.reduce((s, l) => s + l.deal_value, 0) }
    }), [viewLeads, adminTeam]
  )

  const chartData = adminTeam.map(m => {
    const mine = viewLeads.filter(l => l.assigned_to === m.id)
    return { name: m.name.split(" ")[0], leads: mine.length, confirmed: mine.filter(l => l.status === "confirmed").length }
  })

  const filteredIntake = useMemo(() =>
    intakeFilter === "all" ? intakeLeads : intakeLeads.filter(l => l.status === intakeFilter)
  , [intakeLeads, intakeFilter])

  const intakePending = intakeLeads.filter(l => l.status === "new").length

  // ── Intake actions ─────────────────────────────────────────────────────────
  async function handleGraduate(id: string) {
    setIntakeWorking(id)
    try {
      const res = await fetch(`/api/intake/${id}/graduate`, { method: "POST" })
      if (res.ok) {
        setIntakeLeads(prev => prev.map(l => l.id === id ? { ...l, status: "graduated" } : l))
        setGraduateConfirm(null)
      }
    } catch { /* silent */ } finally { setIntakeWorking(null) }
  }

  async function handleIntakeDelete(id: string) {
    setIntakeWorking(id)
    try {
      const res = await fetch(`/api/intake/${id}`, { method: "DELETE" })
      if (res.ok) {
        setIntakeLeads(prev => prev.filter(l => l.id !== id))
        setDeleteConfirm(null)
      }
    } catch { /* silent */ } finally { setIntakeWorking(null) }
  }

  async function handleIntakeStatus(id: string, status: string) {
    setIntakeWorking(id)
    try {
      const res = await fetch(`/api/intake/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) setIntakeLeads(prev => prev.map(l => l.id === id ? { ...l, status: status as IntakeLead["status"] } : l))
    } catch { /* silent */ } finally { setIntakeWorking(null) }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
      <Loader size={24} color="var(--text-3)" strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading console…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

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

      {/* Intake submission banner — always visible for admins */}
      {(() => {
        const hasTarget = intakeTarget > 0
        const pct  = hasTarget ? Math.min(100, Math.round(myIntakeCount / intakeTarget * 100)) : 0
        const done = hasTarget && myIntakeCount >= intakeTarget
        return (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 18, padding: "14px 20px", borderRadius: "var(--r-lg)", border: `1px solid ${done ? "rgba(74,222,128,0.35)" : "rgba(201,162,75,0.35)"}`, background: done ? "rgba(74,222,128,0.06)" : "rgba(201,162,75,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasTarget ? 10 : 0, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Inbox size={15} color={done ? "#4ADE80" : "#C9A24B"} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                    Your Lead Submission Target
                    {done && <span style={{ marginLeft: 8, fontSize: 10, color: "#4ADE80", fontWeight: 700 }}>✓ Complete!</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                    {!hasTarget
                      ? `${myIntakeCount} lead${myIntakeCount !== 1 ? "s" : ""} submitted · no target assigned yet`
                      : done
                        ? `You've hit your target of ${intakeTarget} leads`
                        : `${intakeTarget - myIntakeCount} more lead${intakeTarget - myIntakeCount !== 1 ? "s" : ""} to reach your target of ${intakeTarget}`}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: 22, fontWeight: 900, color: done ? "#4ADE80" : "#C9A24B", fontVariantNumeric: "tabular-nums" }}>{myIntakeCount}</span>
                  {hasTarget && <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>/{intakeTarget}</span>}
                </div>
                <button onClick={() => router.push("/team")}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "var(--r-md)", border: `1px solid ${done ? "rgba(74,222,128,0.4)" : "rgba(201,162,75,0.4)"}`, background: done ? "rgba(74,222,128,0.1)" : "rgba(201,162,75,0.1)", color: done ? "#4ADE80" : "#C9A24B", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  <Plus size={12} /> Add Lead
                </button>
              </div>
            </div>
            {hasTarget && (
              <>
                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.4,0,0.2,1] }}
                    style={{ height: "100%", borderRadius: 100, background: done ? "linear-gradient(90deg,#4ADE80,#22D3EE)" : "linear-gradient(90deg,#C9A24B,#F472B6)" }} />
                </div>
                {!done && <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-3)" }}>{pct}% complete</div>}
              </>
            )}
          </motion.div>
        )
      })()}

      {/* New / Old toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 16, background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", overflow: "hidden", width: "fit-content" }}>
        {(["new", "old"] as const).map(v => {
          const count = leads.filter(l => v === "new" ? l.created_at >= LEGACY_CUTOFF : l.created_at < LEGACY_CUTOFF).length
          return (
            <button key={v} onClick={() => setLeadView(v)}
              style={{ padding: "9px 20px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 7,
                background: leadView === v ? "rgba(201,162,75,0.12)" : "transparent",
                color: leadView === v ? "#C9A24B" : "var(--text-3)",
                borderRight: v === "new" ? "1px solid var(--brand-edge)" : "none" }}>
              {v === "new" ? "New Leads" : "Old Leads"}
              <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 20, background: leadView === v ? "rgba(201,162,75,0.2)" : "rgba(255,255,255,0.06)", color: leadView === v ? "#C9A24B" : "var(--text-3)", fontWeight: 800 }}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Leads",     value: stats.total,     icon: <Target      size={16} strokeWidth={1.5} />, color: "#60A5FA", sub: `${stats.total - stats.assigned} unassigned` },
          { label: "Assigned",        value: stats.assigned,  icon: <Users       size={16} strokeWidth={1.5} />, color: "#C9A24B", sub: `${Math.round(stats.assigned / Math.max(stats.total, 1) * 100)}% coverage` },
          { label: "Confirmed",       value: stats.confirmed, icon: <CheckCircle size={16} strokeWidth={1.5} />, color: "#4ADE80", sub: `${Math.round(stats.confirmed / Math.max(stats.total, 1) * 100)}% win rate` },
          { label: "Revenue Secured", value: stats.secured,   icon: <TrendingUp  size={16} strokeWidth={1.5} />, color: "#A78BFA", prefix: "₹", format: (v: number) => v.toLocaleString("en-IN"), sub: `of ₹${CLUB.target.toLocaleString("en-IN")} target` },
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

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--brand-edge)" }}>
              <div className="g-label">Team Performance</div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="g-table">
                <thead>
                  <tr><th>Member</th><th>Role</th><th>Leads</th><th>Confirmed</th><th>Secured</th><th>Progress</th></tr>
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

          {/* XP Leaderboard */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            className="panel" style={{ flex: 1, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={13} color="#C9A24B" strokeWidth={1.6} />
                <div className="g-label">XP Leaderboard</div>
              </div>
              <button className="btn-gold" onClick={() => router.push("/missions")} style={{ fontSize: 9, padding: "5px 10px" }}>Go to Missions</button>
            </div>
            {lbMeta.resetMessage && (
              <div style={{ padding: "7px 18px", background: "rgba(167,139,250,0.08)", borderBottom: "1px solid rgba(167,139,250,0.18)", fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>
                {lbMeta.resetMessage}
              </div>
            )}
            <div style={{ maxHeight: 340, overflowY: "auto" }}>
              {leaderboard.map((m, i) => {
                const rank = i + 1
                const isMe = m.id === currentUserId
                const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`
                return (
                  <motion.div key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 18px", borderBottom: "1px solid rgba(201,162,75,0.05)", background: isMe ? "rgba(201,162,75,0.07)" : "transparent" }}>
                    <div style={{ width: 22, fontSize: rank <= 3 ? 14 : 10, fontWeight: 800, color: "var(--text-3)", textAlign: "center", flexShrink: 0 }}>{rankLabel}</div>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: `${m.color}18`, border: `1px solid ${isMe ? m.color : m.color + "30"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: m.color, flexShrink: 0 }}>{m.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: isMe ? 700 : 600, color: isMe ? "var(--text-brand)" : "var(--text-1)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.name}{isMe ? " (you)" : ""}
                      </div>
                      <div className="g-bar-bg">
                        <motion.div className="g-bar-fill" initial={{ width: 0 }} animate={{ width: `${m.xp > 0 ? (m.xp / Math.max(leaderboard[0]?.xp ?? 1, 1)) * 100 : 0}%` }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: i * 0.03 }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.xp > 0 ? "#C9A24B" : "var(--text-3)", flexShrink: 0, fontVariantNumeric: "tabular-nums", minWidth: 42, textAlign: "right" }}>{m.xp} XP</div>
                  </motion.div>
                )
              })}
            </div>
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

      {/* Activity Log */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="panel" style={{ marginTop: 18, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 22px 12px", borderBottom: "1px solid var(--brand-edge)" }}>
          <div className="g-label">Activity Log</div>
        </div>
        {audit.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>No activity recorded yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))" }}>
            {audit.map((entry, i) => (
              <motion.div key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 + 0.4 }}
                style={{ padding: "12px 22px", borderBottom: "1px solid rgba(201,162,75,0.05)", borderRight: "1px solid rgba(201,162,75,0.05)", display: "flex", gap: 11, alignItems: "flex-start" }}>
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

      {/* ── Intake Queue ───────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="panel" style={{ marginTop: 18, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 22px 10px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Inbox size={14} color="#60A5FA" strokeWidth={1.6} />
            <div className="g-label">Intake Queue</div>
            {intakePending > 0 && (
              <span style={{ background: "#60A5FA18", color: "#60A5FA", border: "1px solid #60A5FA30", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                {intakePending} new
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["all", "new", "working", "dead", "graduated"] as const).map(f => (
              <button key={f} onClick={() => setIntakeFilter(f)}
                style={{ fontSize: 9, padding: "4px 10px", borderRadius: "var(--r-sm)", cursor: "pointer", border: `1px solid ${intakeFilter === f ? "var(--brand-edge)" : "transparent"}`, background: intakeFilter === f ? "rgba(201,162,75,0.1)" : "transparent", color: intakeFilter === f ? "#C9A24B" : "var(--text-3)", fontWeight: intakeFilter === f ? 700 : 500 }}>
                {f === "all" ? `All (${intakeLeads.length})` : `${f[0].toUpperCase()}${f.slice(1)} (${intakeLeads.filter(l => l.status === f).length})`}
              </button>
            ))}
          </div>
        </div>

        {filteredIntake.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            {intakeLeads.length === 0 ? "No leads submitted to intake yet." : `No ${intakeFilter} leads`}
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="g-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Submitted By</th>
                  <th>Date</th>
                  <th style={{ minWidth: 200 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredIntake.map((lead, i) => {
                  const isWorking = intakeWorking === lead.id
                  const showGraduateConfirm = graduateConfirm === lead.id
                  const showDeleteConfirm   = deleteConfirm === lead.id
                  return (
                    <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <td>
                        <span className={`badge ${INTAKE_BADGE[lead.status]}`} style={{ fontSize: 9 }}>{lead.status}</span>
                      </td>
                      <td style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{lead.name}</td>
                      <td style={{ fontSize: 12, color: "var(--text-2)" }}>{lead.company || "—"}</td>
                      <td>
                        {lead.phone
                          ? <button className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => window.open(`tel:${lead.phone}`)}><PhoneCall size={10} /> {lead.phone}</button>
                          : <span style={{ color: "var(--text-3)", fontSize: 11 }}>—</span>}
                      </td>
                      <td>
                        {lead.email
                          ? <button className="btn-ghost" style={{ fontSize: 10, padding: "3px 8px" }} onClick={() => window.open(`mailto:${lead.email}`)}><Mail size={10} /> {lead.email}</button>
                          : <span style={{ color: "var(--text-3)", fontSize: 11 }}>—</span>}
                      </td>
                      <td style={{ fontSize: 11, color: "var(--text-3)" }}>{lead.submitted_by_name}</td>
                      <td style={{ fontSize: 11, color: "var(--text-3)" }}>{relativeTime(lead.created_at)}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap" }}>
                          {isWorking ? (
                            <Loader size={12} color="var(--text-3)" style={{ animation: "spin 1s linear infinite" }} />
                          ) : showGraduateConfirm ? (
                            <>
                              <span style={{ fontSize: 10, color: "var(--text-3)", marginRight: 2 }}>Graduate?</span>
                              <button className="btn-gold" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => handleGraduate(lead.id)}>Yes</button>
                              <button className="btn-ghost" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => setGraduateConfirm(null)}>No</button>
                            </>
                          ) : showDeleteConfirm ? (
                            <>
                              <span style={{ fontSize: 10, color: "var(--danger)", marginRight: 2 }}>Delete?</span>
                              <button className="btn-danger" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => handleIntakeDelete(lead.id)}>Yes</button>
                              <button className="btn-ghost" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => setDeleteConfirm(null)}>No</button>
                            </>
                          ) : (
                            <>
                              {lead.status !== "graduated" && (
                                <button className="btn-gold" style={{ fontSize: 9, padding: "3px 8px" }} onClick={() => { setGraduateConfirm(lead.id); setDeleteConfirm(null) }}>
                                  <ArrowUpRight size={10} /> Graduate
                                </button>
                              )}
                              {lead.status === "new" && (
                                <button className="btn-ghost" style={{ fontSize: 9, padding: "3px 8px", color: "#C9A24B" }} onClick={() => handleIntakeStatus(lead.id, "working")}>
                                  Working
                                </button>
                              )}
                              {lead.status === "working" && (
                                <button className="btn-ghost" style={{ fontSize: 9, padding: "3px 8px", color: "var(--danger)" }} onClick={() => handleIntakeStatus(lead.id, "dead")}>
                                  Dead
                                </button>
                              )}
                              {lead.status === "dead" && (
                                <button className="btn-ghost" style={{ fontSize: 9, padding: "3px 8px", color: "#60A5FA" }} onClick={() => handleIntakeStatus(lead.id, "new")}>
                                  Reopen
                                </button>
                              )}
                              <button className="btn-ghost" style={{ fontSize: 9, padding: "3px 6px", color: "var(--danger)" }} onClick={() => { setDeleteConfirm(lead.id); setGraduateConfirm(null) }}>
                                <Trash2 size={10} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

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
