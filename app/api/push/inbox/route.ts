import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { db, type Row } from "@/app/lib/server/db"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let rows: Row[] = []
  try {
    rows = await db()`
      SELECT id, title, body, url, importance, target_type, target_value, sent_at::text AS sent_at
      FROM garuda_notifications
      WHERE target_type = 'all'
        OR (target_type = 'role'  AND target_value = ${session.role})
        OR (target_type = 'user'  AND target_value = ${session.sub})
      ORDER BY sent_at DESC
      LIMIT 50
    `
  } catch {
    // table not yet created
    rows = []
  }

  return NextResponse.json({ notifications: rows })
}
