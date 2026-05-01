"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, ExternalLink, Copy, Check, Wand2, ChevronRight } from "lucide-react"
import { CLUB } from "../lib/data"

const TEMPLATES = {
  initial: {
    label: "Initial Outreach",
    subject: `Sponsorship Collaboration | Dandiya Night '26 | Club Garuda, MUJ`,
    body: `Dear [Contact Name],

Greetings from Club Garuda, Manipal University Jaipur.

I hope you are doing well.

I am writing to explore a strategic sponsorship collaboration between [Company] and Club Garuda for our flagship cultural event — Dandiya Night '26.

This event is one of the most anticipated celebrations on campus, bringing together a vibrant, high-energy audience and offering brands a powerful platform for visibility and engagement.

Event Overview
• 10,000+ attendees — a concentrated audience of Jaipur's top engineering and management students
• High-energy experience featuring live DJ, celebrity performances, and curated cultural showcases
• Extensive branding across venue installations, digital campaigns, and print media
• Dedicated on-ground activation zones for immersive brand engagement
• 2,00,000+ cumulative social media reach with pre- and post-event promotions

Why Partner With Us
• Direct access to a highly engaged Gen Z audience
• Opportunities for product sampling, trials, and experiential marketing
• Strong brand recall through authentic campus association
• Long-term visibility via professionally curated post-event digital content

We offer three sponsorship tiers: Partner Sponsor starting at ₹75,000, Co Sponsor at ₹95,000, and Title Sponsor at ₹1,50,000, each customizable to align with your marketing objectives.

I would be happy to schedule a brief 20-minute discussion to explore how we can create a meaningful and high-impact partnership for [Company].

Looking forward to your response.

Warm regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
  followup: {
    label: "Follow-Up",
    subject: `Following Up | Sponsorship Proposal | Dandiya Night '26`,
    body: `Dear [Contact Name],

I hope you are doing well.

I wanted to follow up on my earlier message regarding a sponsorship collaboration for Dandiya Night '26.

I understand you are busy, so I will keep this brief — we have a few sponsorship slots remaining and I wanted to make sure [Company] has the opportunity to be part of this event before they fill up.

Quick reminder of what makes this a standout opportunity:
• 10,000+ attendees — Jaipur's top engineering and management students at a single venue
• 2,00,000+ cumulative reach on Dandiya Night reels and social media promotions
• [Company]'s category exclusivity is still available
• Flexible sponsorship packages and payment terms

Would you be open to a quick 15-minute call this week?

Alternatively, I can send our sponsorship deck directly to your WhatsApp for a quicker review.

Thank you for your time.

Warm regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
  proposal: {
    label: "Proposal Send",
    subject: `Custom Sponsorship Proposal | [Company] x Dandiya Night '26`,
    body: `Dear [Contact Name],

Thank you for your interest in partnering with Club Garuda.

As discussed, please find attached our custom sponsorship proposal prepared specifically for [Company].

EVENT SNAPSHOT
• 10,000+ attendees — concentrated Gen Z audience of engineering and management students
• 2,00,000+ cumulative social media reach on Dandiya Night reels and digital campaigns
• Live DJ, celebrity performances, and curated cultural showcases
• Dedicated on-ground brand activation zones

PROPOSED PACKAGE: [TIER NAME] Sponsorship (₹[Amount])

KEY DELIVERABLES
• Logo on all event banners and backdrops
• 30-second brand slot at opening ceremony
• Dedicated activation booth (10x10 ft)
• Social media mentions across 3 platforms (15+ posts)
• Featured branding across all Dandiya Night reels and digital content
• Post-event report with reach and engagement metrics

NEXT STEPS
1. Review the attached proposal
2. Share any customization requests
3. Sign LOI to confirm partnership
4. Share brand assets for design team

I am available for a call at your convenience to walk you through the proposal.

Best regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
  negotiation: {
    label: "Negotiation Close",
    subject: `Finalising Partnership | [Company] x Dandiya Night '26`,
    body: `Dear [Contact Name],

Thank you for the productive conversation earlier.

I wanted to follow up with a revised package that reflects our discussion:

REVISED OFFER FOR [COMPANY]
• Sponsorship Tier: [TIER] at ₹[Amount]
• Payment: 50% advance, 50% post-event
• Category Exclusivity: Included
• Additional: [Custom Benefit]

As a reminder of the platform you will be associating with:
• 10,000+ attendees at a single high-energy venue
• 2,00,000+ cumulative reach on Dandiya Night reels and event promotions
• Authentic campus association with MUJ's most anticipated cultural event

We are confident this partnership will deliver exceptional ROI for [Company]. To move forward, I just need your confirmation by [DATE] to reserve your slot before the deadline.

Looking forward to welcoming [Company] as our valued partner.

Warm regards,
[Your Name]
Sponsorship Team
Club Garuda
Manipal University Jaipur
garuda.club@muj.manipal.edu`,
  },
} as const

