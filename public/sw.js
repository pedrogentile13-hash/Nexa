// Service worker mínimo: push com o app fechado e, desde 13/11/2026, uma nova
// tentativa quando a Hostinger devolve a página dela de "500 Internal Server Error"
// (servidor reiniciando ou falha passageira na frente do app). Sem cache: nada é
// guardado, o app online continua igual.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

const RETRY_STATUS = new Set([500, 502, 503, 504]);
const WAITS = [800, 2000, 4000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Página de erro da Hostinger (não do Nexa): o Next sempre manda o cabeçalho x-powered-by.
// Um 500 do próprio app já tem tela com nova tentativa automática, então passa direto.
const isHostError = (res) => RETRY_STATUS.has(res.status) && !res.headers.get('x-powered-by');

const FALLBACK = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexa</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#0b0b14;color:#e8e8f0;text-align:center;padding:24px}
.c{max-width:340px}h1{font-size:20px;margin:0 0 8px}p{opacity:.75;line-height:1.5;margin:0 0 20px}
button{background:#7c3aed;color:#fff;border:0;border-radius:12px;padding:12px 20px;font-size:16px}</style></head>
<body><div class="c"><h1>O Nexa está voltando…</h1><p>O servidor está reiniciando. Esta tela tenta de novo sozinha em alguns segundos.</p>
<button onclick="location.reload()">Tentar agora</button></div>
<script>setTimeout(function(){location.reload()},6000)</script></body></html>`;

async function navigateWithRetry(request) {
  let last;
  for (let i = 0; i <= WAITS.length; i++) {
    try {
      const res = await fetch(request);
      if (!isHostError(res)) return res;
      last = res;
    } catch {
      // sem conexão ou conexão derrubada: tenta de novo
    }
    if (i < WAITS.length) await sleep(WAITS[i]);
  }
  return new Response(FALLBACK, {
    status: last ? last.status : 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode !== 'navigate' || req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Retornos de login usam um código de uso único: repetir a requisição quebraria o login.
  if (url.pathname.startsWith('/auth/') || url.pathname.startsWith('/api/')) return;
  event.respondWith(navigateWithRetry(req));
});

self.addEventListener('push', (event) => {
  let payload = { title: 'Nexa Study', body: '', link: '/' };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    // Payload não é JSON — mantém o texto padrão em vez de quebrar o evento.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Nexa Study', {
      body: payload.body || '',
      icon: '/icon-192.png',
      // `badge` é o ícone monocromático da barra de status do Android — o SO
      // sempre desenha só o canal alfa numa cor sólida própria, ignorando
      // cor do arquivo. Passar o ícone colorido (sem transparência ao redor
      // da marca) fazia o Android preencher o quadrado inteiro, virando um
      // bloco azul sem forma nenhuma em vez do "N". Esta é uma silhueta
      // branca com fundo transparente, gerada a partir de
      // assets/brand/logo-mark-src.png — só a forma importa aqui.
      badge: '/badge-monochrome.png',
      data: { link: payload.link || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(link);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(link);
    }),
  );
});
