import { db, type Row } from "./db"
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

// ── DB init (idempotent — runs CREATE TABLE IF NOT EXISTS on every cold start) ──
let initPromise: Promise<void> | null = null
function ensureInit(): Promise<void> {
  if (!initPromise) initPromise = _init()
  return initPromise
}

async function _init(): Promise<void> {
  const sql = db()

  await sql`
    CREATE TABLE IF NOT EXISTS garuda_users (
      id            TEXT PRIMARY KEY,
      username      TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      email         TEXT NOT NULL,
      role          TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'active',
      password_hash TEXT NOT NULL,
      created_by    TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
      force_reset   BOOLEAN NOT NULL DEFAULT TRUE
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS garuda_audit (
      id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      actor_id   TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      action     TEXT NOT NULL,
      target_id  TEXT,
      detail     TEXT NOT NULL,
      ts         TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS garuda_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `

  const countRows = await sql`SELECT COUNT(*)::int AS count FROM garuda_users`
  const count = (countRows[0]?.count as number) ?? 0
  if (count === 0) {
    await _seed()
  }
}

// ── Seed (runs once when garuda_users is empty) ──────────────────────────────
async function _seed(): Promise<void> {
  const sql = db()
  const CREATED_AT = "2026-01-01T00:00:00.000Z"
  const P_SUPER    = hashPassword("9999")
  const P_DEFAULT  = hashPassword("1234")

  type SeedUser = {
    id: string; username: string; name: string; email: string
    role: string; created_by: string | null; password_hash: string; force_reset: boolean
  }

  const members: SeedUser[] = [
    // ── Superadmin ─────────────────────────────────────────────────────────
    { id:"u1",  username:"Om_9999",         name:"Om Shisodiya",            email:"omshisodiya2603@gmail.com",            role:"superadmin", created_by:null,  password_hash:P_SUPER,   force_reset:false },
    // ── Admin — Executive Committee ────────────────────────────────────────
    { id:"u2",  username:"vatsal_vc",        name:"Vatsal Sharma",           email:"vatsal.2427030235@muj.manipal.edu",    role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u3",  username:"kushagrah_gs",     name:"Kushagrah Singh",         email:"kushagrah.2430010462@muj.manipal.edu", role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u4",  username:"harshvardhan_od",  name:"Harshvardhan Singh",      email:"harsh.2428020040@muj.manipal.edu",     role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u5",  username:"ridhi_od",         name:"Ridhi Sharma",            email:"ridhi.2425060051@muj.manipal.edu",     role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u6",  username:"rashiv_cd",        name:"Rashiv Saran",            email:"rashiv.2430010518@muj.manipal.edu",    role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u7",  username:"reet_cs",          name:"Reet Rahul Bhanushali",   email:"reet.2427010105@muj.manipal.edu",      role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u8",  username:"inesh_ts",         name:"Inesh Goyal",             email:"inesh.2427010416@muj.manipal.edu",     role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u9",  username:"anvi_t",           name:"Anvi Singla",             email:"anvi.2427030713@muj.manipal.edu",      role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Admin — Board of Directors ─────────────────────────────────────────
    { id:"u10", username:"vansh_co",         name:"Vansh Nandan",            email:"vansh.2428010080@muj.manipal.edu",     role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u11", username:"lakshya_de",       name:"Lakshya Thakur",          email:"lakshay.2430010416@muj.manipal.edu",   role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u12", username:"shambhavi_dfnr",   name:"Shambhavi Singh",         email:"shambhavi.2430030177@muj.manipal.edu", role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u13", username:"arpit_dpr",        name:"Arpit Srivastava",        email:"arpit.2425060004@muj.manipal.edu",     role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u14", username:"kunj_dsm",         name:"Kunj Kumar",              email:"kunj.2427010097@muj.manipal.edu",      role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u15", username:"shaurya_eic",      name:"Shaurya Sharma",          email:"shaurya.2427010162@muj.manipal.edu",   role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u16", username:"ujjawal_td",       name:"Ujjawal Chaudhary",       email:"ujjawal.2427010084@muj.manipal.edu",   role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Admin — Executive Associates ───────────────────────────────────────
    { id:"u17", username:"vedhitha_ea",      name:"Vedhitha Hariharan Iyer", email:"vedhitha.2503030030@muj.manipal.edu",  role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u18", username:"aneek_ea",         name:"Aneek Dutta",             email:"aneek.2502052532@muj.manipal.edu",     role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u19", username:"sairam_ea",        name:"Sai Ram Kathik Varma",    email:"saripalli.2503130056@muj.manipal.edu", role:"admin",      created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Operations ──────────────────────────────────────────────────
    { id:"u20", username:"piyush_ho",        name:"Piyush Khaitan",          email:"piyush.2502052880@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u21", username:"palak_jho",        name:"Palak Gupta",             email:"palak.2502052086@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u22", username:"ritwika_jho",      name:"Ritwika Verma",           email:"ritwika.2503120029@muj.manipal.edu",   role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u23", username:"risham_ot",        name:"Risham Kumar",            email:"risham.2502050964@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u24", username:"kushagra_ot",      name:"Kushagra Sharma",         email:"kushagra.2502052307@muj.manipal.edu",  role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u25", username:"eshaan_ot",        name:"Eshaan Sharma",           email:"eshaan.2503090045@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u26", username:"adarsh_ot",        name:"Adarsh Kumar",            email:"adarsh.2502050073@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u27", username:"manit_ot",         name:"Manit Garg",              email:"manit.2503070025@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u28", username:"aman_ot",          name:"Aman Kumar Tiwari",       email:"aman.2502051471@muj.manipal.edu",      role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Events ──────────────────────────────────────────────────────
    { id:"u29", username:"nv_he",            name:"N.V. Vitul",              email:"n.2502051285@muj.manipal.edu",          role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u30", username:"angel_jhe",        name:"Angel",                   email:"angel.2502050547@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u31", username:"bhavya_jhe",       name:"Bhavya Shukla",           email:"bhavya.2502052421@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u32", username:"aaradhya_et",      name:"Aaradhya Sharma",         email:"aaradhya.2502052882@muj.manipal.edu",  role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u33", username:"yogit_et",         name:"Yogit",                   email:"yogit.2507020078@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u34", username:"bhavyag_et",       name:"Bhavya Gupta",            email:"bhavya.2502050027@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u35", username:"sagnik_et",        name:"Sagnik Kumar Dey",        email:"sagnik.2502051989@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Logistics ───────────────────────────────────────────────────
    { id:"u36", username:"arya_hl",          name:"Arya Paida",              email:"arya.2502052138@muj.manipal.edu",      role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u37", username:"tanmay_jhl",       name:"Tanmay Kukreja",          email:"tanmay.2507010112@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u38", username:"atharva_jhl",      name:"Atharva Srivastava",      email:"atharva.2502051171@muj.manipal.edu",   role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Marketing ───────────────────────────────────────────────────
    { id:"u39", username:"anshika_mt",       name:"Anshika Agarwal",         email:"anshika.2503120016@muj.manipal.edu",   role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u40", username:"krati_mt",         name:"Krati Arora",             email:"krati.2505060026@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u41", username:"pragya_mt",        name:"Pragya Sinha",            email:"pragya.2503030071@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u42", username:"dhruv_mt",         name:"Dhruv Talwar",            email:"dhruv.2502050098@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u43", username:"kanishka_mt",      name:"Kanishka",                email:"kanishka.2502050297@muj.manipal.edu",  role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u44", username:"samridhi_mt",      name:"Samridhi Choraria",       email:"samridhi.2503120054@muj.manipal.edu",  role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u45", username:"presha_mt",        name:"Presha Gusain",           email:"presha.2503020049@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u46", username:"aradhya_mt",       name:"Aradhya",                 email:"aradhya.2502051816@muj.manipal.edu",   role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Technical ───────────────────────────────────────────────────
    { id:"u47", username:"prisha_tt",        name:"Prisha Mittal",           email:"prisha.2502052597@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u48", username:"devanshu_tt",      name:"Devanshu Yadav",          email:"devanshu.2502051088@muj.manipal.edu",  role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u49", username:"bhumi_tt",         name:"Bhumi Shrivastav",        email:"bhumi.2502052497@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Editorial ───────────────────────────────────────────────────
    { id:"u50", username:"sharanya_edt",     name:"Sharanya Shetty",         email:"sharanya.2502051901@muj.manipal.edu",  role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u51", username:"mayank_edt",       name:"Mayank Singh",            email:"mayank.2506030032@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Social Media ────────────────────────────────────────────────
    { id:"u52", username:"rashi_smt",        name:"Rashi Singh",             email:"rashi.2504010040@muj.manipal.edu",     role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u53", username:"gaadha_smt",       name:"Gaadha Amal Nair",        email:"gaadha.2503030046@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u54", username:"shubham_smt",      name:"Shubham Jain",            email:"shubham.2502051213@muj.manipal.edu",   role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u55", username:"sarika_smt",       name:"Sarika Kashyap",          email:"sarika.2506020042@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    // ── Team — Graphic Design ──────────────────────────────────────────────
    { id:"u56", username:"anvi_gdt",         name:"Anvi Jindal",             email:"anvi.2502050984@muj.manipal.edu",      role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u57", username:"tavishii_gdt",     name:"Tavishii",                email:"tavishi.2502050570@muj.manipal.edu",   role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
    { id:"u58", username:"shivam_gdt",       name:"Shivam Kumar",            email:"shivam.2503030079@muj.manipal.edu",    role:"team",       created_by:"u1",  password_hash:P_DEFAULT, force_reset:true  },
  ]

  for (const m of members) {
    await sql`
      INSERT INTO garuda_users
        (id, username, name, email, role, status, password_hash, created_by, created_at, force_reset)
      VALUES
        (${m.id}, ${m.username}, ${m.name}, ${m.email}, ${m.role}, 'active',
         ${m.password_hash}, ${m.created_by}, ${CREATED_AT}, ${m.force_reset})
    `
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function rowToUser(row: Record<string, unknown>): User {
  return {
    id:            row.id            as string,
    username:      row.username      as string,
    name:          row.name          as string,
    email:         row.email         as string,
    role:          row.role          as UserRole,
    status:        row.status        as UserStatus,
    password_hash: row.password_hash as string,
    created_by:    row.created_by    as string | null,
    created_at:    String(row.created_at),
    force_reset:   row.force_reset   as boolean,
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────
export async function getUserById(id: string): Promise<User | null> {
  await ensureInit()
  const rows = await db()`SELECT * FROM garuda_users WHERE id = ${id}`
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

// Single query that fetches user + force-logout timestamps + site shutdown state
export async function getUserWithForceLogout(id: string): Promise<{
  user:            User | null
  globalTs:        string | null
  userTs:          string | null
  siteShutdown:    boolean
  shutdownMessage: string
}> {
  await ensureInit()
  const globalKey = "force_logout_all"
  const userKey   = `force_logout_user_${id}`
  const rows = await db()`
    SELECT u.*,
      (SELECT value FROM garuda_settings WHERE key = ${globalKey})         AS global_logout,
      (SELECT value FROM garuda_settings WHERE key = ${userKey})            AS user_logout,
      (SELECT value FROM garuda_settings WHERE key = 'site_shutdown')       AS site_shutdown,
      (SELECT value FROM garuda_settings WHERE key = 'shutdown_message')    AS shutdown_message
    FROM garuda_users u WHERE u.id = ${id}
  `
  if (!rows[0]) return { user: null, globalTs: null, userTs: null, siteShutdown: false, shutdownMessage: "" }
  const r = rows[0] as Row
  return {
    user:            rowToUser(r),
    globalTs:        r.global_logout     ? String(r.global_logout)     : null,
    userTs:          r.user_logout       ? String(r.user_logout)       : null,
    siteShutdown:    r.site_shutdown     === "true",
    shutdownMessage: r.shutdown_message  ? String(r.shutdown_message)  : "",
  }
}

export async function getSiteShutdown(): Promise<{ enabled: boolean; message: string }> {
  await ensureInit()
  const rows = await db()`
    SELECT key, value FROM garuda_settings
    WHERE key IN ('site_shutdown', 'shutdown_message')
  `
  let enabled = false
  let message = ""
  for (const r of rows) {
    if (r.key === "site_shutdown") enabled = r.value === "true"
    if (r.key === "shutdown_message") message = String(r.value ?? "")
  }
  return { enabled, message }
}

export async function setSiteShutdown(enabled: boolean, message: string): Promise<void> {
  await ensureInit()
  const sql = db()
  await sql`
    INSERT INTO garuda_settings (key, value, updated_at)
    VALUES ('site_shutdown', ${enabled ? "true" : "false"}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${enabled ? "true" : "false"}, updated_at = now()
  `
  await sql`
    INSERT INTO garuda_settings (key, value, updated_at)
    VALUES ('shutdown_message', ${message}, now())
    ON CONFLICT (key) DO UPDATE SET value = ${message}, updated_at = now()
  `
}

export async function getUserByUsername(username: string): Promise<User | null> {
  await ensureInit()
  const rows = await db()`
    SELECT * FROM garuda_users WHERE lower(username) = lower(${username})
  `
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

export async function getAllUsers(): Promise<User[]> {
  await ensureInit()
  const rows = await db()`SELECT * FROM garuda_users ORDER BY created_at ASC`
  return rows.map(r => rowToUser(r as Row))
}

// ── Write ─────────────────────────────────────────────────────────────────────
export type CreateUserInput = {
  username:   string
  name:       string
  email:      string
  role:       UserRole
  password:   string
  created_by: string
}

export async function createUser(input: CreateUserInput): Promise<User> {
  await ensureInit()
  const existing = await getUserByUsername(input.username)
  if (existing) throw new Error(`Username "${input.username}" is already taken`)

  const id            = `u${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`
  const password_hash = hashPassword(input.password)
  const now           = new Date().toISOString()
  const sql           = db()

  const rows = await sql`
    INSERT INTO garuda_users
      (id, username, name, email, role, status, password_hash, created_by, created_at, force_reset)
    VALUES
      (${id}, ${input.username}, ${input.name}, ${input.email}, ${input.role},
       'active', ${password_hash}, ${input.created_by}, ${now}, TRUE)
    RETURNING *
  `
  return rowToUser(rows[0] as Row)
}

export async function updateUserStatus(id: string, status: UserStatus): Promise<User | null> {
  await ensureInit()
  const rows = await db()`
    UPDATE garuda_users SET status = ${status} WHERE id = ${id} RETURNING *
  `
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

export async function updateUserRole(id: string, role: UserRole): Promise<User | null> {
  await ensureInit()
  const rows = await db()`
    UPDATE garuda_users SET role = ${role} WHERE id = ${id} RETURNING *
  `
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

export async function resetPassword(id: string, newPassword: string): Promise<User | null> {
  await ensureInit()
  const hash = hashPassword(newPassword)
  const rows = await db()`
    UPDATE garuda_users
    SET password_hash = ${hash}, force_reset = TRUE, status = 'pending_reset'
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

export async function changePassword(id: string, newPassword: string): Promise<User | null> {
  await ensureInit()
  const hash = hashPassword(newPassword)
  const rows = await db()`
    UPDATE garuda_users
    SET password_hash = ${hash}, force_reset = FALSE, status = 'active'
    WHERE id = ${id}
    RETURNING *
  `
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

export async function deleteUser(id: string): Promise<boolean> {
  await ensureInit()
  const rows = await db()`DELETE FROM garuda_users WHERE id = ${id} RETURNING id`
  return rows.length > 0
}

export async function updateUsername(id: string, username: string): Promise<User | null> {
  await ensureInit()
  const rows = await db()`
    UPDATE garuda_users SET username = ${username} WHERE id = ${id} RETURNING *
  `
  return rows[0] ? rowToUser(rows[0] as Row) : null
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export async function addAudit(entry: Omit<AuditEntry, "id" | "ts">): Promise<void> {
  await ensureInit()
  await db()`
    INSERT INTO garuda_audit (actor_id, actor_name, action, target_id, detail)
    VALUES (${entry.actor_id}, ${entry.actor_name}, ${entry.action}, ${entry.target_id ?? null}, ${entry.detail})
  `
}

export async function getAudit(limit = 50): Promise<AuditEntry[]> {
  await ensureInit()
  const rows = await db()`
    SELECT id, actor_id, actor_name, action, target_id, detail, ts::text AS ts
    FROM garuda_audit
    ORDER BY ts DESC
    LIMIT ${limit}
  `
  return rows as unknown as AuditEntry[]
}

// ── Force-logout settings ──────────────────────────────────────────────────────
// Keys stored in garuda_settings:
//   "force_logout_all"           → logs out every user whose token iat is before this
//   "force_logout_user_<userId>" → logs out a specific user

export async function setForceLogout(key: string): Promise<void> {
  await ensureInit()
  await db()`
    INSERT INTO garuda_settings (key, value, updated_at)
    VALUES (${key}, now()::text, now())
    ON CONFLICT (key) DO UPDATE SET value = now()::text, updated_at = now()
  `
}

export async function getForceLogoutTimestamps(userId: string): Promise<{ global: string | null; user: string | null }> {
  await ensureInit()
  const globalKey = "force_logout_all"
  const userKey   = `force_logout_user_${userId}`
  const rows = await db()`
    SELECT key, value FROM garuda_settings WHERE key IN (${globalKey}, ${userKey})
  `
  let global: string | null = null
  let user:   string | null = null
  for (const r of rows) {
    if (r.key === globalKey) global = String(r.value)
    if (r.key === userKey)   user   = String(r.value)
  }
  return { global, user }
}

// ── Public shape (no password_hash) ──────────────────────────────────────────
export type PublicUser = Omit<User, "password_hash">
export function toPublic(u: User): PublicUser {
  const { password_hash: _, ...rest } = u
  return rest
}
