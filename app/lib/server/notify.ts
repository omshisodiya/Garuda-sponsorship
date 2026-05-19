import webpush from "web-push"
import { db } from "./db"

export async function sendUserNotification(
  userId: string,
  title: string,
  body: string,
  url  = "/leads",
  importance = "info"
): Promise<void> {
  // 1. Persist in-app notification (shows in bell dropdown)
  try {
    await db()`
      INSERT INTO garuda_notifications
        (title, body, url, importance, target_type, target_value, sent_by, recipient_count)
      VALUES
        (${title}, ${body}, ${url}, ${importance}, 'user', ${userId}, 'system', 1)
    `
  } catch { /* table not yet created */ }

  // 2. Web push
  const vapidPublic  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  const vapidSubject = process.env.VAPID_SUBJECT
  if (!vapidPublic || !vapidPrivate || !vapidSubject) return

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  let subs: { endpoint: string; p256dh: string; auth: string }[] = []
  try {
    const rows = await db()`
      SELECT endpoint, p256dh, auth
      FROM garuda_push_subscriptions
      WHERE user_id = ${userId}
    `
    subs = rows.map(r => ({
      endpoint: String(r.endpoint),
      p256dh:   String(r.p256dh),
      auth:     String(r.auth),
    }))
  } catch { return }

  if (subs.length === 0) return

  const payload  = JSON.stringify({ title, body, url, importance, tag: `assign-${Date.now()}` })
  const stale: string[] = []

  await Promise.allSettled(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) stale.push(sub.endpoint)
      }
    })
  )

  for (const ep of stale) {
    await db()`DELETE FROM garuda_push_subscriptions WHERE endpoint = ${ep}`.catch(() => {})
  }
}
