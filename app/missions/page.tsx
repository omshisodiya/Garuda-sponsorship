"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Flame, Target, Trophy, Clock, CheckCircle2, ChevronRight,
  Star, Zap, ShieldCheck, XCircle, AlertCircle, RefreshCw,
} from "lucide-react"
import type { Lead } from "../lib/data"

// ── Types ─────────────────────────────────────────────────────────────────────
type MissionCategory = "outreach" | "deal" | "pipeline" | "special"
type ClaimStatus = "claimed" | "complete" | "verified" | "rejected"

type ApiClaim = {
  id:               string
  mission_id:       string
  mission_title:    string
  mission_points:   number
  mission_category: string
  user_id:          string
  user_name:        string
  user_role:        string
  status:           ClaimStatus
  claimed_at:       string
  completed_at:     string | null
  verified_by_id:   string | null
  verified_by_name: string | null
  verified_at:      string | null
  rejected_reason:  string | null
}

type Mission = {
  id:       string
  title:    string
  desc:     string
  target:   string
  deadline: string
  points:   number
  category: MissionCategory
}

type DisplayUser = {
  id:       string
  name:     string
  role:     "superadmin" | "admin" | "team"
  color:    string
  initials: string
}

type CurrentUser = {
  id:   string
  name: string
  role: "superadmin" | "admin" | "team"
}

// ── Helpers ───────────────────────────────────────────────────────────────────
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
  return { id: u.id, name: u.name, role: u.role as DisplayUser["role"], color: userColor(u.id), initials: userInitials(u.name) }
}

// ── Mission generation ────────────────────────────────────────────────────────
const CAT_COLORS: Record<MissionCategory, string> = {
  outreach: "var(--info)",
  deal:     "var(--success)",
  pipeline: "var(--warning)",
  special:  "#A78BFA",
}

function generateMissions(leads: Lead[]): Mission[] {
  const missions: Mission[] = []
  const unassigned  = leads.filter(l => l.assigned_to === null && !["confirmed","rejected"].includes(l.status))
  const negotiation = leads.filter(l => l.stage === "negotiation" && !["confirmed","rejected"].includes(l.status))
  const qualified   = leads.filter(l => l.stage === "qualified"   && !["confirmed","rejected"].includes(l.status))
  const noFMCG  = !leads.some(l => l.category === "FMCG" && l.status === "confirmed")
  const noTitle = !leads.some(l => l.deal_value >= 150000 && l.status === "confirmed")
  const noTech  = !leads.some(l => l.category === "Tech"  && l.status === "confirmed")

  if (unassigned.length > 0)
    missions.push({ id: "m_blitz", title: "First Contact Blitz",
      desc: `${unassigned.length} unassigned lead${unassigned.length !== 1 ? "s" : ""} waiting. Pick one up and make first contact within 24h.`,
      target: `${Math.min(5, unassigned.length)} first contacts`, deadline: "May 7, 2026", points: 150, category: "outreach" })

  if (negotiation.length > 0)
    missions.push({ id: "m_close", title: "Close the Deal",
      desc: `${negotiation.length} deal${negotiation.length !== 1 ? "s" : ""} stuck in negotiation. Push one across the line.`,
      target: "1 deal confirmed", deadline: "May 5, 2026", points: 500, category: "deal" })

  if (qualified.length > 0)
    missions.push({ id: "m_proposal", title: "Proposal Push",
      desc: `${qualified.length} qualified lead${qualified.length !== 1 ? "s" : ""} ready for a custom deck. Send proposals and move to Proposal stage.`,
      target: "3 proposals sent", deadline: "May 8, 2026", points: 200, category: "pipeline" })

  if (noFMCG)
    missions.push({ id: "m_fmcg", title: "FMCG Category Lock",
      desc: "No FMCG brand confirmed yet. Secure at least one as Partner Sponsor or higher.",
      target: "1 FMCG confirmed", deadline: "May 10, 2026", points: 350, category: "deal" })

  if (noTitle)
    missions.push({ id: "m_title", title: "Title Sponsor Hunt",
      desc: "No ₹1,50,000 Title Sponsor secured yet. This is the biggest XP mission on the board.",
      target: "1 Title Sponsor confirmed", deadline: "May 15, 2026", points: 600, category: "deal" })

  if (noTech)
    missions.push({ id: "m_tech", title: "Tech Brand Outreach",
      desc: "No Tech sponsor confirmed. Pitch audience demographics and social reach.",
      target: "1 Tech confirmed", deadline: "May 12, 2026", points: 300, category: "outreach" })

  missions.push({ id: "m_social", title: "Social Proof Sprint",
    desc: "Collect testimonials or intent letters from 2 confirmed sponsors to strengthen outreach.",
    target: "2 testimonials", deadline: "May 8, 2026", points: 120, category: "special" })

  return missions
}

