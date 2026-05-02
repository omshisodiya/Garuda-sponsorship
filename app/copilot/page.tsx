"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Brain, RotateCcw, Zap, Target, Mail, TrendingUp, Shield, Flame } from "lucide-react"
import { LEADS, TEAM, getStats, ALERTS, SIGNALS, CLUB, TIERS } from "../lib/data"

type Message = { role: "user" | "assistant"; content: string; timestamp: string }

const QUICK = [
  { label: "What should I do next?",          prompt: "What should I do next based on the current pipeline state?",                                                                                          icon: Target  },
  { label: "Draft outreach email",            prompt: "Draft a full sponsorship outreach email for a top uncontacted lead. Use the official Club Garuda email template and fill in their company name.",       icon: Mail    },
  { label: "Pipeline analysis",               prompt: "Analyze the current pipeline and identify the top risks.",                                                                                              icon: TrendingUp },
  { label: "Negotiation strategy",            prompt: "Give me a negotiation strategy for our highest-value stalled deal.",                                                                                   icon: Zap     },
  { label: "Stalled deal diagnosis",          prompt: "Why might a deal in negotiation stage be stalling and what should we do?",                                                                             icon: Shield  },
  { label: "Top 5 priority leads this week",  prompt: "Which 5 leads should the team prioritize this week and why?",                                                                                          icon: Flame   },
]

function getTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function buildContext() {
  const stats = getStats()
  const confirmed = LEADS.filter(l => l.status === "confirmed")
  const pipeline  = LEADS.filter(l => !["confirmed", "rejected"].includes(l.status))
  const stalled   = LEADS.filter(l => l.stage === "negotiation" && l.probability < 60)
  const hotLeads  = LEADS.filter(l => l.probability >= 70 && !["confirmed", "rejected", "won", "lost"].includes(l.stage))

  return `You are Garuda Copilot — the AI intelligence assistant for Club Garuda's Dandiya Night '26 sponsorship command center.

CLUB CONTEXT
- Club: ${CLUB.name}, ${CLUB.university}
- Event: ${CLUB.event}
- Sponsorship Target: ₹${CLUB.target.toLocaleString("en-IN")}
- Sponsorship Tiers: ${TIERS.map(t => `${t.name} ₹${t.price.toLocaleString("en-IN")}`).join(", ")}
- Attendees: ${CLUB.attendees.toLocaleString()}+
- Social Reach: ${CLUB.socialReach.toLocaleString()}+
- Contact: ${CLUB.email}

LIVE PIPELINE SNAPSHOT
- Total leads: ${stats.total}
- Confirmed sponsors: ${stats.confirmed} (₹${stats.secured.toLocaleString("en-IN")} secured)
- Weighted pipeline: ₹${stats.pipeline.toLocaleString("en-IN")}
- Progress to target: ${stats.progressPct}%
- Conversion rate: ${stats.conversionRate}%

CONFIRMED SPONSORS (${confirmed.length})
${confirmed.map(l => `- ${l.company}: ₹${l.deal_value.toLocaleString("en-IN")}`).join("\n")}

HOT LEADS (${hotLeads.length})
${hotLeads.map(l => `- ${l.company} [${l.category}]: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%, assigned to: ${TEAM.find(m => m.id === l.assigned_to)?.name || "Unassigned"}`).join("\n")}

STALLED LEADS (${stalled.length})
${stalled.map(l => `- ${l.company}: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%`).join("\n")}

PIPELINE (${pipeline.length} leads)
${pipeline.slice(0, 10).map(l => `- ${l.company} [${l.stage}]: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%`).join("\n")}

ACTIVE ALERTS
${ALERTS.filter(a => !a.ack).map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.desc}`).join("\n")}

AI SIGNALS
${SIGNALS.map(s => `- [${s.type.toUpperCase()}] ${s.company}: ${s.title} (score: ${s.score}%)`).join("\n")}

TEAM
${TEAM.map(m => `- ${m.name} (${m.role}): ${LEADS.filter(l => l.assigned_to === m.id).length} leads`).join("\n")}

