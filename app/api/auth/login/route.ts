import { NextRequest, NextResponse } from "next/server"
import { getUserByUsername, addAudit } from "@/app/lib/server/store"
import { verifyPassword, signToken, buildSessionCookie } from "@/app/lib/server/auth"

export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { username, password } = body
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 })
  }

  const user = await getUserByUsername(username)
  if (!user || !verifyPassword(password, user.password_hash)) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
  }

  if (user.status === "disabled") {
    return NextResponse.json({ error: "Account disabled. Contact your administrator." }, { status: 403 })
  }

  const token = await signToken({
    sub:      user.id,
    username: user.username,
    name:     user.name,
    role:     user.role,
  })

  await addAudit({
    actor_id:   user.id,
    actor_name: user.name,
    action:     "login",
    target_id:  null,
    detail:     `Logged in from ${req.headers.get("x-forwarded-for") ?? "unknown"}`,
  })

  const cookie = buildSessionCookie(token)
  const res = NextResponse.json({
    ok:          true,
    force_reset: user.force_reset,
    user: {
      id:       user.id,
      username: user.username,
      name:     user.name,
      role:     user.role,
    },
  })
  res.cookies.set(cookie)
  return res
}
