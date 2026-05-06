import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { db, type Row } from "@/app/lib/server/db"

async function ensureTables() {
  const sql = db()
  await sql`
    CREATE TABLE IF NOT EXISTS garuda_push_subscriptions (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL,
      user_name   TEXT NOT NULL,
      user_role   TEXT NOT NULL,
      endpoint    TEXT NOT NULL UNIQUE,
      p256dh      TEXT NOT NULL,
      auth        TEXT NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS garuda_notifications (
      id               SERIAL PRIMARY KEY,
      title            TEXT NOT NULL,
      body             TEXT NOT NULL,
      url              TEXT,
      importance       TEXT NOT NULL DEFAULT 'info',
      target_type      TEXT NOT NULL,
      target_value     TEXT,
      sent_by          TEXT NOT NULL,
      sent_at          TIMESTAMPTZ DEFAULT NOW(),
      recipient_count  INTEGER DEFAULT 0
    )
  `
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: { subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } } }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { endpoint, keys } = body.subscription ?? {}
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
  }

  await ensureTables()

  await db()`
    INSERT INTO garuda_push_subscriptions (user_id, user_name, user_role, endpoint, p256dh, auth)
    VALUES (${session.sub}, ${session.name}, ${session.role}, ${endpoint}, ${keys.p256dh}, ${keys.auth})
    ON CONFLICT (endpoint) DO UPDATE
      SET user_id   = EXCLUDED.user_id,
          user_name = EXCLUDED.user_name,
          user_role = EXCLUDED.user_role,
          p256dh    = EXCLUDED.p256dh,
          auth      = EXCLUDED.auth
  `

  return NextResponse.json({ ok: true })
}

// DELETE — remove subscription on logout/unsubscribe
export async function DELETE(req: NextRequest) {
  let body: { endpoint?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }
  if (!body.endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 })

  try {
    await db()`DELETE FROM garuda_push_subscriptions WHERE endpoint = ${body.endpoint}`
  } catch {
    // table may not exist yet — ignore
  }
  return NextResponse.json({ ok: true })
}

// For TypeScript to stop complaining about unused import
export type { Row }
