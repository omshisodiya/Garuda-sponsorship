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
- Today's date: ${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}.

OUTREACH EMAIL TEMPLATE
When asked to draft any sponsorship outreach or cold email, follow this exact template structure and tone. Replace [Sponsor's Name / Team] with the actual company or contact name. Replace [Name of Assigned Member] with the name of the team member assigned to that lead. Replace [Contact Number] with the assigned member's contact. Do not use emojis. Keep section headers in plain markdown (##). Fill in no figures that are not in this template or the live context above.

Dear [Sponsor's Name / Team],

Greetings from Club Garuda, Manipal University Jaipur!

I hope this message finds you well.

I am writing to present an exclusive high-impact sponsorship opportunity for our flagship cultural event — Garuda Dandiya Night 2026, one of the largest and most anticipated celebrations on campus, designed at a mega scale with 10,000+ expected footfall and 2,00,000+ consolidated digital and on-ground reach.

This is not just an event — it is a large-scale cultural production, blending tradition, entertainment, and strategic brand engagement.

About Garuda Dandiya Night 2026

Garuda Dandiya Night is a grand Navratri celebration built around Garba and Dandiya Raas, live music, immersive decor, and a vibrant youth atmosphere. The event is designed to deliver a premium, festival-like experience with high production quality, structured crowd flow, and engaging zones.

Key highlights:

- Professionally curated Garba and Dandiya arena
- High-end sound, lighting, and stage setup
- Themed cultural ambience and decor
- Performances, competitions, and crowd engagement activities
- Organized security, entry management, and crowd control system

Scale and Impact Metrics

Physical Footfall

- 10,000+ attendees
- Students from multiple colleges and institutions across Rajasthan
- Highly active, socially engaged youth audience

Digital and Promotional Reach

- 2,00,000+ total consolidated reach
- Instagram campaigns including reels, collaborations, and paid promotions
- WhatsApp marketing chains
- Influencer and campus ambassador promotions
- Posters, banners, and offline branding across Jaipur

Engagement Lifecycle

- Pre-event hype campaign running 15 to 20 days prior
- Live event engagement
- Post-event digital amplification through after-movies and highlights

Strategic Value for Your Brand

This event offers high-visibility, high-engagement brand placement with strong recall.

1. Massive Brand Exposure

- Logo integration across all digital and offline creatives
- Visibility on tickets, banners, entry gates, and stage backdrop
- Mentions in every promotional campaign and announcement

2. Direct Youth Market Access

- Engage directly with 10,000+ young consumers
- Ideal for brand awareness, product trials, and conversions

3. Experiential Marketing

- On-ground stall and booth setup
- Product demonstrations, sampling, and live activations
- Interactive brand experiences within the event space

4. Premium Cultural Association

- Align your brand with a high-energy festive experience at MUJ
- Strong emotional connection leading to higher recall value

5. Data and Lead Generation Opportunities

- QR-based engagement systems
- Contests, giveaways, and registrations
- Direct audience data capture as per optional integrations

Sponsorship Structure

Title Sponsor — Rs. 1,50,000 (Exclusive)

- "Garuda Dandiya Night 2026 Powered by [Your Brand]"
- Maximum visibility across all platforms
- Prime branding on stage, entry gate, and main arena
- Dedicated speaking and announcement slots
- Premium stall location with exclusive activation rights

Co-Sponsor — Rs. 95,000

- Strong co-branding across all creatives
- High-visibility placements across digital and offline channels
- On-ground engagement rights

Partner Sponsor — Rs. 75,000

- Logo placement across major promotions
- On-stage mentions throughout the event
- Branding at key event locations

Associate Sponsor / Zone Sponsor

Sponsor specific areas such as the Dance Arena, Selfie Booth, Entry Gate, Merchandise Zone, or Competition Prizes with selective visibility packages.

Unique Branding Opportunities

- Branded Dandiya sticks distributed to all attendees — a high recall item
- LED screen advertisements during the event
- Photo booths with full brand integration
- Exclusive branded zones within the event
- Live stage integration and host mentions
- Customized contests powered by your brand

Execution Excellence

Club Garuda ensures:

- Structured event management system with dedicated vertical leads
- Separate teams for operations, marketing, and logistics
- Strict security and discipline protocols coordinated with university administration
- Smooth sponsor coordination for all deliverables with regular updates

Why Partner with Club Garuda?

- Proven track record of successful large-scale events at Manipal University Jaipur
- Strong organizational structure with 50+ active core members
- High execution discipline and brand professionalism
- Focus on long-term partnerships, not one-time sponsorships

Next Steps

We would be delighted to share a customized sponsorship deck and discuss how we can align this opportunity with your brand objectives. Please let us know a convenient time for a quick call or meeting.

Thank you for considering this collaboration. We look forward to partnering with you to create a grand, impactful, and unforgettable Garuda Dandiya Night 2026.

Warm regards,

[Name of Assigned Member]
Club Garuda — Manipal University Jaipur
[Contact Number]
garuda.club@muj.manipal.edu

"10,000 people. One night. Infinite energy. Maximum brand impact."`
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
