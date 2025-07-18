self.addEventListener("install", function (event) {
  console.log("[Service Worker] Instalado");
});

self.addEventListener("activate", function (event) {
  console.log("[Service Worker] Activado");
});

self.addEventListener("push", function (event) {
  console.log("[Service Worker] Evento PUSH recibido:", event);

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    console.log("[Service Worker] Payload recibido:", data);
  } catch (e) {
    console.error("[Service Worker] Error al parsear el payload:", e);
  }

  const title = data.title || "Notificación";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icon.png",
    data: data.url || "/",
  };

  console.log("[Service Worker] Mostrando notificación:", title, options);

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  console.log("[Service Worker] Notificación clickeada:", event);
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
