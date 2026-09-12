// Service worker mínimo — só o necessário para push funcionar com o app
// fechado. Sem cache nem modo offline: fora do escopo desta fase, e registrar
// isto não muda nada de como o app se comporta online.

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
      badge: '/icon-192.png',
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
