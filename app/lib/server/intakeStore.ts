import { db, type Row } from "./db"

export type IntakeStatus = "new" | "working" | "dead" | "graduated"

export type IntakeLead = {
  id:                string
  name:              string
  company:           string
  phone:             string
  email:             string
  notes:             string
  submitted_by:      string
  submitted_by_name: string
  status:            IntakeStatus
  graduated_lead_id: string | null
  created_at:        string
  updated_at:        string
}

export type IntakeInput = {
  name:              string
  company?:          string
  phone?:            string
  email?:            string
  notes?:            string
  submitted_by:      string
  submitted_by_name: string
}

let _initPromise: Promise<void> | null = null
function ensureInit(): Promise<void> {
  if (!_initPromise) _initPromise = _init()
  return _initPromise
}

async function _init(): Promise<void> {
  await db()`
    CREATE TABLE IF NOT EXISTS garuda_intake (
      id                TEXT PRIMARY KEY,
      name              TEXT NOT NULL,
      company           TEXT NOT NULL DEFAULT '',
      phone             TEXT NOT NULL DEFAULT '',
      email             TEXT NOT NULL DEFAULT '',
      notes             TEXT NOT NULL DEFAULT '',
      submitted_by      TEXT NOT NULL,
      submitted_by_name TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'new',
      graduated_lead_id TEXT,
      created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `
}

function rowToIntake(row: Row): IntakeLead {
  return {
    id:                String(row.id ?? ""),
    name:              String(row.name ?? ""),
    company:           String(row.company ?? ""),
    phone:             String(row.phone ?? ""),
    email:             String(row.email ?? ""),
    notes:             String(row.notes ?? ""),
    submitted_by:      String(row.submitted_by ?? ""),
    submitted_by_name: String(row.submitted_by_name ?? ""),
    status:            (row.status as IntakeStatus) ?? "new",
    graduated_lead_id: row.graduated_lead_id ? String(row.graduated_lead_id) : null,
    created_at:        String(row.created_at ?? ""),
    updated_at:        String(row.updated_at ?? ""),
  }
}

function newIntakeId(): string {
  return `I${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
}

// ── Read ──────────────────────────────────────────────────────────────────────

export async function getAllIntakeLeads(): Promise<IntakeLead[]> {
  await ensureInit()
  const rows = await db()`
    SELECT id, name, company, phone, email, notes, submitted_by, submitted_by_name,
           status, graduated_lead_id, created_at::text, updated_at::text
    FROM garuda_intake ORDER BY created_at DESC
  `
  return rows.map(r => rowToIntake(r as Row))
}

export async function getIntakeBySubmitter(userId: string): Promise<IntakeLead[]> {
  await ensureInit()
  const rows = await db()`
    SELECT id, name, company, phone, email, notes, submitted_by, submitted_by_name,
           status, graduated_lead_id, created_at::text, updated_at::text
    FROM garuda_intake WHERE submitted_by = ${userId} ORDER BY created_at DESC
  `
  return rows.map(r => rowToIntake(r as Row))
}

export async function getIntakeLeadById(id: string): Promise<IntakeLead | null> {
  await ensureInit()
  const rows = await db()`
    SELECT id, name, company, phone, email, notes, submitted_by, submitted_by_name,
           status, graduated_lead_id, created_at::text, updated_at::text
    FROM garuda_intake WHERE id = ${id}
  `
  return rows[0] ? rowToIntake(rows[0] as Row) : null
}

// ── Write ─────────────────────────────────────────────────────────────────────

export async function createIntakeLeads(inputs: IntakeInput[]): Promise<number> {
  if (inputs.length === 0) return 0
  await ensureInit()
  const sql = db()
  const BATCH = 50
  let count = 0
  for (let i = 0; i < inputs.length; i += BATCH) {
    const slice = inputs.slice(i, i + BATCH)
    await Promise.all(slice.map(input => sql`
      INSERT INTO garuda_intake
        (id, name, company, phone, email, notes, submitted_by, submitted_by_name)
      VALUES
        (${newIntakeId()}, ${input.name}, ${input.company ?? ""}, ${input.phone ?? ""},
         ${input.email ?? ""}, ${input.notes ?? ""}, ${input.submitted_by}, ${input.submitted_by_name})
    `))
    count += slice.length
  }
  return count
}

export async function updateIntakeStatus(id: string, status: IntakeStatus): Promise<IntakeLead | null> {
  await ensureInit()
  const rows = await db()`
    UPDATE garuda_intake SET status = ${status}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, company, phone, email, notes, submitted_by, submitted_by_name,
              status, graduated_lead_id, created_at::text, updated_at::text
  `
  return rows[0] ? rowToIntake(rows[0] as Row) : null
}

export async function graduateIntakeLead(id: string, leadId: string): Promise<IntakeLead | null> {
  await ensureInit()
  const rows = await db()`
    UPDATE garuda_intake
    SET status = 'graduated', graduated_lead_id = ${leadId}, updated_at = now()
    WHERE id = ${id}
    RETURNING id, name, company, phone, email, notes, submitted_by, submitted_by_name,
              status, graduated_lead_id, created_at::text, updated_at::text
  `
  return rows[0] ? rowToIntake(rows[0] as Row) : null
}

export async function deleteIntakeLead(id: string): Promise<boolean> {
  await ensureInit()
  const rows = await db()`DELETE FROM garuda_intake WHERE id = ${id} RETURNING id`
  return rows.length > 0
}
