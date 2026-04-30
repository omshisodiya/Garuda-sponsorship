"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Lock, CheckCircle, ChevronRight } from "lucide-react"
import Image from "next/image"

function ChangePasswordForm() {
  const [password, setPassword] = useState("")
  const [confirm,  setConfirm]  = useState("")
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [done,     setDone]     = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const next   = params.get("next") ?? "/team"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 4) { setError("Password must be at least 4 characters"); return }
    if (password !== confirm) { setError("Passwords do not match"); return }
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/change-password", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to update password"); return }
      setDone(true)
      setTimeout(() => router.push(next), 1400)
    } catch {
      setError("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>

      <div style={{ position: "fixed", top: "20%", left: "8%", width: 180, height: 180, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(224,64,251,0.9), rgba(99,66,253,0.6), rgba(61,90,254,0.2))", boxShadow: "0 0 60px rgba(224,64,251,0.3)", animation: "float-sphere-1 8s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: "15%", right: "12%", width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(99,66,253,0.85), rgba(61,90,254,0.4), transparent)", pointerEvents: "none", zIndex: 0 }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 10 }}
      >
        <div style={{ background: "rgba(7,7,10,0.78)", backdropFilter: "blur(32px) saturate(150%)", WebkitBackdropFilter: "blur(32px) saturate(150%)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 24, boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,162,75,0.08)", padding: "36px 32px 32px" }}>

          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Image src="/garuda.png" alt="Garuda OS" width={120} height={120} style={{ width: 120, height: "auto", filter: "drop-shadow(0 0 24px rgba(201,162,75,0.4))" }} priority />
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.3em", color: "var(--text-3)", textTransform: "uppercase", marginTop: 10 }}>GARUDA OS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--text-1)", marginTop: 3, letterSpacing: "-0.02em" }}>Set New Password</div>
            <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 6, lineHeight: 1.6 }}>Your account requires a password change before you can continue.</div>
          </div>

          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,162,75,0.25), transparent)", marginBottom: 24 }} />

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "16px 0" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--success-bg)", border: "1px solid var(--success-edge)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CheckCircle size={24} color="var(--success)" strokeWidth={1.5} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--success)" }}>Password updated</div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>Redirecting to your dashboard…</div>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", display: "flex", pointerEvents: "none" }}>
                      <Lock size={14} strokeWidth={1.5} />
                    </div>
                    <input
                      className="g-input"
                      type={showPwd ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 4 characters"
                      autoComplete="new-password"
                      style={{ paddingLeft: 38, paddingRight: 44 }}
                    />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      style={{ position: "absolute", right: 13, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex", alignItems: "center", padding: 0 }}>
                      {showPwd ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Confirm Password</label>
                  <div style={{ position: "relative" }}>
                    <div style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-3)", display: "flex", pointerEvents: "none" }}>
                      <Lock size={14} strokeWidth={1.5} />
                    </div>
                    <input
                      className="g-input"
                      type={showPwd ? "text" : "password"}
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      autoComplete="new-password"
                      style={{ paddingLeft: 38 }}
                    />
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      style={{ padding: "9px 14px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--danger)" }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ boxShadow: "0 0 28px rgba(107,15,26,0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  style={{ width: "100%", padding: "13px 20px", marginTop: 4, background: "linear-gradient(135deg, #6B0F1A, #8B1525)", border: "1px solid rgba(201,162,75,0.22)", borderRadius: "var(--r-md)", color: "#C9A24B", fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.75 : 1, transition: "all 0.2s" }}
                >
                  {loading ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                        style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(201,162,75,0.25)", borderTop: "2px solid #C9A24B", borderRadius: "50%" }} />
                      Updating…
                    </>
                  ) : (
                    <>Set New Password <ChevronRight size={14} strokeWidth={2} /></>
                  )}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p style={{ textAlign: "center", fontSize: 10, color: "var(--text-3)", marginTop: 20, letterSpacing: "0.04em" }}>
          Club Garuda · Manipal University Jaipur
        </p>
      </motion.div>

      <style jsx global>{`
        @keyframes float-sphere-1 { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }
      `}</style>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={null}>
      <ChangePasswordForm />
    </Suspense>
  )
}
