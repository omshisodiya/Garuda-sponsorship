import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { sendUserNotification } from "@/app/lib/server/notify"

type AssignmentRow = {
  userId:    string
  name:      string
  companies: string[]
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "admin" && session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let assignments: AssignmentRow[] = []
  try {
    const body = await req.json()
    assignments = body.assignments ?? []
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  await Promise.all(
    assignments.map(({ userId, companies }) => {
      const count   = companies.length
      const preview = companies.slice(0, 3).join(", ") + (count > 3 ? ` +${count - 3} more` : "")
      return sendUserNotification(
        userId,
        `You've been assigned ${count} new lead${count > 1 ? "s" : ""}`,
        preview,
        "/leads",
        "info"
      )
    })
  )

  return NextResponse.json({ ok: true })
}
