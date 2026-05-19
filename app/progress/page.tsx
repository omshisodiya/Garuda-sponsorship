"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"
import { Inbox, Target, TrendingUp, CheckCircle, XCircle, Clock, Users, ArrowUpDown } from "lucide-react"

type UserProgress = {
  id: string
  name: string
  role: string
  initials: string
  color: string
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
  const [stats,    setStats]    = useState<UserProgress[]>([])
  const [loading,  setLoading]  = useState(true)
  const [role,     setRole]     = useState("team")
  const [filter,   setFilter]   = useState<"all" | "team" | "admin">("all")
  const [sortKey,  setSortKey]  = useState<SortKey>("intakeTotal")
  const [sortDesc, setSortDesc] = useState(true)

  useEffect(() => {
    const r = sessionStorage.getItem("g_role") ?? "team"
    setRole(r)
    fetch("/api/progress")
      .then(res => res.ok ? res.json() : { stats: [] })
      .then(d => setStats(d.stats ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

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

      {/* Summary KPI row — leaders only */}
      {isLeader && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 22 }}>
          {[
            { label: "Total Submitted",   value: totals.intake,    icon: Inbox,       color: "#60A5FA" },
            { label: "Graduated to Vault",value: totals.graduated, icon: CheckCircle, color: "#4ADE80" },
            { label: "Leads Assigned",    value: totals.assigned,  icon: Users,       color: "#C9A24B" },
            { label: "Leads Worked",      value: totals.worked,    icon: TrendingUp,  color: "#A78BFA" },
            { label: "Deals Confirmed",   value: totals.confirmed, icon: Target,      color: "#FB923C" },
          ].map(({ label, value, icon: Icon, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 * i }}
              style={{ padding: "14px 16px", background: "var(--glass-1)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-lg)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon size={13} color={color} />
                <span style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>{label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
        {isLeader && (
          <div style={{ display: "flex", gap: 0, background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
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
        )}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 10, color: "var(--text-3)", alignSelf: "center", marginRight: 2 }}>Sort:</span>
          <SortBtn k="intakeTotal"     label="Submitted" />
          <SortBtn k="intakeGraduated" label="Graduated" />
          <SortBtn k="leadsTotal"      label="Assigned" />
          <SortBtn k="leadsWorked"     label="Worked" />
          <SortBtn k="leadsConfirmed"  label="Confirmed" />
          <SortBtn k="name"            label="Name" />
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px,1fr))", gap: 14 }}>
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
                  <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{u.intakeTotal}</span>
                </div>
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
                  <div style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>No leads submitted yet</div>
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
    </div>
  )
}
