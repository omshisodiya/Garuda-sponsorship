"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Eye, EyeOff, Copy, Check, Lock, Globe, Camera, Mail, Key } from "lucide-react"

type Credential = {
  id:       string
  platform: string
  label:    string
  username: string
  password: string
  url:      string
  icon:     React.ElementType
  color:    string
}

const CREDENTIALS: Credential[] = [
  { id: "c1", platform: "Instagram",     label: "Club Instagram",       username: "@clubgaruda_muj",          password: "Garuda@Insta2026",  url: "https://instagram.com",       icon: Camera,    color: "#E1306C" },
  { id: "c2", platform: "LinkedIn",      label: "Club LinkedIn",        username: "Club Garuda MUJ",          password: "Garuda@LinkedIn26", url: "https://linkedin.com",        icon: Globe,     color: "#0077B5" },
  { id: "c3", platform: "Gmail",         label: "Official Club Email",  username: "garuda.club@muj.manipal.edu", password: "Garuda@Gmail26",  url: "https://mail.google.com",     icon: Mail,      color: "#EA4335" },
  { id: "c4", platform: "Canva",         label: "Design Team Canva",    username: "garuda.club@muj.manipal.edu", password: "Garuda@Canva26",  url: "https://canva.com",           icon: Key,       color: "#00C4CC" },
  { id: "c5", platform: "Google Drive",  label: "Shared Drive",         username: "garuda.club@muj.manipal.edu", password: "Garuda@Drive26",  url: "https://drive.google.com",    icon: Globe,     color: "#4285F4" },
  { id: "c6", platform: "WhatsApp API",  label: "Outreach WhatsApp",    username: "+91-XXXXXXXXXX",           password: "See admin panel",   url: "",                            icon: Globe,     color: "#25D366" },
]

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--success)" : "var(--text-3)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6, transition: "color 0.15s" }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

export default function CredentialVaultPage() {
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin]           = useState("")
  const [pinErr, setPinErr]     = useState("")

  function toggle(id: string) {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function unlock(e: React.FormEvent) {
    e.preventDefault()
    if (pin === "9999") { setUnlocked(true); setPinErr("") }
    else { setPinErr("Incorrect PIN"); setPin("") }
  }

  if (!unlocked) {
    return (
      <div style={{ padding: "24px 28px", maxWidth: 420, margin: "60px auto" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="panel" style={{ padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #6B0F1A, #C9A24B)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Shield size={26} color="#07070A" />
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-1)", marginBottom: 6 }}>Credential Vault</div>
          <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 24 }}>Superadmin access only. Enter your PIN to unlock.</div>
          <form onSubmit={unlock} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              className="g-input"
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN"
              maxLength={6}
              autoFocus
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 20 }}
            />
            {pinErr && <div style={{ fontSize: 12, color: "var(--danger)" }}>{pinErr}</div>}
            <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn-gold" style={{ justifyContent: "center" }}>
              <Lock size={13} /> Unlock Vault
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Superadmin · Credential Vault</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Credential Vault</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{CREDENTIALS.length} stored credentials · superadmin eyes only</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: "var(--success)", background: "var(--success-bg)", border: "1px solid var(--success-edge)", borderRadius: "var(--r-sm)", padding: "5px 12px", fontWeight: 700 }}>
            VAULT UNLOCKED
          </div>
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setUnlocked(false); setRevealed(new Set()) }}>
            <Lock size={12} /> Lock
          </button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        <AnimatePresence>
          {CREDENTIALS.map((cred, i) => {
            const Icon = cred.icon
            const show = revealed.has(cred.id)
            return (
              <motion.div key={cred.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="panel" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: cred.color, borderRadius: "3px 0 0 3px" }} />
                <div style={{ paddingLeft: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cred.color}18`, border: `1px solid ${cred.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: cred.color }}>
                      <Icon size={17} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>{cred.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>{cred.platform}</div>
                    </div>
                    <button onClick={() => toggle(cred.id)}
                      style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 4 }}>
                      {show ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {[
                    { label: "Username / Handle", value: cred.username },
                    { label: "Password", value: show ? cred.password : "••••••••••••" },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-sm)" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#C9A24B", fontFamily: "monospace", letterSpacing: show || f.label !== "Password" ? "0.02em" : "0.15em" }}>
                          {f.value}
                        </span>
                        {show && <CopyBtn text={f.value} />}
                      </div>
                    </div>
                  ))}

                  {cred.url && (
                    <a href={cred.url} target="_blank" rel="noopener noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: "var(--text-3)", textDecoration: "none", marginTop: 4 }}>
                      <Globe size={10} /> Open Platform
                    </a>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
