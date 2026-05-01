import { db, type Row } from "./db"

export type MissionClaim = {
  id:               string
  mission_id:       string
  mission_title:    string
  mission_points:   number
  mission_category: string
  user_id:          string
  user_name:        string
  user_role:        string
  status:           "claimed" | "complete" | "verified" | "rejected"
  claimed_at:       string
  completed_at:     string | null
  verified_by_id:   string | null
  verified_by_name: string | null
  verified_at:      string | null
  rejected_reason:  string | null
}

let _initPromise: Promise<void> | null = null
function ensureInit(): Promise<void> {
  if (!_initPromise) _initPromise = _init()
  return _initPromise
}

async function _init(): Promise<void> {
  await db()`
    CREATE TABLE IF NOT EXISTS garuda_mission_claims (
      id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      mission_id       TEXT    NOT NULL,
      mission_title    TEXT    NOT NULL DEFAULT '',
      mission_points   INTEGER NOT NULL DEFAULT 0,
      mission_category TEXT    NOT NULL DEFAULT 'outreach',
      user_id          TEXT    NOT NULL,
      user_name        TEXT    NOT NULL,
      user_role        TEXT    NOT NULL,
      status           TEXT    NOT NULL DEFAULT 'claimed',
      claimed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
      completed_at     TIMESTAMPTZ,
      verified_by_id   TEXT,
      verified_by_name TEXT,
      verified_at      TIMESTAMPTZ,
      rejected_reason  TEXT
    )
  `
  // Drop old UNIQUE constraint if it exists (allows re-claiming after verification)
  await db()`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'garuda_mission_claims_mission_id_user_id_key'
      ) THEN
        ALTER TABLE garuda_mission_claims DROP CONSTRAINT garuda_mission_claims_mission_id_user_id_key;
      END IF;
    END $$
  `
  // Partial unique index: only one active claim per (mission, user) at a time
  await db()`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_active_mission_claim
    ON garuda_mission_claims (mission_id, user_id)
    WHERE status = 'claimed' OR status = 'complete'
  `
}

function rowToClaim(row: Row): MissionClaim {
  return {
    id:               String(row.id ?? ""),
    mission_id:       String(row.mission_id ?? ""),
    mission_title:    String(row.mission_title ?? ""),
    mission_points:   (row.mission_points as number) ?? 0,
    mission_category: String(row.mission_category ?? "outreach"),
    user_id:          String(row.user_id ?? ""),
    user_name:        String(row.user_name ?? ""),
    user_role:        String(row.user_role ?? ""),
    status:           (row.status as MissionClaim["status"]) ?? "claimed",
    claimed_at:       String(row.claimed_at ?? ""),
    completed_at:     row.completed_at  ? String(row.completed_at)  : null,
    verified_by_id:   row.verified_by_id  ? String(row.verified_by_id)  : null,
    verified_by_name: row.verified_by_name ? String(row.verified_by_name) : null,
    verified_at:      row.verified_at   ? String(row.verified_at)   : null,
    rejected_reason:  row.rejected_reason ? String(row.rejected_reason) : null,
  }
}

// ── Read ──────────────────────────────────────────────────────────────────────
export async function getAllClaims(): Promise<MissionClaim[]> {
  await ensureInit()
  const rows = await db()`SELECT * FROM garuda_mission_claims ORDER BY claimed_at DESC`
  return rows.map(r => rowToClaim(r as Row))
}

export async function getClaimsByUser(userId: string): Promise<MissionClaim[]> {
  await ensureInit()
  const rows = await db()`
    SELECT * FROM garuda_mission_claims WHERE user_id = ${userId} ORDER BY claimed_at DESC
  `
  return rows.map(r => rowToClaim(r as Row))
}

export async function getPendingVerifications(): Promise<MissionClaim[]> {
  await ensureInit()
  const rows = await db()`
    SELECT * FROM garuda_mission_claims WHERE status = 'complete' ORDER BY completed_at DESC
  `
  return rows.map(r => rowToClaim(r as Row))
}

