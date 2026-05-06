import { NextRequest, NextResponse } from "next/server"
import webpush from "web-push"
import { getSessionFromCookies } from "@/app/lib/server/auth"
import { db, type Row } from "@/app/lib/server/db"

type PushSub = {
  endpoint: string
  p256dh:   string
  auth:     string
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromCookies()
  if (!session || session.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: {
    title?: string
    body?: string
    importance?: string
    targetType?: string
    targetValue?: string
    url?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const { title, body: msgBody, importance = "info", targetType = "all", targetValue, url } = body
  if (!title || !msgBody) {
    return NextResponse.json({ error: "title and body required" }, { status: 400 })
  }

  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublic || !vapidPrivate || !vapidSubject) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 })
  }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  // Fetch subscriptions
  let rows: Row[] = []
  try {
    if (targetType === "all") {
      rows = await db()`SELECT endpoint, p256dh, auth FROM garuda_push_subscriptions`
    } else if (targetType === "role" && targetValue) {
      rows = await db()`SELECT endpoint, p256dh, auth FROM garuda_push_subscriptions WHERE user_role = ${targetValue}`
    } else if (targetType === "user" && targetValue) {
      rows = await db()`SELECT endpoint, p256dh, auth FROM garuda_push_subscriptions WHERE user_id = ${targetValue}`
    }
  } catch {
    // table doesn't exist yet
    rows = []
  }

  const subs: PushSub[] = rows.map(r => ({
    endpoint: String(r.endpoint),
    p256dh:   String(r.p256dh),
    auth:     String(r.auth),
  }))

  const payload = JSON.stringify({ title, body: msgBody, url: url || "/", importance, tag: `garuda-${Date.now()}` })

  let sent = 0
  const staleEndpoints: string[] = []

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          staleEndpoints.push(sub.endpoint)
        }
      }
    })
  )

  // Clean stale subscriptions
  for (const ep of staleEndpoints) {
    await db()`DELETE FROM garuda_push_subscriptions WHERE endpoint = ${ep}`.catch(() => {})
  }

  // Log notification
  try {
    await db()`
      INSERT INTO garuda_notifications (title, body, url, importance, target_type, target_value, sent_by, recipient_count)
      VALUES (${title}, ${msgBody}, ${url ?? null}, ${importance}, ${targetType}, ${targetValue ?? null}, ${session.name}, ${sent})
    `
  } catch {
    // table may not exist
  }

  return NextResponse.json({ sent, total: subs.length })
}
