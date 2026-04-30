"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Map, TrendingUp, CheckCircle, Target, Star, Award, Flame, Clock, Mail, Phone } from "lucide-react"
import { LEADS, TEAM, getStats } from "../lib/data"

const TIER_THRESHOLDS = [
  { name: "Garuda",       min: 400, icon: Flame,       color: "#C9A24B", desc: "Elite tier — top performer" },
  { name: "Lead Closer",  min: 280, icon: Star,        color: "#4ADE80", desc: "Consistently closing deals" },
  { name: "Closer",       min: 180, icon: Target,      color: "#60A5FA", desc: "Strong win rate" },
  { name: "Hunter",       min: 100, icon: TrendingUp,  color: "#A78BFA", desc: "Active outreach cadence" },
  { name: "Apprentice",   min: 0,   icon: Award,       color: "var(--text-3)", desc: "Learning the ropes" },
]

export default function MePage() {
  const [userId, setUserId] = useState("u5")
  const stats = getStats()

  const member = TEAM.find(m => m.id === userId) || TEAM[4]
  const myLeads = LEADS.filter(l => l.assigned_to === member.id)
  const confirmed = myLeads.filter(l => l.status === "confirmed")
  const inDiscussion = myLeads.filter(l => l.status === "in_discussion")
  const contacted = myLeads.filter(l => ["contacted","in_discussion","confirmed"].includes(l.status))
  const secured = confirmed.reduce((s, l) => s + l.deal_value, 0)
  const pipeline = myLeads.filter(l => !["rejected"].includes(l.status)).reduce((s, l) => s + l.deal_value * l.probability / 100, 0)
  const xp = secured / 100 + contacted.length * 10 + confirmed.length * 50

  const currentTier = TIER_THRESHOLDS.find(t => xp >= t.min) || TIER_THRESHOLDS[4]
  const nextTier    = TIER_THRESHOLDS.findIndex(t => xp >= t.min) > 0 ? TIER_THRESHOLDS[TIER_THRESHOLDS.findIndex(t => xp >= t.min) - 1] : null
  const TierIcon    = currentTier.icon

  const xpToNext = nextTier ? (nextTier.min - xp) : 0
  const tierPct   = nextTier ? Math.round(((xp - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>My Profile · Career Path</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Career Path</h1>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 18 }}>

        {/* Profile card */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="panel" style={{ padding: "24px 20px", textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: 18, background: `${member.color}18`, border: `2px solid ${member.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: member.color, margin: "0 auto 14px" }}>
              {member.initials}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)", marginBottom: 3 }}>{member.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>{member.role}</div>

            {/* Tier badge */}
            <div style={{ padding: "10px 16px", background: `${currentTier.color}12`, border: `1px solid ${currentTier.color}30`, borderRadius: "var(--r-md)", marginBottom: 14, display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
              <TierIcon size={16} color={currentTier.color} strokeWidth={1.5} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: currentTier.color }}>{currentTier.name}</div>
                <div style={{ fontSize: 9, color: "var(--text-3)" }}>{currentTier.desc}</div>
              </div>
            </div>

            {/* XP bar */}
            <div style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span className="g-label">XP Progress</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-brand)" }}>{Math.round(xp).toLocaleString()} XP</span>
              </div>
              <div className="g-bar-bg">
                <motion.div className="g-bar-fill" initial={{ width: 0 }} animate={{ width: `${tierPct}%` }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
              {nextTier && (
                <div style={{ fontSize: 9, color: "var(--text-3)", marginTop: 4 }}>
                  {Math.round(xpToNext)} XP to {nextTier.name}
                </div>
              )}
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel" style={{ padding: "16px 18px" }}>
            <div className="g-label" style={{ marginBottom: 12 }}>Contact</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 11, color: "var(--text-2)" }}>
                <Mail size={12} color="var(--text-3)" strokeWidth={1.5} />
                {member.id.toLowerCase()}@clubgaruda.muj.edu
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 11, color: "var(--text-2)" }}>
                <Phone size={12} color="var(--text-3)" strokeWidth={1.5} />
                +91 9XXXXXXX
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats + leads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Stat grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {[
              { label: "My Leads",      value: myLeads.length,      color: "var(--info)",    icon: Map        },
              { label: "Confirmed",     value: confirmed.length,    color: "var(--success)", icon: CheckCircle },
              { label: "In Discussion", value: inDiscussion.length, color: "var(--warning)", icon: Clock       },
              { label: "Secured",       value: `₹${(secured/1000).toFixed(0)}K`, color: "#C9A24B", icon: TrendingUp },
              { label: "Pipeline",      value: `₹${(pipeline/1000).toFixed(0)}K`, color: "#A78BFA", icon: Target    },
              { label: "Win Rate",      value: myLeads.length > 0 ? `${Math.round(confirmed.length/myLeads.length*100)}%` : "—", color: "var(--success)", icon: Star },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="kpi-card">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${s.color}14`, border: `1px solid ${s.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10, color: s.color }}>
                    <Icon size={13} strokeWidth={1.5} />
                  </div>
                  <div className="g-label" style={{ marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{String(s.value)}</div>
                </motion.div>
              )
            })}
          </div>

          {/* Tier progression */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel">
            <div className="g-label" style={{ marginBottom: 14 }}>Tier Progression</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...TIER_THRESHOLDS].reverse().map((tier, i) => {
                const earned = xp >= tier.min
                const Icon   = tier.icon
                const isCurrent = tier.name === currentTier.name
                return (
                  <div key={tier.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: isCurrent ? `${tier.color}10` : "rgba(255,255,255,0.02)", border: `1px solid ${isCurrent ? `${tier.color}30` : "rgba(255,255,255,0.06)"}`, borderRadius: "var(--r-md)", opacity: earned ? 1 : 0.4 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${tier.color}14`, border: `1px solid ${tier.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={13} color={tier.color} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? tier.color : "var(--text-2)" }}>{tier.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>{tier.desc} · {tier.min}+ XP</div>
                    </div>
                    {isCurrent && <span className="badge badge-gold" style={{ fontSize: 9 }}>Current</span>}
                    {earned && !isCurrent && <CheckCircle size={14} color="var(--success)" strokeWidth={1.5} />}
                  </div>
                )
              })}
            </div>
          </motion.div>

          {/* My leads table */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--brand-edge)" }}>
              <div className="g-label">My Assigned Leads ({myLeads.length})</div>
            </div>
            <table className="g-table">
              <thead><tr><th>Company</th><th>Status</th><th>Deal Value</th><th>Probability</th></tr></thead>
              <tbody>
                {myLeads.slice(0, 8).map(lead => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 600, color: "var(--text-1)" }}>{lead.company}</td>
                    <td><span className={`badge ${lead.status === "confirmed" ? "badge-green" : lead.status === "in_discussion" ? "badge-gold" : "badge-blue"}`} style={{ fontSize: 9 }}>{lead.status.replace("_"," ")}</span></td>
                    <td style={{ fontWeight: 700, color: "#C9A24B", fontSize: 12 }}>₹{lead.deal_value.toLocaleString("en-IN")}</td>
                    <td style={{ fontSize: 12, color: lead.probability >= 70 ? "var(--success)" : "var(--warning)" }}>{lead.probability}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
