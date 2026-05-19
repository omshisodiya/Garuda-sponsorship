"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useSecurityStore } from "../lib/securityStore"
import {
  Target, CheckCircle, Clock, PhoneCall, Mail, Plus, X, Upload,
  ChevronDown, ChevronUp, Loader, Trophy, Inbox, FileText,
} from "lucide-react"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts"
import type { Lead } from "../lib/data"

type LeaderboardEntry = { id: string; name: string; initials: string; color: string; role: string; xp: number }
type LbMeta = { resetMessage: string; resetAt: string | null }
type IntakeLead = {
  id: string; name: string; company: string; phone: string; email: string
  notes: string; submitted_by: string; submitted_by_name: string
  status: "new" | "working" | "dead" | "graduated"
  graduated_lead_id: string | null; created_at: string
}

// ── CSV helpers ───────────────────────────────────────────────────────────────
function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let cur = "", inQ = false
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++ } else inQ = !inQ
    } else if (line[i] === ',' && !inQ) { result.push(cur); cur = "" }
    else cur += line[i]
  }
  result.push(cur)
  return result
}

function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []
  const headers = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
  return lines.slice(1).map(line => {
    const vals = parseCsvLine(line)
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? "").trim() })
    return obj
  }).filter(r => r.name?.trim())
}

