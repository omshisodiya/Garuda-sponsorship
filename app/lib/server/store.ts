import { hashPassword } from "./auth"

export type UserRole   = "superadmin" | "admin" | "team"
export type UserStatus = "active" | "disabled" | "pending_reset"

export type User = {
  id:            string
  username:      string
  name:          string
  email:         string
  role:          UserRole
  status:        UserStatus
  password_hash: string
  created_by:    string | null
  created_at:    string
  force_reset:   boolean
}

export type AuditEntry = {
  id:         string
  actor_id:   string
  actor_name: string
  action:     string
  target_id:  string | null
  detail:     string
  ts:         string
}

// ── Seed data — hashed at module load time ──────────────────────────────────
// Credentials: Om_9999/9999  Vatsal_5555/5555  Team_2222/2222
const SEED: Omit<User, "password_hash">[] = [
  { id: "u1", username: "Om_9999",    name: "Om Shisodiya",      email: "omshisodiya2603@gmail.com", role: "superadmin", status: "active",  created_by: null,  created_at: "2026-01-01T00:00:00Z", force_reset: false },
  { id: "u2", username: "Vatsal_5555",name: "Vatsal Sharma",     email: "vatsal@muj.manipal.edu",    role: "admin",      status: "active",  created_by: "u1",  created_at: "2026-01-01T00:00:00Z", force_reset: false },
  { id: "u3", username: "Jivaansh",   name: "Jivaansh Chandna",  email: "jivaansh@muj.manipal.edu",  role: "admin",      status: "active",  created_by: "u1",  created_at: "2026-01-01T00:00:00Z", force_reset: false },
  { id: "u4", username: "Harshvardhan",name:"Harshvardhan Singh", email: "harsh@muj.manipal.edu",     role: "admin",      status: "active",  created_by: "u1",  created_at: "2026-01-01T00:00:00Z", force_reset: false },
  { id: "u5", username: "Team_2222",  name: "Ridhi Sharma",      email: "ridhi@muj.manipal.edu",     role: "team",       status: "active",  created_by: "u2",  created_at: "2026-01-02T00:00:00Z", force_reset: false },
  { id: "u6", username: "Rashiv",     name: "Rashiv Saran",      email: "rashiv@muj.manipal.edu",    role: "team",       status: "active",  created_by: "u2",  created_at: "2026-01-02T00:00:00Z", force_reset: false },
  { id: "u7", username: "Reet",       name: "Reet Rahul Bhanushali", email: "reet@muj.manipal.edu", role: "team",       status: "active",  created_by: "u2",  created_at: "2026-01-02T00:00:00Z", force_reset: false },
  { id: "u8", username: "Inesh",      name: "Inesh Goyal",       email: "inesh@muj.manipal.edu",     role: "team",       status: "active",  created_by: "u2",  created_at: "2026-01-02T00:00:00Z", force_reset: false },
  { id: "u9", username: "Anvi",       name: "Anvi Singla",       email: "anvi@muj.manipal.edu",      role: "team",       status: "active",  created_by: "u2",  created_at: "2026-01-02T00:00:00Z", force_reset: false },
  { id: "u10",username: "Kushagrah",  name: "Kushagrah Singh",   email: "kushagrah@muj.manipal.edu", role: "team",       status: "active",  created_by: "u2",  created_at: "2026-01-02T00:00:00Z", force_reset: false },
]

const SEED_PASSWORDS: Record<string, string> = {
  u1: "9999", u2: "5555", u3: "2222", u4: "2222",
  u5: "2222", u6: "2222", u7: "2222", u8: "2222", u9: "2222", u10: "2222",
}

function buildStore(): Map<string, User> {
  const m = new Map<string, User>()
  for (const s of SEED) {
    m.set(s.id, { ...s, password_hash: hashPassword(SEED_PASSWORDS[s.id] ?? "changeme") })
  }
  return m
}

// Module-level singleton (persists across hot-reloads in dev via globalThis)
declare global {
  // eslint-disable-next-line no-var
  var __garuda_users: Map<string, User> | undefined
  // eslint-disable-next-line no-var
  var __garuda_audit: AuditEntry[]     | undefined
}

const USERS: Map<string, User> = globalThis.__garuda_users ?? buildStore()
const AUDIT: AuditEntry[]      = globalThis.__garuda_audit  ?? []
globalThis.__garuda_users = USERS
globalThis.__garuda_audit = AUDIT

let _uidCounter = USERS.size + 1
function newId() { return `u${++_uidCounter}` }
function nowISO() { return new Date().toISOString() }

// ── Read ─────────────────────────────────────────────────────────────────────
export function getUserById(id: string): User | null {
  return USERS.get(id) ?? null
}

export function getUserByUsername(username: string): User | null {
  for (const u of USERS.values()) {
    if (u.username.toLowerCase() === username.toLowerCase()) return u
  }
  return null
}

export function getAllUsers(): User[] {
  return [...USERS.values()].sort((a, b) => a.created_at.localeCompare(b.created_at))
}

// ── Write ─────────────────────────────────────────────────────────────────────
export type CreateUserInput = {
  username:    string
  name:        string
  email:       string
  role:        UserRole
  password:    string
  created_by:  string
}

export function createUser(input: CreateUserInput): User {
  if (getUserByUsername(input.username)) {
    throw new Error(`Username "${input.username}" is already taken`)
  }
  const user: User = {
    id:            newId(),
    username:      input.username,
    name:          input.name,
    email:         input.email,
    role:          input.role,
    status:        "active",
    password_hash: hashPassword(input.password),
    created_by:    input.created_by,
    created_at:    nowISO(),
    force_reset:   true,
  }
  USERS.set(user.id, user)
  return user
}

export function updateUserStatus(id: string, status: UserStatus): User | null {
  const u = USERS.get(id)
  if (!u) return null
  const updated = { ...u, status }
  USERS.set(id, updated)
  return updated
}

export function updateUserRole(id: string, role: UserRole): User | null {
  const u = USERS.get(id)
  if (!u) return null
  const updated = { ...u, role }
  USERS.set(id, updated)
  return updated
}

export function resetPassword(id: string, newPassword: string): User | null {
  const u = USERS.get(id)
  if (!u) return null
  const updated = { ...u, password_hash: hashPassword(newPassword), force_reset: true, status: "pending_reset" as UserStatus }
  USERS.set(id, updated)
  return updated
}

export function changePassword(id: string, newPassword: string): User | null {
  const u = USERS.get(id)
  if (!u) return null
  const updated = { ...u, password_hash: hashPassword(newPassword), force_reset: false, status: "active" as UserStatus }
  USERS.set(id, updated)
  return updated
}

export function deleteUser(id: string): boolean {
  return USERS.delete(id)
}

export function updateUsername(id: string, username: string): User | null {
  const u = USERS.get(id)
  if (!u) return null
  const updated = { ...u, username }
  USERS.set(id, updated)
  return updated
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export function addAudit(entry: Omit<AuditEntry, "id" | "ts">) {
  AUDIT.unshift({ ...entry, id: crypto.randomUUID(), ts: nowISO() })
  if (AUDIT.length > 500) AUDIT.length = 500
}

export function getAudit(limit = 50): AuditEntry[] {
  return AUDIT.slice(0, limit)
}

// ── Safe public shape (no password_hash) ─────────────────────────────────────
export type PublicUser = Omit<User, "password_hash">
export function toPublic(u: User): PublicUser {
  const { password_hash: _, ...rest } = u
  return rest
}
