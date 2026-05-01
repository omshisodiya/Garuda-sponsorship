import { db, type Row } from "./db"
import { CLUB, type Lead } from "../data"
import seedData from "./seedLeads.json"

// ── Table init ────────────────────────────────────────────────────────────────
let _initPromise: Promise<void> | null = null
function ensureInit(): Promise<void> {
  if (!_initPromise) _initPromise = _init()
  return _initPromise
}

async function _init(): Promise<void> {
  const sql = db()
  await sql`
    CREATE TABLE IF NOT EXISTS garuda_leads (
      id            TEXT PRIMARY KEY,
      company       TEXT    NOT NULL,
      poc_name      TEXT    NOT NULL DEFAULT '',
      poc_email     TEXT    NOT NULL DEFAULT '',
      poc_phone     TEXT    NOT NULL DEFAULT '',
      category      TEXT    NOT NULL DEFAULT 'FMCG',
      status        TEXT    NOT NULL DEFAULT 'not_started',
      stage         TEXT    NOT NULL DEFAULT 'prospect',
      assigned_to   TEXT,
      deal_value    INTEGER NOT NULL DEFAULT 75000,
      probability   INTEGER NOT NULL DEFAULT 25,
      notes         TEXT    NOT NULL DEFAULT '',
      last_activity TEXT    NOT NULL DEFAULT '',
      created_at    TEXT    NOT NULL DEFAULT '',
      created_by    TEXT    NOT NULL DEFAULT 'u1',
      screenshots   JSONB   NOT NULL DEFAULT '{}'
    )
  `
  await sql`ALTER TABLE garuda_leads ADD COLUMN IF NOT EXISTS assigned_by TEXT`
  await sql`ALTER TABLE garuda_leads ADD COLUMN IF NOT EXISTS assigned_by_role TEXT`
  // Reset leads that were seeded with pre-assigned/pre-progressed status (ghost XP fix)
  await sql`
    UPDATE garuda_leads
    SET status = 'not_started', stage = 'prospect',
        assigned_to = NULL, assigned_by = NULL, assigned_by_role = NULL
    WHERE id IN ('L053','L054','L062','L066','L067','L069','L073','L074','L077')
      AND status = 'contacted'
  `
  // Seed from JSON if table is empty
  const countRows = await sql`SELECT COUNT(*)::int AS cnt FROM garuda_leads`
  const count = (countRows[0]?.cnt as number) ?? 0
  if (count === 0) {
    const BATCH = 50
    const seeds = seedData as Array<Record<string, unknown>>
    for (let i = 0; i < seeds.length; i += BATCH) {
      await Promise.all(seeds.slice(i, i + BATCH).map(lead => sql`
        INSERT INTO garuda_leads
          (id, company, poc_name, poc_email, poc_phone, category, status, stage,
           assigned_to, deal_value, probability, notes, last_activity, created_at, created_by, screenshots)
        VALUES
          (${String(lead.id)}, ${String(lead.company)}, ${String(lead.poc_name ?? "")},
           ${String(lead.poc_email ?? "")}, ${String(lead.poc_phone ?? "")},
           ${String(lead.category ?? "FMCG")}, ${String(lead.status ?? "not_started")},
           ${String(lead.stage ?? "prospect")}, ${(lead.assigned_to as string | null) ?? null},
           ${Number(lead.deal_value ?? 75000)}, ${Number(lead.probability ?? 20)},
           ${String(lead.notes ?? "")}, ${String(lead.last_activity ?? "")},
           ${String(lead.created_at ?? "")}, ${String(lead.created_by ?? "u1")}, '{}')
        ON CONFLICT (id) DO NOTHING
      `))
    }
  }
}

// ── Row → Lead ────────────────────────────────────────────────────────────────
function rowToLead(row: Row): Lead {
  return {
    id:            String(row.id ?? ""),
    company:       String(row.company ?? ""),
    poc_name:      String(row.poc_name ?? ""),
    poc_email:     String(row.poc_email ?? ""),
    poc_phone:     String(row.poc_phone ?? ""),
    category:      (row.category as Lead["category"]) ?? "FMCG",
    status:        (row.status  as Lead["status"])   ?? "not_started",
    stage:         (row.stage   as Lead["stage"])    ?? "prospect",
    assigned_to:   (row.assigned_to as string | null) ?? null,
    deal_value:    (row.deal_value  as number) ?? 75000,
    probability:   (row.probability as number) ?? 25,
    notes:         String(row.notes ?? ""),
    last_activity: String(row.last_activity ?? ""),
    created_at:    String(row.created_at ?? ""),
    created_by:    String(row.created_by ?? "u1"),
    assigned_by:       row.assigned_by      ? String(row.assigned_by)      : null,
    assigned_by_role:  row.assigned_by_role ? String(row.assigned_by_role) : null,
    screenshots:   (row.screenshots as Record<string, string>) ?? {},
  }
}

