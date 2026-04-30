import { NextRequest, NextResponse } from "next/server"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import {
  getUserById, updateUserStatus, updateUserRole, resetPassword,
  changePassword, toPublic, addAudit, deleteUser, updateUsername, getUserByUsername,
} from "@/app/lib/server/store"
import type { UserRole, UserStatus } from "@/app/lib/server/store"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  if (session.sub !== id && session.role === "team") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const user = await getUserById(id)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  return NextResponse.json({ user: toPublic(user) })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: {
    status?:         UserStatus
    role?:           UserRole
    reset_password?: string
    new_password?:   string
    new_username?:   string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const target = await getUserById(id)
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isSelf = session.sub === id

  // Change own password (any role)
  if (body.new_password !== undefined && isSelf) {
    if (body.new_password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 })
    }
    const updated = await changePassword(id, body.new_password)
    await addAudit({ actor_id: session.sub, actor_name: session.name, action: "password_changed", target_id: id, detail: "User changed own password" })
    return NextResponse.json({ user: toPublic(updated!) })
  }

  // Change own username (superadmin only)
  if (body.new_username !== undefined && isSelf && session.role === "superadmin") {
    const trimmed = body.new_username.trim()
    if (trimmed.length < 3) {
      return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 })
    }
    const existing = await getUserByUsername(trimmed)
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Username already taken" }, { status: 400 })
    }
    const updated = await updateUsername(id, trimmed)
    await addAudit({ actor_id: session.sub, actor_name: session.name, action: "username_changed", target_id: id, detail: `Username changed to ${trimmed}` })
    return NextResponse.json({ user: toPublic(updated!) })
  }

  // Everything below requires admin+
  if (session.role === "team") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Superadmin guard
  if (target.role === "superadmin" && session.role !== "superadmin") {
    return NextResponse.json({ error: "Cannot modify a superadmin account" }, { status: 403 })
  }

  // Admin guard — admins can only modify team members
  if (session.role === "admin" && target.role !== "team") {
    return NextResponse.json({ error: "Admins can only modify team members" }, { status: 403 })
  }

  if (body.status !== undefined) {
    if (isSelf) return NextResponse.json({ error: "Cannot change own status" }, { status: 400 })
    const updated = await updateUserStatus(id, body.status)
    await addAudit({ actor_id: session.sub, actor_name: session.name, action: "status_changed", target_id: id, detail: `Status set to ${body.status}` })
    return NextResponse.json({ user: toPublic(updated!) })
  }

  if (body.role !== undefined) {
    if (session.role !== "superadmin") return NextResponse.json({ error: "Only superadmin can change roles" }, { status: 403 })
    if (isSelf) return NextResponse.json({ error: "Cannot change own role" }, { status: 400 })
    const updated = await updateUserRole(id, body.role)
    await addAudit({ actor_id: session.sub, actor_name: session.name, action: "role_changed", target_id: id, detail: `Role changed to ${body.role}` })
    return NextResponse.json({ user: toPublic(updated!) })
  }

  if (body.reset_password !== undefined) {
    if (body.reset_password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters" }, { status: 400 })
    }
    const updated = await resetPassword(id, body.reset_password)
    await addAudit({ actor_id: session.sub, actor_name: session.name, action: "password_reset", target_id: id, detail: `Password reset for ${target.username}` })
    return NextResponse.json({ user: toPublic(updated!) })
  }

  return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const session = await getSessionFromCookies()
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  if (session.role === "team") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (session.sub === id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 })

  const target = await getUserById(id)
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (session.role === "admin" && target.role !== "team") {
    return NextResponse.json({ error: "Admins can only delete team members" }, { status: 403 })
  }

  await deleteUser(id)
  await addAudit({ actor_id: session.sub, actor_name: session.name, action: "user_deleted", target_id: id, detail: `Deleted user ${target.username}` })
  return new NextResponse(null, { status: 204 })
}
