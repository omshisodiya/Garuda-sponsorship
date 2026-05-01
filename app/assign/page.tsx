"use client"

import { useState, useMemo, useEffect } from "react"
import { motion } from "framer-motion"
import { Search, GitBranch, CheckSquare, Square, Loader, Shuffle } from "lucide-react"
import { TEAM } from "../lib/data"
import type { Lead, TeamMemberId } from "../lib/data"

export default function AssignPage() {
  const [leads,      setLeads]      = useState<Lead[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState<Set<string>>(new Set())
  const [search,     setSearch]     = useState("")
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [bulkTarget, setBulkTarget] = useState<TeamMemberId>("u20")
  const [distributing, setDistributing] = useState(false)

  // All members assignable (team > admin > superadmin for auto-distribute)
  const assignable = [...TEAM]

  useEffect(() => {
    fetch("/api/leads")
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setLeads(data.leads ?? []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() =>
    leads.filter(l =>
      [l.company, l.poc_name, l.category, l.status].join(" ")
        .toLowerCase().includes(search.toLowerCase())
    ),
    [leads, search]
  )

  async function assign(leadId: string, memberId: TeamMemberId | "null") {
    const assigned_to = memberId === "null" ? null : memberId
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, assigned_to } : l))
    setSaving(prev => new Set(prev).add(leadId))
    try {
      await fetch(`/api/leads/${leadId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ assigned_to }),
      })
    } catch { /* optimistic */ } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(leadId); return s })
    }
  }

  async function bulkAssign() {
    const ids = [...selected]
    setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, assigned_to: bulkTarget } : l))
    setSelected(new Set())
    await Promise.all(
      ids.map(id =>
        fetch(`/api/leads/${id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ assigned_to: bulkTarget }),
        }).catch(() => {})
      )
    )
  }

  async function autoDistribute() {
    const unassigned = leads.filter(l => l.assigned_to === null && !["confirmed","rejected"].includes(l.status))
    if (unassigned.length === 0) return
    setDistributing(true)

    // Priority order: team > admin > superadmin
    const byTier = (t: string) => t === "team" ? 0 : t === "admin" ? 1 : 2
    const pool = [...assignable]
      .filter(m => m.id !== "jc") // skip display-only member
      .sort((a, b) => byTier(a.tier) - byTier(b.tier))

    // Current load per member
    const load: Record<string, number> = {}
    pool.forEach(m => { load[m.id] = leads.filter(l => l.assigned_to === m.id).length })

    // Round-robin from least loaded, preferring team over admin over superadmin
    const assignments: { id: string; assigned_to: string }[] = []
    const updatedLoad = { ...load }

    for (const lead of unassigned) {
      // Find member with lowest load (tier-weighted)
      const best = pool.reduce((prev, curr) => {
        const pa = updatedLoad[prev.id] * 1 + byTier(prev.tier) * 0.001
        const ca = updatedLoad[curr.id] * 1 + byTier(curr.tier) * 0.001
        return ca < pa ? curr : prev
      })
      assignments.push({ id: lead.id, assigned_to: best.id })
      updatedLoad[best.id]++
    }

    // Optimistic update
    setLeads(prev =>
      prev.map(l => {
        const a = assignments.find(x => x.id === l.id)
        return a ? { ...l, assigned_to: a.assigned_to as TeamMemberId } : l
      })
    )

    // Persist
    await Promise.all(
      assignments.map(({ id, assigned_to }) =>
        fetch(`/api/leads/${id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ assigned_to }),
        }).catch(() => {})
      )
    )
    setDistributing(false)
  }

  function toggle(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function selectAll() {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(l => l.id)))
  }

  const teamStats = assignable.filter(m => m.id !== "jc").map(m => ({
    ...m,
    count: leads.filter(l => l.assigned_to === m.id).length,
  }))
  const unassigned = leads.filter(l => l.assigned_to === null).length

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh", flexDirection: "column", gap: 12 }}>
        <Loader size={24} color="var(--text-3)" strokeWidth={1.5} style={{ animation: "spin 1s linear infinite" }} />
        <div style={{ fontSize: 13, color: "var(--text-3)" }}>Loading leads…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1600, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Assignments · Lead Ownership</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Assignment Console</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            {leads.length} leads · {leads.length - unassigned} assigned · {unassigned} unassigned
          </p>
        </div>
        <button
          className="btn-gold"
          onClick={autoDistribute}
          disabled={distributing || unassigned === 0}
          style={{ fontSize: 11, opacity: unassigned === 0 ? 0.4 : 1 }}
        >
          <Shuffle size={13} strokeWidth={2} />
          {distributing ? "Distributing…" : `Auto-Distribute (${unassigned})`}
        </button>
      </motion.div>

      {/* Team Load — scrollable row */}
      <div style={{ overflowX: "auto", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 10, minWidth: "max-content" }}>
          {teamStats.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              style={{ padding: "12px 16px", background: "var(--glass-1)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-lg)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${m.color}18`, border: `1px solid ${m.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: m.color, flexShrink: 0 }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{m.count}</div>
                <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{m.name.split(" ")[0]}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 9, padding: "0 13px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)" }}>
          <Search size={13} color="var(--text-3)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads…"
            style={{ flex: 1, padding: "10px 0", background: "transparent", border: "none", color: "var(--text-1)", fontSize: 12, fontFamily: "inherit", outline: "none" }} />
        </div>

        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 13px", background: "rgba(201,162,75,0.07)", border: "1px solid rgba(201,162,75,0.2)", borderRadius: "var(--r-md)" }}>
            <GitBranch size={13} color="#C9A24B" />
            <span style={{ fontSize: 11, color: "#C9A24B", fontWeight: 700 }}>{selected.size} selected</span>
            <select className="g-select" value={bulkTarget} onChange={e => setBulkTarget(e.target.value as TeamMemberId)} style={{ minWidth: 130, fontSize: 11 }}>
              {assignable.filter(m => m.id !== "jc").map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.tier})</option>
              ))}
            </select>
            <button className="btn-gold" onClick={bulkAssign} style={{ padding: "7px 13px", fontSize: 11 }}>Bulk Assign</button>
            <button className="btn-ghost" onClick={() => setSelected(new Set())} style={{ padding: "7px 11px", fontSize: 12, lineHeight: 1 }}>&times;</button>
          </motion.div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="g-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th style={{ paddingLeft: 16, width: 44 }}>
                  <button onClick={selectAll} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-3)" }}>
                    {selected.size === filtered.length && filtered.length > 0
                      ? <CheckSquare size={14} color="#C9A24B" />
                      : <Square size={14} />}
                  </button>
                </th>
                <th>Company</th>
                <th>Contact</th>
                <th>Category</th>
                <th>Status</th>
                <th>Current Owner</th>
                <th>Assign To</th>
                <th style={{ paddingRight: 16 }}>Deal Value</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => {
                const owner = assignable.find(m => m.id === lead.assigned_to)
                const isSel  = selected.has(lead.id)
                const isSaving = saving.has(lead.id)
                return (
                  <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    style={{ background: isSel ? "rgba(201,162,75,0.04)" : undefined, opacity: isSaving ? 0.6 : 1 }}>
                    <td style={{ paddingLeft: 16 }}>
                      <button onClick={() => toggle(lead.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: "var(--text-3)" }}>
                        {isSel ? <CheckSquare size={14} color="#C9A24B" /> : <Square size={14} />}
                      </button>
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--text-1)", fontSize: 13 }}>{lead.company}</td>
                    <td style={{ fontSize: 11, color: "var(--text-2)" }}>
                      <div>{lead.poc_name}</div>
                      <div style={{ color: "var(--text-3)", fontSize: 10, marginTop: 1 }}>{lead.poc_phone}</div>
                    </td>
                    <td><span className="badge badge-purple" style={{ fontSize: 9 }}>{lead.category}</span></td>
                    <td>
                      <span className={`badge ${lead.status === "confirmed" ? "badge-green" : lead.status === "in_discussion" ? "badge-gold" : lead.status === "rejected" ? "badge-red" : "badge-blue"}`} style={{ fontSize: 9 }}>
                        {lead.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td>
                      {owner ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: `${owner.color}18`, border: `1px solid ${owner.color}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: owner.color }}>
                            {owner.initials}
                          </div>
                          <div>
                            <span style={{ fontSize: 11, color: owner.color, fontWeight: 600 }}>{owner.name.split(" ")[0]}</span>
                            <div style={{ fontSize: 9, color: "var(--text-3)" }}>{owner.tier}</div>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-3)" }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <select
                        className="g-select"
                        value={lead.assigned_to || "null"}
                        onChange={e => assign(lead.id, e.target.value as TeamMemberId | "null")}
                        style={{ minWidth: 160, fontSize: 11 }}
                        disabled={isSaving}
                      >
                        <option value="null">Unassigned</option>
                        <optgroup label="── Team ──">
                          {assignable.filter(m => m.tier === "team").map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="── Admin ──">
                          {assignable.filter(m => m.tier === "admin" && m.id !== "jc").map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="── Superadmin ──">
                          {assignable.filter(m => m.tier === "superadmin").map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </optgroup>
                      </select>
                    </td>
                    <td style={{ paddingRight: 16, fontSize: 12, fontWeight: 700, color: "#C9A24B" }}>
                      ₹{lead.deal_value.toLocaleString("en-IN")}
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-3)", fontSize: 13 }}>
            {leads.length === 0 ? "No leads found." : "No leads match your search."}
          </div>
        )}
      </motion.div>
    </div>
  )
}
