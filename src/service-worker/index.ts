/// <reference lib="webworker" />
const worker = self as unknown as ServiceWorkerGlobalScope;

// No response caching: authenticated data and query.live streams must remain private and uncached.
worker.addEventListener('push', (event) => {
	let payload: { title?: string; body?: string; messageId?: string; url?: string } = {};
	try {
		payload = event.data?.json() ?? {};
	} catch {
		/* Use a safe fallback notification. */
	}
	event.waitUntil(
		worker.registration.showNotification(payload.title ?? 'Basketball Chat', {
			body: payload.body ?? 'There is a new message in Basketball Chat.',
			icon: '/icons/icon-192x192.png',
			badge: '/icons/icon-96x96.png',
			tag: payload.messageId ? `message-${payload.messageId}` : 'basketball-chat',
			data: { url: payload.url ?? '/messages' }
		})
	);
});
worker.addEventListener('notificationclick', (event) => {
	event.notification.close();
	event.waitUntil(
		(async () => {
			const target = new URL(event.notification.data?.url ?? '/messages', worker.location.origin);
			if (target.origin !== worker.location.origin || target.pathname !== '/messages') return;
			const clients = await worker.clients.matchAll({ type: 'window', includeUncontrolled: true });
			for (const client of clients) {
				if (new URL(client.url).origin === target.origin) {
					await client.navigate(target.href);
					await client.focus();
					return;
				}
			}
			await worker.clients.openWindow(target.href);
		})()
	);
});
export {};