function relativeDate(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const INTAKE_DOT: Record<string, string> = {
  new: "#60A5FA", working: "#C9A24B", dead: "#F87171", graduated: "#4ADE80",
}

export default function TeamPage() {
  const { teamLocked } = useSecurityStore()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  // existing state
  const [myLeads,     setMyLeads]     = useState<Lead[]>([])
  const [userName,    setUserName]    = useState("Team Member")
  const [userId,      setUserId]      = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [lbMeta,      setLbMeta]      = useState<LbMeta>({ resetMessage: "", resetAt: null })
  const [loading,     setLoading]     = useState(true)
  const [expanded,    setExpanded]    = useState<string | null>(null)
  const [note,        setNote]        = useState("")
  const [noteSaved,   setNoteSaved]   = useState(false)

  // intake state
  const [showAdd,      setShowAdd]      = useState(false)
  const [addTab,       setAddTab]       = useState<"single" | "bulk">("single")
  const [sForm,        setSForm]        = useState({ name: "", company: "", phone: "", email: "", notes: "" })
  const [bulkRows,     setBulkRows]     = useState<Array<Record<string, string>>>([])
  const [bulkFileName, setBulkFileName] = useState("")
  const [dragOver,     setDragOver]     = useState(false)
  const [submitting,   setSubmitting]   = useState(false)
  const [submitResult, setSubmitResult] = useState("")
  const [myIntake,     setMyIntake]     = useState<IntakeLead[]>([])
  const [iFilter,      setIFilter]      = useState<"all" | "new" | "working" | "dead" | "graduated">("all")
  const [intakeTarget, setIntakeTarget] = useState(0)

  useEffect(() => {
    if (teamLocked) router.push("/locked")
  }, [teamLocked, router])

  useEffect(() => {
    async function load() {
      try {
        const [meRes, leadsRes, lbRes, intakeRes, targetsRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/leads"),
          fetch("/api/leaderboard"),
          fetch("/api/intake"),
          fetch("/api/intake/targets"),
        ])
        let uid: string | null = null
        if (meRes.ok) {
          const { user } = await meRes.json()
          setUserName(user?.name ?? "Team Member")
          setUserId(user?.id ?? null)
          uid = user?.id ?? null
        }
        if (leadsRes.ok) setMyLeads((await leadsRes.json()).leads ?? [])
        if (lbRes.ok) {
          const d = await lbRes.json()
          setLeaderboard(d.ranked ?? [])
          setLbMeta({ resetMessage: d.resetMessage ?? "", resetAt: d.resetAt ?? null })
        }
        if (intakeRes.ok) setMyIntake((await intakeRes.json()).leads ?? [])
        if (targetsRes.ok && uid) {
          const { targets } = await targetsRes.json()
          setIntakeTarget(targets?.[uid] ?? 0)
        }
      } catch { /* silent */ } finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShowAdd(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const radarData = useMemo(() => {
    const total = myLeads.length || 1
    const contacted     = myLeads.filter(l => l.status !== "not_started").length
    const proposals     = myLeads.filter(l => ["proposal", "negotiation", "won"].includes(l.stage)).length
    const won           = myLeads.filter(l => l.stage === "won").length
    const threeDaysAgo  = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const recentActivity = myLeads.filter(l => new Date(l.last_activity) >= threeDaysAgo).length
    return [
      { axis: "Outreach",  value: Math.round((contacted     / total) * 100) },
      { axis: "Proposals", value: Math.round((proposals     / total) * 100) },
      { axis: "Closures",  value: Math.round((won           / total) * 100) },
      { axis: "Active",    value: Math.round((recentActivity / total) * 100) },
      { axis: "Pipeline",  value: myLeads.length > 0 ? Math.min(100, myLeads.length * 10) : 0 },
    ]
  }, [myLeads])

  const followUpsDue = useMemo(() => {
    const threeDaysAgo = new Date(); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    return myLeads.filter(l =>
      !["confirmed", "rejected"].includes(l.status) &&
      new Date(l.last_activity) < threeDaysAgo
    )
  }, [myLeads])

  const filteredIntake = useMemo(() =>
    iFilter === "all" ? myIntake : myIntake.filter(l => l.status === iFilter)
  , [myIntake, iFilter])

  // ── file handling ──────────────────────────────────────────────────────────
  function processFile(file: File) {
    setBulkFileName(file.name)
    const reader = new FileReader()
    reader.onload = e => setBulkRows(parseCsv(e.target?.result as string))
    reader.readAsText(file)
  }
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (f) processFile(f)
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]; if (f) processFile(f)
  }
  function downloadTemplate() {
    const csv = "name,company,phone,email,notes\nExample Lead,Company Name,9876543210,email@example.com,Notes here"
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    Object.assign(document.createElement("a"), { href: url, download: "intake_template.csv" }).click()
    URL.revokeObjectURL(url)
  }

  // ── submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    const leads = addTab === "single"
      ? [{ name: sForm.name, company: sForm.company, phone: sForm.phone, email: sForm.email, notes: sForm.notes }]
      : bulkRows.map(r => ({ name: r.name ?? "", company: r.company ?? "", phone: r.phone ?? "", email: r.email ?? "", notes: r.notes ?? "" }))
    if (!leads.some(l => l.name?.trim())) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/intake", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads }),
      })
      const data = await res.json()
      if (data.ok) {
        setSubmitResult(`${data.count} lead${data.count !== 1 ? "s" : ""} submitted!`)
        const r = await fetch("/api/intake")
        if (r.ok) setMyIntake((await r.json()).leads ?? [])
        setTimeout(() => {
          setShowAdd(false); setSubmitResult("")
          setSForm({ name: "", company: "", phone: "", email: "", notes: "" })
          setBulkRows([]); setBulkFileName(""); setAddTab("single")
        }, 1800)
      }
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  async function updateIntakeStatus(id: string, status: string) {
    const res = await fetch(`/api/intake/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) setMyIntake(prev => prev.map(l => l.id === id ? { ...l, status: status as IntakeLead["status"] } : l))
  }

  function saveNote() { setNoteSaved(true); setTimeout(() => setNoteSaved(false), 2200) }

  const stageColor: Record<string, string> = {
    prospect: "badge-blue", qualified: "badge-purple", proposal: "badge-gold",
    negotiation: "badge-orange", won: "badge-green", lost: "badge-red",
  }

  const kpis = [
    { label: "My Leads",       value: myLeads.length,                                          icon: <Target    size={15} strokeWidth={1.5} />, color: "#C9A24B" },
    { label: "Contacted",      value: myLeads.filter(l => l.status !== "not_started").length,  icon: <PhoneCall size={15} strokeWidth={1.5} />, color: "#60A5FA" },
    { label: "Confirmed",      value: myLeads.filter(l => l.status === "confirmed").length,     icon: <CheckCircle size={15} strokeWidth={1.5} />, color: "#4ADE80" },
    { label: "Follow-ups Due", value: followUpsDue.length,                                      icon: <Clock     size={15} strokeWidth={1.5} />, color: "#F59E0B" },
  ]

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
      <Loader size={24} color="var(--text-3)" strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
      <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading your dashboard…</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Team · My Dashboard</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>
            Welcome, {userName}
          </h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            {myLeads.length} assigned leads · Dandiya Night &apos;26
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-gold" onClick={() => setShowAdd(true)} style={{ fontSize: 11 }}>
            <Plus size={13} /> Add Lead
          </button>
          <button className="btn-ghost" onClick={() => router.push("/leads")} style={{ fontSize: 11 }}>
            View All Leads
          </button>
        </div>
      </motion.div>

      {/* Intake submission banner — always visible */}
      {(() => {
        const submitted = myIntake.length
        const hasTarget = intakeTarget > 0
        const pct  = hasTarget ? Math.min(100, Math.round(submitted / intakeTarget * 100)) : 0
        const done = hasTarget && submitted >= intakeTarget
        return (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: 18, padding: "14px 20px", borderRadius: "var(--r-lg)", border: `1px solid ${done ? "rgba(74,222,128,0.35)" : "rgba(201,162,75,0.35)"}`, background: done ? "rgba(74,222,128,0.06)" : "rgba(201,162,75,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasTarget ? 10 : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Inbox size={15} color={done ? "#4ADE80" : "#C9A24B"} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                    Lead Submission Target
                    {done && <span style={{ marginLeft: 8, fontSize: 10, color: "#4ADE80", fontWeight: 700 }}>✓ Complete!</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 1 }}>
                    {!hasTarget
                      ? `${submitted} lead${submitted !== 1 ? "s" : ""} submitted · no target assigned yet`
                      : done
                        ? `You've hit your target of ${intakeTarget} leads`
                        : `${intakeTarget - submitted} more lead${intakeTarget - submitted !== 1 ? "s" : ""} to reach your target`}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: done ? "#4ADE80" : "#C9A24B", fontVariantNumeric: "tabular-nums" }}>{submitted}</span>
                {hasTarget && <span style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}>/{intakeTarget}</span>}
              </div>
            </div>
            {hasTarget && (
              <>
                <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: [0.4,0,0.2,1] }}
                    style={{ height: "100%", borderRadius: 100, background: done ? "linear-gradient(90deg,#4ADE80,#22D3EE)" : "linear-gradient(90deg,#C9A24B,#F472B6)" }} />
                </div>
                {!done && <div style={{ marginTop: 6, fontSize: 10, color: "var(--text-3)" }}>{pct}% complete · click <strong style={{ color: "#C9A24B" }}>Add Lead</strong> above to submit new leads</div>}
              </>
            )}
          </motion.div>
        )
      })()}

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

        {/* Left — My Leads */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--brand-edge)" }}>
              <div className="g-label">My Assigned Leads ({myLeads.length})</div>
            </div>
            <div>
              {myLeads.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No leads assigned to you yet.</div>
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
                            { label: "Email",         value: lead.poc_email },
                            { label: "Phone",         value: lead.poc_phone },
                            { label: "Status",        value: lead.status.replace(/_/g, " ") },
                            { label: "Probability",   value: `${lead.probability}%` },
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

          {followUpsDue.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel">
              <div className="g-label" style={{ marginBottom: 12, color: "var(--warning)" }}>Follow-ups Overdue ({followUpsDue.length})</div>
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

          {/* XP Leaderboard */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.32 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Trophy size={13} color="#C9A24B" strokeWidth={1.6} />
                <div className="g-label">XP Leaderboard</div>
              </div>
              <button className="btn-gold" onClick={() => router.push("/missions")} style={{ fontSize: 9, padding: "5px 10px" }}>Claim More XP</button>
            </div>
            {lbMeta.resetMessage && (
              <div style={{ padding: "7px 16px", background: "rgba(167,139,250,0.08)", borderBottom: "1px solid rgba(167,139,250,0.18)", fontSize: 11, color: "#A78BFA", fontWeight: 600 }}>
                {lbMeta.resetMessage}
              </div>
            )}
            <div style={{ maxHeight: 260, overflowY: "auto" }}>
              {leaderboard.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>No data yet</div>
              ) : leaderboard.map((m, i) => {
                const rank = i + 1
                const rankLabel = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`
                const isMe = m.id === userId
                const maxXp = leaderboard[0]?.xp || 1
                return (
                  <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 16px", borderBottom: "1px solid rgba(201,162,75,0.05)", background: isMe ? "rgba(201,162,75,0.06)" : "transparent" }}>
                    <div style={{ width: 22, fontSize: rank <= 3 ? 13 : 10, fontWeight: 800, color: rank <= 3 ? undefined : "var(--text-3)", textAlign: "center", flexShrink: 0 }}>{rankLabel}</div>
                    <div style={{ width: 26, height: 26, borderRadius: 7, background: `${m.color}18`, border: `1px solid ${isMe ? m.color : m.color + "30"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: m.color, flexShrink: 0 }}>{m.initials}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: isMe ? 700 : 600, color: isMe ? "var(--text-brand)" : "var(--text-1)", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.name}{isMe ? " (you)" : ""}
                      </div>
                      <div className="g-bar-bg">
                        <motion.div className="g-bar-fill" initial={{ width: 0 }} animate={{ width: `${m.xp > 0 ? (m.xp / maxXp) * 100 : 0}%` }} transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1], delay: i * 0.03 }} style={{ background: isMe ? "#C9A24B" : undefined }} />
                      </div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: m.xp > 0 ? "#C9A24B" : "var(--text-3)", flexShrink: 0, fontVariantNumeric: "tabular-nums" }}>{m.xp} XP</div>
                  </div>
                )
              })}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>My Revenue Summary</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Secured",     value: myLeads.filter(l => l.status === "confirmed").reduce((s, l) => s + l.deal_value, 0),                                                              color: "#4ADE80" },
                { label: "Pipeline",    value: myLeads.filter(l => !["confirmed","rejected"].includes(l.status)).reduce((s, l) => s + l.deal_value * l.probability / 100, 0),                   color: "#C9A24B" },
                { label: "Total Value", value: myLeads.reduce((s, l) => s + l.deal_value, 0),                                                                                                    color: "#60A5FA" },
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

      {/* ── My Submissions ─────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
        className="panel" style={{ marginTop: 18, padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Inbox size={14} color="#60A5FA" strokeWidth={1.6} />
            <div className="g-label">My Submitted Leads</div>
            {myIntake.filter(l => l.status === "new").length > 0 && (
              <span style={{ background: "#60A5FA18", color: "#60A5FA", border: "1px solid #60A5FA30", borderRadius: 20, padding: "1px 8px", fontSize: 10, fontWeight: 700 }}>
                {myIntake.filter(l => l.status === "new").length} new
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["all", "new", "working", "dead", "graduated"] as const).map(f => (
              <button key={f} onClick={() => setIFilter(f)}
                style={{ fontSize: 9, padding: "4px 10px", borderRadius: "var(--r-sm)", cursor: "pointer", border: `1px solid ${iFilter === f ? "var(--brand-edge)" : "transparent"}`, background: iFilter === f ? "rgba(201,162,75,0.1)" : "transparent", color: iFilter === f ? "#C9A24B" : "var(--text-3)", fontWeight: iFilter === f ? 700 : 500 }}>
                {f === "all" ? `All (${myIntake.length})` : `${f[0].toUpperCase()}${f.slice(1)} (${myIntake.filter(l => l.status === f).length})`}
              </button>
            ))}
            <button className="btn-gold" onClick={() => setShowAdd(true)} style={{ fontSize: 9, padding: "4px 10px" }}>
              <Plus size={11} /> Add
            </button>
          </div>
        </div>

        {filteredIntake.length === 0 ? (
          <div style={{ padding: "28px", textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
            {myIntake.length === 0
              ? <div><div style={{ marginBottom: 10 }}>No leads submitted yet.</div>
                  <button className="btn-gold" onClick={() => setShowAdd(true)} style={{ fontSize: 11 }}><Plus size={13} /> Submit Your First Lead</button>
                </div>
              : `No ${iFilter} leads`}
          </div>
        ) : (
          <div>
            {filteredIntake.map((lead, i) => (
              <motion.div key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                style={{ padding: "11px 20px", borderBottom: "1px solid rgba(201,162,75,0.05)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: INTAKE_DOT[lead.status], flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>{lead.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 1 }}>
                    {lead.company && <span>{lead.company} · </span>}
                    {relativeDate(lead.created_at)}
                    {lead.status === "graduated" && <span style={{ color: "#4ADE80", marginLeft: 4 }}>· Graduated to vault ✓</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  {lead.phone && (
                    <button className="btn-ghost" style={{ fontSize: 9, padding: "4px 8px" }} onClick={() => window.open(`tel:${lead.phone}`)}>
                      <PhoneCall size={10} />
                    </button>
                  )}
                  {lead.email && (
                    <button className="btn-ghost" style={{ fontSize: 9, padding: "4px 8px" }} onClick={() => window.open(`mailto:${lead.email}`)}>
                      <Mail size={10} />
                    </button>
                  )}
                  {lead.status === "new" && (
                    <button className="btn-ghost" style={{ fontSize: 9, padding: "4px 8px", color: "#C9A24B" }} onClick={() => updateIntakeStatus(lead.id, "working")}>
                      Working
                    </button>
                  )}
                  {lead.status === "working" && (
                    <button className="btn-ghost" style={{ fontSize: 9, padding: "4px 8px", color: "var(--danger)" }} onClick={() => updateIntakeStatus(lead.id, "dead")}>
                      Dead
                    </button>
                  )}
                  {lead.status === "dead" && (
                    <button className="btn-ghost" style={{ fontSize: 9, padding: "4px 8px", color: "#60A5FA" }} onClick={() => updateIntakeStatus(lead.id, "new")}>
                      Reopen
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ── Add Lead Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(14px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => setShowAdd(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }}
              className="panel" style={{ width: "100%", maxWidth: 500, padding: 0, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
              onClick={e => e.stopPropagation()}>

              {/* Modal header */}
              <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <Plus size={14} color="#C9A24B" />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>Submit a Lead</div>
                </div>
                <button className="btn-ghost" onClick={() => setShowAdd(false)} style={{ padding: 6 }}><X size={14} /></button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid var(--brand-edge)", flexShrink: 0 }}>
                {(["single", "bulk"] as const).map(t => (
                  <button key={t} onClick={() => setAddTab(t)}
                    style={{ flex: 1, padding: "10px", fontSize: 11, fontWeight: addTab === t ? 700 : 500, background: addTab === t ? "rgba(201,162,75,0.08)" : "transparent", color: addTab === t ? "#C9A24B" : "var(--text-3)", borderBottom: addTab === t ? "2px solid #C9A24B" : "2px solid transparent", cursor: "pointer", border: "none", outline: "none", transition: "all 0.12s" }}>
                    {t === "single" ? "Single Lead" : "Bulk CSV"}
                  </button>
                ))}
              </div>

              {/* Success banner */}
              <AnimatePresence>
                {submitResult && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{ padding: "12px 20px", background: "rgba(74,222,128,0.1)", borderBottom: "1px solid rgba(74,222,128,0.2)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <CheckCircle size={14} color="#4ADE80" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#4ADE80" }}>{submitResult}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Body */}
              <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
                {addTab === "single" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    {[
                      { key: "name",    label: "Lead Name",             placeholder: "Person or brand name", required: true },
                      { key: "company", label: "Company / Organisation", placeholder: "Optional"                             },
                      { key: "phone",   label: "Phone",                 placeholder: "Mobile number"                         },
                      { key: "email",   label: "Email",                 placeholder: "Contact email"                         },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5, display: "block" }}>
                          {f.label}{f.required && <span style={{ color: "var(--danger)", marginLeft: 2 }}>*</span>}
                        </label>
                        <input value={sForm[f.key as keyof typeof sForm]}
                          onChange={e => setSForm(p => ({ ...p, [f.key]: e.target.value }))}
                          placeholder={f.placeholder}
                          style={{ width: "100%", padding: "9px 12px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", color: "var(--text-1)", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
                          onFocus={e => { e.target.style.borderColor = "var(--brand-2)" }}
                          onBlur={e => { e.target.style.borderColor = "var(--brand-edge)" }}
                        />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5, display: "block" }}>Notes</label>
                      <textarea value={sForm.notes} onChange={e => setSForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Context, source, anything useful…"
                        style={{ width: "100%", minHeight: 70, padding: "9px 12px", background: "rgba(0,0,0,0.25)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", color: "var(--text-1)", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                        onFocus={e => { e.target.style.borderColor = "var(--brand-2)" }}
                        onBlur={e => { e.target.style.borderColor = "var(--brand-edge)" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6 }}>
                        CSV columns: <span style={{ color: "var(--text-2)", fontWeight: 600 }}>name, company, phone, email, notes</span>
                        <br />First row must be headers. Max 200 rows.
                      </div>
                      <button className="btn-ghost" onClick={downloadTemplate} style={{ fontSize: 10, padding: "5px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        <FileText size={11} /> Template
                      </button>
                    </div>

                    {/* Drop zone */}
                    <div
                      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      style={{ border: `2px dashed ${dragOver ? "#C9A24B" : "var(--brand-edge)"}`, borderRadius: "var(--r-md)", padding: "24px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? "rgba(201,162,75,0.05)" : "transparent", transition: "all 0.15s" }}>
                      <Upload size={20} color={dragOver ? "#C9A24B" : "var(--text-3)"} style={{ margin: "0 auto 8px" }} />
                      <div style={{ fontSize: 12, color: dragOver ? "#C9A24B" : "var(--text-3)" }}>
                        {bulkFileName || "Drag & drop .csv here, or click to browse"}
                      </div>
                      {bulkRows.length > 0 && (
                        <div style={{ fontSize: 11, color: "#4ADE80", marginTop: 5, fontWeight: 700 }}>
                          {bulkRows.length} lead{bulkRows.length !== 1 ? "s" : ""} ready
                        </div>
                      )}
                    </div>
                    <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: "none" }} onChange={handleFileSelect} />

                    {bulkRows.length > 0 && (
                      <div style={{ border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                        <div style={{ overflowX: "auto", maxHeight: 180, overflowY: "auto" }}>
                          <table className="g-table" style={{ fontSize: 10 }}>
                            <thead><tr><th>Name</th><th>Company</th><th>Phone</th><th>Email</th></tr></thead>
                            <tbody>
                              {bulkRows.slice(0, 8).map((row, i) => (
                                <tr key={i}>
                                  <td style={{ fontWeight: 600 }}>{row.name}</td>
                                  <td>{row.company || "—"}</td>
                                  <td>{row.phone || "—"}</td>
                                  <td>{row.email || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {bulkRows.length > 8 && (
                          <div style={{ padding: "6px 14px", fontSize: 10, color: "var(--text-3)", borderTop: "1px solid var(--brand-edge)" }}>
                            + {bulkRows.length - 8} more rows
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit row */}
                <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
                  <button className="btn-ghost" onClick={() => setShowAdd(false)} style={{ flex: 1, justifyContent: "center", fontSize: 12 }}>Cancel</button>
                  <button className="btn-gold"
                    onClick={handleSubmit}
                    disabled={submitting || (addTab === "single" && !sForm.name.trim()) || (addTab === "bulk" && bulkRows.length === 0)}
                    style={{ flex: 2, justifyContent: "center", fontSize: 12, opacity: (submitting || (addTab === "single" && !sForm.name.trim()) || (addTab === "bulk" && bulkRows.length === 0)) ? 0.55 : 1 }}>
                    {submitting ? <Loader size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Plus size={12} />}
                    {submitting ? "Submitting…" : addTab === "single" ? "Submit Lead" : `Submit ${bulkRows.length || ""} Lead${bulkRows.length !== 1 ? "s" : ""}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
