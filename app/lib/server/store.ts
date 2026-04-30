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
// Superadmin: Om / 9999 (no force_reset)
// All others: default password 1234, force_reset: true
const SEED: Omit<User, "password_hash">[] = [
  // ── Superadmin ──────────────────────────────────────────────────────────
  { id: "u1",  username: "Om_9999",         name: "Om Shisodiya",            email: "omshisodiya2603@gmail.com",           role: "superadmin", status: "active", created_by: null, created_at: "2026-01-01T00:00:00Z", force_reset: false },
  // ── Admin — Executive Committee ─────────────────────────────────────────
  { id: "u2",  username: "Vatsal_VC",        name: "Vatsal Sharma",           email: "vatsal.2427030235@muj.manipal.edu",   role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u3",  username: "Kushagrah_GS",     name: "Kushagrah Singh",         email: "kushagrah.2430010462@muj.manipal.edu",role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u4",  username: "Harshvardhan_OD",  name: "Harshvardhan Singh",      email: "harsh.2428020040@muj.manipal.edu",    role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u5",  username: "Ridhi_OD",         name: "Ridhi Sharma",            email: "ridhi.2425060051@muj.manipal.edu",    role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u6",  username: "Rashiv_CD",        name: "Rashiv Saran",            email: "rashiv.2430010518@muj.manipal.edu",   role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u7",  username: "Reet_CS",          name: "Reet Rahul Bhanushali",   email: "reet.2427010105@muj.manipal.edu",     role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u8",  username: "Inesh_TS",         name: "Inesh Goyal",             email: "Inesh.2427010416@muj.manipal.edu",    role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u9",  username: "Anvi_T",           name: "Anvi Singla",             email: "anvi.2427030713@muj.manipal.edu",     role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u10", username: "Vansh_CO",         name: "Vansh Nandan",            email: "vansh.2428010080@muj.manipal.edu",    role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u11", username: "Lakshya_DE",       name: "Lakshya Thakur",          email: "lakshay.2430010416@muj.manipal.edu",  role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u12", username: "Shambhavi_DFnR",   name: "Shambhavi Singh",         email: "shambhavi.2430030177@muj.manipal.edu",role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u13", username: "Arpit_DPR",        name: "Arpit Srivastava",        email: "arpit.2425060004@muj.manipal.edu",    role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u14", username: "Kunj_DSM",         name: "Kunj Kumar",              email: "Kunj.2427010097@muj.manipal.edu",     role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u15", username: "Shaurya_EIC",      name: "Shaurya Sharma",          email: "shaurya.2427010162@muj.manipal.edu",  role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u16", username: "Ujjawal_TD",       name: "Ujjawal Chaudhary",       email: "Ujjawal.2427010084@muj.manipal.edu",  role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Admin — Executive Associates ────────────────────────────────────────
  { id: "u17", username: "Vedhitha_EA",      name: "Vedhitha Hariharan Iyer", email: "vedhitha.2503030030@muj.manipal.edu", role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u18", username: "Aneek_EA",         name: "Aneek Dutta",             email: "aneek.2502052532@muj.manipal.edu",    role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u19", username: "Sairam_EA",        name: "Sai Ram Kathik Varma",    email: "saripalli.2503130056@muj.manipal.edu",role: "admin", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Operations ───────────────────────────────────────────────────
  { id: "u20", username: "Piyush_HO",        name: "Piyush Khaitan",          email: "piyush.2502052880@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u21", username: "Palak_JHO",        name: "Palak Gupta",             email: "palak.2502052086@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u22", username: "Ritwika_JHO",      name: "Ritwika Verma",           email: "ritwika.2503120029@muj.manipal.edu",  role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u23", username: "Risham_OT",        name: "Risham Kumar",            email: "risham.2502050964@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u24", username: "Kushagra_OT",      name: "Kushagra Sharma",         email: "kushagra.2502052307@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u25", username: "Eshaan_OT",        name: "Eshaan Sharma",           email: "eshaan.2503090045@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u26", username: "Adarsh_OT",        name: "Adarsh Kumar",            email: "adarsh.2502050073@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u27", username: "Manit_OT",         name: "Manit Garg",              email: "manit.2503070025@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u28", username: "Aman_OT",          name: "Aman Kumar Tiwari",       email: "aman.2502051471@muj.manipal.edu",     role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Events ───────────────────────────────────────────────────────
  { id: "u29", username: "NV_HE",            name: "N.V. Vitul",              email: "n.2502051285@muj.manipal.edu",         role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u30", username: "Angel_JHE",        name: "Angel",                   email: "angel.2502050547@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u31", username: "Bhavya_JHE",       name: "Bhavya Shukla",           email: "bhavya.2502052421@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u32", username: "Aaradhya_ET",      name: "Aaradhya Sharma",         email: "aaradhya.2502052882@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u33", username: "Yogit_ET",         name: "Yogit",                   email: "Yogit.2507020078@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u34", username: "BhavyaG_ET",       name: "Bhavya Gupta",            email: "bhavya.2502050027@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u35", username: "Sagnik_ET",        name: "Sagnik Kumar Dey",        email: "sagnik.2502051989@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Logistics ────────────────────────────────────────────────────
  { id: "u36", username: "Arya_HL",          name: "Arya Paida",              email: "arya.2502052138@muj.manipal.edu",     role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u37", username: "Tanmay_JHL",       name: "Tanmay Kukreja",          email: "tanmay.2507010112@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u38", username: "Atharva_JHL",      name: "Atharva Srivastava",      email: "atharva.2502051171@muj.manipal.edu",  role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Marketing ────────────────────────────────────────────────────
  { id: "u39", username: "Anshika_MT",       name: "Anshika Agarwal",         email: "anshika.2503120016@muj.manipal.edu",  role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u40", username: "Krati_MT",         name: "Krati Arora",             email: "krati.2505060026@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u41", username: "Pragya_MT",        name: "Pragya Sinha",            email: "pragya.2503030071@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u42", username: "Dhruv_MT",         name: "Dhruv Talwar",            email: "dhruv.2502050098@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u43", username: "Kanishka_MT",      name: "Kanishka",                email: "Kanishka.2502050297@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u44", username: "Samridhi_MT",      name: "Samridhi Choraria",       email: "samridhi.2503120054@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u45", username: "Presha_MT",        name: "Presha Gusain",           email: "presha.2503020049@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u46", username: "Aradhya_MT",       name: "Aradhya",                 email: "aradhya.2502051816@muj.manipal.edu",  role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Technical ────────────────────────────────────────────────────
  { id: "u47", username: "Prisha_TT",        name: "Prisha Mittal",           email: "prisha.2502052597@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u48", username: "Devanshu_TT",      name: "Devanshu Yadav",          email: "devanshu.2502051088@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u49", username: "Bhumi_TT",         name: "Bhumi Shrivastav",        email: "Bhumi.2502052497@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Editorial ────────────────────────────────────────────────────
  { id: "u50", username: "Sharanya_EDT",     name: "Sharanya Shetty",         email: "sharanya.2502051901@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u51", username: "Mayank_EDT",       name: "Mayank Singh",            email: "mayank.2506030032@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — FnR (Finance & Resources) ────────────────────────────────────
  { id: "u52", username: "Akula_HFnR",       name: "Akula Shashank",          email: "akula.2502052468@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u53", username: "Aayush_JHFnR",     name: "Aayush Thakur",           email: "aayush.2506010188@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u54", username: "Swwastik_JHFnR",   name: "Swwastik Jain",           email: "swwastik.2503120082@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Social Media ─────────────────────────────────────────────────
  { id: "u55", username: "Jivaansh_HS",      name: "Jivaansh Chandna",        email: "jivaansh.2502051716@muj.manipal.edu", role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u56", username: "Rashi_SMT",        name: "Rashi Singh",             email: "rashi.2504010040@muj.manipal.edu",    role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u57", username: "Gaadha_SMT",       name: "Gaadha Amal Nair",        email: "gaadha.2503030046@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u58", username: "Shubham_SMT",      name: "Shubham Jain",            email: "shubham.2502051213@muj.manipal.edu",  role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u59", username: "Sarika_SMT",       name: "Sarika Kashyap",          email: "sarika.2506020042@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  // ── Team — Graphic Design ───────────────────────────────────────────────
  { id: "u60", username: "Anvi_GDT",         name: "Anvi Jindal",             email: "anvi.2502050984@muj.manipal.edu",     role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u61", username: "Tavishii_GDT",     name: "Tavishii",                email: "tavishi.2502050570@muj.manipal.edu",  role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
  { id: "u62", username: "Shivam_GDT",       name: "Shivam Kumar",            email: "shivam.2503030079@muj.manipal.edu",   role: "team", status: "active", created_by: "u1", created_at: "2026-01-01T00:00:00Z", force_reset: true },
]

const SEED_PASSWORDS: Record<string, string> = {
  u1: "9999",
  u2: "1234", u3: "1234", u4: "1234", u5: "1234", u6: "1234",
  u7: "1234", u8: "1234", u9: "1234", u10: "1234", u11: "1234",
  u12: "1234", u13: "1234", u14: "1234", u15: "1234", u16: "1234",
  u17: "1234", u18: "1234", u19: "1234", u20: "1234", u21: "1234",
  u22: "1234", u23: "1234", u24: "1234", u25: "1234", u26: "1234",
  u27: "1234", u28: "1234", u29: "1234", u30: "1234", u31: "1234",
  u32: "1234", u33: "1234", u34: "1234", u35: "1234", u36: "1234",
  u37: "1234", u38: "1234", u39: "1234", u40: "1234", u41: "1234",
  u42: "1234", u43: "1234", u44: "1234", u45: "1234", u46: "1234",
  u47: "1234", u48: "1234", u49: "1234", u50: "1234", u51: "1234",
  u52: "1234", u53: "1234", u54: "1234", u55: "1234", u56: "1234",
  u57: "1234", u58: "1234", u59: "1234", u60: "1234", u61: "1234",
  u62: "1234",
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
