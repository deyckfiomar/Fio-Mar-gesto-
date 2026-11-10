/* Fio-Mar Gestor — service worker
   Sempre busca a versão mais nova no servidor (GitHub Pages).
   Só usa a cópia guardada no celular quando estiver sem internet.
   Ao publicar uma versão nova, mude o número abaixo junto com o index.html. */
const VERSAO = '2.11.0';
const CACHE = 'fiomar-' + VERSAO;
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png', './assistente.js', './diagnostico.js', './codigos-extra.json', './pratico.js', './patio.js', './backup.js', './avisos.js', './pedidos.js', './forms.js'];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // a versão nova assume na hora, sem esperar fechar o app
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k); // apaga as cópias antigas
    await self.clients.claim();
  })());
});

// avisos de agendamento (enviados pelo servidor 30 minutos antes)
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Fio-Mar Gestor', {
    body: d.body || '', icon: './icon-192.png', tag: d.tag || 'fiomar', renotify: true,
    vibrate: [250, 120, 250], requireInteraction: !!d.ag, data: { ag: d.ag || '' },
  }));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const ag = (e.notification.data || {}).ag || '';
  const url = new URL('./' + (ag ? '?ag=' + encodeURIComponent(ag) : ''), self.registration.scope).href;
  e.waitUntil((async () => {
    const L = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of L) if (c.url.startsWith(self.registration.scope)) { await c.focus(); if (ag) c.postMessage({ ag }); return; }
    await self.clients.openWindow(url);
  })());
});

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return; // Supabase, bibliotecas e fontes vão direto para a internet
  e.respondWith((async () => {
    try {
      const res = await fetch(r, { cache: 'no-store' }); // rede primeiro, ignorando o cache do navegador
      if (res.ok) { const c = await caches.open(CACHE); c.put(r, res.clone()).catch(() => {}); }
      return res;
    } catch (err) { // sem internet: usa a cópia guardada
      const m = (await caches.match(r)) || (r.mode === 'navigate' ? (await caches.match('./index.html')) || (await caches.match('./')) : null);
      if (m) return m;
      throw err;
    }
  })());
});
