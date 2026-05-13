"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { TrendingUp, Target, CheckCircle, IndianRupee, Eye, EyeOff, Download } from "lucide-react"
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts"
import { LEADS, MONTHLY_REVENUE, TIERS, getStats, CLUB } from "../lib/data"

function ChartTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: unknown; color: string }>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "rgba(7,7,10,0.97)", border: "1px solid var(--brand-edge)", borderRadius: 10, padding: "8px 14px" }}>
      <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 5 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ fontSize: 12, color: p.color, fontWeight: 700 }}>
          {p.name}: <span style={{ color: "var(--text-1)" }}>₹{Number(p.value).toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  )
}

export default function VaultPage() {
  const [showProb, setShowProb] = useState(true)
  const stats = useMemo(() => getStats(), [])

  const confirmedLeads = LEADS.filter(l => l.status === "confirmed")
  const pipelineLeads  = LEADS.filter(l => !["confirmed","rejected"].includes(l.status))


  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Revenue · Intelligence Vault</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Revenue Vault</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>Target ₹{CLUB.target.toLocaleString("en-IN")} · Dandiya Night &apos;26</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" onClick={() => setShowProb(p => !p)} style={{ fontSize: 11 }}>
            {showProb ? <EyeOff size={13} /> : <Eye size={13} />} {showProb ? "Hide" : "Show"} Probability
          </button>
          <button className="btn-ghost" style={{ fontSize: 11 }}><Download size={13} /> Export PDF</button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Target",        value: stats.target,       color: "#6E695F", icon: <Target size={16} strokeWidth={1.5} />,       prefix: "₹" },
          { label: "Secured",       value: stats.secured,      color: "#4ADE80", icon: <CheckCircle size={16} strokeWidth={1.5} />,  prefix: "₹" },
          { label: "Pipeline",      value: stats.pipeline,     color: "#C9A24B", icon: <TrendingUp size={16} strokeWidth={1.5} />,   prefix: "₹" },
          { label: "Progress",      value: stats.progressPct,  color: "#60A5FA", icon: <IndianRupee size={16} strokeWidth={1.5} />, suffix: "%" },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="kpi-card">
            <div style={{ position: "absolute", top: 0, left: 0, width: 36, height: 2.5, background: k.color, borderRadius: "18px 0 3px 0" }} />
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${k.color}18`, border: `1px solid ${k.color}28`, display: "flex", alignItems: "center", justifyContent: "center", color: k.color, marginBottom: 11 }}>{k.icon}</div>
            <div className="g-label" style={{ marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)", fontVariantNumeric: "tabular-nums" }}>
              {k.prefix}{k.value.toLocaleString("en-IN")}{k.suffix}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Master progress bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ marginBottom: 18, padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="g-label">Revenue Progress — ₹5,00,000 Target</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-brand)" }}>{stats.progressPct}% secured · {Math.min(100, stats.pipelinePct)}% with pipeline</div>
        </div>
        <div style={{ height: 14, background: "rgba(255,255,255,0.04)", borderRadius: 100, overflow: "hidden", position: "relative" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${stats.progressPct}%` }} transition={{ duration: 1.2, ease: [0.4,0,0.2,1], delay: 0.3 }}
            style={{ position: "absolute", top: 0, left: 0, height: "100%", background: "linear-gradient(90deg, #15803D, #4ADE80)", borderRadius: 100 }} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, stats.pipelinePct) - stats.progressPct}%` }} transition={{ duration: 1.4, ease: [0.4,0,0.2,1], delay: 0.5 }}
            style={{ position: "absolute", top: 0, left: `${stats.progressPct}%`, height: "100%", background: "repeating-linear-gradient(45deg, rgba(201,162,75,0.4) 0px, rgba(201,162,75,0.4) 6px, transparent 6px, transparent 12px)", borderRadius: 100 }} />
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 10 }}>
          {[
            { label: "Secured",       value: `₹${stats.secured.toLocaleString("en-IN")}`,  color: "#4ADE80" },
            { label: "Pipeline",      value: `₹${stats.pipeline.toLocaleString("en-IN")}`, color: "#C9A24B" },
            { label: "Remaining",     value: `₹${Math.max(0, stats.target - stats.secured - stats.pipeline).toLocaleString("en-IN")}`, color: "var(--text-3)" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{item.label}: <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span></span>
            </div>
          ))}
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Revenue Trend */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="panel">
          <div className="g-label" style={{ marginBottom: 14 }}>Monthly Revenue Trend</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={MONTHLY_REVENUE}>
              <defs>
                <linearGradient id="secGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ADE80" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="pipGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A24B" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#C9A24B" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,75,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "var(--text-3)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--text-3)", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="secured" name="Secured" stroke="#4ADE80" strokeWidth={2} fill="url(#secGrad)" />
              <Area type="monotone" dataKey="pipeline" name="Pipeline" stroke="#C9A24B" strokeWidth={1.5} strokeDasharray="5 3" fill="url(#pipGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tier Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="panel">
          <div className="g-label" style={{ marginBottom: 14 }}>Sponsorship Tier Packages</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIERS.map((tier, i) => (
              <motion.div key={tier.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 + 0.3 }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: `1px solid ${tier.color}20`, borderLeft: `3px solid ${tier.color}`, borderRadius: "var(--r-md)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tier.color }}>{tier.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>{tier.perks[0]} · {tier.perks[1]}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text-1)" }}>₹{tier.price.toLocaleString("en-IN")}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Sponsor Matrix */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid var(--brand-edge)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="g-label">Active Pipeline Matrix ({pipelineLeads.length + confirmedLeads.length} sponsors)</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="g-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Category</th>
                <th>Status</th>
                <th>Deal Value</th>
                {showProb && <th>Probability</th>}
                {showProb && <th>Weighted Value</th>}
                <th>Assigned</th>
                <th>Last Touch</th>
              </tr>
            </thead>
            <tbody>
              {[...confirmedLeads, ...pipelineLeads].map((lead, i) => (
                <motion.tr key={lead.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                  <td style={{ fontWeight: 700, color: "var(--text-1)", fontSize: 13 }}>{lead.company}</td>
                  <td><span className="badge badge-purple" style={{ fontSize: 9 }}>{lead.category}</span></td>
                  <td>
                    <span className={`badge ${lead.status === "confirmed" ? "badge-green" : lead.status === "in_discussion" ? "badge-gold" : lead.status === "followed_up" ? "badge-orange" : lead.status === "contacted" ? "badge-purple" : "badge-blue"}`} style={{ fontSize: 9 }}>
                      {lead.status.replace("_"," ")}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: "#C9A24B" }}>₹{lead.deal_value.toLocaleString("en-IN")}</td>
                  {showProb && <td style={{ fontSize: 12, color: lead.probability >= 70 ? "var(--success)" : lead.probability >= 40 ? "var(--warning)" : "var(--info)" }}>{lead.probability}%</td>}
                  {showProb && <td style={{ fontSize: 11, color: "var(--text-2)" }}>₹{Math.round(lead.deal_value * lead.probability / 100).toLocaleString("en-IN")}</td>}
                  <td style={{ fontSize: 11, color: "var(--text-2)" }}>
                    {lead.assigned_to ? `${lead.assigned_to.charAt(0).toUpperCase()}...` : <span style={{ color: "var(--text-3)" }}>—</span>}
                  </td>
                  <td style={{ fontSize: 11, color: "var(--text-3)" }}>{lead.last_activity}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
