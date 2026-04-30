"use client"

import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Columns3, Flame, Clock, ChevronRight, X, Mail, Phone } from "lucide-react"
import { LEADS, TEAM, type Lead, type LeadStage } from "../lib/data"

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: "prospect",    label: "Prospect",    color: "var(--text-3)" },
  { key: "qualified",   label: "Qualified",   color: "var(--info)" },
  { key: "proposal",    label: "Proposal",    color: "#A78BFA" },
  { key: "negotiation", label: "Negotiation", color: "var(--warning)" },
  { key: "won",         label: "Won",         color: "var(--success)" },
  { key: "lost",        label: "Lost",        color: "var(--danger)" },
]

const BADGE: Record<LeadStage, string> = {
  prospect: "badge-blue", qualified: "badge-blue", proposal: "badge-purple",
  negotiation: "badge-orange", won: "badge-green", lost: "badge-red",
}

function isHot(l: Lead)     { return l.probability >= 75 && !["won","lost"].includes(l.stage) }
function isStalled(l: Lead) { return l.stage === "negotiation" && l.probability < 50 }

export default function PipelinePage() {
  const [selected, setSelected] = useState<Lead | null>(null)

  const byStage = useMemo(() =>
    Object.fromEntries(STAGES.map(s => [s.key, LEADS.filter(l => l.stage === s.key)])) as Record<LeadStage, Lead[]>,
    []
  )

  const totalPipeline = LEADS.filter(l => !["won","lost"].includes(l.stage))
    .reduce((s, l) => s + l.deal_value * l.probability / 100, 0)

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1700, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Pipeline · Kanban Board</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Pipeline Board</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            Weighted pipeline: ₹{Math.round(totalPipeline).toLocaleString("en-IN")} · {LEADS.filter(l => !["won","lost"].includes(l.stage)).length} active leads
          </p>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--success)" }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>Hot lead (75%+)</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "var(--warning)" }} />
            <span style={{ fontSize: 10, color: "var(--text-3)" }}>Stalled</span>
          </div>
        </div>
      </motion.div>

      {/* Kanban */}
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 12 }}>
        {STAGES.map((stage, si) => {
          const leads = byStage[stage.key] || []
          const stageValue = leads.reduce((s, l) => s + l.deal_value * l.probability / 100, 0)
          return (
            <motion.div key={stage.key} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: si * 0.07 }}
              style={{ minWidth: 230, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>

              {/* Column header */}
              <div style={{ padding: "10px 12px", background: "var(--glass-1)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", borderTop: `3px solid ${stage.color}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: stage.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{stage.label}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-1)" }}>{leads.length}</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--text-3)" }}>₹{Math.round(stageValue).toLocaleString("en-IN")}</div>
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
                {leads.map((lead, li) => (
                  <motion.div key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: li * 0.05 + si * 0.04 }}
                    whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}
                    onClick={() => setSelected(lead)}
                    style={{
                      padding: "11px 13px", borderRadius: "var(--r-md)", cursor: "pointer",
                      background: "var(--glass-2)",
                      border: `1px solid ${isHot(lead) ? "rgba(74,222,128,0.3)" : isStalled(lead) ? "rgba(245,158,11,0.3)" : "var(--brand-edge)"}`,
                      borderLeft: `3px solid ${isHot(lead) ? "var(--success)" : isStalled(lead) ? "var(--warning)" : stage.color}`,
                      transition: "all 0.15s",
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)", flex: 1, paddingRight: 6 }}>{lead.company}</div>
                      {isHot(lead) && <Flame size={11} color="var(--success)" style={{ flexShrink: 0 }} />}
                      {isStalled(lead) && <Clock size={11} color="var(--warning)" style={{ flexShrink: 0 }} />}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 7 }}>
                      {lead.poc_name} · {lead.category}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#C9A24B" }}>₹{lead.deal_value.toLocaleString("en-IN")}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 28, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                          <div style={{ width: `${lead.probability}%`, height: "100%", background: lead.probability >= 70 ? "var(--success)" : lead.probability >= 40 ? "var(--warning)" : "var(--info)", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 9, color: "var(--text-3)" }}>{lead.probability}%</span>
                      </div>
                    </div>
                    {lead.assigned_to && (
                      <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 3, background: `${TEAM.find(m => m.id === lead.assigned_to)?.color || "#C9A24B"}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, fontWeight: 800, color: TEAM.find(m => m.id === lead.assigned_to)?.color || "#C9A24B" }}>
                          {TEAM.find(m => m.id === lead.assigned_to)?.initials?.charAt(0)}
                        </div>
                        <span style={{ fontSize: 9, color: "var(--text-3)" }}>{TEAM.find(m => m.id === lead.assigned_to)?.name.split(" ")[0]}</span>
                      </div>
                    )}
                  </motion.div>
                ))}
                {leads.length === 0 && (
                  <div style={{ padding: "18px", textAlign: "center", color: "var(--text-3)", fontSize: 11, border: "1px dashed rgba(201,162,75,0.1)", borderRadius: "var(--r-md)" }}>
                    No leads
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9990 }}
              onClick={() => setSelected(null)} />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 380, background: "var(--bg-1)", borderLeft: "1px solid var(--brand-edge)", zIndex: 9991, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>{selected.company}</div>
                  <span className={`badge ${BADGE[selected.stage]}`} style={{ fontSize: 9, marginTop: 5, display: "inline-flex" }}>{selected.stage}</span>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "var(--text-3)", cursor: "pointer" }}><X size={18} /></button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "Deal Value",   value: `₹${selected.deal_value.toLocaleString("en-IN")}` },
                  { label: "Probability",  value: `${selected.probability}%` },
                  { label: "Category",     value: selected.category },
                  { label: "Status",       value: selected.status.replace("_"," ") },
                  { label: "Last Touch",   value: selected.last_activity },
                  { label: "Assigned To",  value: TEAM.find(m => m.id === selected.assigned_to)?.name || "Unassigned" },
                ].map(r => (
                  <div key={r.label} style={{ padding: "9px 11px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--r-md)", border: "1px solid var(--brand-edge)" }}>
                    <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 3 }}>{r.label}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", textTransform: "capitalize" }}>{r.value}</div>
                  </div>
                ))}
              </div>

              <div className="g-divider" style={{ margin: "2px 0" }} />
              <div>
                <div className="g-label" style={{ marginBottom: 6 }}>Point of Contact</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>{selected.poc_name}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Mail size={12} color="var(--text-3)" />
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{selected.poc_email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Phone size={12} color="var(--text-3)" />
                    <span style={{ fontSize: 12, color: "var(--text-2)" }}>{selected.poc_phone}</span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <>
                  <div className="g-divider" style={{ margin: "2px 0" }} />
                  <div>
                    <div className="g-label" style={{ marginBottom: 6 }}>Notes</div>
                    <div style={{ fontSize: 12, color: "var(--text-2)", lineHeight: 1.7, padding: "10px 12px", background: "rgba(0,0,0,0.2)", borderRadius: "var(--r-md)", border: "1px solid var(--brand-edge)" }}>{selected.notes}</div>
                  </div>
                </>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                <button className="btn-gold" onClick={() => window.open(`mailto:${selected.poc_email}`)} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>
                  <Mail size={12} /> Email
                </button>
                <button className="btn-ghost" style={{ padding: "11px 14px" }}><ChevronRight size={13} /></button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
