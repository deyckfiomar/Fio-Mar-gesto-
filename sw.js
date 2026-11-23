/* Fio-Mar Gestor — service worker
   Desde a 2.36.0 o app abre direto da cópia guardada no celular (rápido, mesmo com internet fraca).
   A versão nova chega quando este arquivo muda: o app procura ao abrir/voltar, baixa tudo de novo
   em segundo plano e recarrega sozinho (index.html, 'controllerchange').
   Ao publicar uma versão nova, mude o número abaixo junto com o index.html. */
const VERSAO = '2.42.2';
const CACHE = 'fiomar-' + VERSAO;
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './apple-touch-icon.png', './assistente.js', './ilustra.js', './diagnostico.js', './codigos-extra.json', './pratico.js', './patio.js', './backup.js', './avisos.js', './pedidos.js', './financas.js', './agenda.js', './barras.js', './mais.js', './pessoal.js', './forms.js', './ia.js', './nav.js', './puxar.js', './placa.js', './oficina.js', './jspdf.umd.min.js'];

// biblioteca de fora com versão fixa (Supabase): guardada para o app abrir sem internet. O jsPDF fica no próprio app desde a 2.32.0
const LIBS = ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js'];
const LIBC = 'fiomar-libs-1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(LIBC).then((c) => Promise.all(LIBS.map((u) => c.match(u).then((m) => m || c.add(new Request(u, { mode: 'cors' }))).catch(() => {})))));
  self.skipWaiting(); // a versão nova assume na hora, sem esperar fechar o app
  // '?v=' fura o cache do GitHub Pages, para nunca guardar um arquivo da versão anterior
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => fetch(new Request(u + (u.includes('?') ? '&' : '?') + 'v=' + VERSAO, { cache: 'reload' })).then((res) => { if (res.ok) return c.put(u, res); }).catch(() => {})))));
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && k !== LIBC) await caches.delete(k); // apaga as cópias antigas
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
  if (LIBS.includes(r.url)) { // biblioteca com versão fixa: usa a cópia guardada; se não tiver, baixa e guarda
    e.respondWith(caches.open(LIBC).then(async (c) => (await c.match(r.url)) || fetch(r).then((res) => { if (res.ok) c.put(r.url, res.clone()).catch(() => {}); return res; })));
    return;
  }
  if (u.origin !== self.location.origin) return; // Supabase, fontes e o resto vão direto para a internet
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    // 1) cópia guardada desta versão: abre na hora
    const g = r.mode === 'navigate' ? ((await c.match(r, { ignoreSearch: true })) || (await c.match('./index.html')) || (await c.match('./'))) : await c.match(r);
    if (g) return g;
    // 2) não guardado (ou instalação incompleta): busca na internet e guarda
    try {
      const res = await fetch(r, { cache: 'no-store' });
      if (res.ok) c.put(r, res.clone()).catch(() => {});
      return res;
    } catch (err) {
      const m = await caches.match(r, { ignoreSearch: true });
      if (m) return m;
      throw err;
    }
  })());
});
