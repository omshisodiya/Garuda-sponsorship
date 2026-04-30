"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useSecurityStore } from "../lib/securityStore"
import {
  Target, CheckCircle, Clock, PhoneCall, Mail,
  ChevronDown, ChevronUp, Loader,
} from "lucide-react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import type { Lead } from "../lib/data"

export default function TeamPage() {
  const { teamLocked } = useSecurityStore()
  const router         = useRouter()

  const [myLeads,    setMyLeads]    = useState<Lead[]>([])
  const [userName,   setUserName]   = useState("Team Member")
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState<string | null>(null)
  const [note,       setNote]       = useState("")
  const [noteSaved,  setNoteSaved]  = useState(false)

  useEffect(() => {
    if (teamLocked) router.push("/locked")
  }, [teamLocked, router])

  // Load current user + their leads
  useEffect(() => {
    async function load() {
      try {
        const [meRes, leadsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/leads"),
        ])
        if (meRes.ok) {
          const { user } = await meRes.json()
          setUserName(user?.name ?? "Team Member")
        }
        if (leadsRes.ok) {
          const { leads } = await leadsRes.json()
          setMyLeads(leads ?? [])
        }
      } catch { /* silent — UI handles empty state */ } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Compute radar data from actual leads
  const radarData = useMemo(() => {
    const total = myLeads.length || 1
    const contacted    = myLeads.filter(l => l.status !== "not_started").length
    const proposals    = myLeads.filter(l => ["proposal","negotiation","won"].includes(l.stage)).length
    const won          = myLeads.filter(l => l.stage === "won").length
    const today = new Date()
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(today.getDate() - 3)
    const recentActivity = myLeads.filter(l => new Date(l.last_activity) >= threeDaysAgo).length
    return [
      { axis: "Outreach",   value: Math.round((contacted / total) * 100) },
      { axis: "Proposals",  value: Math.round((proposals  / total) * 100) },
      { axis: "Closures",   value: Math.round((won        / total) * 100) },
      { axis: "Active",     value: Math.round((recentActivity / total) * 100) },
      { axis: "Pipeline",   value: myLeads.length > 0 ? Math.min(100, myLeads.length * 10) : 0 },
    ]
  }, [myLeads])

  // Follow-ups due: leads with last_activity > 3 days old and not confirmed/rejected
  const followUpsDue = useMemo(() => {
    const today = new Date()
    const threeDaysAgo = new Date(today)
    threeDaysAgo.setDate(today.getDate() - 3)
    return myLeads.filter(l =>
      !["confirmed", "rejected"].includes(l.status) &&
      new Date(l.last_activity) < threeDaysAgo
    )
  }, [myLeads])

  function saveNote() {
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2200)
  }

  const stageColor: Record<string, string> = {
    prospect: "badge-blue", qualified: "badge-purple", proposal: "badge-gold",
    negotiation: "badge-orange", won: "badge-green", lost: "badge-red",
  }

  const kpis = [
    { label: "My Leads",       value: myLeads.length,                                     icon: <Target size={15} strokeWidth={1.5} />,     color: "#C9A24B" },
    { label: "Contacted",      value: myLeads.filter(l => l.status !== "not_started").length, icon: <PhoneCall size={15} strokeWidth={1.5} />, color: "#60A5FA" },
    { label: "Confirmed",      value: myLeads.filter(l => l.status === "confirmed").length,   icon: <CheckCircle size={15} strokeWidth={1.5} />, color: "#4ADE80" },
    { label: "Follow-ups Due", value: followUpsDue.length,                                   icon: <Clock size={15} strokeWidth={1.5} />,     color: "#F59E0B" },
  ]

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader size={24} color="var(--text-3)" strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading your dashboard…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Team · My Dashboard</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>
            Welcome, {userName}
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            {myLeads.length} assigned leads · Dandiya Night &apos;26
          </p>
        </div>
        <button className="btn-gold" onClick={() => router.push("/leads")} style={{ fontSize: 11 }}>
          View All Leads
        </button>
      </motion.div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="kpi-card">
            <div style={{ position: "absolute", top: 0, left: 0, width: 32, height: 2.5, background: k.color, borderRadius: "18px 0 3px 0" }} />
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${k.color}18`, border: `1px solid ${k.color}28`, display: "flex", alignItems: "center", justifyContent: "center", color: k.color, marginBottom: 10 }}>{k.icon}</div>
            <div className="g-label" style={{ marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>

        {/* My Leads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--brand-edge)" }}>
              <div className="g-label">My Assigned Leads ({myLeads.length})</div>
            </div>
            <div>
              {myLeads.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                  No leads assigned to you yet.
                </div>
              ) : myLeads.map((lead, i) => (
                <motion.div key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <div
                    style={{ padding: "13px 20px", borderBottom: "1px solid rgba(201,162,75,0.05)", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, transition: "background 0.12s" }}
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--glass-2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{lead.company}</div>
                      <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>{lead.poc_name} · {lead.category}</div>
                    </div>
                    <span className={`badge ${stageColor[lead.stage]}`} style={{ fontSize: 9 }}>{lead.stage}</span>
                    <span style={{ fontSize: 12, color: "#C9A24B", fontWeight: 700, minWidth: 70, textAlign: "right" }}>₹{lead.deal_value.toLocaleString("en-IN")}</span>
                    {expanded === lead.id ? <ChevronUp size={14} color="var(--text-3)" /> : <ChevronDown size={14} color="var(--text-3)" />}
                  </div>

                  <AnimatePresence>
                    {expanded === lead.id && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden", background: "rgba(0,0,0,0.2)", borderBottom: "1px solid rgba(201,162,75,0.05)" }}>
                        <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          {[
                            { label: "Email",        value: lead.poc_email },
                            { label: "Phone",        value: lead.poc_phone },
                            { label: "Status",       value: lead.status.replace(/_/g, " ") },
                            { label: "Probability",  value: `${lead.probability}%` },
                            { label: "Last Activity", value: lead.last_activity },
                          ].map(row => (
                            <div key={row.label}>
                              <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{row.label}</div>
                              <div style={{ fontSize: 12, color: "var(--text-1)" }}>{row.value}</div>
                            </div>
                          ))}
                          <div style={{ gridColumn: "1/-1" }}>
                            <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>Notes</div>
                            <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.6 }}>{lead.notes || "—"}</div>
                          </div>
                          <div style={{ gridColumn: "1/-1", display: "flex", gap: 8 }}>
                            <button className="btn-gold" style={{ fontSize: 10, padding: "7px 12px" }} onClick={() => window.open(`mailto:${lead.poc_email}`)}>
                              <Mail size={11} /> Email
                            </button>
                            <button className="btn-ghost" style={{ fontSize: 10, padding: "7px 12px" }} onClick={() => window.open(`tel:${lead.poc_phone}`)}>
                              <PhoneCall size={11} /> Call
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Follow-ups due */}
          {followUpsDue.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel">
              <div className="g-label" style={{ marginBottom: 12, color: "var(--warning)" }}>
                Follow-ups Overdue ({followUpsDue.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {followUpsDue.map(lead => (
                  <div key={lead.id} style={{ padding: "10px 14px", background: "var(--warning-bg)", border: "1px solid var(--warning-edge)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", gap: 12 }}>
                    <Clock size={13} color="var(--warning)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{lead.company}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>Last activity: {lead.last_activity}</div>
                    </div>
                    <button className="btn-gold" style={{ fontSize: 10, padding: "5px 10px" }} onClick={() => window.open(`mailto:${lead.poc_email}`)}>
                      <Mail size={10} /> Follow up
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Performance Radar */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }} className="panel">
            <div className="g-label" style={{ marginBottom: 4 }}>Performance Radar</div>
            <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 12 }}>Based on your assigned leads</div>
            {myLeads.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(201,162,75,0.1)" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: "var(--text-3)", fontSize: 9 }} />
                  <Radar dataKey="value" stroke="#C9A24B" fill="#C9A24B" fillOpacity={0.12} strokeWidth={1.5} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          {/* Notes */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="panel">
            <div className="g-label" style={{ marginBottom: 10 }}>Quick Notes</div>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Log a sponsor interaction, idea, or follow-up..."
              style={{ width: "100%", minHeight: 90, padding: "10px 12px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", color: "var(--text-1)", fontSize: 12, lineHeight: 1.7, resize: "vertical", fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              onFocus={e => { e.target.style.borderColor = "var(--brand-2)" }}
              onBlur={e => { e.target.style.borderColor = "var(--brand-edge)" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <button className="btn-gold" onClick={saveNote} style={{ fontSize: 10, padding: "7px 14px" }}>Save Note</button>
              <AnimatePresence>
                {noteSaved && (
                  <motion.span initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 11, color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle size={12} /> Saved
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Revenue summary */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>My Revenue Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Secured",  value: myLeads.filter(l => l.status === "confirmed").reduce((s, l) => s + l.deal_value, 0), color: "#4ADE80" },
                { label: "Pipeline", value: myLeads.filter(l => !["confirmed","rejected"].includes(l.status)).reduce((s, l) => s + l.deal_value * l.probability / 100, 0), color: "#C9A24B" },
                { label: "Total Value", value: myLeads.reduce((s, l) => s + l.deal_value, 0), color: "#60A5FA" },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: item.color, fontVariantNumeric: "tabular-nums" }}>
                    ₹{Math.round(item.value).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
