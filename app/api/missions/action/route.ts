import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import {
  claimMission, completeMission, verifyMission, rejectMission,
  getClaimForVerification, withdrawClaim,
} from "@/app/lib/server/missionStore"
import { addAudit } from "@/app/lib/server/store"

type ActionBody = {
  action:          "claim" | "complete" | "verify" | "reject" | "withdraw"
  missionId:       string
  missionTitle?:   string
  missionPoints?:  number
  missionCategory?:string
  targetUserId?:   string   // for verify/reject: whose claim to act on
  reason?:         string   // for reject
}

// POST /api/missions/action
export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: ActionBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { action, missionId } = body
  if (!action || !missionId) {
    return NextResponse.json({ error: "action and missionId required" }, { status: 400 })
  }

  // ── Withdraw ──────────────────────────────────────────────────────────────
  if (action === "withdraw") {
    const ok = await withdrawClaim(missionId, session.sub)
    if (!ok) return NextResponse.json({ error: "No active claim to withdraw" }, { status: 404 })
    addAudit({ actor_id: session.sub, actor_name: session.name, action: "mission_withdrawn", target_id: missionId, detail: `Withdrew claim on mission ${missionId}` })
    return NextResponse.json({ ok: true })
  }

  // ── Claim ─────────────────────────────────────────────────────────────────
  if (action === "claim") {
    if (!body.missionTitle || body.missionPoints == null) {
      return NextResponse.json({ error: "missionTitle and missionPoints required" }, { status: 400 })
    }
    const result = await claimMission({
      missionId,
      missionTitle:    body.missionTitle,
      missionPoints:   body.missionPoints,
      missionCategory: body.missionCategory ?? "outreach",
      userId:          session.sub,
      userName:        session.name,
      userRole:        session.role,
    })
    if (!result.ok && result.error === "Already claimed") {
      return NextResponse.json({ error: "Mission already claimed", claim: result.claim }, { status: 409 })
    }
    addAudit({ actor_id: session.sub, actor_name: session.name, action: "mission_claimed", target_id: missionId, detail: `Claimed mission: ${body.missionTitle}` })
    return NextResponse.json({ claim: result.claim })
  }

  // ── Complete ──────────────────────────────────────────────────────────────
  if (action === "complete") {
    const claim = await completeMission(missionId, session.sub)
    if (!claim) return NextResponse.json({ error: "No active claim found" }, { status: 404 })
    addAudit({ actor_id: session.sub, actor_name: session.name, action: "mission_completed", target_id: missionId, detail: `Submitted for verification: ${claim.mission_title}` })
    return NextResponse.json({ claim })
  }

  // ── Verify (admin → team only; superadmin → anyone) ──────────────────────
  if (action === "verify") {
    if (session.role !== "admin" && session.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const targetUserId = body.targetUserId
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 })

    const pending = await getClaimForVerification(missionId, targetUserId)
    if (!pending) return NextResponse.json({ error: "No pending completion found" }, { status: 404 })

    // Admins may only verify team members; superadmin can verify admin + team
    if (session.role === "admin" && pending.user_role !== "team") {
      return NextResponse.json({ error: "Admins can only verify Team member completions. Admin completions require Superadmin approval." }, { status: 403 })
    }

    const claim = await verifyMission(missionId, targetUserId, session.sub, session.name)
    if (!claim) return NextResponse.json({ error: "Verify failed" }, { status: 500 })
    addAudit({ actor_id: session.sub, actor_name: session.name, action: "mission_verified", target_id: missionId, detail: `Verified ${claim.user_name}'s completion of: ${claim.mission_title} (+${claim.mission_points} XP)` })
    return NextResponse.json({ claim })
  }

  // ── Reject (admin → team only; superadmin → anyone) ───────────────────────
  if (action === "reject") {
    if (session.role !== "admin" && session.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const targetUserId = body.targetUserId
    if (!targetUserId) return NextResponse.json({ error: "targetUserId required" }, { status: 400 })

    const pending = await getClaimForVerification(missionId, targetUserId)
    if (!pending) return NextResponse.json({ error: "No pending completion found" }, { status: 404 })

    if (session.role === "admin" && pending.user_role !== "team") {
      return NextResponse.json({ error: "Admins can only reject Team member completions." }, { status: 403 })
    }

    const claim = await rejectMission(missionId, targetUserId, session.sub, session.name, body.reason ?? "")
    if (!claim) return NextResponse.json({ error: "Reject failed" }, { status: 500 })
    addAudit({ actor_id: session.sub, actor_name: session.name, action: "mission_rejected", target_id: missionId, detail: `Rejected ${claim.user_name}'s completion of: ${claim.mission_title}. Reason: ${body.reason}` })
    return NextResponse.json({ claim })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