type TemplateKey = keyof typeof TEMPLATES

export default function OutreachPage() {
  const [template, setTemplate] = useState<TemplateKey>("initial")
  const [company, setCompany]   = useState("")
  const [contact, setContact]   = useState("")
  const [email, setEmail]       = useState("")
  const [yourName, setYourName] = useState("")
  const [subject, setSubject]   = useState<string>(TEMPLATES.initial.subject)
  const [body, setBody]         = useState<string>(TEMPLATES.initial.body)
  const [copied, setCopied]     = useState(false)
  const [sent, setSent]         = useState(false)

  function applyTemplate(key: TemplateKey) {
    setTemplate(key)
    setSubject(TEMPLATES[key].subject)
    setBody(TEMPLATES[key].body)
  }

  function personalise() {
    let s = subject; let b = body
    if (company)  { s = s.replaceAll("[Company]", company);              b = b.replaceAll("[Company]", company) }
    if (contact)  { b = b.replaceAll("[Contact Name]", contact) }
    if (yourName) { b = b.replaceAll("[Your Name]", yourName) }
    setSubject(s); setBody(b)
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendGmail() {
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&cc=${encodeURIComponent(CLUB.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")
    setSent(true); setTimeout(() => setSent(false), 3000)
  }

  function sendOutlook() {
    window.open(`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")
    setSent(true); setTimeout(() => setSent(false), 3000)
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1300, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Outreach · Communication Studio</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Outreach Studio</h1>
        </div>
        <a href="/copilot">
          <button className="btn-ghost" style={{ fontSize: 11 }}><Wand2 size={13} /> AI Copilot</button>
        </a>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 18 }}>

        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Templates */}
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>Templates</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {(Object.keys(TEMPLATES) as TemplateKey[]).map(key => (
                <button key={key} onClick={() => applyTemplate(key)}
                  style={{ padding: "10px 13px", borderRadius: "var(--r-md)", border: "1px solid", borderColor: template === key ? "rgba(201,162,75,0.35)" : "rgba(201,162,75,0.1)", background: template === key ? "rgba(201,162,75,0.09)" : "rgba(255,255,255,0.02)", color: template === key ? "#C9A24B" : "var(--text-2)", fontSize: 12, fontWeight: template === key ? 700 : 400, cursor: "pointer", fontFamily: "inherit", textAlign: "left", transition: "all 0.15s" }}>
                  {TEMPLATES[key].label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Recipient */}
          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="panel">
            <div className="g-label" style={{ marginBottom: 12 }}>Recipient Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Company",      value: company,   set: setCompany,   ph: "e.g. Red Bull India" },
                { label: "Contact Name", value: contact,   set: setContact,   ph: "e.g. Arjun Mehta" },
                { label: "Your Name",    value: yourName,  set: setYourName,  ph: "e.g. Jivaansh Chandna" },
                { label: "Email",        value: email,     set: setEmail,     ph: "contact@company.com" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input className="g-input" value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={{ fontSize: 12 }} />
                </div>
              ))}
              <motion.button whileTap={{ scale: 0.97 }} className="btn-gold" onClick={personalise} style={{ justifyContent: "center", fontSize: 11 }}>
                <Wand2 size={12} /> Personalise
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Email Composer */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="panel" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="g-label">Email Composer</div>

          <div>
            <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Subject Line</label>
            <input className="g-input" value={subject} onChange={e => setSubject(e.target.value)} style={{ fontSize: 13, fontWeight: 600 }} />
          </div>

          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Email Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              style={{ width: "100%", minHeight: 360, padding: "14px 16px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", color: "var(--text-1)", fontSize: 12, lineHeight: 1.8, resize: "vertical", fontFamily: "inherit", outline: "none", transition: "border-color 0.18s" }}
              onFocus={e => { e.target.style.borderColor = "var(--brand-2)" }}
              onBlur={e => { e.target.style.borderColor = "var(--brand-edge)" }}
            />
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-gold" onClick={sendGmail} style={{ fontSize: 12 }}>
              <Mail size={13} /> Gmail
            </motion.button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="btn-ghost" onClick={sendOutlook} style={{ fontSize: 12 }}>
              <ExternalLink size={13} /> Outlook
            </motion.button>
            <motion.button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { const a = document.createElement("a"); a.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; a.click() }}>
              <Mail size={13} /> Default Mail
            </motion.button>
            <motion.button className="btn-ghost" onClick={copyToClipboard} style={{ fontSize: 12, marginLeft: "auto" }}>
              {copied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </motion.button>

            <AnimatePresence>
              {sent && (
                <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  style={{ fontSize: 11, color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                  <Check size={12} /> Email client opened
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
