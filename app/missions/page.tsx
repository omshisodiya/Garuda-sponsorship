"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Target, Trophy, Clock, CheckCircle2, Plus, Users, ChevronRight, Star, Zap } from "lucide-react"
import { TEAM, type Lead } from "../lib/data"

type MissionCategory = "outreach" | "deal" | "pipeline" | "special"
type MissionStatus   = "open" | "claimed" | "complete" | "verified"

type Mission = {
  id: string
  title: string
  desc: string
  target: string
  deadline: string
  points: number
  status: MissionStatus
  claimedBy: string | null
  category: MissionCategory
}

const CAT_COLORS: Record<MissionCategory, string> = {
  outreach: "var(--info)",
  deal:     "var(--success)",
  pipeline: "var(--warning)",
  special:  "#A78BFA",
}

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; badge: string }> = {
  open:     { label: "Open",     color: "var(--text-3)",  bg: "rgba(255,255,255,0.03)", badge: "badge-blue"   },
  claimed:  { label: "Claimed",  color: "var(--warning)", bg: "var(--warning-bg)",      badge: "badge-orange" },
  complete: { label: "Complete", color: "var(--info)",    bg: "var(--info-bg)",          badge: "badge-blue"   },
  verified: { label: "Verified", color: "var(--success)", bg: "var(--success-bg)",       badge: "badge-green"  },
}

// XP earned per lead based on its status and deal value
function xpForLead(lead: Lead): number {
  if (lead.status === "confirmed") {
    if (lead.deal_value >= 150000) return 400
    if (lead.deal_value >= 95000)  return 300
    if (lead.deal_value > 0)       return 200
    return 100 // in-kind
  }
  if (lead.status === "in_discussion") return 75
  if (lead.status === "contacted")     return 30
  return 0
}

// Tier badge based on XP
function xpTier(xp: number): { label: string; color: string } {
  if (xp >= 500) return { label: "Garuda",      color: "#C9A24B" }
  if (xp >= 300) return { label: "Closer",       color: "#4ADE80" }
  if (xp >= 150) return { label: "Hunter",       color: "#60A5FA" }
  if (xp >  0)   return { label: "Apprentice",   color: "#A78BFA" }
  return              { label: "Unranked",       color: "var(--text-3)" }
}

// Auto-generate missions from live lead data
function generateMissions(leads: Lead[]): Mission[] {
  const missions: Mission[] = []
  const unassigned    = leads.filter(l => l.assigned_to === null && !["confirmed","rejected"].includes(l.status))
  const negotiation   = leads.filter(l => l.stage === "negotiation" && !["confirmed","rejected"].includes(l.status))
  const qualified     = leads.filter(l => l.stage === "qualified" && !["confirmed","rejected"].includes(l.status))
  const noFMCG        = leads.filter(l => l.category === "FMCG" && l.status === "confirmed").length === 0
  const noTitle       = leads.filter(l => l.deal_value >= 150000 && l.status === "confirmed").length === 0
  const noTech        = leads.filter(l => l.category === "Tech" && l.status === "confirmed").length === 0

  if (unassigned.length > 0) {
    missions.push({
      id: "m_blitz", title: "First Contact Blitz",
      desc: `${unassigned.length} unassigned lead${unassigned.length !== 1 ? "s" : ""} waiting. Pick one up and make first contact within 24h.`,
      target: `${Math.min(5, unassigned.length)} first contacts`,
      deadline: "May 7, 2026", points: 150, status: "open", claimedBy: null, category: "outreach",
    })
  }

  if (negotiation.length > 0) {
    missions.push({
      id: "m_close", title: "Close the Deal",
      desc: `${negotiation.length} deal${negotiation.length !== 1 ? "s" : ""} stuck in negotiation. Push one across the line — confirmed = +200 to +400 XP.`,
      target: "1 deal confirmed",
      deadline: "May 5, 2026", points: 500, status: "open", claimedBy: null, category: "deal",
    })
  }

  if (qualified.length > 0) {
    missions.push({
      id: "m_proposal", title: "Proposal Push",
      desc: `${qualified.length} qualified lead${qualified.length !== 1 ? "s" : ""} ready for a custom deck. Send proposals and move to Proposal stage.`,
      target: "3 proposals sent",
      deadline: "May 8, 2026", points: 200, status: "open", claimedBy: null, category: "pipeline",
    })
  }

  if (noFMCG) {
    missions.push({
      id: "m_fmcg", title: "FMCG Category Lock",
      desc: "No FMCG brand confirmed yet. Secure at least one as Partner Sponsor or higher for category exclusivity.",
      target: "1 FMCG confirmed",
      deadline: "May 10, 2026", points: 350, status: "open", claimedBy: null, category: "deal",
    })
  }

  if (noTitle) {
    missions.push({
      id: "m_title", title: "Title Sponsor Hunt",
      desc: "No ₹1,50,000 Title Sponsor secured. Landing this is the single biggest XP mission on the board.",
      target: "1 Title Sponsor confirmed",
      deadline: "May 15, 2026", points: 600, status: "open", claimedBy: null, category: "deal",
    })
  }

  if (noTech) {
    missions.push({
      id: "m_tech", title: "Tech Brand Outreach",
      desc: "No Tech sponsor confirmed. Tech brands love student events — pitch audience demographics and social reach.",
      target: "1 Tech confirmed",
      deadline: "May 12, 2026", points: 300, status: "open", claimedBy: null, category: "outreach",
    })
  }

  missions.push({
    id: "m_social", title: "Social Proof Sprint",
    desc: "Collect testimonials or intent letters from 2 confirmed sponsors to strengthen outreach to remaining prospects.",
    target: "2 testimonials",
    deadline: "May 8, 2026", points: 120, status: "open", claimedBy: null, category: "special",
  })

  return missions
}

