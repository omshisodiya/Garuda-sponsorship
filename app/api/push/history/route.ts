import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { db, type Row } from "@/app/lib/server/db"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let rows: Row[] = []
  try {
    rows = await db()`
      SELECT id, title, body, url, importance, target_type, target_value,
             sent_by, sent_at::text AS sent_at, recipient_count
      FROM garuda_notifications
      ORDER BY sent_at DESC
      LIMIT 100
    `
  } catch {
    rows = []
  }

  return NextResponse.json({ notifications: rows })
}
