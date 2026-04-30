import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllUsers, createUser, toPublic, addAudit } from "@/app/lib/server/store"
import type { UserRole } from "@/app/lib/server/store"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "superadmin" && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const all = getAllUsers()
  const visible = session.role === "superadmin"
    ? all
    : all.filter(u => u.role !== "superadmin")
  return NextResponse.json({ users: visible.map(toPublic) })
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role !== "superadmin" && session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { username?: string; name?: string; email?: string; role?: UserRole; password?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { username, name, email, role, password } = body
  if (!username || !name || !email || !role || !password) {
    return NextResponse.json({ error: "username, name, email, role, password required" }, { status: 400 })
  }

  // Admins cannot create superadmins
  if (session.role === "admin" && role === "superadmin") {
    return NextResponse.json({ error: "Admins cannot create superadmin accounts" }, { status: 403 })
  }

  if (password.length < 4) {
    return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 })
  }

  try {
    const user = createUser({ username, name, email, role, password, created_by: session.sub })
    addAudit({
      actor_id:   session.sub,
      actor_name: session.name,
      action:     "user_created",
      target_id:  user.id,
      detail:     `Created user ${username} with role ${role}`,
    })
    return NextResponse.json({ user: toPublic(user) }, { status: 201 })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create user"
    return NextResponse.json({ error: msg }, { status: 409 })
  }
}