INSTRUCTIONS
- Answer from live context above. Never fabricate numbers.
- When drafting emails, CC ${CLUB.email}.
- Keep responses concise and actionable.
- Today's date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}.`
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello, I am Garuda Copilot — your live sponsorship intelligence assistant.\n\nI have full context on your current pipeline: leads, deal values, probabilities, team assignments, alerts, and AI signals. Ask me to draft an email, analyze a sponsor, rank your priorities, or diagnose a stalled deal.\n\nType a question or use a Quick Command below.", timestamp: getTime() },
  ])
  const [input, setInput]       = useState("")
  const [loading, setLoading]   = useState(false)
  const [apiAvail, setApiAvail] = useState(true)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const abortRef                = useRef<boolean>(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(text?: string) {
    const query = (text || input).trim()
    if (!query || loading) return
    setInput("")

    const userMsg: Message = { role: "user", content: query, timestamp: getTime() }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)
    abortRef.current = false

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          stream: true,
          messages: [
            { role: "system", content: buildContext() },
            ...history.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
          ],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        if (res.status === 503) setApiAvail(false)
        throw new Error(err?.error?.message ?? `HTTP ${res.status}`)
      }

      const aiMsg: Message = { role: "assistant", content: "", timestamp: getTime() }
      setMessages(prev => [...prev, aiMsg])

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buf = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done || abortRef.current) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split("\n")
        buf = lines.pop() ?? ""
        for (const line of lines) {
          if (!line.startsWith("data: ") || line === "data: [DONE]") continue
          try {
            const delta = JSON.parse(line.slice(6))?.choices?.[0]?.delta?.content
            if (delta) {
              setMessages(prev => {
                const last = prev[prev.length - 1]
                return [...prev.slice(0, -1), { ...last, content: last.content + delta }]
              })
            }
          } catch { /* partial JSON, skip */ }
        }
      }

      setApiAvail(true)
    } catch (e: unknown) {
      if (!abortRef.current) {
        const msg = e instanceof Error ? e.message : "Unknown error"
        setMessages(prev => [...prev, { role: "assistant", content: `Error: ${msg}`, timestamp: getTime() }])
      }
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    abortRef.current = true
    setMessages([{ role: "assistant", content: "Session cleared. How can I help you?", timestamp: getTime() }])
    setLoading(false)
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1400, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 20, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>AI · Garuda Brain</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>AI Copilot</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>Live context · Pipeline-aware · Groq AI</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!apiAvail && (
            <div style={{ fontSize: 11, color: "var(--warning)", background: "var(--warning-bg)", border: "1px solid var(--warning-edge)", borderRadius: "var(--r-sm)", padding: "5px 10px" }}>
              AI service unavailable. Please check backend configuration.
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className={`status-dot ${loading ? "warm" : "live"}`} />
            <span style={{ fontSize: 10, color: loading ? "var(--warning)" : "rgba(74,222,128,0.7)", fontWeight: 600 }}>{loading ? "THINKING" : "READY"}</span>
          </div>
          <button className="btn-ghost" onClick={clearChat} style={{ fontSize: 11 }}><RotateCcw size={12} /> Clear</button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 18, height: "calc(100vh - 220px)" }}>

        {/* Chat */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="panel"
          style={{ display: "flex", flexDirection: "column", padding: 0, overflow: "hidden" }}>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px 10px" }}>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}
                style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, marginBottom: 16, alignItems: "flex-start" }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, background: msg.role === "assistant" ? "linear-gradient(135deg, #6B0F1A, #C9A24B)" : "var(--glass-3)", border: msg.role === "assistant" ? "none" : "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {msg.role === "assistant" ? <Brain size={14} color="#07070A" strokeWidth={2} /> : <span style={{ fontSize: 11, color: "var(--text-2)" }}>U</span>}
                </div>
                <div style={{ maxWidth: "82%", minWidth: 0 }}>
                  <div style={{ fontSize: 9, color: "var(--text-3)", marginBottom: 4, textAlign: msg.role === "user" ? "right" : "left" }}>
                    {msg.role === "assistant" ? "Garuda Copilot" : "You"} · {msg.timestamp}
                  </div>
                  <div style={{ padding: "11px 15px", background: msg.role === "assistant" ? "rgba(255,255,255,0.035)" : "rgba(201,162,75,0.09)", border: `1px solid ${msg.role === "assistant" ? "rgba(255,255,255,0.06)" : "rgba(201,162,75,0.22)"}`, borderRadius: msg.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", fontSize: 12, color: "var(--text-1)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>
                    {msg.content || (loading && i === messages.length - 1 ? (
                      <span style={{ color: "var(--text-3)" }}>Thinking…</span>
                    ) : "")}
                  </div>
                </div>
              </motion.div>
            ))}

            <AnimatePresence>
              {loading && messages[messages.length - 1]?.role !== "assistant" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "linear-gradient(135deg, #6B0F1A, #C9A24B)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain size={14} color="#07070A" strokeWidth={2} />
                  </div>
                  <div style={{ padding: "11px 15px", background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "4px 14px 14px 14px", display: "flex", gap: 4 }}>
                    {[0,1,2].map(d => (
                      <motion.div key={d} animate={{ y: [0,-4,0] }} transition={{ duration: 0.55, repeat: Infinity, delay: d * 0.14 }}
                        style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A24B", opacity: 0.7 }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "14px 18px", borderTop: "1px solid rgba(201,162,75,0.08)", display: "flex", gap: 9 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask about pipeline, draft an email, analyze a sponsor…"
              className="g-input" style={{ flex: 1, fontSize: 12 }} />
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="btn-gold" onClick={() => sendMessage()}
              disabled={loading || !input.trim()} style={{ padding: "11px 18px", opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <Send size={13} />
            </motion.button>
          </div>
        </motion.div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, overflow: "hidden" }}>

          {/* Quick Commands */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ flexShrink: 0 }}>
            <div className="g-label" style={{ marginBottom: 12 }}>Quick Commands</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {QUICK.map((cmd, i) => {
                const Icon = cmd.icon
                return (
                  <motion.button key={i} whileHover={{ x: 3 }} whileTap={{ scale: 0.97 }} onClick={() => sendMessage(cmd.prompt)} disabled={loading}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(201,162,75,0.1)", borderRadius: "var(--r-md)", cursor: "pointer", color: "var(--text-2)", fontSize: 11, fontFamily: "inherit", textAlign: "left", transition: "all 0.14s", opacity: loading ? 0.5 : 1 }}>
                    <Icon size={12} color="#C9A24B" strokeWidth={1.6} style={{ flexShrink: 0 }} />
                    {cmd.label}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>

          {/* AI Signals */}
          <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="panel" style={{ flex: 1, overflowY: "auto" }}>
            <div className="g-label" style={{ marginBottom: 12 }}>Live Signals</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {SIGNALS.slice(0, 4).map(sig => (
                <motion.div key={sig.id} whileHover={{ y: -1 }}
                  style={{ padding: "10px 12px", background: "rgba(255,255,255,0.025)", border: `1px solid ${sig.type === "opportunity" ? "var(--success-edge)" : sig.type === "risk" ? "var(--danger-edge)" : "rgba(201,162,75,0.18)"}`, borderLeft: `3px solid ${sig.type === "opportunity" ? "var(--success)" : sig.type === "risk" ? "var(--danger)" : "#C9A24B"}`, borderRadius: "var(--r-md)", cursor: "pointer" }}
                  onClick={() => sendMessage(`Tell me more about the ${sig.type} signal for ${sig.company}: ${sig.title}`)}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)" }}>{sig.company}</div>
                    <span style={{ fontSize: 10, fontWeight: 800, color: sig.type === "opportunity" ? "var(--success)" : sig.type === "risk" ? "var(--danger)" : "#C9A24B" }}>{sig.score}%</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-3)" }}>{sig.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
