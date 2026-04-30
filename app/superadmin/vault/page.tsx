"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Eye, EyeOff, Copy, Check, Lock, Globe, Camera, Mail, Key, Pencil, Plus, Trash2, X, Save } from "lucide-react"

type Credential = {
  id:       string
  platform: string
  label:    string
  username: string
  password: string
  url:      string
  color:    string
}

const DEFAULT_CREDENTIALS: Credential[] = [
  { id: "c1", platform: "Instagram",    label: "Club Instagram",      username: "@clubgaruda_muj",             password: "Garuda@Insta2026",  url: "https://instagram.com",    color: "#E1306C" },
  { id: "c2", platform: "LinkedIn",     label: "Club LinkedIn",       username: "Club Garuda MUJ",             password: "Garuda@LinkedIn26", url: "https://linkedin.com",     color: "#0077B5" },
  { id: "c3", platform: "Gmail",        label: "Official Club Email", username: "garuda.club@muj.manipal.edu", password: "Garuda@Gmail26",    url: "https://mail.google.com",  color: "#EA4335" },
  { id: "c4", platform: "Canva",        label: "Design Team Canva",   username: "garuda.club@muj.manipal.edu", password: "Garuda@Canva26",    url: "https://canva.com",        color: "#00C4CC" },
  { id: "c5", platform: "Google Drive", label: "Shared Drive",        username: "garuda.club@muj.manipal.edu", password: "Garuda@Drive26",    url: "https://drive.google.com", color: "#4285F4" },
  { id: "c6", platform: "WhatsApp API", label: "Outreach WhatsApp",   username: "+91-XXXXXXXXXX",              password: "See admin panel",   url: "",                         color: "#25D366" },
]

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  Instagram:    Camera,
  LinkedIn:     Globe,
  Gmail:        Mail,
  Canva:        Key,
  "Google Drive": Globe,
  "WhatsApp API": Globe,
}

const STORAGE_KEY = "garuda_vault_credentials"

function getIcon(platform: string): React.ElementType {
  return PLATFORM_ICONS[platform] ?? Key
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--success)" : "var(--text-3)", display: "flex", alignItems: "center", padding: 4, borderRadius: 6, transition: "color 0.15s" }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

const BLANK: Omit<Credential, "id"> = { platform: "", label: "", username: "", password: "", url: "", color: "#C9A24B" }

