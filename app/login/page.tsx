"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, ChevronRight, User, Lock } from "lucide-react"
import Image from "next/image"

const ROLE_DEST: Record<string, string> = {
  superadmin: "/superadmin",
  admin:      "/admin",
  team:       "/team",
}

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")


  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const u = username.trim()
    const p = password.trim()
    if (!u || !p) { setError("Username and password are required"); return }
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ username: u, password: p }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Login failed"); return }
      const dest = ROLE_DEST[data.user.role] ?? "/team"
      if (data.force_reset) {
        window.location.href = `/change-password?next=${encodeURIComponent(dest)}`
      } else {
        window.location.href = dest
      }
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>

      {/* Floating spheres */}
      <div style={{ position: "fixed", top: "20%", left: "8%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(224,64,251,0.9), rgba(99,66,253,0.6), rgba(61,90,254,0.2))", boxShadow: "0 0 60px rgba(224,64,251,0.3)", animation: "float-sphere-1 8s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "8%", right: "10%", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(0,229,255,0.9), rgba(61,90,254,0.5), rgba(61,90,254,0.1))", boxShadow: "0 0 40px rgba(0,229,255,0.25)", animation: "float-sphere-2 6s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "15%", right: "12%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(99,66,253,0.85), rgba(61,90,254,0.4), transparent)", boxShadow: "0 0 32px rgba(99,102,241,0.2)", animation: "float-sphere-3 10s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}
      >
        {/* Frosted login card */}
        <div style={{
          background: "rgba(7,7,10,0.78)",
          backdropFilter: "blur(32px) saturate(150%)",
          WebkitBackdropFilter: "blur(32px) saturate(150%)",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 24,
          boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,162,75,0.08)",
          padding: "36px 32px 32px",
        }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ display: "inline-block" }}
            >
              <Image
                src="/garuda.png"
                alt="Garuda OS"
                width={180}
                height={180}
                style={{ width: 180, height: "auto", filter: "drop-shadow(0 0 32px rgba(201,162,75,0.5))" }}
                priority
              />
            </motion.div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.3em", color: "var(--text-3)", textTransform: "uppercase", marginTop: 10 }}>GARUDA OS</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", marginTop: 3, letterSpacing: "-0.02em" }}>Command Center</div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,75,0.25), transparent)", marginBottom: 26 }} />

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Username */}
            <div>
              <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Username</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", display: "flex", pointerEvents: "none" }}>
                  <User size={14} strokeWidth={1.5} />
                </div>
                <input
                  className="g-input"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
              <div style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", display: "flex", pointerEvents: "none" }}>
                  <Lock size={14} strokeWidth={1.5} />
                </div>
                <input
                  className="g-input"
                  type={showPwd ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                  {showPwd ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                </button>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                  style={{ padding: "9px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--danger)" }}>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={{ boxShadow: "0 0 28px rgba(107,15,26,0.5), inset 0 0 20px rgba(201,162,75,0.08)" }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              style={{
                width: "100%", padding: "13px 20px", marginTop: 4,
                background: "linear-gradient(135deg, #6B0F1A, #8B1525)",
                border: "1px solid rgba(201,162,75,0.22)",
                borderRadius: "var(--r-md)",
                color: "#C9A24B",
                fontSize: 11, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                opacity: loading ? 0.75 : 1,
                transition: "all 0.2s",
              }}
            >
              {loading ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                    style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(201,162,75,0.25)", borderTop: "2px solid #C9A24B", borderRadius: "50%" }} />
                  Authenticating
                </>
              ) : (
                <>Enter Command Center <ChevronRight size={14} strokeWidth={2} /></>
              )}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 20, letterSpacing: "0.04em" }}>
          Club Garuda · Manipal University Jaipur
        </p>
      </motion.div>

      <style jsx global>{`
        @keyframes float-sphere-1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }
        @keyframes float-sphere-2 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
        @keyframes float-sphere-3 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
      `}</style>
    </div>
  )
}
