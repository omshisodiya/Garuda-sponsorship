"use client"

import { motion } from "framer-motion"
import { Trophy, Star, CheckCircle, TrendingUp, Award, Target, Crown, Flame } from "lucide-react"
import { LEADS, TEAM, CLUB } from "../lib/data"

export default function RecordsPage() {
  const confirmed = LEADS.filter(l => l.status === "confirmed")
  const topDeal   = confirmed.sort((a, b) => b.deal_value - a.deal_value)[0]
  const totalSecured = confirmed.reduce((s, l) => s + l.deal_value, 0)

  const teamRecords = TEAM.filter(m => m.tier !== "superadmin").map(m => {
    const myLeads   = LEADS.filter(l => l.assigned_to === m.id)
    const myConfirmed = myLeads.filter(l => l.status === "confirmed")
    const secured   = myConfirmed.reduce((s, l) => s + l.deal_value, 0)
    return { ...m, deals: myConfirmed.length, secured }
  }).sort((a, b) => b.secured - a.secured)

  const milestones = [
    { title: "First Deal Closed",          value: "Puma India — ₹75,000",            date: "Apr 15, 2026",  icon: Star,       color: "var(--success)"  },
    { title: "Partner Sponsor Secured",    value: "Campus Shoes — ₹75,000",          date: "Apr 10, 2026",  icon: CheckCircle, color: "var(--info)"    },
    { title: "30% Revenue Target Reached", value: "₹1,50,000 secured",               date: "Apr 20, 2026",  icon: TrendingUp, color: "#C9A24B"          },
    { title: "First Negotiation Stage",    value: "Red Bull India — ₹1,50,000",      date: "Apr 22, 2026",  icon: Target,     color: "var(--warning)"  },
    { title: "5 Active Deals Milestone",   value: "In Discussion across categories", date: "Apr 25, 2026",  icon: Award,      color: "#A78BFA"          },
  ]

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 24, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Records · Hall of Achievement</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Hall of Records</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{CLUB.event} · {CLUB.university}</p>
        </div>
        <Trophy size={36} color="#C9A24B" strokeWidth={1.2} style={{ opacity: 0.5 }} />
      </motion.div>

      {/* Season stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Secured",   value: `₹${totalSecured.toLocaleString("en-IN")}`, color: "#C9A24B",        icon: Trophy    },
          { label: "Deals Closed",    value: confirmed.length,                            color: "var(--success)", icon: CheckCircle },
          { label: "Team Size",       value: TEAM.filter(m => m.tier !== "superadmin").length, color: "var(--info)", icon: Star },
          { label: "Top Deal",        value: topDeal ? `₹${topDeal.deal_value.toLocaleString("en-IN")}` : "—", color: "#A78BFA", icon: Crown },
        ].map((k, i) => {
          const Icon = k.icon
          return (
            <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="kpi-card">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${k.color}14`, border: `1px solid ${k.color}28`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: k.color }}>
                <Icon size={16} strokeWidth={1.5} />
              </div>
              <div className="g-label" style={{ marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{String(k.value)}</div>
            </motion.div>
          )
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>

        {/* Leaderboard */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Crown size={14} color="#C9A24B" strokeWidth={1.5} />
            <div className="g-label">Season Leaderboard</div>
          </div>
          {teamRecords.map((member, i) => (
            <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 13px", background: i === 0 ? "rgba(201,162,75,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${i === 0 ? "rgba(201,162,75,0.18)" : "rgba(255,255,255,0.05)"}`, borderRadius: "var(--r-md)", marginBottom: 6 }}>
              <div style={{ width: 24, fontSize: 13, fontWeight: 800, color: i < 3 ? "#C9A24B" : "var(--text-3)", textAlign: "center", flexShrink: 0 }}>
                {i === 0 ? <Crown size={14} color="#C9A24B" strokeWidth={1.5} /> : i === 1 ? <Star size={13} color="#94A3B8" strokeWidth={1.5} /> : i === 2 ? <Star size={12} color="#CD7F32" strokeWidth={1.5} /> : `#${i+1}`}
              </div>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${member.color}18`, border: `1px solid ${member.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: member.color, flexShrink: 0 }}>
                {member.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{member.name}</div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>{member.deals} deal{member.deals !== 1 ? "s" : ""} closed</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? "#C9A24B" : "var(--text-2)", flexShrink: 0 }}>
                ₹{member.secured.toLocaleString("en-IN")}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="panel">
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Flame size={14} color="var(--warning)" strokeWidth={1.5} />
            <div className="g-label">Season Milestones</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {milestones.map((m, i) => {
              const Icon = m.icon
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
                  style={{ display: "flex", gap: 12, padding: "11px 13px", background: `${m.color}06`, border: `1px solid ${m.color}18`, borderLeft: `3px solid ${m.color}`, borderRadius: "var(--r-md)" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${m.color}14`, border: `1px solid ${m.color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={13} color={m.color} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>{m.title}</div>
                    <div style={{ fontSize: 10, color: "var(--text-3)" }}>{m.value} · {m.date}</div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Confirmed sponsors showcase */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", gap: 8 }}>
          <CheckCircle size={14} color="var(--success)" strokeWidth={1.5} />
          <div className="g-label">Confirmed Sponsors — Dandiya Night &apos;26</div>
        </div>
        <table className="g-table">
          <thead><tr><th>Company</th><th>Category</th><th>Deal Value</th><th>Closed By</th><th>Confirmed</th></tr></thead>
          <tbody>
            {confirmed.map(lead => {
              const closer = TEAM.find(m => m.id === lead.assigned_to)
              return (
                <tr key={lead.id}>
                  <td style={{ fontWeight: 700, color: "var(--text-1)" }}>{lead.company}</td>
                  <td><span className="badge badge-purple" style={{ fontSize: 9 }}>{lead.category}</span></td>
                  <td style={{ fontSize: 13, fontWeight: 800, color: "#C9A24B" }}>₹{lead.deal_value.toLocaleString("en-IN")}</td>
                  <td>
                    {closer && (
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, background: `${closer.color}18`, border: `1px solid ${closer.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: closer.color }}>
                          {closer.initials}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--text-2)" }}>{closer.name.split(" ")[0]}</span>
                      </div>
                    )}
                  </td>
                  <td><span className="badge badge-green" style={{ fontSize: 9 }}>Confirmed</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </motion.div>
    </div>
  )
}