export default function CredentialVaultPage() {
  const [creds, setCreds]       = useState<Credential[]>(DEFAULT_CREDENTIALS)
  const [revealed, setRevealed] = useState<Set<string>>(new Set())
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin]           = useState("")
  const [pinErr, setPinErr]     = useState("")

  // Edit / Add modal
  const [editing, setEditing]   = useState<Credential | null>(null)
  const [isNew, setIsNew]       = useState(false)
  const [editPwdShow, setEditPwdShow] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Load persisted credentials from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setCreds(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  function persist(updated: Credential[]) {
    setCreds(updated)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch { /* ignore */ }
  }

  function toggle(id: string) {
    setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function unlock(e: React.FormEvent) {
    e.preventDefault()
    if (pin === "9999") { setUnlocked(true); setPinErr("") }
    else { setPinErr("Incorrect PIN"); setPin("") }
  }

  function openEdit(cred: Credential) {
    setEditing({ ...cred })
    setIsNew(false)
    setEditPwdShow(false)
  }

  function openAdd() {
    setEditing({ ...BLANK, id: `c${Date.now()}` })
    setIsNew(true)
    setEditPwdShow(false)
  }

  function saveEdit() {
    if (!editing) return
    if (!editing.platform || !editing.label || !editing.username) return
    const updated = isNew
      ? [...creds, editing]
      : creds.map(c => c.id === editing.id ? editing : c)
    persist(updated)
    setEditing(null)
  }

  function deleteCred(id: string) {
    persist(creds.filter(c => c.id !== id))
    setDeleteConfirm(null)
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
            <input className="g-input" type="password" value={pin} onChange={e => setPin(e.target.value)}
              placeholder="Enter PIN" maxLength={6} autoFocus style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 20 }} />
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
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>Superadmin · Credential Vault</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>Credential Vault</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{creds.length} stored credentials · superadmin eyes only</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 11, color: "var(--success)", background: "var(--success-bg)", border: "1px solid var(--success-edge)", borderRadius: "var(--r-sm)", padding: "5px 12px", fontWeight: 700 }}>
            VAULT UNLOCKED
          </div>
          <button className="btn-gold" style={{ fontSize: 11 }} onClick={openAdd}>
            <Plus size={12} /> Add Credential
          </button>
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setUnlocked(false); setRevealed(new Set()) }}>
            <Lock size={12} /> Lock
          </button>
        </div>
      </motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
        <AnimatePresence>
          {creds.map((cred, i) => {
            const Icon = getIcon(cred.platform)
            const show = revealed.has(cred.id)
            return (
              <motion.div key={cred.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                className="panel" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, left: 0, width: 3, height: "100%", background: cred.color, borderRadius: "3px 0 0 3px" }} />
                <div style={{ paddingLeft: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${cred.color}18`, border: `1px solid ${cred.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: cred.color, flexShrink: 0 }}>
                      <Icon size={17} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cred.label}</div>
                      <div style={{ fontSize: 10, color: "var(--text-3)" }}>{cred.platform}</div>
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={() => toggle(cred.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex", padding: 4 }}>
                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={() => openEdit(cred)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#C9A24B", display: "flex", padding: 4 }}>
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteConfirm(cred.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", display: "flex", padding: 4 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {[
                    { label: "Username / Handle", value: cred.username },
                    { label: "Password",          value: show ? cred.password : "••••••••••••" },
                  ].map(f => (
                    <div key={f.label} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-sm)" }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#C9A24B", fontFamily: "monospace", letterSpacing: show || f.label !== "Password" ? "0.02em" : "0.15em", wordBreak: "break-all" }}>
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

      {/* Edit / Add modal */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setEditing(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92 }}
              className="panel" style={{ width: 460, padding: 28 }} onClick={e => e.stopPropagation()}>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-1)" }}>
                  {isNew ? "Add Credential" : "Edit Credential"}
                </div>
                <button onClick={() => setEditing(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                  <X size={16} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                {[
                  { label: "Platform",        key: "platform", ph: "e.g. Instagram" },
                  { label: "Label",           key: "label",    ph: "e.g. Club Instagram" },
                  { label: "Username/Handle", key: "username", ph: "e.g. @clubgaruda_muj" },
                  { label: "URL (optional)",  key: "url",      ph: "https://..." },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}</label>
                    <input className="g-input" value={(editing as Record<string, string>)[f.key] ?? ""} placeholder={f.ph}
                      onChange={e => setEditing(prev => prev ? { ...prev, [f.key]: e.target.value } : prev)} />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Password</label>
                  <div style={{ position: "relative" }}>
                    <input className="g-input" type={editPwdShow ? "text" : "password"} value={editing.password} placeholder="Enter password"
                      onChange={e => setEditing(prev => prev ? { ...prev, password: e.target.value } : prev)}
                      style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setEditPwdShow(p => !p)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex" }}>
                      {editPwdShow ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Accent Colour</label>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="color" value={editing.color} onChange={e => setEditing(prev => prev ? { ...prev, color: e.target.value } : prev)}
                      style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid var(--brand-edge)", background: "none", cursor: "pointer", padding: 2 }} />
                    <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{editing.color}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={() => setEditing(null)}>Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} className="btn-gold" style={{ flex: 1, justifyContent: "center", fontSize: 11 }}
                    onClick={saveEdit} disabled={!editing.platform || !editing.label || !editing.username}>
                    <Save size={12} /> {isNew ? "Add" : "Save Changes"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="panel" style={{ width: 360, padding: 26 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>Delete Credential?</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 20 }}>
                {creds.find(c => c.id === deleteConfirm)?.label} will be permanently removed from the vault.
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn-danger" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={() => deleteCred(deleteConfirm!)}>
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
