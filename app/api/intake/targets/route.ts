import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getIntakeTargets, setIntakeTarget } from "@/app/lib/server/intakeStore"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const targets = await getIntakeTargets()
  return NextResponse.json({ targets })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "admin" && session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let userId: string, target: number
  try {
    const body = await req.json()
    userId = String(body.userId ?? "")
    target = Math.max(0, Math.floor(Number(body.target) || 0))
    if (!userId) throw new Error("missing userId")
  } catch {
    return NextResponse.json({ error: "userId and target required" }, { status: 400 })
  }

  await setIntakeTarget(userId, target, session.sub)
  return NextResponse.json({ ok: true, userId, target })
}
