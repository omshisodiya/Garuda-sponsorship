"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Inbox, Target, TrendingUp, CheckCircle, XCircle, Clock, Users, ArrowUpDown, Pencil, Check, X as XIcon, Shuffle } from "lucide-react"

type UserProgress = {
  id: string
  name: string
  role: string
  initials: string
  color: string
  intakeTarget: number
  intakeTotal: number
  intakeNew: number
  intakeWorking: number
  intakeDead: number
  intakeGraduated: number
  intakeXp: number
  leadsTotal: number
  leadsNotStarted: number
  leadsContacted: number
  leadsFollowedUp: number
  leadsInDiscussion: number
  leadsConfirmed: number
  leadsRejected: number
  leadsWorked: number
}

type SortKey = "name" | "intakeTotal" | "intakeGraduated" | "leadsTotal" | "leadsWorked" | "leadsConfirmed"

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  superadmin: { label: "Super Admin", color: "#E879F9" },
  admin:      { label: "Admin",       color: "#FBBF24" },
  team:       { label: "Team",        color: "#60A5FA" },
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round(value / max * 100))
  return (
    <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden", flex: 1 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ height: "100%", background: color, borderRadius: 100 }}
      />
    </div>
  )
}

function ProgressRing({ value, max, color, size = 56 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const pct = max === 0 ? 0 : Math.min(1, value / max)
  const dash = pct * circ
  return (
    <svg width={size} height={size} style={{ flexShrink: 0, transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={5}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      />
    </svg>
  )
}

export default function ProgressPage() {
  const [stats,      setStats]      = useState<UserProgress[]>([])
  const [loading,    setLoading]    = useState(true)
  const [role,       setRole]       = useState<string>(() =>
    typeof window !== "undefined" ? (sessionStorage.getItem("g_role") ?? "team") : "team"
  )
  const [filter,     setFilter]     = useState<"all" | "team" | "admin">("all")
  const [sortKey,    setSortKey]    = useState<SortKey>("intakeTotal")
  const [sortDesc,   setSortDesc]   = useState(true)
  const [editTarget,   setEditTarget]   = useState<string | null>(null)
  const [editValue,    setEditValue]    = useState("")
  const [saving,       setSaving]       = useState<Set<string>>(new Set())
  const [bulkOpen,     setBulkOpen]     = useState(false)
  const [bulkTotal,    setBulkTotal]    = useState("")
  const [bulkMode,     setBulkMode]     = useState<"equal" | "weighted">("weighted")
  const [bulkApplying, setBulkApplying] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function loadStats() {
    return fetch("/api/progress")
      .then(res => res.ok ? res.json() : { stats: [] })
      .then(d => setStats(d.stats ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStats()
    // Auto-refresh every 60 s so all users see live updates
    const timer = setInterval(() => loadStats(), 60_000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEdit(userId: string, current: number) {
    setEditTarget(userId)
    setEditValue(current === 0 ? "" : String(current))
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  async function saveTarget(userId: string) {
    const target = Math.max(0, parseInt(editValue) || 0)
    setSaving(prev => new Set(prev).add(userId))
    try {
      const res = await fetch("/api/intake/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, target }),
      })
      if (res.ok) {
        setStats(prev => prev.map(u => u.id === userId ? { ...u, intakeTarget: target } : u))
      }
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(userId); return s })
      setEditTarget(null)
    }
    // Sync in background after save
    loadStats()
  }

  // Weighted role factor — same as assign console
  const ROLE_WEIGHT: Record<string, number> = { team: 1.0, admin: 0.35, superadmin: 0 }

  const bulkEligible = useMemo(
    () => stats.filter(u => u.role !== "superadmin"),
    [stats]
  )

  const bulkPreview = useMemo(() => {
    const total = parseInt(bulkTotal) || 0
    if (total <= 0 || bulkEligible.length === 0) return []

    if (bulkMode === "equal") {
      const each = Math.round(total / bulkEligible.length)
      return bulkEligible.map((u, i) => ({
        ...u,
        newTarget: i === bulkEligible.length - 1 ? total - each * (bulkEligible.length - 1) : each,
      }))
    }

    // Weighted
    const totalWeight = bulkEligible.reduce((s, u) => s + (ROLE_WEIGHT[u.role] ?? 0), 0)
    let distributed = 0
    return bulkEligible.map((u, i) => {
      const weight = ROLE_WEIGHT[u.role] ?? 0
      const newTarget = i === bulkEligible.length - 1
        ? Math.max(0, total - distributed)
        : Math.round(total * weight / totalWeight)
      distributed += newTarget
      return { ...u, newTarget }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulkTotal, bulkMode, bulkEligible])

  async function applyBulkTargets() {
    if (bulkPreview.length === 0) return
    setBulkApplying(true)
    try {
      await Promise.all(
        bulkPreview.map(({ id, newTarget }) =>
          fetch("/api/intake/targets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: id, target: newTarget }),
          }).catch(() => {})
        )
      )
      setStats(prev => prev.map(u => {
        const preview = bulkPreview.find(p => p.id === u.id)
        return preview ? { ...u, intakeTarget: preview.newTarget } : u
      }))
      setBulkOpen(false)
      setBulkTotal("")
      // Re-fetch to confirm server state
      loadStats()
    } finally {
      setBulkApplying(false)
    }
  }

  const isLeader = role === "admin" || role === "superadmin"

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDesc(d => !d)
    else { setSortKey(key); setSortDesc(true) }
  }

  const displayed = useMemo(() => {
    let list = [...stats]
    if (isLeader && filter !== "all") list = list.filter(u => u.role === filter)
    list.sort((a, b) => {
      const diff = (a[sortKey] as number | string) > (b[sortKey] as number | string) ? 1 : -1
      return sortDesc ? -diff : diff
    })
    return list
  }, [stats, filter, sortKey, sortDesc, isLeader])

  const totals = useMemo(() => ({
    intake:    stats.reduce((s, u) => s + u.intakeTotal, 0),
    graduated: stats.reduce((s, u) => s + u.intakeGraduated, 0),
    assigned:  stats.reduce((s, u) => s + u.leadsTotal, 0),
    worked:    stats.reduce((s, u) => s + u.leadsWorked, 0),
    confirmed: stats.reduce((s, u) => s + u.leadsConfirmed, 0),
  }), [stats])

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 24, height: 24, border: "2px solid var(--brand-edge)", borderTopColor: "#C9A24B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <div style={{ fontSize: 12, color: "var(--text-3)" }}>Loading progress…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      style={{ display: "flex", alignItems: "center", gap: 4, padding: "6px 11px", borderRadius: "var(--r-sm)", border: `1px solid ${sortKey === k ? "rgba(201,162,75,0.4)" : "var(--brand-edge)"}`, background: sortKey === k ? "rgba(201,162,75,0.1)" : "transparent", color: sortKey === k ? "#C9A24B" : "var(--text-3)", fontSize: 10, fontWeight: sortKey === k ? 700 : 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
    >
      {label} <ArrowUpDown size={9} />
    </button>
  )

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Progress · Activity Tracker</div>
        <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: "0 0 4px" }}>Lead Progress Board</h1>
        <p style={{ color: "var(--text-3)", fontSize: 12, margin: 0 }}>Track who added leads, how many graduated, and how many assigned leads are being worked on</p>
      </motion.div>

      {/* Row: filter + Auto-Set Targets button */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        {isLeader ? (
          <div style={{ display: "flex", gap: 0, background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", overflow: "hidden", flexShrink: 0 }}>
            {(["all", "team", "admin"] as const).map((f, i) => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: "8px 16px", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: filter === f ? "rgba(201,162,75,0.12)" : "transparent",
                  color: filter === f ? "#C9A24B" : "var(--text-3)",
                  borderRight: i < 2 ? "1px solid var(--brand-edge)" : "none" }}>
                {f === "all" ? "All" : f === "team" ? "Team" : "Admins"}
              </button>
            ))}
          </div>
        ) : <div />}
        {isLeader && (
          <button
            onClick={() => { setBulkOpen(true); setBulkTotal("") }}
            style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: "var(--r-md)", border: "1px solid rgba(201,162,75,0.5)", background: "rgba(201,162,75,0.12)", color: "#C9A24B", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, whiteSpace: "nowrap" }}
          >
            <Shuffle size={13} /> Auto-Set Targets
          </button>
        )}
      </div>

      {/* Summary KPI row — leaders only */}
      {isLeader && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 12, marginBottom: 18 }}>
          {[
            { label: "Total Submitted",   value: totals.intake,    icon: Inbox,       color: "#60A5FA" },
            { label: "Graduated to Vault",value: totals.graduated, icon: CheckCircle, color: "#4ADE80" },
            { label: "Leads Assigned",    value: totals.assigned,  icon: Users,       color: "#C9A24B" },
            { label: "Leads Worked",      value: totals.worked,    icon: TrendingUp,  color: "#A78BFA" },
            { label: "Deals Confirmed",   value: totals.confirmed, icon: Target,      color: "#FB923C" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label}
              style={{ padding: "14px 16px", background: "var(--glass-1)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-lg)", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon size={13} color={color} />
                <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sort row */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <span style={{ fontSize: 10, color: "var(--text-3)", alignSelf: "center", marginRight: 2 }}>Sort:</span>
        <SortBtn k="intakeTotal"     label="Submitted" />
        <SortBtn k="intakeGraduated" label="Graduated" />
        <SortBtn k="leadsTotal"      label="Assigned" />
        <SortBtn k="leadsWorked"     label="Worked" />
        <SortBtn k="leadsConfirmed"  label="Confirmed" />
        <SortBtn k="name"            label="Name" />
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))", gap: 14 }}>
        {displayed.map((u, i) => {
          const rb = ROLE_BADGE[u.role] ?? ROLE_BADGE.team
          const intakeActivePct = u.intakeTotal === 0 ? 0 : Math.round((u.intakeGraduated + u.intakeWorking) / u.intakeTotal * 100)
          const leadsWorkedPct  = u.leadsTotal === 0 ? 0 : Math.round(u.leadsWorked / u.leadsTotal * 100)

          return (
            <motion.div key={u.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.28 }}
              className="panel"
              style={{ padding: 18 }}
            >
              {/* User header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${u.color}20`, border: `1.5px solid ${u.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: u.color, flexShrink: 0 }}>
                  {u.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</div>
                  <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 100, background: `${rb.color}18`, border: `1px solid ${rb.color}30`, color: rb.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{rb.label}</span>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 2 }}>Intake XP</div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#C9A24B", fontVariantNumeric: "tabular-nums" }}>{u.intakeXp}</div>
                </div>
              </div>

              {/* Intake section */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Inbox size={12} color="#60A5FA" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Leads Submitted to Intake</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>
                      {u.intakeTotal}{u.intakeTarget > 0 && <span style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>/{u.intakeTarget}</span>}
                    </span>
                    {/* Target edit — leaders only */}
                    {isLeader && (
                      editTarget === u.id ? (
                        <AnimatePresence>
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                              ref={inputRef}
                              type="number" min="0" max="9999"
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter") saveTarget(u.id); if (e.key === "Escape") setEditTarget(null) }}
                              style={{ width: 54, padding: "3px 7px", borderRadius: "var(--r-sm)", border: "1px solid rgba(201,162,75,0.5)", background: "rgba(201,162,75,0.08)", color: "var(--text-1)", fontSize: 11, fontFamily: "inherit", outline: "none" }}
                              placeholder="target"
                            />
                            <button onClick={() => saveTarget(u.id)} disabled={saving.has(u.id)}
                              style={{ width: 22, height: 22, borderRadius: "var(--r-sm)", border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.1)", color: "#4ADE80", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Check size={11} />
                            </button>
                            <button onClick={() => setEditTarget(null)}
                              style={{ width: 22, height: 22, borderRadius: "var(--r-sm)", border: "1px solid rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.08)", color: "#F87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <XIcon size={11} />
                            </button>
                          </motion.div>
                        </AnimatePresence>
                      ) : (
                        <button onClick={() => startEdit(u.id, u.intakeTarget)}
                          title="Set lead submission target"
                          style={{ width: 22, height: 22, borderRadius: "var(--r-sm)", border: "1px solid var(--brand-edge)", background: "transparent", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.14s" }}>
                          <Pencil size={10} />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Target progress bar */}
                {u.intakeTarget > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>Target Progress</span>
                      <span style={{ fontSize: 9, color: u.intakeTotal >= u.intakeTarget ? "#4ADE80" : "#C9A24B", fontWeight: 700 }}>
                        {Math.min(100, Math.round(u.intakeTotal / u.intakeTarget * 100))}%
                        {u.intakeTotal >= u.intakeTarget && " ✓"}
                      </span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, u.intakeTotal / u.intakeTarget * 100)}%` }}
                        transition={{ duration: 0.8, ease: [0.4,0,0.2,1] }}
                        style={{ height: "100%", borderRadius: 100, background: u.intakeTotal >= u.intakeTarget ? "linear-gradient(90deg,#4ADE80,#22D3EE)" : "linear-gradient(90deg,#C9A24B,#F472B6)" }}
                      />
                    </div>
                    {u.intakeTotal < u.intakeTarget && (
                      <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 3 }}>
                        {u.intakeTarget - u.intakeTotal} more needed to hit target
                      </div>
                    )}
                  </div>
                )}

                {u.intakeTotal > 0 && (
                  <>
                    {/* Segmented bar */}
                    <div style={{ display: "flex", height: 7, borderRadius: 100, overflow: "hidden", gap: 1, marginBottom: 8 }}>
                      {[
                        { val: u.intakeGraduated, color: "#4ADE80" },
                        { val: u.intakeWorking,   color: "#C9A24B" },
                        { val: u.intakeNew,       color: "#60A5FA" },
                        { val: u.intakeDead,      color: "#F87171" },
                      ].map(({ val, color }, si) => {
                        const w = u.intakeTotal === 0 ? 0 : (val / u.intakeTotal) * 100
                        return w > 0 ? (
                          <motion.div key={si}
                            initial={{ flex: 0 }} animate={{ flex: w }}
                            transition={{ duration: 0.6, delay: 0.1 + si * 0.05 }}
                            style={{ background: color, minWidth: 0 }}
                          />
                        ) : null
                      })}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {[
                        { label: "Graduated", val: u.intakeGraduated, color: "#4ADE80" },
                        { label: "Working",   val: u.intakeWorking,   color: "#C9A24B" },
                        { label: "New",       val: u.intakeNew,       color: "#60A5FA" },
                        { label: "Dead",      val: u.intakeDead,      color: "#F87171" },
                      ].filter(x => x.val > 0).map(({ label, val, color }) => (
                        <span key={label} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-3)" }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                          {label} <strong style={{ color: "var(--text-2)" }}>{val}</strong>
                        </span>
                      ))}
                    </div>
                  </>
                )}
                {u.intakeTotal === 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
                    {u.intakeTarget > 0 ? `0 / ${u.intakeTarget} — target not started yet` : "No leads submitted yet"}</div>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "var(--brand-edge)", marginBottom: 14 }} />

              {/* Assigned leads section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Target size={12} color="#C9A24B" />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)" }}>Assigned Leads</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{u.leadsTotal}</span>
                </div>
                {u.leadsTotal > 0 && (
                  <>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                      <MiniBar value={u.leadsWorked} max={u.leadsTotal} color="#A78BFA" />
                      <span style={{ fontSize: 10, color: "var(--text-3)", flexShrink: 0 }}>{leadsWorkedPct}% worked</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                      {[
                        { label: "Not Started",  val: u.leadsNotStarted,   color: "var(--text-3)", icon: Clock       },
                        { label: "Contacted",    val: u.leadsContacted,    color: "#60A5FA",        icon: TrendingUp  },
                        { label: "Follow Up",    val: u.leadsFollowedUp,   color: "#FBBF24",        icon: TrendingUp  },
                        { label: "In Discussion",val: u.leadsInDiscussion, color: "#A78BFA",        icon: TrendingUp  },
                        { label: "Confirmed",    val: u.leadsConfirmed,    color: "#4ADE80",        icon: CheckCircle },
                        { label: "Rejected",     val: u.leadsRejected,     color: "#F87171",        icon: XCircle     },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={{ padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "var(--r-sm)", textAlign: "center" }}>
                          <div style={{ fontSize: 16, fontWeight: 900, color, fontVariantNumeric: "tabular-nums" }}>{val}</div>
                          <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {u.leadsTotal === 0 && (
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>No leads assigned yet</div>
                )}
              </div>

              {/* Bottom summary strip */}
              {(u.intakeTotal > 0 || u.leadsTotal > 0) && (
                <div style={{ marginTop: 14, paddingTop: 10, borderTop: "1px solid var(--brand-edge)", display: "flex", gap: 10, justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
                    <ProgressRing value={u.intakeGraduated} max={u.intakeTotal || 1} color="#4ADE80" size={36} />
                    <div>
                      <div style={{ color: "#4ADE80", fontWeight: 700 }}>{u.intakeTotal === 0 ? 0 : Math.round(u.intakeGraduated / u.intakeTotal * 100)}%</div>
                      <div style={{ color: "var(--text-3)" }}>grad rate</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
                    <ProgressRing value={u.leadsWorked} max={u.leadsTotal || 1} color="#A78BFA" size={36} />
                    <div>
                      <div style={{ color: "#A78BFA", fontWeight: 700 }}>{leadsWorkedPct}%</div>
                      <div style={{ color: "var(--text-3)" }}>lead activity</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10 }}>
                    <ProgressRing value={u.leadsConfirmed} max={u.leadsTotal || 1} color="#FB923C" size={36} />
                    <div>
                      <div style={{ color: "#FB923C", fontWeight: 700 }}>{u.leadsTotal === 0 ? 0 : Math.round(u.leadsConfirmed / u.leadsTotal * 100)}%</div>
                      <div style={{ color: "var(--text-3)" }}>confirmed</div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {displayed.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-3)", fontSize: 13 }}>No data yet</div>
      )}

      {/* ── Auto-Set Targets Modal ──────────────────────────────────────── */}
      <AnimatePresence>
        {bulkOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setBulkOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", zIndex: 500 }}
            />

            {/* Panel — centered in content area (not full viewport) */}
            <div style={{ position: "fixed", inset: 0, paddingLeft: "var(--sidebar-w, 0px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 501, pointerEvents: "none" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -16 }}
              transition={{ duration: 0.2, ease: [0.4,0,0.2,1] }}
              style={{ width: "min(520px,92vw)", background: "var(--bg-2)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-xl)", boxShadow: "var(--shadow-xl)", overflow: "hidden", pointerEvents: "auto" }}
            >
              {/* Header */}
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Shuffle size={14} color="#C9A24B" />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>Auto-Set Submission Targets</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>Distribute a total lead quota across team members</div>
                  </div>
                </div>
                <button onClick={() => setBulkOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}><XIcon size={16} /></button>
              </div>

              <div style={{ padding: "20px 22px" }}>
                {/* Total input */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 7 }}>Total leads to distribute</label>
                  <input
                    type="number" min="1" max="9999"
                    value={bulkTotal}
                    onChange={e => setBulkTotal(e.target.value)}
                    placeholder="e.g. 500"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "var(--r-md)", border: "1px solid var(--brand-edge)", background: "rgba(255,255,255,0.04)", color: "var(--text-1)", fontSize: 16, fontWeight: 700, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Distribution mode */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", display: "block", marginBottom: 9 }}>How to split</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    {([
                      { value: "weighted", label: "Hierarchy weighted", desc: "Team gets more, admin gets less" },
                      { value: "equal",    label: "Equal split",        desc: "Everyone gets the same amount" },
                    ] as const).map(opt => (
                      <button key={opt.value} onClick={() => setBulkMode(opt.value)}
                        style={{ flex: 1, padding: "10px 14px", borderRadius: "var(--r-md)", border: `1px solid ${bulkMode === opt.value ? "rgba(201,162,75,0.5)" : "var(--brand-edge)"}`, background: bulkMode === opt.value ? "rgba(201,162,75,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.14s" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 3 }}>
                          <div style={{ width: 13, height: 13, borderRadius: "50%", border: `2px solid ${bulkMode === opt.value ? "#C9A24B" : "var(--text-3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {bulkMode === opt.value && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A24B" }} />}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: bulkMode === opt.value ? "#C9A24B" : "var(--text-2)" }}>{opt.label}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-3)", paddingLeft: 20 }}>{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview table */}
                {bulkPreview.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-2)", marginBottom: 8 }}>
                      Preview
                      <span style={{ marginLeft: 8, fontSize: 10, color: "var(--text-3)", fontWeight: 400 }}>
                        (total distributed: {bulkPreview.reduce((s, u) => s + u.newTarget, 0)} / {parseInt(bulkTotal) || 0})
                      </span>
                    </div>
                    <div style={{ border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", overflow: "hidden", maxHeight: 260, overflowY: "auto" }}>
                      {bulkPreview.map((u, i) => {
                        const rb = ROLE_BADGE[u.role] ?? ROLE_BADGE.team
                        return (
                          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: i < bulkPreview.length - 1 ? "1px solid var(--brand-edge)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                            <div style={{ width: 26, height: 26, borderRadius: 7, background: `${u.color}20`, border: `1px solid ${u.color}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: u.color, flexShrink: 0 }}>
                              {u.initials}
                            </div>
                            <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name}</span>
                            <span style={{ fontSize: 8, padding: "2px 7px", borderRadius: 100, background: `${rb.color}18`, color: rb.color, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>{rb.label}</span>
                            <span style={{ fontSize: 16, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums", flexShrink: 0, minWidth: 32, textAlign: "right" }}>{u.newTarget}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <button onClick={() => setBulkOpen(false)} className="btn-ghost" style={{ fontSize: 12 }}>Cancel</button>
                  <button
                    onClick={applyBulkTargets}
                    disabled={bulkPreview.length === 0 || bulkApplying}
                    style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 20px", borderRadius: "var(--r-md)", border: "1px solid rgba(201,162,75,0.4)", background: bulkPreview.length === 0 ? "rgba(255,255,255,0.04)" : "rgba(201,162,75,0.14)", color: bulkPreview.length === 0 ? "var(--text-3)" : "#C9A24B", fontSize: 12, fontWeight: 700, cursor: bulkPreview.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
                  >
                    {bulkApplying ? (
                      <><div style={{ width: 12, height: 12, border: "2px solid rgba(201,162,75,0.3)", borderTopColor: "#C9A24B", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /> Applying…</>
                    ) : (
                      <><Check size={13} /> Apply to All</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
