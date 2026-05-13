import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getUserWithForceLogout, toPublic } from "@/app/lib/server/store"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { user, globalTs, userTs, siteShutdown, shutdownMessage } = await getUserWithForceLogout(session.sub)

  if (!user || user.status === "disabled") {
    return NextResponse.json({ error: "User not found or disabled" }, { status: 401 })
  }

  // iat is seconds; force_logout timestamps are ISO strings — compare in ms
  const iatMs    = (session.iat ?? 0) * 1000
  const globalMs = globalTs ? new Date(globalTs).getTime() : 0
  const userMs   = userTs   ? new Date(userTs).getTime()   : 0
  if (iatMs < globalMs || iatMs < userMs) {
    return NextResponse.json({ error: "Session invalidated by admin" }, { status: 401 })
  }

  // superadmin is never affected by site shutdown
  const showShutdown = siteShutdown && user.role !== "superadmin"

  return NextResponse.json({
    user: toPublic(user),
    siteShutdown: showShutdown,
    shutdownMessage,
  })
}