// ── XP helpers ────────────────────────────────────────────────────────────────
function xpForLead(lead: Lead): number {
  if (lead.status === "confirmed") {
    if (lead.deal_value >= 150000) return 400
    if (lead.deal_value >= 95000)  return 300
    if (lead.deal_value > 0)       return 200
    return 100
  }
  if (lead.status === "in_discussion") return 75
  if (lead.status === "contacted")     return 30
  return 0
}
function xpTier(xp: number): { label: string; color: string } {
  if (xp >= 500) return { label: "Garuda",     color: "#C9A24B" }
  if (xp >= 300) return { label: "Closer",     color: "#4ADE80" }
  if (xp >= 150) return { label: "Hunter",     color: "#60A5FA" }
  if (xp >  0)   return { label: "Apprentice", color: "#A78BFA" }
  return              { label: "Unranked",     color: "var(--text-3)" }
}

// ── MissionCard ────────────────────────────────────────────────────────────────
function MissionCard({
  mission, claim, currentUser, onClaim, onComplete,
}: {
  mission:     Mission
  claim:       ApiClaim | null
  currentUser: CurrentUser | null
  onClaim:     (m: Mission) => Promise<void>
  onComplete:  (missionId: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)
  const catColor = CAT_COLORS[mission.category]
  const isOpen     = !claim
  const isClaimed  = claim?.status === "claimed"
  const isComplete = claim?.status === "complete"
  const wasRejected = isClaimed && !!claim?.rejected_reason

  const borderColor = isComplete ? "rgba(96,165,250,0.25)" : isClaimed ? "var(--warning-edge)" : "var(--brand-edge)"
  const bg          = isComplete ? "rgba(96,165,250,0.06)"  : isClaimed ? "var(--warning-bg)"  : "rgba(255,255,255,0.02)"
  const badgeLabel  = isComplete ? "Awaiting Verification" : wasRejected ? "Rejected — Retry" : isClaimed ? "In Progress" : "Open"
  const badgeClass  = isComplete ? "badge badge-blue" : isClaimed ? "badge badge-orange" : "badge badge-blue"

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={isOpen ? { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" } : {}}
      style={{ padding: "18px 20px", background: bg, border: `1px solid ${borderColor}`,
        borderTop: `3px solid ${catColor}`, borderRadius: "var(--r-md)", transition: "all 0.18s" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span className={badgeClass} style={{ fontSize: 9 }}>{badgeLabel}</span>
            <span style={{ fontSize: 9, color: catColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{mission.category}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{mission.title}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#C9A24B" }}>{mission.points}</div>
          <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700 }}>XP</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 8 }}>{mission.desc}</div>

      {wasRejected && claim?.rejected_reason && (
        <div style={{ fontSize: 10, color: "#F87171", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 6, padding: "6px 10px", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <AlertCircle size={10} /> Rejected: {claim.rejected_reason}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-3)" }}>
          <Target size={11} strokeWidth={1.5} /> {mission.target}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-3)" }}>
          <Clock size={11} strokeWidth={1.5} /> {mission.deadline}
        </div>

        {isOpen && (
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={async () => { setBusy(true); await onClaim(mission); setBusy(false) }}
            disabled={busy || !currentUser}
            className="btn-gold" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}>
            {busy ? "…" : <><span>Claim</span><ChevronRight size={11} strokeWidth={2} /></>}
          </motion.button>
        )}
        {isClaimed && (
          <motion.button whileTap={{ scale: 0.96 }}
            onClick={async () => { setBusy(true); await onComplete(mission.id); setBusy(false) }}
            disabled={busy}
            className="btn-ghost" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 10 }}>
            {busy ? "…" : wasRejected ? "Resubmit Complete" : "Mark Complete"}
          </motion.button>
        )}
        {isComplete && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--info)", fontWeight: 700 }}>
            <Clock size={12} strokeWidth={1.5} /> Pending Verification
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Verification Panel ────────────────────────────────────────────────────────
function VerificationPanel({
  pending, currentUser, onVerify, onReject,
}: {
  pending:     ApiClaim[]
  currentUser: CurrentUser | null
  onVerify:    (missionId: string, userId: string) => Promise<void>
  onReject:    (missionId: string, userId: string, reason: string) => Promise<void>
}) {
  const [busy,        setBusy]        = useState<string | null>(null)
  const [rejectState, setRejectState] = useState<{ key: string; reason: string } | null>(null)

  // Superadmin sees all (admin + team); admin sees team only
  const visible = currentUser?.role === "superadmin"
    ? pending
    : pending.filter(c => c.user_role === "team")

  if (visible.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="panel" style={{ marginBottom: 20, borderColor: "var(--warning-edge)", background: "var(--warning-bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <ShieldCheck size={14} color="var(--warning)" strokeWidth={1.5} />
        <div className="g-label" style={{ color: "var(--warning)" }}>Verification Queue — {visible.length} pending</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {visible.map(claim => {
          const key = `${claim.mission_id}_${claim.user_id}`
          const isRejecting = rejectState?.key === key
          return (
            <div key={claim.id} style={{ padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "var(--r-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>{claim.mission_title}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>
                    By <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{claim.user_name}</span>
                    {" "}· {claim.user_role} · <span style={{ color: "#C9A24B", fontWeight: 700 }}>{claim.mission_points} XP</span>
                    {claim.completed_at && <> · {new Date(claim.completed_at).toLocaleDateString("en-IN")}</>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-gold"
                    disabled={busy === key}
                    style={{ padding: "5px 12px", fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}
                    onClick={async () => { setBusy(key); await onVerify(claim.mission_id, claim.user_id); setBusy(null) }}>
                    <CheckCircle2 size={10} strokeWidth={2} /> {busy === key ? "…" : "Verify"}
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-ghost"
                    disabled={busy === key}
                    style={{ padding: "5px 12px", fontSize: 10, display: "flex", alignItems: "center", gap: 5, color: "#F87171", borderColor: "rgba(248,113,113,0.2)" }}
                    onClick={() => setRejectState(isRejecting ? null : { key, reason: "" })}>
                    <XCircle size={10} strokeWidth={2} /> Reject
                  </motion.button>
                </div>
              </div>
              {isRejecting && (
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <input
                    value={rejectState?.reason ?? ""}
                    onChange={e => setRejectState(prev => prev ? { ...prev, reason: e.target.value } : null)}
                    placeholder="Reason for rejection…"
                    style={{ flex: 1, padding: "6px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--r-sm)", color: "var(--text-1)", fontSize: 11, outline: "none" }}
                  />
                  <motion.button whileTap={{ scale: 0.96 }} className="btn-ghost"
                    disabled={busy === key || !rejectState?.reason.trim()}
                    style={{ padding: "6px 14px", fontSize: 10, color: "#F87171", borderColor: "rgba(248,113,113,0.3)" }}
                    onClick={async () => {
                      if (!rejectState?.reason.trim()) return
                      setBusy(key)
                      await onReject(claim.mission_id, claim.user_id, rejectState.reason)
                      setRejectState(null)
                      setBusy(null)
                    }}>
                    {busy === key ? "…" : "Confirm Reject"}
                  </motion.button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MissionsPage() {
  const [leads,       setLeads]       = useState<Lead[]>([])
  const [users,       setUsers]       = useState<DisplayUser[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [missions,    setMissions]    = useState<Mission[]>([])
  const [claims,      setClaims]      = useState<ApiClaim[]>([])
  const [pending,     setPending]     = useState<ApiClaim[]>([])
  const [xpMap,       setXpMap]       = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(true)

  const refresh = useCallback(async () => {
    try {
      const [leadsData, usersData, meData, missionsData] = await Promise.all([
        fetch("/api/leads").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/users").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/auth/me").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/missions").then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      const ls: Lead[] = leadsData?.leads ?? []
      setLeads(ls)
      setMissions(generateMissions(ls))
      if (usersData?.users) setUsers((usersData.users as { id: string; name: string; role: string }[]).map(toDisplayUser))
      if (meData?.user) setCurrentUser(meData.user as CurrentUser)
      if (missionsData) {
        setClaims(missionsData.claims ?? [])
        setPending(missionsData.pending ?? [])
        setXpMap(missionsData.xpMap ?? {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // Active (non-verified) claim for current user on a given mission
  const getUserClaim = useCallback((missionId: string): ApiClaim | null => {
    if (!currentUser) return null
    return claims.find(c =>
      c.mission_id === missionId && c.user_id === currentUser.id &&
      (c.status === "claimed" || c.status === "complete")
    ) ?? null
  }, [claims, currentUser])

  // Group missions
  const { openMissions, inProgressMissions, awaitingMissions } = useMemo(() => {
    const open: Array<{ mission: Mission; claim: null }> = []
    const inProgress: Array<{ mission: Mission; claim: ApiClaim }> = []
    const awaiting: Array<{ mission: Mission; claim: ApiClaim }> = []
    for (const m of missions) {
      const claim = getUserClaim(m.id)
      if (!claim) open.push({ mission: m, claim: null })
      else if (claim.status === "claimed") inProgress.push({ mission: m, claim })
      else awaiting.push({ mission: m, claim })
    }
    return { openMissions: open, inProgressMissions: inProgress, awaitingMissions: awaiting }
  }, [missions, getUserClaim])

  // XP leaderboard — lead XP + verified mission XP
  const leaderboard = useMemo(() => {
    return users
      .filter(u => u.role !== "superadmin")
      .map(member => {
        const myLeads  = leads.filter(l => l.assigned_to === member.id)
        const leadXp   = myLeads.reduce((s, l) => s + xpForLead(l), 0)
        const missionXp = xpMap[member.id] ?? 0
        const xp = leadXp + missionXp
        const tier = xpTier(xp)
        return { ...member, xp, leadXp, missionXp, tierLabel: tier.label, tierColor: tier.color, leadCount: myLeads.length }
      })
      .filter(m => m.leadCount > 0 || m.xp > 0)
      .sort((a, b) => b.xp - a.xp)
  }, [leads, users, xpMap])

  const totalXp = leaderboard.reduce((s, m) => s + m.xp, 0)

  const verifyQueueSize = currentUser?.role === "superadmin"
    ? pending.length
    : pending.filter(c => c.user_role === "team").length

  // Category-wise leaderboard
  const [lbCategory, setLbCategory] = useState<string>("Overall")
  const leadCategories = useMemo(() => {
    const cats = [...new Set(leads.map(l => l.category))].sort()
    return ["Overall", ...cats]
  }, [leads])

  const categoryLeaderboard = useMemo(() => {
    const filteredLeads = lbCategory === "Overall"
      ? leads
      : leads.filter(l => l.category === lbCategory)
    return users
      .filter(u => u.role !== "superadmin")
      .map(member => {
        const myLeads   = filteredLeads.filter(l => l.assigned_to === member.id)
        const leadXp    = myLeads.reduce((s, l) => s + xpForLead(l), 0)
        const missionXp = lbCategory === "Overall" ? (xpMap[member.id] ?? 0) : 0
        const xp = leadXp + missionXp
        const tier = xpTier(xp)
        return { ...member, xp, leadXp, missionXp, tierLabel: tier.label, tierColor: tier.color, leadCount: myLeads.length }
      })
      .filter(m => m.xp > 0 || (lbCategory === "Overall" && m.leadCount > 0))
      .sort((a, b) => b.xp - a.xp)
  }, [leads, users, xpMap, lbCategory])

  const lowPerformers = useMemo(() => {
    return users
      .filter(u => u.role !== "superadmin")
      .map(member => {
        const myLeads   = leads.filter(l => l.assigned_to === member.id)
        if (myLeads.length === 0) return null
        const progressed = myLeads.filter(l => l.status !== "not_started").length
        const mXp = xpMap[member.id] ?? 0
        const lXp = myLeads.reduce((s, l) => {
          if (l.status === "confirmed") return s + (l.deal_value >= 150000 ? 400 : l.deal_value >= 95000 ? 300 : l.deal_value > 0 ? 200 : 100)
          if (l.status === "in_discussion") return s + 75
          if (l.status === "contacted") return s + 30
          return s
        }, 0)
        const totalXp = mXp + lXp
        if (totalXp === 0 && progressed === 0) {
          return { ...member, leadCount: myLeads.length, progressed, totalXp }
        }
        return null
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  }, [leads, users, xpMap])

  async function handleClaim(mission: Mission) {
    if (!currentUser) return
    await fetch("/api/missions/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "claim", missionId: mission.id, missionTitle: mission.title, missionPoints: mission.points, missionCategory: mission.category }),
    })
    await refresh()
  }

  async function handleComplete(missionId: string) {
    await fetch("/api/missions/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", missionId }),
    })
    await refresh()
  }

  async function handleVerify(missionId: string, targetUserId: string) {
    await fetch("/api/missions/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify", missionId, targetUserId }),
    })
    await refresh()
  }

  async function handleReject(missionId: string, targetUserId: string, reason: string) {
    await fetch("/api/missions/action", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject", missionId, targetUserId, reason }),
    })
    await refresh()
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading missions…</div>
    </div>
  )

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Missions · Team Performance</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Mission Board</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            {openMissions.length} open · {inProgressMissions.length} in progress · {totalXp.toLocaleString()} XP earned by team
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {currentUser && (
            <div style={{ fontSize: 10, color: "var(--text-3)", padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-sm)" }}>
              {currentUser.name} · <span style={{ color: "#C9A24B", fontWeight: 700 }}>{currentUser.role}</span>
            </div>
          )}
          <button onClick={refresh} className="btn-ghost" style={{ padding: "6px 12px", fontSize: 10, display: "flex", alignItems: "center", gap: 5 }}>
            <RefreshCw size={10} strokeWidth={2} /> Refresh
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "rgba(201,162,75,0.07)", border: "1px solid rgba(201,162,75,0.2)", borderRadius: "var(--r-md)" }}>
            <Zap size={13} color="#C9A24B" />
            <span style={{ fontSize: 11, color: "#C9A24B", fontWeight: 700 }}>Real XP — leads + verified missions</span>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Open",        count: openMissions.length,       color: "var(--text-3)",  icon: Target       },
          { label: "In Progress", count: inProgressMissions.length, color: "var(--warning)", icon: Flame        },
          { label: currentUser?.role === "team" ? "My Pending" : "Verify Queue",
            count: currentUser?.role === "team" ? awaitingMissions.length : verifyQueueSize,
            color: "var(--info)", icon: Clock },
          { label: "Team XP",     count: totalXp,                   color: "#C9A24B",        icon: Trophy       },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="kpi-card">
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}18`, border: `1px solid ${s.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, color: s.color }}>
                <Icon size={14} strokeWidth={1.5} />
              </div>
              <div className="g-label" style={{ marginBottom: 3 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{s.count.toLocaleString()}</div>
            </motion.div>
          )
        })}
      </div>

      {/* Admin / Superadmin verification panel */}
      {(currentUser?.role === "admin" || currentUser?.role === "superadmin") && (
        <VerificationPanel
          pending={pending}
          currentUser={currentUser}
          onVerify={handleVerify}
          onReject={handleReject}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
        {/* Missions list */}
        <div>
          <AnimatePresence>
            {inProgressMissions.length > 0 && (
              <motion.div key="inprogress" style={{ marginBottom: 24 }}>
                <div className="g-label" style={{ marginBottom: 12, color: "var(--warning)" }}>In Progress ({inProgressMissions.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {inProgressMissions.map(({ mission, claim }) => (
                    <MissionCard key={mission.id} mission={mission} claim={claim}
                      currentUser={currentUser} onClaim={handleClaim} onComplete={handleComplete} />
                  ))}
                </div>
              </motion.div>
            )}

            {awaitingMissions.length > 0 && (
              <motion.div key="awaiting" style={{ marginBottom: 24 }}>
                <div className="g-label" style={{ marginBottom: 12, color: "var(--info)" }}>Awaiting Verification ({awaitingMissions.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {awaitingMissions.map(({ mission, claim }) => (
                    <MissionCard key={mission.id} mission={mission} claim={claim}
                      currentUser={currentUser} onClaim={handleClaim} onComplete={handleComplete} />
                  ))}
                </div>
              </motion.div>
            )}

            {openMissions.length > 0 && (
              <motion.div key="open">
                <div className="g-label" style={{ marginBottom: 12 }}>Available Missions ({openMissions.length})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {openMissions.map(({ mission }) => (
                    <MissionCard key={mission.id} mission={mission} claim={null}
                      currentUser={currentUser} onClaim={handleClaim} onComplete={handleComplete} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {missions.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)", fontSize: 13, border: "1px dashed var(--brand-edge)", borderRadius: "var(--r-md)" }}>
              All missions cleared! Add leads to unlock new missions.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Leaderboard with category tabs */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div className="g-label">XP Leaderboard</div>
              <span style={{ fontSize: 9, color: "var(--text-3)", background: "rgba(201,162,75,0.07)", border: "1px solid rgba(201,162,75,0.15)", padding: "2px 7px", borderRadius: 10 }}>Live</span>
            </div>
            {/* Category tabs */}
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
              {leadCategories.map(cat => (
                <button key={cat} onClick={() => setLbCategory(cat)}
                  style={{ padding: "3px 8px", fontSize: 9, fontWeight: 700, borderRadius: 10, border: "none", cursor: "pointer",
                    background: lbCategory === cat ? "#C9A24B" : "rgba(255,255,255,0.06)",
                    color: lbCategory === cat ? "#000" : "var(--text-3)",
                    transition: "all 0.15s" }}>
                  {cat}
                </button>
              ))}
            </div>
            {categoryLeaderboard.length === 0 ? (
              <div style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", padding: "16px 0" }}>
                No XP in {lbCategory} yet
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {categoryLeaderboard.slice(0, 12).map((member, i) => (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px",
                    background: i === 0 ? "rgba(201,162,75,0.06)" : "rgba(255,255,255,0.02)",
                    borderRadius: "var(--r-sm)", border: `1px solid ${i === 0 ? "rgba(201,162,75,0.18)" : "rgba(255,255,255,0.05)"}` }}>
                    <div style={{ width: 20, fontSize: 10, fontWeight: 700, color: i < 3 ? "#C9A24B" : "var(--text-3)", textAlign: "center", flexShrink: 0 }}>
                      {i < 3 ? <Star size={11} color="#C9A24B" fill="#C9A24B" /> : `#${i + 1}`}
                    </div>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${member.color}18`, border: `1px solid ${member.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: member.color, flexShrink: 0 }}>
                      {member.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 8, color: member.tierColor, fontWeight: 700 }}>
                        {member.tierLabel}
                        {lbCategory === "Overall"
                          ? ` · ${member.leadXp}L+${member.missionXp}M`
                          : ` · ${member.leadCount} leads`}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: member.xp > 0 ? "#C9A24B" : "var(--text-3)", flexShrink: 0 }}>{member.xp}</div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* XP guide */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>How XP is Earned</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { action: "Lead Contacted",    xp: "+30",  color: "var(--info)"    },
                { action: "In Discussion",      xp: "+75",  color: "var(--warning)" },
                { action: "Partner (₹75k)",    xp: "+200", color: "#FBBF24"        },
                { action: "Co Sponsor (₹95k)", xp: "+300", color: "#60A5FA"        },
                { action: "Title (₹1.5L)",     xp: "+400", color: "#C9A24B"        },
                { action: "Verified Mission",  xp: "Varies", color: "#A78BFA"      },
              ].map(r => (
                <div key={r.action} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{r.action}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>{r.xp} XP</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Role info */}
          {currentUser && (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="panel">
              <div className="g-label" style={{ marginBottom: 8 }}>
                {currentUser.role === "team" ? "Mission Rules" : "Your Verify Rights"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.65 }}>
                {currentUser.role === "superadmin" && "As Superadmin you can verify any completed mission — from admins and team members alike."}
                {currentUser.role === "admin" && "As Admin you can verify Team member completions. Your own completed missions require Superadmin approval."}
                {currentUser.role === "team" && "Claim → do the work → Mark Complete. An Admin or Superadmin will verify. After verification the mission resets so you can claim it again for more XP."}
              </div>
            </motion.div>
          )}

          {(currentUser?.role === "admin" || currentUser?.role === "superadmin") && lowPerformers.length > 0 && (
            <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="panel"
              style={{ borderColor: "rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#F87171", flexShrink: 0 }} />
                <div className="g-label" style={{ color: "#F87171" }}>Needs Attention ({lowPerformers.length})</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {lowPerformers.slice(0, 8).map(member => (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "rgba(255,255,255,0.02)", borderRadius: "var(--r-sm)", border: "1px solid rgba(248,113,113,0.12)" }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: `${member.color}18`, border: `1px solid ${member.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: member.color, flexShrink: 0 }}>
                      {member.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 8, color: "var(--text-3)" }}>{member.leadCount} leads · 0 progress</div>
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "#F87171", flexShrink: 0 }}>No XP</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 10, lineHeight: 1.5 }}>
                These members have assigned leads but no progress yet.
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
