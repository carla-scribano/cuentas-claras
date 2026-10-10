// Libre de Deudas — service worker (modo offline)
// Estrategia: red primero para que la página siempre llegue fresca cuando hay
// internet, y caché como respaldo para que todo funcione sin conexión.
// Rutas relativas a propósito: la página vive en un subdirectorio de GitHub Pages.

const CACHE = "libre-de-deudas-v1";
const ARCHIVOS = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;
  if (pedido.method !== "GET") return; // el chat (POST al worker) pasa directo
  if (new URL(pedido.url).origin !== self.location.origin) return; // solo lo propio

  evento.respondWith(
    fetch(pedido)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(pedido, copia));
        return respuesta;
      })
      .catch(() => caches.match(pedido).then((guardado) => guardado || caches.match("./index.html")))
  );
});
