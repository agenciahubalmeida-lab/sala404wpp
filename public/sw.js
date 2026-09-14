self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title || "SALA 404", {
      body: data.body || "Há um novo aviso no painel.",
      icon: "/painel/icon/192",
      badge: "/painel/icon/192",
      tag: data.tag || "sala404",
      data: { url: "/painel" },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const target = windows.find((w) => new URL(w.url).pathname === "/painel");
      if (target) return target.focus();
      return self.clients.openWindow("/painel");
    })(),
  );
});
// Deliberately no fetch cache: private lead responses must never be cached offline.
