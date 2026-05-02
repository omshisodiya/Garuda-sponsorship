import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { db, type Row } from "@/app/lib/server/db"

export type SessionEntry = {
  userId:       string
  userName:     string
  loginAt:      string
  logoutAt:     string | null
  durationMins: number | null
  ip:           string
}

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || (session.role !== "superadmin")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const rows = await db()`
    SELECT id, actor_id, actor_name, action, detail, ts
    FROM garuda_audit
    WHERE action IN ('login', 'logout')
    ORDER BY ts ASC
    LIMIT 1000
  `

  // Group events by user
  const byUser = new Map<string, Array<{ action: string; ts: string; detail: string; name: string }>>()
  for (const row of rows as Row[]) {
    const uid = String(row.actor_id)
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid)!.push({
      action: String(row.action),
      ts:     String(row.ts),
      detail: String(row.detail ?? ""),
      name:   String(row.actor_name),
    })
  }

  const sessions: SessionEntry[] = []
  for (const [userId, events] of byUser.entries()) {
    let pending: { ts: string; detail: string; name: string } | null = null
    for (const ev of events) {
      if (ev.action === "login") {
        pending = { ts: ev.ts, detail: ev.detail, name: ev.name }
      } else if (ev.action === "logout" && pending) {
        const loginMs  = new Date(pending.ts).getTime()
        const logoutMs = new Date(ev.ts).getTime()
        sessions.push({
          userId,
          userName:     pending.name,
          loginAt:      pending.ts,
          logoutAt:     ev.ts,
          durationMins: Math.round((logoutMs - loginMs) / 60000),
          ip:           pending.detail.replace("Logged in from ", "").trim(),
        })
        pending = null
      }
    }
    if (pending) {
      sessions.push({
        userId,
        userName:     pending.name,
        loginAt:      pending.ts,
        logoutAt:     null,
        durationMins: null,
        ip:           pending.detail.replace("Logged in from ", "").trim(),
      })
    }
  }

  sessions.sort((a, b) => new Date(b.loginAt).getTime() - new Date(a.loginAt).getTime())

  return NextResponse.json({ sessions: sessions.slice(0, 100) })
}