function MissionCard({ mission, onClaim, onComplete }: {
  mission: Mission
  onClaim: (id: string) => void
  onComplete: (id: string) => void
}) {
  const stCfg    = STATUS_CONFIG[mission.status]
  const catColor = CAT_COLORS[mission.category]

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      whileHover={mission.status === "open" ? { y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" } : {}}
      style={{ padding: "18px 20px", background: stCfg.bg, border: `1px solid ${mission.status === "verified" ? "var(--success-edge)" : mission.status === "claimed" ? "var(--warning-edge)" : "var(--brand-edge)"}`, borderTop: `3px solid ${catColor}`, borderRadius: "var(--r-md)", transition: "all 0.18s" }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span className={`badge ${stCfg.badge}`} style={{ fontSize: 9 }}>{stCfg.label}</span>
            <span style={{ fontSize: 9, color: catColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{mission.category}</span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{mission.title}</div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#C9A24B" }}>{mission.points}</div>
          <div style={{ fontSize: 9, color: "var(--text-3)", fontWeight: 700 }}>XP</div>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.65, marginBottom: 12 }}>{mission.desc}</div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-3)" }}>
          <Target size={11} strokeWidth={1.5} /> {mission.target}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-3)" }}>
          <Clock size={11} strokeWidth={1.5} /> {mission.deadline}
        </div>
        {mission.claimedBy && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-2)" }}>
            <Users size={11} strokeWidth={1.5} />
            {TEAM.find(m => m.id === mission.claimedBy)?.name.split(" ")[0] ?? "Someone"}
          </div>
        )}
        {mission.status === "open" && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onClaim(mission.id)} className="btn-gold"
            style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 10 }}>
            Claim <ChevronRight size={11} strokeWidth={2} />
          </motion.button>
        )}
        {mission.status === "claimed" && (
          <button className="btn-ghost" onClick={() => onComplete(mission.id)} style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 10 }}>
            Mark Complete
          </button>
        )}
        {mission.status === "complete" && (
          <div style={{ marginLeft: "auto", fontSize: 10, color: "var(--info)", fontWeight: 700 }}>
            Pending Verification
          </div>
        )}
        {mission.status === "verified" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--success)", fontWeight: 700 }}>
            <CheckCircle2 size={12} strokeWidth={1.5} /> XP Awarded
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MissionsPage() {
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [loading,  setLoading]  = useState(true)
  const [missions, setMissions] = useState<Mission[]>([])
  const [claimedAs] = useState("u5") // would come from session in a real impl

  useEffect(() => {
    fetch("/api/leads")
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        const ls: Lead[] = data?.leads ?? []
        setLeads(ls)
        setMissions(generateMissions(ls))
      })
      .catch(() => setMissions(generateMissions([])))
      .finally(() => setLoading(false))
  }, [])

  function claimMission(id: string) {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claimed" as MissionStatus, claimedBy: claimedAs } : m))
  }

  function completeMission(id: string) {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "complete" as MissionStatus } : m))
  }

  // Real-time XP per member based on their actual lead performance
  const leaderboard = useMemo(() => {
    return TEAM
      .filter(m => m.tier !== "superadmin")
      .map(member => {
        const myLeads = leads.filter(l => l.assigned_to === member.id)
        const xp = myLeads.reduce((sum, l) => sum + xpForLead(l), 0)
        const tier = xpTier(xp)
        return { ...member, xp, tierLabel: tier.label, tierColor: tier.color, leadCount: myLeads.length }
      })
      .sort((a, b) => b.xp - a.xp)
  }, [leads])

  const open     = missions.filter(m => m.status === "open")
  const claimed  = missions.filter(m => m.status === "claimed")
  const complete = missions.filter(m => m.status === "complete" || m.status === "verified")

  const totalXpEarned = leaderboard.reduce((s, m) => s + m.xp, 0)

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
            {open.length} open · {claimed.length} in progress · {totalXpEarned.toLocaleString()} XP earned by team
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", background: "rgba(201,162,75,0.07)", border: "1px solid rgba(201,162,75,0.2)", borderRadius: "var(--r-md)" }}>
          <Zap size={13} color="#C9A24B" />
          <span style={{ fontSize: 11, color: "#C9A24B", fontWeight: 700 }}>XP is real — based on your lead pipeline</span>
        </div>
      </motion.div>

      {/* XP summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Open",       count: open.length,          color: "var(--text-3)",  icon: Target      },
          { label: "In Progress",count: claimed.length,        color: "var(--warning)", icon: Flame       },
          { label: "Completed",  count: complete.length,       color: "var(--success)", icon: CheckCircle2},
          { label: "Team XP",    count: totalXpEarned,         color: "#C9A24B",        icon: Trophy      },
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
        {/* Missions list */}
        <div>
          {open.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="g-label" style={{ marginBottom: 12 }}>Available Missions ({open.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {open.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMission} onComplete={completeMission} />)}
              </div>
            </div>
          )}
          {claimed.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="g-label" style={{ marginBottom: 12 }}>In Progress ({claimed.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {claimed.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMission} onComplete={completeMission} />)}
              </div>
            </div>
          )}
          {complete.length > 0 && (
            <div>
              <div className="g-label" style={{ marginBottom: 12 }}>Completed ({complete.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {complete.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMission} onComplete={completeMission} />)}
              </div>
            </div>
          )}
          {missions.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-3)", fontSize: 13, border: "1px dashed var(--brand-edge)", borderRadius: "var(--r-md)" }}>
              All missions cleared! Add leads to unlock new missions.
            </div>
          )}
        </div>

        {/* Real-time Leaderboard */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="panel">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div className="g-label">XP Leaderboard</div>
              <span style={{ fontSize: 9, color: "var(--text-3)", background: "rgba(201,162,75,0.07)", border: "1px solid rgba(201,162,75,0.15)", padding: "2px 7px", borderRadius: 10 }}>Live</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {leaderboard.slice(0, 12).map((member, i) => (
                <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: i === 0 ? "rgba(201,162,75,0.06)" : "rgba(255,255,255,0.02)", borderRadius: "var(--r-sm)", border: `1px solid ${i === 0 ? "rgba(201,162,75,0.18)" : "rgba(255,255,255,0.05)"}` }}>
                  <div style={{ width: 20, fontSize: 10, fontWeight: 700, color: i < 3 ? "#C9A24B" : "var(--text-3)", textAlign: "center", flexShrink: 0 }}>
                    {i < 3 ? <Star size={11} color="#C9A24B" fill="#C9A24B" /> : `#${i + 1}`}
                  </div>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: `${member.color}18`, border: `1px solid ${member.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: member.color, flexShrink: 0 }}>
                    {member.initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name.split(" ")[0]}</div>
                    <div style={{ fontSize: 8, color: member.tierColor, fontWeight: 700 }}>{member.tierLabel} · {member.leadCount}L</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: member.xp > 0 ? "#C9A24B" : "var(--text-3)", flexShrink: 0 }}>{member.xp}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* XP guide */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>How XP is Earned</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { action: "Lead Contacted",       xp: "+30 XP",  color: "var(--info)"    },
                { action: "In Discussion",         xp: "+75 XP",  color: "var(--warning)" },
                { action: "Partner (₹75k)",       xp: "+200 XP", color: "#FBBF24"        },
                { action: "Co Sponsor (₹95k)",    xp: "+300 XP", color: "#60A5FA"        },
                { action: "Title (₹1.5L)",        xp: "+400 XP", color: "#C9A24B"        },
              ].map(r => (
                <div key={r.action} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 8px", background: "rgba(255,255,255,0.02)", borderRadius: 6 }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)" }}>{r.action}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: r.color }}>{r.xp}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
