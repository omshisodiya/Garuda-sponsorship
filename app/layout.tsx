"use client"

import "./globals.css"
import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"
import Image from "next/image"
import {
  LayoutDashboard, Database, Columns3, GitBranch, Zap, Bell,
  Users, Vault, Mail, Target, Brain, Shield, ChevronLeft,
  ChevronRight, Search, LogOut, Flame, Map, Trophy, BookOpen,
  Terminal, Sun, Moon, AlertCircle, Info, AlertTriangle, X as XIcon,
} from "lucide-react"

type InboxNotif = {
  id: number
  title: string
  body: string
  url?: string
  importance: string
  sent_at: string
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0))).buffer
}

function relTimeShort(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const NAV: Record<string, Array<{ label: string; href: string; icon: React.ElementType; badge?: string }>> = {
  superadmin: [
    { label: "Command Center",   href: "/superadmin",       icon: LayoutDashboard },
    { label: "Lead Vault",       href: "/leads",            icon: Database },
    { label: "Pipeline Board",   href: "/pipeline",         icon: Columns3 },
    { label: "Assignments",      href: "/assign",           icon: GitBranch },
    { label: "Signals",          href: "/signals",          icon: Zap,    badge: "AI" },
    { label: "Alerts",           href: "/alerts",           icon: Bell },
    { label: "Outreach Studio",  href: "/outreach",         icon: Mail },
    { label: "Revenue Vault",    href: "/vault",            icon: Vault },
    { label: "Sponsor Intel",    href: "/apollo",           icon: Target },
    { label: "AI Copilot",       href: "/copilot",          icon: Brain,  badge: "AI" },
    { label: "Users",            href: "/users",            icon: Users },
    { label: "Credential Vault", href: "/superadmin/vault", icon: Shield },
  ],
  admin: [
    { label: "Dashboard",        href: "/admin",            icon: LayoutDashboard },
    { label: "Lead Vault",       href: "/leads",            icon: Database },
    { label: "Pipeline Board",   href: "/pipeline",         icon: Columns3 },
    { label: "Assignments",      href: "/assign",           icon: GitBranch },
    { label: "Users",            href: "/users",            icon: Users },
    { label: "Signals",          href: "/signals",          icon: Zap,    badge: "AI" },
    { label: "Alerts",           href: "/alerts",           icon: Bell },
    { label: "Outreach Studio",  href: "/outreach",         icon: Mail },
    { label: "AI Copilot",       href: "/copilot",          icon: Brain,  badge: "AI" },
    { label: "Missions",         href: "/missions",         icon: Flame },
  ],
  team: [
    { label: "My Dashboard",     href: "/team",             icon: LayoutDashboard },
    { label: "My Leads",         href: "/leads",            icon: Database },
    { label: "Pipeline",         href: "/pipeline",         icon: Columns3 },
    { label: "Outreach",         href: "/outreach",         icon: Mail },
    { label: "AI Copilot",       href: "/copilot",          icon: Brain,  badge: "AI" },
    { label: "Missions",         href: "/missions",         icon: Flame },
  ],
}

const CMD_ROUTES = [
  { label: "Command Center",   href: "/superadmin",       icon: LayoutDashboard, desc: "Main intelligence dashboard" },
  { label: "Lead Vault",       href: "/leads",            icon: Database,        desc: "Full CRM & sponsor database" },
  { label: "Pipeline Board",   href: "/pipeline",         icon: Columns3,        desc: "Kanban pipeline view" },
  { label: "Assignments",      href: "/assign",           icon: GitBranch,       desc: "Lead assignment console" },
  { label: "Signals",          href: "/signals",          icon: Zap,             desc: "AI-generated signals" },
  { label: "Alerts",           href: "/alerts",           icon: Bell,            desc: "Alert center" },
  { label: "Outreach Studio",  href: "/outreach",         icon: Mail,            desc: "Sponsor email studio" },
  { label: "Revenue Vault",    href: "/vault",            icon: Vault,           desc: "Revenue intelligence" },
  { label: "Sponsor Intel",    href: "/apollo",           icon: Target,          desc: "Intelligence finder" },
  { label: "AI Copilot",       href: "/copilot",          icon: Brain,           desc: "Garuda AI assistant" },
  { label: "Users",            href: "/users",            icon: Users,           desc: "User management" },
  { label: "Credential Vault", href: "/superadmin/vault", icon: Shield,          desc: "Admin credentials" },
  { label: "Missions",         href: "/missions",         icon: Flame,           desc: "Team mission board" },
  { label: "Morning Briefing", href: "/briefing",         icon: BookOpen,        desc: "Daily briefing" },
  { label: "Command Board",    href: "/command",          icon: Terminal,        desc: "Executive command board" },
  { label: "Hall of Records",  href: "/records",          icon: Trophy,          desc: "Historic achievements" },
  { label: "Career Path",      href: "/me",               icon: Map,             desc: "My profile & growth" },
]

const ROLE_LABELS: Record<string, string> = { superadmin: "Super Admin", admin: "Admin", team: "Team Member" }

const IDLE_MS   = 9 * 60 * 1000  // 9 min of no activity → show warning (10 min total)
const WARN_SECS = 60              // 60-second countdown before auto-logout
const IDLE_LS   = "g_last_active" // localStorage key shared across all tabs

const SIDEBAR_FULL = 252
const SIDEBAR_ICON = 66

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole]         = useState(() => (typeof window !== "undefined" ? sessionStorage.getItem("g_role") ?? "team" : "team"))
  const [user, setUser]         = useState(() => (typeof window !== "undefined" ? sessionStorage.getItem("g_name") ?? "User" : "User"))
  const [expanded, setExpanded] = useState(true)
  const [cmdOpen, setCmdOpen]   = useState(false)
  const [cmdQuery, setCmdQuery] = useState("")
  const [cmdIdx, setCmdIdx]     = useState(0)
  const [mounted, setMounted]   = useState(false)
  const [time, setTime]         = useState("")
  const [theme, setTheme]       = useState<"dark" | "light">("dark")
  const [userId, setUserId]     = useState("")
  const [bellOpen, setBellOpen] = useState(false)
  const [inboxNotifs, setInboxNotifs] = useState<InboxNotif[]>([])
  const [readIds, setReadIds]   = useState<Set<number>>(new Set())
  const [idleWarning, setIdleWarning] = useState(false)
  const [idleSecsLeft, setIdleSecsLeft] = useState(WARN_SECS)
  const idleTimerRef  = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const warnTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const resetIdleRef  = useRef<(() => void) | null>(null)

  const pathname = usePathname()
  const router   = useRouter()
  const noLayout = ["/login", "/lock", "/locked", "/change-password"].some(p => pathname?.startsWith(p))

  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 0)
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setRole(data.user.role)
          setUser(data.user.name)
          setUserId(data.user.id)
          sessionStorage.setItem("g_role", data.user.role)
          sessionStorage.setItem("g_name", data.user.name)
        }
      })
      .catch(() => {})
    return () => window.clearTimeout(t)
  }, [])

  // Fetch in-app notification inbox
  useEffect(() => {
    fetch("/api/push/inbox")
      .then(r => r.ok ? r.json() : { notifications: [] })
      .then(d => setInboxNotifs(d.notifications ?? []))
      .catch(() => {})
    const saved = localStorage.getItem("g_notif_reads")
    if (saved) {
      try { setReadIds(new Set(JSON.parse(saved) as number[])) } catch { /* ignore */ }
    }
  }, [])

  // Register service worker + subscribe to push when user ID is known
  useEffect(() => {
    if (!userId || typeof window === "undefined") return
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) return

    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js")
        const permission = await Notification.requestPermission()
        if (permission !== "granted") return

        const existing = await reg.pushManager.getSubscription()
        const sub = existing ?? await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        })

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
      } catch {
        // push not supported or denied — silently ignore
      }
    })()
  }, [userId])

  useEffect(() => {
    const tick = () => {
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }))
    }
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  const openCmd = useCallback(() => { setCmdOpen(true); setCmdQuery(""); setCmdIdx(0) }, [])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openCmd() }
      if (e.key === "Escape") setCmdOpen(false)
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [openCmd])

  useEffect(() => {
    const saved = localStorage.getItem("g_theme") as "dark" | "light" | null
    if (saved) setTheme(saved)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme)
    localStorage.setItem("g_theme", theme)
  }, [theme])

  // Poll /api/auth/me every 60s — detects server-side force-logout by superadmin
  useEffect(() => {
    if (noLayout) return
    const id = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.status === 401) {
          sessionStorage.removeItem("g_role")
          sessionStorage.removeItem("g_name")
          window.location.href = "/login"
        }
      } catch { /* network blip — ignore, next tick will retry */ }
    }, 60_000)
    return () => clearInterval(id)
  }, [noLayout])

  // Idle detection — auto-logout after 10 min of no activity across ALL open tabs
  useEffect(() => {
    if (noLayout) return

    async function doLogout() {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
      sessionStorage.removeItem("g_role")
      sessionStorage.removeItem("g_name")
      window.location.href = "/login"
    }

    // broadcast=true: this tab had activity, tell other tabs
    // broadcast=false: another tab had activity, just reset our own timer
    function reset(broadcast = true) {
      if (broadcast) localStorage.setItem(IDLE_LS, Date.now().toString())
      if (idleTimerRef.current)  clearTimeout(idleTimerRef.current)
      if (warnTimerRef.current)  clearInterval(warnTimerRef.current)
      warnTimerRef.current = null
      setIdleWarning(false)
      setIdleSecsLeft(WARN_SECS)
      idleTimerRef.current = setTimeout(() => {
        setIdleWarning(true)
        let secs = WARN_SECS
        setIdleSecsLeft(secs)
        warnTimerRef.current = setInterval(() => {
          secs -= 1
          setIdleSecsLeft(secs)
          if (secs <= 0) {
            clearInterval(warnTimerRef.current!)
            warnTimerRef.current = null
            doLogout()
          }
        }, 1000)
      }, IDLE_MS)
    }

    // Pick up activity from other open tabs/windows (storage fires in all OTHER tabs)
    function onStorage(e: StorageEvent) {
      if (e.key === IDLE_LS) reset(false)
    }

    resetIdleRef.current = reset
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"] as const
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    window.addEventListener("storage", onStorage)
    reset()

    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      window.removeEventListener("storage", onStorage)
      if (idleTimerRef.current)  clearTimeout(idleTimerRef.current)
      if (warnTimerRef.current)  clearInterval(warnTimerRef.current)
    }
  }, [noLayout])

  const cmdFiltered = CMD_ROUTES.filter(r =>
    r.label.toLowerCase().includes(cmdQuery.toLowerCase()) ||
    r.desc.toLowerCase().includes(cmdQuery.toLowerCase())
  )

  function navigate(href: string) { setCmdOpen(false); router.push(href) }
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    sessionStorage.removeItem("g_role")
    sessionStorage.removeItem("g_name")
    window.location.href = "/login"
  }

  const nav = NAV[role] || NAV.team

  if (!mounted) return <html><body style={{ background: "#07070A" }} /></html>

  if (noLayout) {
    return (
      <html lang="en">
        <body>
          <div className="g-bg" />
          <div className="g-bg-grid" />
          <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
        </body>
      </html>
    )
  }

  const sideW = expanded ? SIDEBAR_FULL : SIDEBAR_ICON

  return (
    <html lang="en">
      <body style={{ overflow: "hidden" }}>
        <div className="g-bg" />
        <div className="g-bg-grid" />

        <div style={{ display: "flex", height: "100vh", position: "relative", zIndex: 1 }}>

          {/* SIDEBAR */}
          <motion.aside
            animate={{ width: sideW }}
            transition={{ duration: 0.3, ease: [0.4,0,0.2,1] }}
            style={{
              width: sideW, minWidth: sideW, height: "100vh",
              display: "flex", flexDirection: "column",
              background: "var(--sidebar-bg)",
              backdropFilter: "blur(36px)", WebkitBackdropFilter: "blur(36px)",
              borderRight: "1px solid var(--sidebar-border)",
              position: "relative", zIndex: 100, overflow: "hidden", flexShrink: 0,
            }}
          >
            {/* ambient top glow */}
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 180, background: "radial-gradient(ellipse at top, var(--sidebar-top-glow) 0%, transparent 70%)", pointerEvents: "none" }} />

            {/* Brand */}
            <div style={{ padding: expanded ? "22px 18px 18px" : "22px 12px 18px", display: "flex", alignItems: "center", gap: 11, borderBottom: "1px solid var(--sidebar-brand-border)", flexShrink: 0, position: "relative" }}>
              <motion.div
                whileHover={{ rotate: 4, scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, overflow: "hidden", boxShadow: "0 0 16px rgba(201,162,75,0.25)" }}
              >
                <Image src="/garuda.png" alt="Garuda OS" width={36} height={36} style={{ width: 36, height: 36, objectFit: "cover" }} />
              </motion.div>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#C9A24B", letterSpacing: "0.06em" }}>GARUDA OS</div>
                    <div style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}>Command Centre</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Collapse toggle */}
            <button
              onClick={() => setExpanded(o => !o)}
              style={{ position: "absolute", right: -11, top: 68, width: 22, height: 22, background: "rgba(201,162,75,0.12)", border: "1px solid rgba(201,162,75,0.28)", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, color: "#C9A24B" }}
            >
              {expanded ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
            </button>

            {/* Nav */}
            <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto", overflowX: "hidden" }}>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--text-3)", padding: "0 8px 8px" }}>
                    Navigation
                  </motion.div>
                )}
              </AnimatePresence>

              {nav.map((item, i) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
                return (
                  <motion.button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.25 }}
                    style={{
                      width: "100%", display: "flex", alignItems: "center",
                      gap: expanded ? 10 : 0, justifyContent: expanded ? "flex-start" : "center",
                      padding: expanded ? "9px 12px" : "9px",
                      borderRadius: "var(--r-md)",
                      border: `1px solid ${isActive ? "rgba(201,162,75,0.2)" : "transparent"}`,
                      background: isActive ? "rgba(201,162,75,0.07)" : "transparent",
                      color: isActive ? "#C9A24B" : "var(--text-2)",
                      cursor: "pointer", marginBottom: 2, position: "relative",
                      transition: "all 0.14s", fontFamily: "inherit", overflow: "hidden",
                    }}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        style={{ position: "absolute", left: 0, top: "18%", bottom: "18%", width: 2.5, borderRadius: "0 3px 3px 0", background: "linear-gradient(180deg, #E0BC6A, #C9A24B)", boxShadow: "0 0 6px rgba(201,162,75,0.6)" }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                      />
                    )}
                    <Icon size={15} strokeWidth={1.6} style={{ flexShrink: 0 }} />
                    <AnimatePresence>
                      {expanded && (
                        <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                          style={{ fontSize: 12, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap", overflow: "hidden", flex: 1 }}>
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    {expanded && item.badge && (
                      <span style={{ padding: "1px 6px", borderRadius: 100, background: "rgba(201,162,75,0.14)", color: "#C9A24B", fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", border: "1px solid rgba(201,162,75,0.22)", flexShrink: 0 }}>{item.badge}</span>
                    )}
                  </motion.button>
                )
              })}

              <AnimatePresence>
                {expanded && (
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={openCmd}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: "var(--r-md)", border: "1px solid rgba(201,162,75,0.1)", background: "rgba(255,255,255,0.02)", color: "var(--text-3)", cursor: "pointer", marginTop: 10, fontSize: 11, fontFamily: "inherit" }}
                  >
                    <Search size={12} />
                    <span style={{ flex: 1, textAlign: "left" }}>Search…</span>
                    <kbd style={{ padding: "1px 6px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 9, color: "var(--text-3)" }}>Ctrl+K</kbd>
                  </motion.button>
                )}
              </AnimatePresence>
            </nav>

            {/* User dock */}
            <div style={{ padding: expanded ? "14px 12px" : "14px 8px", borderTop: "1px solid rgba(201,162,75,0.08)", display: "flex", alignItems: "center", gap: expanded ? 10 : 0, justifyContent: expanded ? "flex-start" : "center", flexShrink: 0 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #6B0F1A, #C9A24B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0, boxShadow: "0 0 10px rgba(201,162,75,0.18)" }}>
                {user.charAt(0).toUpperCase()}
              </div>
              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user}</div>
                    <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{ROLE_LABELS[role]}</div>
                  </motion.div>
                )}
              </AnimatePresence>
              {expanded && (
                <motion.button whileTap={{ scale: 0.92 }} onClick={logout}
                  style={{ width: 28, height: 28, borderRadius: 8, background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                  title="Logout">
                  <LogOut size={12} />
                </motion.button>
              )}
            </div>
          </motion.aside>

          {/* MAIN */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden", position: "relative" }}>

            {/* TOP BAR */}
            <div style={{ height: 56, display: "flex", alignItems: "center", padding: "0 24px", borderBottom: "1px solid var(--topbar-border)", background: "var(--topbar-bg)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", gap: 16, flexShrink: 0, zIndex: 50 }}>
              {/* breadcrumb */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--text-3)" }}>
                <span style={{ color: "var(--text-brand)" }}>Garuda</span>
                <ChevronRight size={10} style={{ opacity: 0.4 }} />
                <span style={{ color: "var(--text-2)" }}>{nav.find(n => n.href === pathname || pathname?.startsWith(n.href + "/"))?.label || "Dashboard"}</span>
              </div>

              <div style={{ flex: 1 }} />

              {/* search */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                onClick={openCmd}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 14px", background: "var(--topbar-search-bg)", border: "1px solid var(--topbar-search-border)", borderRadius: "var(--r-sm)", color: "var(--text-3)", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
              >
                <Search size={12} />
                <span>Search leads, actions…</span>
                <kbd style={{ padding: "1px 6px", borderRadius: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", fontSize: 9, marginLeft: 4 }}>⌘K</kbd>
              </motion.button>

              {/* theme toggle */}
              <motion.button
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                className="theme-toggle"
                title={theme === "dark" ? "Switch to Day Mode" : "Switch to Dark Mode"}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </motion.button>

              {/* alerts / bell */}
              <div style={{ position: "relative" }}>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setBellOpen(o => !o)}
                  style={{ width: 34, height: 34, borderRadius: "var(--r-sm)", background: "var(--topbar-alert-bg)", border: "1px solid var(--topbar-alert-border)", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Bell size={14} />
                </motion.button>
                {inboxNotifs.filter(n => !readIds.has(n.id)).length > 0 && (
                  <span style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, padding: "0 3px", background: "var(--danger)", border: "1.5px solid var(--bg-0)", borderRadius: "50%", fontSize: 8, fontWeight: 800, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {inboxNotifs.filter(n => !readIds.has(n.id)).length}
                  </span>
                )}
              </div>

              {/* clock */}
              <div style={{ padding: "5px 12px", background: "var(--topbar-clock-bg)", border: "1px solid var(--topbar-clock-border)", borderRadius: "var(--r-sm)", fontSize: 11, fontWeight: 600, color: "var(--text-brand)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.04em" }}>
                {time}
              </div>

              {/* live */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="status-dot live" />
                <span style={{ fontSize: 10, color: "rgba(74,222,128,0.7)", fontWeight: 600 }}>LIVE</span>
              </div>
            </div>

            {/* BELL NOTIFICATION PANEL */}
            <AnimatePresence>
              {bellOpen && (
                <>
                  {/* backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setBellOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 200 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.4,0,0.2,1] }}
                    style={{
                      position: "absolute", top: 60, right: 24, width: 370, maxHeight: 500,
                      background: "var(--bg-2)", border: "1px solid var(--brand-edge)",
                      borderRadius: "var(--r-xl)", zIndex: 201, overflow: "hidden",
                      boxShadow: "var(--shadow-xl)",
                      display: "flex", flexDirection: "column",
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--brand-edge)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Bell size={14} style={{ color: "var(--brand-2)" }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>Notifications</span>
                        {inboxNotifs.filter(n => !readIds.has(n.id)).length > 0 && (
                          <span className="badge badge-red" style={{ fontSize: 9 }}>
                            {inboxNotifs.filter(n => !readIds.has(n.id)).length} new
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        {inboxNotifs.length > 0 && (
                          <button
                            onClick={() => {
                              const all = new Set(inboxNotifs.map(n => n.id))
                              setReadIds(all)
                              localStorage.setItem("g_notif_reads", JSON.stringify([...all]))
                            }}
                            style={{ fontSize: 10, color: "var(--text-brand)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                          >
                            Mark all read
                          </button>
                        )}
                        <button onClick={() => setBellOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", display: "flex" }}>
                          <XIcon size={14} />
                        </button>
                      </div>
                    </div>

                    {/* List */}
                    <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
                      {inboxNotifs.length === 0 ? (
                        <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                          No notifications yet
                        </div>
                      ) : inboxNotifs.map(n => {
                        const isUnread = !readIds.has(n.id)
                        const IconComp = n.importance === "critical" ? AlertCircle : n.importance === "warning" ? AlertTriangle : Info
                        const iconColor = n.importance === "critical" ? "var(--danger)" : n.importance === "warning" ? "var(--warning)" : "var(--info)"
                        return (
                          <div
                            key={n.id}
                            onClick={() => {
                              const next = new Set(readIds)
                              next.add(n.id)
                              setReadIds(next)
                              localStorage.setItem("g_notif_reads", JSON.stringify([...next]))
                              if (n.url) { setBellOpen(false); router.push(n.url) }
                            }}
                            style={{
                              display: "flex", gap: 12, padding: "12px 18px",
                              cursor: n.url ? "pointer" : "default",
                              background: isUnread ? "var(--glass-2)" : "transparent",
                              borderBottom: "1px solid var(--brand-edge)",
                              transition: "background 0.12s",
                            }}
                          >
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: `${iconColor}18`, border: `1px solid ${iconColor}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <IconComp size={13} style={{ color: iconColor }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: isUnread ? 700 : 500, color: "var(--text-1)", marginBottom: 2, display: "flex", justifyContent: "space-between", gap: 6 }}>
                                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.title}</span>
                                <span style={{ fontSize: 10, color: "var(--text-3)", flexShrink: 0 }}>{relTimeShort(n.sent_at)}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.4 }}>{n.body}</div>
                              {n.url && <div style={{ fontSize: 10, color: "var(--info)", marginTop: 4 }}>{n.url} →</div>}
                            </div>
                            {isUnread && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--brand-2)", flexShrink: 0, marginTop: 4 }} />}
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* PAGE */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              <motion.div key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: [0.4,0,0.2,1] }} style={{ minHeight: "100%" }}>
                {children}
              </motion.div>
            </div>
          </div>
        </div>

        {/* COMMAND PALETTE */}
        <AnimatePresence>
          {cmdOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="cmd-overlay" onClick={() => setCmdOpen(false)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: -12 }} transition={{ duration: 0.18, ease: [0.4,0,0.2,1] }}
                className="cmd-box" onClick={e => e.stopPropagation()}
              >
                <div style={{ display: "flex", alignItems: "center", padding: "0 18px" }}>
                  <Search size={16} style={{ color: "var(--text-3)", flexShrink: 0, marginRight: 10 }} />
                  <input
                    autoFocus className="cmd-input"
                    placeholder="Search modules, leads, actions…"
                    value={cmdQuery}
                    onChange={e => { setCmdQuery(e.target.value); setCmdIdx(0) }}
                    onKeyDown={e => {
                      if (e.key === "ArrowDown") setCmdIdx(i => Math.min(i+1, cmdFiltered.length-1))
                      if (e.key === "ArrowUp")   setCmdIdx(i => Math.max(i-1, 0))
                      if (e.key === "Enter" && cmdFiltered[cmdIdx]) navigate(cmdFiltered[cmdIdx].href)
                    }}
                  />
                </div>
                <div style={{ maxHeight: 360, overflowY: "auto", padding: "6px 0 10px" }}>
                  {cmdFiltered.length === 0 ? (
                    <div style={{ padding: "14px 22px", color: "var(--text-3)", fontSize: 12 }}>No results</div>
                  ) : cmdFiltered.map((r, i) => {
                    const Icon = r.icon
                    return (
                      <button key={r.href} onClick={() => navigate(r.href)}
                        style={{ width: "calc(100% - 14px)", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", background: i === cmdIdx ? "rgba(201,162,75,0.07)" : "transparent", border: "none", borderRadius: "var(--r-md)", margin: "2px 7px", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "background 0.12s" }}
                        onMouseEnter={() => setCmdIdx(i)}
                      >
                        <span style={{ width: 30, height: 30, background: "rgba(201,162,75,0.09)", border: "1px solid rgba(201,162,75,0.18)", borderRadius: "var(--r-sm)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Icon size={13} color="#C9A24B" strokeWidth={1.6} />
                        </span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: i === cmdIdx ? "#C9A24B" : "var(--text-1)" }}>{r.label}</div>
                          <div style={{ fontSize: 10, color: "var(--text-3)" }}>{r.desc}</div>
                        </div>
                        {i === cmdIdx && <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-3)" }}>Enter</span>}
                      </button>
                    )
                  })}
                </div>
                <div style={{ padding: "9px 18px", borderTop: "1px solid rgba(201,162,75,0.08)", display: "flex", gap: 14, fontSize: 10, color: "var(--text-3)" }}>
                  <span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* IDLE WARNING MODAL */}
        <AnimatePresence>
          {!noLayout && idleWarning && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: -10 }}
                transition={{ duration: 0.2, ease: [0.4,0,0.2,1] }}
                style={{ width: "100%", maxWidth: 380, background: "var(--bg-2)", border: "1px solid rgba(201,162,75,0.25)", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.7)", padding: "32px 28px", textAlign: "center" }}
              >
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(201,162,75,0.1)", border: "1px solid rgba(201,162,75,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <span style={{ fontSize: 22, fontVariantNumeric: "tabular-nums", fontWeight: 800, color: idleSecsLeft <= 15 ? "var(--danger)" : "#C9A24B" }}>{idleSecsLeft}</span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>Session expiring</div>
                <div style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 24, lineHeight: 1.5 }}>
                  You&apos;ve been idle. You&apos;ll be logged out in <strong style={{ color: idleSecsLeft <= 15 ? "var(--danger)" : "#C9A24B" }}>{idleSecsLeft}s</strong> unless you continue.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => resetIdleRef.current?.()}
                    style={{ flex: 1, padding: "11px 0", borderRadius: "var(--r-md)", background: "linear-gradient(135deg, #6B0F1A, #8B1525)", border: "1px solid rgba(201,162,75,0.22)", color: "#C9A24B", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Stay logged in
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={logout}
                    style={{ padding: "11px 16px", borderRadius: "var(--r-md)", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", color: "var(--danger)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Logout
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </body>
    </html>
  )
}