export async function getUserMissionXP(userId: string): Promise<number> {
  await ensureInit()
  const rows = await db()`
    SELECT COALESCE(SUM(mission_points), 0)::int AS xp
    FROM garuda_mission_claims
    WHERE user_id = ${userId} AND status = 'verified'
  `
  return (rows[0]?.xp as number) ?? 0
}

export async function getAllUsersXP(): Promise<Record<string, number>> {
  await ensureInit()
  const rows = await db()`
    SELECT user_id, COALESCE(SUM(mission_points), 0)::int AS xp
    FROM garuda_mission_claims
    WHERE status = 'verified'
    GROUP BY user_id
  `
  const out: Record<string, number> = {}
  for (const r of rows) out[String(r.user_id)] = (r.xp as number) ?? 0
  return out
}

// ── Write ─────────────────────────────────────────────────────────────────────
export async function claimMission(args: {
  missionId:       string
  missionTitle:    string
  missionPoints:   number
  missionCategory: string
  userId:          string
  userName:        string
  userRole:        string
}): Promise<{ ok: boolean; claim: MissionClaim | null; error?: string }> {
  await ensureInit()
  // Block if an active (claimed/complete) claim already exists — verified claims allow re-claim
  const activeRows = await db()`
    SELECT * FROM garuda_mission_claims
    WHERE mission_id = ${args.missionId} AND user_id = ${args.userId}
    AND status IN ('claimed', 'complete')
    LIMIT 1
  `
  if (activeRows.length > 0) {
    return { ok: false, claim: rowToClaim(activeRows[0] as Row), error: "Already claimed" }
  }

  const rows = await db()`
    INSERT INTO garuda_mission_claims
      (mission_id, mission_title, mission_points, mission_category, user_id, user_name, user_role, status)
    VALUES
      (${args.missionId}, ${args.missionTitle}, ${args.missionPoints}, ${args.missionCategory},
       ${args.userId}, ${args.userName}, ${args.userRole}, 'claimed')
    RETURNING *
  `
  return { ok: true, claim: rows[0] ? rowToClaim(rows[0] as Row) : null }
}

export async function completeMission(
  missionId: string,
  userId: string
): Promise<MissionClaim | null> {
  await ensureInit()
  const rows = await db()`
    UPDATE garuda_mission_claims
    SET status = 'complete', completed_at = now()
    WHERE mission_id = ${missionId} AND user_id = ${userId} AND status = 'claimed'
    RETURNING *
  `
  return rows[0] ? rowToClaim(rows[0] as Row) : null
}

export async function verifyMission(
  missionId:    string,
  userId:       string,
  verifierId:   string,
  verifierName: string
): Promise<MissionClaim | null> {
  await ensureInit()
  // Set to verified — partial index only blocks 'claimed'/'complete', so after this the user can re-claim
  const rows = await db()`
    UPDATE garuda_mission_claims
    SET status = 'verified', verified_by_id = ${verifierId},
        verified_by_name = ${verifierName}, verified_at = now()
    WHERE mission_id = ${missionId} AND user_id = ${userId} AND status = 'complete'
    RETURNING *
  `
  return rows[0] ? rowToClaim(rows[0] as Row) : null
}

export async function rejectMission(
  missionId:    string,
  userId:       string,
  verifierId:   string,
  verifierName: string,
  reason:       string
): Promise<MissionClaim | null> {
  await ensureInit()
  // Reset to claimed so user can re-try, keep rejection reason
  const rows = await db()`
    UPDATE garuda_mission_claims
    SET status = 'claimed',
        rejected_reason = ${reason},
        verified_by_id = ${verifierId},
        verified_by_name = ${verifierName},
        verified_at = now(),
        completed_at = null
    WHERE mission_id = ${missionId} AND user_id = ${userId} AND status = 'complete'
    RETURNING *
  `
  return rows[0] ? rowToClaim(rows[0] as Row) : null
}
