import { NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { getAllClaims, getClaimsByUser, getPendingVerifications, getAllUsersXP } from "@/app/lib/server/missionStore"

// GET /api/missions
// Team: returns own claims
// Admin/Superadmin: returns all claims + pending verifications + per-user XP
export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (session.role === "team") {
    const claims = await getClaimsByUser(session.sub)
    return NextResponse.json({ claims, pending: [], xpMap: {} })
  }

  const [claims, pending, xpMap] = await Promise.all([
    getAllClaims(),
    getPendingVerifications(),
    getAllUsersXP(),
  ])

  return NextResponse.json({ claims, pending, xpMap })
}