// ── Unique ID ─────────────────────────────────────────────────────────────────
function newLeadId(): string {
  return `L${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

// ── Read ──────────────────────────────────────────────────────────────────────
export async function getAllLeads(): Promise<Lead[]> {
  await ensureInit()
  const rows = await db()`SELECT * FROM garuda_leads ORDER BY created_at DESC`
  return rows.map(r => rowToLead(r as Row))
}

export async function getLeadById(id: string): Promise<Lead | null> {
  await ensureInit()
  const rows = await db()`SELECT * FROM garuda_leads WHERE id = ${id}`
  return rows[0] ? rowToLead(rows[0] as Row) : null
}

export async function getLeadsByAssignee(userId: string): Promise<Lead[]> {
  await ensureInit()
  const rows = await db()`
    SELECT * FROM garuda_leads WHERE assigned_to = ${userId} ORDER BY created_at DESC
  `
  return rows.map(r => rowToLead(r as Row))
}

// ── Write ─────────────────────────────────────────────────────────────────────
export async function createLead(lead: Omit<Lead, "id" | "created_at">): Promise<Lead> {
  await ensureInit()
  const id         = newLeadId()
  const created_at = new Date().toISOString().split("T")[0]
  const sql        = db()

  await sql`
    INSERT INTO garuda_leads
      (id, company, poc_name, poc_email, poc_phone, category, status, stage,
       assigned_to, deal_value, probability, notes, last_activity, created_at,
       created_by, screenshots)
    VALUES
      (${id}, ${lead.company}, ${lead.poc_name}, ${lead.poc_email}, ${lead.poc_phone},
       ${lead.category}, ${lead.status}, ${lead.stage}, ${lead.assigned_to ?? null},
       ${lead.deal_value}, ${lead.probability}, ${lead.notes}, ${lead.last_activity},
       ${created_at}, ${lead.created_by}, ${JSON.stringify(lead.screenshots ?? {})})
  `
  const rows = await sql`SELECT * FROM garuda_leads WHERE id = ${id}`
  return rowToLead(rows[0] as Row)
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "created_at" | "created_by">>
): Promise<Lead | null> {
  await ensureInit()
  const current = await getLeadById(id)
  if (!current) return null

  const today = new Date().toISOString().split("T")[0]
  const m = {
    ...current,
    ...patch,
    last_activity: today,
    screenshots: patch.screenshots ?? current.screenshots ?? {},
  }

  await db()`
    UPDATE garuda_leads SET
      company       = ${m.company},
      poc_name      = ${m.poc_name},
      poc_email     = ${m.poc_email},
      poc_phone     = ${m.poc_phone},
      category      = ${m.category},
      status        = ${m.status},
      stage         = ${m.stage},
      assigned_to   = ${m.assigned_to ?? null},
      assigned_by   = ${(m as Lead & { assigned_by?: string | null }).assigned_by ?? null},
      assigned_by_role = ${(m as Lead & { assigned_by_role?: string | null }).assigned_by_role ?? null},
      deal_value    = ${m.deal_value},
      probability   = ${m.probability},
      notes         = ${m.notes},
      last_activity = ${m.last_activity},
      screenshots   = ${JSON.stringify(m.screenshots)}
    WHERE id = ${id}
  `
  return m as Lead
}

export async function deleteLead(id: string): Promise<boolean> {
  await ensureInit()
  const rows = await db()`DELETE FROM garuda_leads WHERE id = ${id} RETURNING id`
  return rows.length > 0
}

// ── Stats (pure — takes lead array) ──────────────────────────────────────────
export function computeStats(leads: Lead[]) {
  const today        = new Date()
  const fiveDaysAgo  = new Date(today); fiveDaysAgo.setDate(today.getDate() - 5)

  const confirmed    = leads.filter(l => l.status === "confirmed")
  const active       = leads.filter(l => !["rejected","confirmed"].includes(l.status))
  const secured      = confirmed.reduce((s, l) => s + l.deal_value, 0)
  const pipeline     = active.reduce((s, l) => s + (l.deal_value * l.probability / 100), 0)
  const contacted    = leads.filter(l => ["contacted","in_discussion","confirmed"].includes(l.status))
  const inDiscussion = leads.filter(l => l.status === "in_discussion")
  const won          = leads.filter(l => l.stage === "won")
  const qualified    = leads.filter(l => ["qualified","proposal","negotiation","won"].includes(l.stage))
  const conversionRate = qualified.length > 0 ? Math.round((won.length / qualified.length) * 100) : 0
  const followUpsDue = leads.filter(l =>
    !["confirmed","rejected"].includes(l.status) &&
    l.assigned_to !== null &&
    new Date(l.last_activity) < fiveDaysAgo
  )

  return {
    total:          leads.length,
    assigned:       leads.filter(l => l.assigned_to !== null).length,
    unassigned:     leads.filter(l => l.assigned_to === null).length,
    contacted:      contacted.length,
    inDiscussion:   inDiscussion.length,
    confirmed:      confirmed.length,
    pipeline:       Math.round(pipeline),
    secured,
    target:         CLUB.target,
    progressPct:    Math.round((secured / CLUB.target) * 100),
    pipelinePct:    Math.round(((secured + pipeline) / CLUB.target) * 100),
    conversionRate,
    followUpsDue:   followUpsDue.length,
  }
}
