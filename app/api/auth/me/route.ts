import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getUserById, toPublic } from "@/app/lib/server/store"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const user = await getUserById(session.sub)
  if (!user || user.status === "disabled") {
    return NextResponse.json({ error: "User not found or disabled" }, { status: 401 })
  }

  return NextResponse.json({ user: toPublic(user) })
}
