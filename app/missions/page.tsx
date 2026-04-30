"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Target, Trophy, Clock, CheckCircle2, Plus, Users, ChevronRight, Star } from "lucide-react"
import { TEAM } from "../lib/data"

type MissionStatus = "open" | "claimed" | "complete" | "verified"

type Mission = {
  id: string
  title: string
  desc: string
  target: string
  deadline: string
  points: number
  status: MissionStatus
  claimedBy: string | null
  category: "outreach" | "deal" | "pipeline" | "special"
}

const MISSIONS: Mission[] = [
  { id: "m1", title: "First Contact Blitz",     desc: "Make first contact with 5 new prospects in the Jaipur local business category.", target: "5 first contacts",   deadline: "May 5, 2026",  points: 150, status: "open",     claimedBy: null,  category: "outreach"  },
  { id: "m2", title: "Proposal Push",            desc: "Submit custom sponsorship proposals to 3 leads currently in Qualified stage.",    target: "3 proposals sent",  deadline: "May 3, 2026",  points: 200, status: "claimed",  claimedBy: "u5",  category: "pipeline"  },
  { id: "m3", title: "Close the boAt Deal",      desc: "Move boAt from Negotiation to Won. Final offer + signed confirmation required.", target: "1 deal confirmed",  deadline: "May 2, 2026",  points: 500, status: "claimed",  claimedBy: "u9",  category: "deal"      },
  { id: "m4", title: "Unassigned Lead Sweep",    desc: "Contact all unassigned leads and add first notes within 48 hours.",             target: "4 leads activated", deadline: "May 7, 2026",  points: 100, status: "complete", claimedBy: "u6",  category: "outreach"  },
  { id: "m5", title: "FMCG Category Lock",       desc: "Secure at least one FMCG brand as Associate Sponsor or higher.",               target: "1 FMCG confirmed",  deadline: "May 10, 2026", points: 350, status: "open",     claimedBy: null,  category: "deal"      },
  { id: "m6", title: "Social Proof Sprint",      desc: "Collect testimonials or references from 2 confirmed sponsors for outreach.",   target: "2 testimonials",    deadline: "May 8, 2026",  points: 120, status: "verified", claimedBy: "u7",  category: "special"   },
]

const CAT_COLORS = {
  outreach: "var(--info)",
  deal:     "var(--success)",
  pipeline: "var(--warning)",
  special:  "#A78BFA",
}

const STATUS_CONFIG: Record<MissionStatus, { label: string; color: string; bg: string; badge: string }> = {
  open:     { label: "Open",     color: "var(--text-3)",  bg: "rgba(255,255,255,0.03)", badge: "badge-blue"   },
  claimed:  { label: "Claimed",  color: "var(--warning)", bg: "var(--warning-bg)",     badge: "badge-orange" },
  complete: { label: "Complete", color: "var(--info)",    bg: "var(--info-bg)",         badge: "badge-blue"   },
  verified: { label: "Verified", color: "var(--success)", bg: "var(--success-bg)",      badge: "badge-green"  },
}

function MissionCard({ mission, onClaim }: { mission: Mission; onClaim: (id: string) => void }) {
  const stCfg = STATUS_CONFIG[mission.status]
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
            {TEAM.find(m => m.id === mission.claimedBy)?.name.split(" ")[0]}
          </div>
        )}
        {mission.status === "open" && (
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => onClaim(mission.id)} className="btn-gold"
            style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 10 }}>
            Claim Mission <ChevronRight size={11} strokeWidth={2} />
          </motion.button>
        )}
        {mission.status === "complete" && (
          <button className="btn-ghost" style={{ marginLeft: "auto", padding: "6px 14px", fontSize: 10 }}>
            Submit for Verification
          </button>
        )}
        {mission.status === "verified" && (
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--success)", fontWeight: 700 }}>
            <CheckCircle2 size={12} strokeWidth={1.5} /> Completed
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function MissionsPage() {
  const [missions, setMissions] = useState(MISSIONS)

  function claimMission(id: string) {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, status: "claimed" as MissionStatus, claimedBy: "u5" } : m))
  }

  const open     = missions.filter(m => m.status === "open")
  const claimed  = missions.filter(m => m.status === "claimed")
  const complete = missions.filter(m => m.status === "complete" || m.status === "verified")

  const totalXP = missions.filter(m => m.status === "verified").reduce((s, m) => s + m.points, 0)

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Missions · Team Performance</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Mission Board</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            {open.length} open · {claimed.length} in progress · {totalXP} XP earned this sprint
          </p>
        </div>
        <button className="btn-gold" style={{ fontSize: 11 }}>
          <Plus size={13} strokeWidth={2} /> Post Mission
        </button>
      </motion.div>

      {/* XP summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Open",       count: open.length,     color: "var(--text-3)",  icon: Target },
          { label: "In Progress",count: claimed.length,  color: "var(--warning)", icon: Flame  },
          { label: "Completed",  count: complete.length, color: "var(--success)", icon: CheckCircle2 },
          { label: "XP Earned",  count: totalXP,         color: "#C9A24B",        icon: Trophy, suffix: "" },
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}>
        {/* Missions */}
        <div>
          {open.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="g-label" style={{ marginBottom: 12 }}>Available Missions ({open.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {open.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMission} />)}
              </div>
            </div>
          )}
          {claimed.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div className="g-label" style={{ marginBottom: 12 }}>In Progress ({claimed.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {claimed.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMission} />)}
              </div>
            </div>
          )}
          {complete.length > 0 && (
            <div>
              <div className="g-label" style={{ marginBottom: 12 }}>Completed ({complete.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {complete.map(m => <MissionCard key={m.id} mission={m} onClaim={claimMission} />)}
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div>
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="panel">
            <div className="g-label" style={{ marginBottom: 14 }}>Sprint Leaderboard</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TEAM.filter(m => m.tier !== "superadmin").slice(0, 6).map((member, i) => {
                const xp = i === 0 ? 450 : i === 1 ? 320 : i === 2 ? 270 : i < 5 ? 120 + (5-i)*30 : 40
                const tier = xp >= 400 ? "Garuda" : xp >= 280 ? "Closer" : xp >= 180 ? "Hunter" : "Apprentice"
                const tierColor = xp >= 400 ? "#C9A24B" : xp >= 280 ? "#4ADE80" : xp >= 180 ? "#60A5FA" : "var(--text-3)"
                return (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: i === 0 ? "rgba(201,162,75,0.06)" : "rgba(255,255,255,0.02)", borderRadius: "var(--r-sm)", border: `1px solid ${i === 0 ? "rgba(201,162,75,0.18)" : "rgba(255,255,255,0.05)"}` }}>
                    <div style={{ width: 20, fontSize: 11, fontWeight: 700, color: i < 3 ? "#C9A24B" : "var(--text-3)", textAlign: "center" }}>
                      {i < 3 ? <Star size={11} color="#C9A24B" fill="#C9A24B" /> : `#${i+1}`}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${member.color}18`, border: `1px solid ${member.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: member.color, flexShrink: 0 }}>
                      {member.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name.split(" ")[0]}</div>
                      <div style={{ fontSize: 9, color: tierColor, fontWeight: 700 }}>{tier}</div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#C9A24B" }}>{xp}</div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
