import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { LEADS, TEAM, getStats, ALERTS, SIGNALS, CLUB } from "../../lib/data"

function buildContext() {
  const stats = getStats()
  const confirmed = LEADS.filter(l => l.status === "confirmed")
  const pipeline  = LEADS.filter(l => !["confirmed","rejected"].includes(l.status))
  const stalled   = LEADS.filter(l => l.stage === "negotiation" && l.probability < 60)
  const hotLeads  = LEADS.filter(l => l.probability >= 70 && !["confirmed","rejected","won","lost"].includes(l.stage))

  return `You are Garuda Copilot — the AI intelligence assistant for Club Garuda's Dandiya Night '26 sponsorship command center.

CLUB CONTEXT
- Club: ${CLUB.name}, ${CLUB.university}
- Event: ${CLUB.event}
- Sponsorship Target: ₹${CLUB.target.toLocaleString("en-IN")}
- Attendees: ${CLUB.attendees.toLocaleString()}+
- Social Reach: ${CLUB.socialReach.toLocaleString()}+
- Contact: ${CLUB.email}

LIVE PIPELINE SNAPSHOT
- Total leads: ${stats.total}
- Assigned: ${stats.assigned}
- Contacted: ${stats.contacted}
- In Discussion: ${stats.inDiscussion}
- Confirmed sponsors: ${stats.confirmed} (₹${stats.secured.toLocaleString("en-IN")} secured)
- Weighted pipeline: ₹${stats.pipeline.toLocaleString("en-IN")}
- Progress to target: ${stats.progressPct}%
- Conversion rate: ${stats.conversionRate}%

CONFIRMED SPONSORS (${confirmed.length})
${confirmed.map(l => `- ${l.company}: ₹${l.deal_value.toLocaleString("en-IN")} (${l.stage})`).join("\n")}

HOT LEADS — High probability, not yet confirmed (${hotLeads.length})
${hotLeads.map(l => `- ${l.company} [${l.category}]: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}% probability, stage: ${l.stage}, assigned to: ${TEAM.find(m => m.id === l.assigned_to)?.name || "Unassigned"}`).join("\n")}

STALLED LEADS — Negotiation but low probability (${stalled.length})
${stalled.map(l => `- ${l.company}: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%, last touch: ${l.last_activity}`).join("\n")}

PIPELINE LEADS (${pipeline.length})
${pipeline.slice(0, 10).map(l => `- ${l.company} [${l.stage}]: ₹${l.deal_value.toLocaleString("en-IN")}, ${l.probability}%`).join("\n")}

ACTIVE ALERTS
${ALERTS.filter(a => !a.ack).map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.desc}`).join("\n")}

AI SIGNALS
${SIGNALS.map(s => `- [${s.type.toUpperCase()}] ${s.company}: ${s.title} (score: ${s.score}%)`).join("\n")}

TEAM
${TEAM.map(m => `- ${m.name} (${m.role}): ${LEADS.filter(l => l.assigned_to === m.id).length} leads`).join("\n")}

INSTRUCTIONS
- Answer questions from live context above. Never fabricate numbers.
- If data is unavailable, say so explicitly.
- When drafting emails, CC ${CLUB.email}.
- Keep responses concise, actionable, and cited (reference specific lead/sponsor names when possible).
- You can draft emails, suggest next actions, analyze sponsors, score leads, or answer strategy questions.
- Today's date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}.`
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json() as { messages: Array<{ role: "user" | "assistant"; content: string }> }

  if (!process.env.GOOGLE_AI_API_KEY) {
    return new Response(
      JSON.stringify({ error: "GOOGLE_AI_API_KEY not set. Add it to .env.local to enable live AI. Get a free key at https://aistudio.google.com/apikey" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    )
  }

  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: buildContext(),
  })

  // Gemini requires history to start with a user turn — drop leading model messages
  const rawHistory = messages.slice(0, -1).map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))
  const firstUserIdx = rawHistory.findIndex(m => m.role === "user")
  const history = firstUserIdx === -1 ? [] : rawHistory.slice(firstUserIdx)
  const lastMessage = messages[messages.length - 1].content

  const chat = model.startChat({ history })

  let result: Awaited<ReturnType<typeof chat.sendMessageStream>>
  try {
    result = await chat.sendMessageStream(lastMessage)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Gemini API error"
    return new Response(JSON.stringify({ error: msg }), { status: 502, headers: { "Content-Type": "application/json" } })
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text()
          if (text) controller.enqueue(encoder.encode(text))
        }
      } catch {
        controller.enqueue(encoder.encode("\n\n[Error: stream interrupted]"))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
