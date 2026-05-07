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
      SELECT user_role, COUNT(*)::int AS cnt
      FROM garuda_push_subscriptions
      GROUP BY user_role
    `
  } catch {
    rows = []
  }

  const byRole: Record<string, number> = {}
  let total = 0
  for (const r of rows) {
    byRole[String(r.user_role)] = Number(r.cnt)
    total += Number(r.cnt)
  }

  return NextResponse.json({ total, byRole })
}
