import { NextRequest } from "next/server"
import { TEAM, CLUB, TIERS, computeAlerts, computeSignals } from "../../lib/data"
import { getAllLeads, computeStats } from "../../lib/server/leadStore"

type CopilotMessage = { role: "system" | "user" | "assistant"; content: string }

const GROQ_MODEL = "llama-3.3-70b-versatile"

async function buildContext() {
  const leads   = await getAllLeads()
  const stats   = computeStats(leads)
  const alerts  = computeAlerts(leads)
  const signals = computeSignals(leads)

  const confirmed = leads.filter(l => l.status === "confirmed")
  const pipeline  = leads.filter(l => !["confirmed","rejected"].includes(l.status))
  const stalled   = leads.filter(l => l.stage === "negotiation" && l.probability < 60)
  const hotLeads  = leads.filter(l => l.probability >= 70 && !["confirmed","rejected","won","lost"].includes(l.stage))

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
- Assigned: ${stats.assigned} | Unassigned: ${stats.unassigned}
- Contacted: ${stats.contacted}
- In Discussion: ${stats.inDiscussion}
- Confirmed sponsors: ${stats.confirmed} (₹${stats.secured.toLocaleString("en-IN")} secured)
- Weighted pipeline: ₹${stats.pipeline.toLocaleString("en-IN")}
- Progress to target: ${stats.progressPct}%
- Conversion rate: ${stats.conversionRate}%

CONFIRMED SPONSORS (${confirmed.length})
${confirmed.length > 0 ? confirmed.map(l => `- ${l.company}: ₹${l.deal_value.toLocaleString("en-IN")} (${l.stage})`).join("\n") : "- None yet"}

HOT LEADS — High probability, not yet confirmed (${hotLeads.length})
${hotLeads.length > 0 ? hotLeads.map(l => {
  const member = TEAM.find(m => m.id === l.assigned_to)
  return `- ${l.company} [${l.category}]: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}% probability, stage: ${l.stage}, assigned to: ${member?.name || "Unassigned"}`
}).join("\n") : "- None"}

STALLED LEADS (${stalled.length})
${stalled.length > 0 ? stalled.map(l => `- ${l.company}: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%, last touch: ${l.last_activity}`).join("\n") : "- None"}

PIPELINE LEADS (${pipeline.length})
${pipeline.slice(0, 10).map(l => `- ${l.company} [${l.stage}]: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%`).join("\n")}

ACTIVE ALERTS
${alerts.filter(a => !a.ack).length > 0 ? alerts.filter(a => !a.ack).map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.desc}`).join("\n") : "- No active alerts"}

AI SIGNALS
${signals.length > 0 ? signals.map(s => `- [${s.type.toUpperCase()}] ${s.company}: ${s.title} (score: ${s.score}%)`).join("\n") : "- No signals"}

INSTRUCTIONS
- Answer from live context above. Never fabricate numbers.
- If data is unavailable, say so explicitly.
- When drafting emails, CC ${CLUB.email}.
- Keep responses concise and actionable.
- Use only these sponsorship tiers: Partner Sponsor ₹75,000, Co Sponsor ₹95,000, Title Sponsor ₹1,50,000.
- Today's date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}.`
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: CopilotMessage[] }
  const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GROQ_API_KEY is not set. Add it to .env.local and restart." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const context = await buildContext()
  const hasSystem = messages.some(m => m.role === "system")
  const groqMessages: CopilotMessage[] = hasSystem
    ? messages
    : [{ role: "system", content: context }, ...messages]

  let groqRes: Response
  try {
    groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: GROQ_MODEL, stream: true, messages: groqMessages }),
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Groq API error"
    return new Response(JSON.stringify({ error: msg }), { status: 502, headers: { "Content-Type": "application/json" } })
  }

  if (!groqRes.ok) {
    const err = await groqRes.json().catch(() => ({}))
    const msg = (err as { error?: { message?: string } })?.error?.message ?? `Groq HTTP ${groqRes.status}`
    return new Response(JSON.stringify({ error: msg }), { status: 502, headers: { "Content-Type": "application/json" } })
  }

  if (!groqRes.body) {
    return new Response(JSON.stringify({ error: "Empty stream" }), { status: 502, headers: { "Content-Type": "application/json" } })
  }

  return new Response(groqRes.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  })
}
