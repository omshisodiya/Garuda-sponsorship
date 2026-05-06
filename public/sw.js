/* Garuda OS — Service Worker for Web Push Notifications */

self.addEventListener("push", function (event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Garuda OS", body: event.data.text(), importance: "info" };
  }

  const title = payload.title || "Garuda OS";
  const options = {
    body: payload.body || "",
    icon: "/garuda.png",
    badge: "/garuda.png",
    tag: payload.tag || "garuda-notification",
    data: { url: payload.url || "/" },
    requireInteraction: payload.importance === "critical",
    vibrate: payload.importance === "critical" ? [200, 100, 200, 100, 200] : [100],
    actions:
      payload.importance === "critical"
        ? [{ action: "open", title: "Open" }, { action: "dismiss", title: "Dismiss" }]
        : [{ action: "open", title: "View" }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        // Try to focus an existing window at the target URL
        for (const client of clientList) {
          if (client.url.endsWith(url) && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise focus any open window and navigate, or open new
        for (const client of clientList) {
          if ("navigate" in client && "focus" in client) {
            return client.focus().then(() => client.navigate(url));
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
});

self.addEventListener("install", function (event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
