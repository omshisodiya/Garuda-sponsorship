"use client"

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users, UserPlus, Shield, Lock, Unlock, RefreshCw,
  CheckCircle, AlertTriangle, Eye, EyeOff, Copy, Check, Trash2, Settings,
} from "lucide-react"
import type { PublicUser, UserRole, UserStatus } from "@/app/lib/server/store"

type Section = "users" | "create"

const ROLE_BADGE: Record<UserRole, { label: string; cls: string }> = {
  superadmin: { label: "Super Admin", cls: "badge-red"    },
  admin:      { label: "Admin",       cls: "badge-orange" },
  team:       { label: "Team",        cls: "badge-blue"   },
}

const STATUS_BADGE: Record<UserStatus, { label: string; cls: string }> = {
  active:         { label: "Active",          cls: "badge-green"  },
  disabled:       { label: "Disabled",        cls: "badge-red"    },
  pending_reset:  { label: "Pending Reset",   cls: "badge-orange" },
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      style={{ background: "none", border: "none", cursor: "pointer", color: copied ? "var(--success)" : "var(--text-3)", display: "flex", alignItems: "center", padding: 0 }}>
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  )
}

export default function UsersPage() {
  const [users, setUsers]         = useState<PublicUser[]>([])
  const [loading, setLoading]     = useState(true)
  const [section, setSection]     = useState<Section>("users")
  const [myRole, setMyRole]       = useState<UserRole>("team")
  const [myId, setMyId]           = useState<string>("")

  // Create form
  const [cfName, setCfName]       = useState("")
  const [cfUser, setCfUser]       = useState("")
  const [cfEmail, setCfEmail]     = useState("")
  const [cfRole, setCfRole]       = useState<UserRole>("team")
  const [cfPwd, setCfPwd]         = useState("")
  const [cfShowPwd, setCfShowPwd] = useState(false)
  const [cfBusy, setCfBusy]       = useState(false)
  const [cfError, setCfError]     = useState("")
  const [created, setCreated]     = useState<{ username: string; password: string } | null>(null)

  // Action modals
  const [confirm, setConfirm]     = useState<{ user: PublicUser; action: "disable" | "enable" | "reset" | "delete" } | null>(null)
  const [resetPwd, setResetPwd]   = useState("")
  const [actionBusy, setActionBusy] = useState(false)
  const [actionMsg, setActionMsg] = useState("")

  // My Account modal (superadmin self-edit)
  const [showAccount, setShowAccount] = useState(false)
  const [acUsername, setAcUsername]   = useState("")
  const [acPwd, setAcPwd]             = useState("")
  const [acPwdShow, setAcPwdShow]     = useState(false)
  const [acBusy, setAcBusy]           = useState(false)
  const [acMsg, setAcMsg]             = useState("")
  const [acSuccess, setAcSuccess]     = useState("")

  const loadUsers = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/users").catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setUsers(data.users)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => { if (d?.user) { setMyRole(d.user.role); setMyId(d.user.id) } })
  }, [loadUsers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCfError("")
    if (!cfName || !cfUser || !cfEmail || !cfPwd) { setCfError("All fields required"); return }
    setCfBusy(true)
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: cfName, username: cfUser, email: cfEmail, role: cfRole, password: cfPwd }),
    }).catch(() => null)
    setCfBusy(false)
    if (!res) { setCfError("Network error"); return }
    const data = await res.json()
    if (!res.ok) { setCfError(data.error ?? "Failed"); return }
    // Optimistically insert the new user immediately from the response
    if (data.user) setUsers(prev => [...prev, data.user])
    setCreated({ username: cfUser, password: cfPwd })
    setCfName(""); setCfUser(""); setCfEmail(""); setCfRole("team"); setCfPwd("")
    // Background refresh to sync any server-side ordering
    loadUsers()
  }

  async function executeAction() {
    if (!confirm) return
    setActionBusy(true)
    setActionMsg("")
    let res: Response | null = null

    if (confirm.action === "disable") {
      res = await fetch(`/api/users/${confirm.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disabled" }),
      }).catch(() => null)
    } else if (confirm.action === "enable") {
      res = await fetch(`/api/users/${confirm.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      }).catch(() => null)
    } else if (confirm.action === "reset") {
      if (!resetPwd || resetPwd.length < 4) { setActionMsg("Password must be at least 4 characters"); setActionBusy(false); return }
      res = await fetch(`/api/users/${confirm.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reset_password: resetPwd }),
      }).catch(() => null)
    } else if (confirm.action === "delete") {
      res = await fetch(`/api/users/${confirm.user.id}`, { method: "DELETE" }).catch(() => null)
    }

    setActionBusy(false)
    if (!res?.ok) {
      const d = await res?.json().catch(() => ({}))
      setActionMsg(d?.error ?? "Action failed")
      return
    }
    if (confirm.action === "delete") {
      setUsers(prev => prev.filter(u => u.id !== confirm.user.id))
      setConfirm(null)
      return
    }
    // Update the affected user in state directly from the response
    const updated = await res.json().catch(() => null)
    if (updated?.user) {
      setUsers(prev => prev.map(u => u.id === updated.user.id ? updated.user : u))
    }
    setConfirm(null)
    setResetPwd("")
  }

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault()
    setAcBusy(true); setAcMsg(""); setAcSuccess("")
    const updates: Record<string, string> = {}
    if (acUsername.trim()) updates.new_username = acUsername.trim()
    if (acPwd)             updates.new_password = acPwd
    if (!updates.new_username && !updates.new_password) { setAcMsg("Enter a new password"); setAcBusy(false); return }

    let lastError = ""
    if (updates.new_username) {
      const r = await fetch(`/api/users/${myId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_username: updates.new_username }) }).catch(() => null)
      if (!r?.ok) { const d = await r?.json().catch(() => ({})); lastError = d?.error ?? "Failed to update username" }
    }
    if (updates.new_password) {
      const r = await fetch(`/api/users/${myId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ new_password: updates.new_password }) }).catch(() => null)
      if (!r?.ok) { const d = await r?.json().catch(() => ({})); lastError = d?.error ?? "Failed to update password" }
    }
    setAcBusy(false)
    if (lastError) { setAcMsg(lastError); return }
    setAcSuccess("Account updated successfully")
    setAcUsername(""); setAcPwd("")
    loadUsers()
  }

  const active   = users.filter(u => u.status === "active").length
  const disabled = users.filter(u => u.status === "disabled").length
  const admins   = users.filter(u => u.role === "admin" || u.role === "superadmin").length

  return (
    <div style={{ padding: "24px 28px", maxWidth: 1300, margin: "0 auto" }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 22, display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="g-label" style={{ marginBottom: 5, color: "var(--text-brand)" }}>System · User Management</div>
          <h1 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-1)", margin: 0 }}>User Management</h1>
          <p style={{ color: "var(--text-3)", fontSize: 12, marginTop: 5 }}>{users.length} users · {active} active · {disabled} disabled</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-ghost" style={{ fontSize: 11 }} onClick={loadUsers}><RefreshCw size={12} /> Refresh</button>
          {(myRole === "superadmin" || myRole === "admin") && (
            <button className="btn-ghost" style={{ fontSize: 11 }} onClick={() => { setShowAccount(true); setAcUsername(""); setAcPwd(""); setAcMsg(""); setAcSuccess("") }}>
              <Settings size={12} /> My Account
            </button>
          )}
          {(myRole === "superadmin" || myRole === "admin") && (
            <button className="btn-gold" style={{ fontSize: 11 }} onClick={() => setSection(s => s === "create" ? "users" : "create")}>
              <UserPlus size={13} /> {section === "create" ? "View Users" : "Create User"}
            </button>
          )}
        </div>
      </motion.div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total Users",   value: users.length, color: "#60A5FA", icon: <Users size={15} /> },
          { label: "Active",        value: active,       color: "#4ADE80", icon: <CheckCircle size={15} /> },
          { label: "Admins",        value: admins,       color: "#C9A24B", icon: <Shield size={15} /> },
          { label: "Disabled",      value: disabled,     color: "#F87171", icon: <Lock size={15} /> },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="kpi-card">
            <div style={{ position: "absolute", top: 0, left: 0, width: 36, height: 2.5, background: k.color, borderRadius: "18px 0 3px 0" }} />
            <div style={{ width: 32, height: 32, borderRadius: 9, background: `${k.color}18`, border: `1px solid ${k.color}30`, display: "flex", alignItems: "center", justifyContent: "center", color: k.color, marginBottom: 10 }}>{k.icon}</div>
            <div className="g-label" style={{ marginBottom: 3 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>{k.value}</div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* Create Form */}
        {section === "create" && (
          <motion.div key="create" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="panel" style={{ maxWidth: 520 }}>
            <div className="g-label" style={{ marginBottom: 16 }}>New User</div>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {[
                { label: "Full Name",    value: cfName,  set: setCfName,  ph: "e.g. Arjun Mehta",         type: "text"  },
                { label: "Username",     value: cfUser,  set: setCfUser,  ph: "e.g. arjun_mehta",         type: "text"  },
                { label: "Email",        value: cfEmail, set: setCfEmail, ph: "arjun@muj.manipal.edu",    type: "email" },
              ].map(f => (
                <div key={f.label}>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>{f.label}</label>
                  <input className="g-input" type={f.type} value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Role</label>
                <select className="g-input" value={cfRole} onChange={e => setCfRole(e.target.value as UserRole)}
                  style={{ appearance: "none", cursor: "pointer" }}>
                  <option value="team">Team Member</option>
                  {(myRole === "superadmin" || myRole === "admin") && <option value="admin">Admin</option>}
                  {myRole === "superadmin" && <option value="superadmin">Super Admin</option>}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 5 }}>Temporary Password</label>
                <div style={{ position: "relative" }}>
                  <input className="g-input" type={cfShowPwd ? "text" : "password"} value={cfPwd} onChange={e => setCfPwd(e.target.value)}
                    placeholder="Min 4 characters" style={{ paddingRight: 40 }} />
                  <button type="button" onClick={() => setCfShowPwd(p => !p)}
                    style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex" }}>
                    {cfShowPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {cfError && (
                <div style={{ padding: "9px 13px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--danger)" }}>
                  {cfError}
                </div>
              )}

              <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                <button type="button" className="btn-ghost" style={{ fontSize: 11 }} onClick={() => setSection("users")}>Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn-gold" style={{ fontSize: 11, flex: 1, justifyContent: "center" }} disabled={cfBusy}>
                  {cfBusy ? "Creating…" : "Create User"}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Users Table */}
        {section === "users" && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--brand-edge)" }}>
              <div className="g-label">All Users</div>
            </div>

            {loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>Loading…</div>
            ) : users.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                <Users size={28} strokeWidth={1} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                No users found
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="g-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Created</th>
                      {(myRole === "superadmin" || myRole === "admin") && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(201,162,75,0.15)", border: "1px solid rgba(201,162,75,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#C9A24B" }}>
                              {u.name.charAt(0)}
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)" }}>{u.name}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: 11, color: "#C9A24B", fontFamily: "monospace" }}>{u.username}</td>
                        <td style={{ fontSize: 11, color: "var(--text-3)" }}>{u.email}</td>
                        <td><span className={`badge ${ROLE_BADGE[u.role].cls}`} style={{ fontSize: 9 }}>{ROLE_BADGE[u.role].label}</span></td>
                        <td><span className={`badge ${STATUS_BADGE[u.status].cls}`} style={{ fontSize: 9 }}>{STATUS_BADGE[u.status].label}</span></td>
                        <td style={{ fontSize: 10, color: "var(--text-3)" }}>{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                        {(myRole === "superadmin" || myRole === "admin") && (
                          <td>
                            {(() => {
                              const isSelf = u.id === myId
                              const canReset = !isSelf && (myRole === "superadmin" ? u.role !== "superadmin" : u.role === "team")
                              const canToggle = !isSelf && (myRole === "superadmin" ? u.role !== "superadmin" : u.role === "team")
                              const canDelete = !isSelf && (myRole === "superadmin" || (myRole === "admin" && u.role === "team"))
                              if (!canReset && !canToggle && !canDelete) return null
                              return (
                                <div style={{ display: "flex", gap: 6 }}>
                                  {canReset && (
                                    <button className="btn-ghost" style={{ padding: "4px 10px", fontSize: 10 }}
                                      onClick={() => { setConfirm({ user: u, action: "reset" }); setResetPwd(""); setActionMsg("") }}>
                                      <RefreshCw size={10} /> Reset Pwd
                                    </button>
                                  )}
                                  {canToggle && (
                                    <button className={u.status === "disabled" ? "btn-gold" : "btn-ghost"} style={{ padding: "4px 10px", fontSize: 10 }}
                                      onClick={() => { setConfirm({ user: u, action: u.status === "disabled" ? "enable" : "disable" }); setActionMsg("") }}>
                                      {u.status === "disabled" ? <Unlock size={10} /> : <Lock size={10} />}
                                      {u.status === "disabled" ? "Enable" : "Disable"}
                                    </button>
                                  )}
                                  {canDelete && (
                                    <button className="btn-danger" style={{ padding: "4px 10px", fontSize: 10 }}
                                      onClick={() => { setConfirm({ user: u, action: "delete" }); setActionMsg("") }}>
                                      <Trash2 size={10} /> Delete
                                    </button>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Created success modal */}
      <AnimatePresence>
        {created && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setCreated(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="panel" style={{ width: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <CheckCircle size={32} color="var(--success)" style={{ margin: "0 auto 10px" }} />
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--success)" }}>User Created</div>
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>Save these credentials — the password will not be shown again</div>
              </div>
              {[
                { label: "Username", value: created.username },
                { label: "Password", value: created.password },
              ].map(f => (
                <div key={f.label} style={{ marginBottom: 10, padding: "13px 15px", background: "rgba(0,0,0,0.35)", border: "1px solid var(--brand-edge)", borderRadius: "var(--r-md)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 9, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{f.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#C9A24B", fontFamily: "monospace" }}>{f.value}</div>
                  </div>
                  <CopyBtn text={f.value} />
                </div>
              ))}
              <button className="btn-gold" style={{ width: "100%", justifyContent: "center", marginTop: 6 }} onClick={() => setCreated(null)}>
                I've saved the credentials
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action confirm modal */}
      <AnimatePresence>
        {confirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setConfirm(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="panel" style={{ width: 400, padding: 26 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-start" }}>
                <AlertTriangle size={20} color={confirm.action === "disable" || confirm.action === "delete" ? "var(--danger)" : "#C9A24B"} style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                    {confirm.action === "disable" ? "Disable Account?" : confirm.action === "enable" ? "Enable Account?" : confirm.action === "delete" ? "Delete Account?" : "Reset Password?"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>
                    {confirm.user.name} · {confirm.user.username}
                  </div>
                  {confirm.action === "delete" && (
                    <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 6 }}>This action is permanent and cannot be undone.</div>
                  )}
                </div>
              </div>

              {confirm.action === "reset" && (
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>New Password</label>
                  <input className="g-input" type="text" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="Min 4 characters" autoFocus />
                </div>
              )}

              {actionMsg && (
                <div style={{ marginBottom: 12, padding: "8px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--danger)" }}>
                  {actionMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-ghost" onClick={() => setConfirm(null)} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>Cancel</button>
                <button
                  className={confirm.action === "disable" || confirm.action === "delete" ? "btn-danger" : "btn-gold"}
                  onClick={executeAction}
                  disabled={actionBusy}
                  style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>
                  {actionBusy ? "Working…" : confirm.action === "disable" ? "Disable" : confirm.action === "enable" ? "Enable" : confirm.action === "delete" ? "Delete" : "Reset"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* My Account modal */}
      <AnimatePresence>
        {showAccount && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(10px)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowAccount(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }}
              className="panel" style={{ width: 420, padding: 28 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(201,162,75,0.15)", border: "1px solid rgba(201,162,75,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Settings size={16} color="#C9A24B" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-1)" }}>My Account</div>
                  <div style={{ fontSize: 11, color: "var(--text-3)" }}>Change your username or password</div>
                </div>
              </div>

              <form onSubmit={handleAccount} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {myRole === "superadmin" && (
                  <div>
                    <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>New Username</label>
                    <input className="g-input" type="text" value={acUsername} onChange={e => setAcUsername(e.target.value)} placeholder="Leave blank to keep current" />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 9, color: "var(--text-3)", letterSpacing: "0.09em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>New Password</label>
                  <div style={{ position: "relative" }}>
                    <input className="g-input" type={acPwdShow ? "text" : "password"} value={acPwd} onChange={e => setAcPwd(e.target.value)} placeholder="Leave blank to keep current" style={{ paddingRight: 40 }} />
                    <button type="button" onClick={() => setAcPwdShow(p => !p)}
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-3)", cursor: "pointer", display: "flex" }}>
                      {acPwdShow ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {acMsg && (
                  <div style={{ padding: "8px 12px", background: "var(--danger-bg)", border: "1px solid var(--danger-edge)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--danger)" }}>{acMsg}</div>
                )}
                {acSuccess && (
                  <div style={{ padding: "8px 12px", background: "var(--success-bg)", border: "1px solid var(--success-edge)", borderRadius: "var(--r-sm)", fontSize: 12, color: "var(--success)", display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={13} /> {acSuccess}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
                  <button type="button" className="btn-ghost" style={{ flex: 1, justifyContent: "center", fontSize: 11 }} onClick={() => setShowAccount(false)}>Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" className="btn-gold" disabled={acBusy} style={{ flex: 1, justifyContent: "center", fontSize: 11 }}>
                    {acBusy ? "Saving…" : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
