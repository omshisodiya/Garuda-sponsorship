import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"

const GROQ_MODEL = "llama-3.3-70b-versatile"
const API_KEY    = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY

const PROMPT = `You are a business development assistant for Club Garuda at Manipal University Jaipur. We are organising Garuda Dandiya Night 2026, a large-scale Navratri cultural event targeting 10,000+ footfall. We need Dandiya Night sponsorship prospects.

Generate a list of 1100 companies across India that would be ideal Dandiya Night sponsors. Include brands from: FMCG (food/beverage/consumer goods), Tech/IT/Apps, Food & Beverage (restaurants, delivery, beverages), Sports & Fitness, Lifestyle & Fashion, Automotive, Finance & FinTech, EdTech, Healthcare & Wellness, Media & Entertainment, Jewellery, Home Decor, Event & Hospitality, Travel, Retail.

Rules:
- Include well-known Indian brands, mid-size regional brands, and Rajasthan/Jaipur-local businesses
- Mix national brands and local Jaipur/Rajasthan companies
- Prioritise brands likely to sponsor college cultural events and reach young audiences
- Output ONLY in this exact format, one per line, no numbering, no bullets, no extra text:
CompanyName | Category

Example:
Haldiram's | FMCG
PhonePe | Tech
Domino's India | F&B

Now generate the full list of 1100 companies:`

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (!API_KEY) return NextResponse.json({ error: "Groq API key not configured" }, { status: 500 })

  const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      messages:    [{ role: "user", content: PROMPT }],
      stream:      true,
      temperature: 0.8,
      max_tokens:  8000,
    }),
  })

  if (!groqRes.ok) {
    const err = await groqRes.text().catch(() => "")
    return NextResponse.json({ error: "Groq error: " + err }, { status: 502 })
  }

  return new Response(groqRes.body, {
    headers: {
      "Content-Type":  "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  })
}
