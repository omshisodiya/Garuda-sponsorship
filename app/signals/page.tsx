"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, Brain, Clock, Target, ArrowUpRight, Shield } from "lucide-react"
import { SIGNALS, LEADS, TEAM } from "../lib/data"

type Signal = typeof SIGNALS[number]
type Filter = "all" | "opportunity" | "risk" | "action"

const TYPE_CONFIG = {
  opportunity: { label: "Opportunity",  icon: TrendingUp,    color: "var(--success)",  bg: "var(--success-bg)",  edge: "var(--success-edge)",  badge: "badge-green"  },
  risk:        { label: "Risk",         icon: AlertTriangle, color: "var(--danger)",   bg: "var(--danger-bg)",   edge: "var(--danger-edge)",   badge: "badge-red"    },
  action:      { label: "Action",       icon: Target,        color: "var(--warning)",  bg: "var(--warning-bg)",  edge: "var(--warning-edge)",  badge: "badge-orange" },
}

function SignalCard({ sig, onAck, acked }: { sig: Signal; onAck: (id: string) => void; acked: boolean }) {
  const cfg  = TYPE_CONFIG[sig.type]
  const Icon = cfg.icon
  const lead = LEADS.find(l => l.id === sig.lead)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: acked ? 0.45 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      style={{
        padding: "16px 18px",
        background: acked ? "rgba(255,255,255,0.01)" : cfg.bg,
        border: `1px solid ${acked ? "rgba(255,255,255,0.06)" : cfg.edge}`,
        borderLeft: `3px solid ${acked ? "var(--text-3)" : cfg.color}`,
        borderRadius: "var(--r-md)",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: acked ? "rgba(255,255,255,0.04)" : `${cfg.color}18`, border: `1px solid ${acked ? "rgba(255,255,255,0.08)" : cfg.edge}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={acked ? "var(--text-3)" : cfg.color} strokeWidth={1.5} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: acked ? "var(--text-3)" : "var(--text-1)" }}>{sig.company}</span>
            <span className={`badge ${acked ? "badge-blue" : cfg.badge}`} style={{ fontSize: 9 }}>{cfg.label}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: acked ? "var(--text-3)" : cfg.color, marginLeft: "auto" }}>Score {sig.score}%</span>
          </div>

          <div style={{ fontSize: 12, fontWeight: 600, color: acked ? "var(--text-3)" : "var(--text-2)", marginBottom: 4 }}>{sig.title}</div>
          <div style={{ fontSize: 11, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 10 }}>{sig.desc}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} strokeWidth={1.5} /> {sig.time}
            </span>

            {lead && (
              <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                · Deal ₹{lead.deal_value.toLocaleString("en-IN")} · {lead.stage}
              </span>
            )}

            <div style={{ marginLeft: "auto", display: "flex", gap: 7 }}>
              {!acked && (
                <button onClick={() => onAck(sig.id)} className="btn-ghost"
                  style={{ padding: "5px 12px", fontSize: 10 }}>
                  <CheckCircle2 size={11} strokeWidth={1.5} /> Acknowledge
                </button>
              )}
              {lead && (
                <button className="btn-ghost" style={{ padding: "5px 12px", fontSize: 10 }}>
                  View Lead <ArrowUpRight size={11} strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function SignalsPage() {
  const [filter, setFilter]   = useState<Filter>("all")
  const [acked, setAcked]     = useState<Set<string>>(new Set())
  const [aiLoading, setAiLoading] = useState(false)

  function acknowledge(id: string) {
    setAcked(prev => new Set([...prev, id]))
  }

  const filtered = SIGNALS.filter(s => filter === "all" || s.type === filter)
  const active   = filtered.filter(s => !acked.has(s.id))
  const resolved = filtered.filter(s =>  acked.has(s.id))

  const counts = {
    opportunity: SIGNALS.filter(s => s.type === "opportunity").length,
    risk:        SIGNALS.filter(s => s.type === "risk").length,
    action:      SIGNALS.filter(s => s.type === "action").length,
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>AI · Intelligence Feed</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Signal Intelligence</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>
            {active.length} active signals · AI-generated from live pipeline
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setAiLoading(l => !l)} className="btn-ghost" style={{ fontSize: 11 }}>
            <Brain size={13} strokeWidth={1.5} /> {aiLoading ? "Generating..." : "Refresh AI Signals"}
          </button>
        </div>
      </motion.div>

      {/* Summary tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
        {(["opportunity","risk","action"] as const).map((type, i) => {
          const cfg  = TYPE_CONFIG[type]
          const Icon = cfg.icon
          return (
            <motion.div key={type} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              onClick={() => setFilter(f => f === type ? "all" : type)}
              style={{ padding: "16px 20px", background: filter === type ? cfg.bg : "var(--glass-1)", border: `1px solid ${filter === type ? cfg.edge : "var(--brand-edge)"}`, borderRadius: "var(--r-lg)", cursor: "pointer", display: "flex", alignItems: "center", gap: 13, transition: "all 0.15s" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: `${cfg.color}14`, border: `1px solid ${cfg.edge}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={16} color={cfg.color} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>{counts[type]}</div>
                <div className="g-label">{cfg.label}s</div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Filter bar */}
      <div style={{ display: "flex", gap: 6, marginBottom: 18, flexWrap: "wrap" }}>
        {(["all","opportunity","risk","action"] as Filter[]).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "6px 14px", borderRadius: 100, border: "1px solid", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.14s",
              borderColor: filter === f ? "var(--brand-2)" : "var(--brand-edge)",
              background: filter === f ? "rgba(201,162,75,0.1)" : "transparent",
              color: filter === f ? "var(--brand-2)" : "var(--text-3)" }}>
            {f === "all" ? `All (${SIGNALS.length})` : `${TYPE_CONFIG[f].label}s (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Active signals */}
      <div style={{ marginBottom: 28 }}>
        <div className="g-label" style={{ marginBottom: 12 }}>Active — {active.length} signals</div>
        <AnimatePresence>
          {active.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ padding: "32px", textAlign: "center", border: "1px dashed rgba(201,162,75,0.1)", borderRadius: "var(--r-md)", color: "var(--text-3)", fontSize: 12 }}>
              <Shield size={28} strokeWidth={1} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
              No active signals for this filter
            </motion.div>
          )}
          {active.map(sig => (
            <SignalCard key={sig.id} sig={sig} onAck={acknowledge} acked={false} />
          ))}
        </AnimatePresence>
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <div className="g-label" style={{ marginBottom: 12, opacity: 0.6 }}>Acknowledged — {resolved.length}</div>
          {resolved.map(sig => (
            <SignalCard key={sig.id} sig={sig} onAck={acknowledge} acked={true} />
          ))}
        </div>
      )}

      {/* AI info */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={{ marginTop: 24, padding: "14px 18px", background: "rgba(96,165,250,0.05)", border: "1px solid rgba(96,165,250,0.15)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", gap: 10 }}>
        <Brain size={14} color="var(--info)" strokeWidth={1.5} />
        <span style={{ fontSize: 11, color: "var(--text-3)" }}>
          Signals are AI-generated by Garuda Brain from live pipeline activity, response cadence, and probability trends. Scores update every 15 minutes.
        </span>
        <ChevronRight size={13} color="var(--text-3)" />
      </motion.div>
    </div>
  )
}
