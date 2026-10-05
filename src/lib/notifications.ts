import {
	notificationSettings,
	subscribeNotifications,
	unsubscribeNotifications
} from '#lib/remote/notifications.remote.js';

export function supportsNotifications() {
	return (
		typeof window !== 'undefined' &&
		window.isSecureContext &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
}
export function needsHomeScreenInstall() {
	if (typeof window === 'undefined') return false;
	const ios =
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	return (
		ios &&
		!window.matchMedia('(display-mode: standalone)').matches &&
		!(navigator as Navigator & { standalone?: boolean }).standalone
	);
}
async function registration() {
	await navigator.serviceWorker.register('/service-worker.js', { type: 'module', scope: '/' });
	return navigator.serviceWorker.ready;
}
export async function notificationSubscription() {
	if (!supportsNotifications()) return null;
	const registered = await navigator.serviceWorker.getRegistration('/');
	return registered ? registered.pushManager.getSubscription() : null;
}
async function save(subscription: PushSubscription) {
	const json = subscription.toJSON();
	if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh)
		throw new Error('Could not register this device.');
	await subscribeNotifications({
		endpoint: json.endpoint,
		keys: { auth: json.keys.auth, p256dh: json.keys.p256dh }
	});
}
export async function enableNotifications(publicKey: string) {
	if (!supportsNotifications() || needsHomeScreenInstall())
		throw new Error('Install the app on your Home Screen to enable notifications.');
	// Invoke permission immediately from the button gesture, before awaiting server work.
	const permission = await Notification.requestPermission();
	if (permission !== 'granted')
		throw new Error('Notifications are blocked. You can allow them in your device settings.');
	const registered = await registration();
	let subscription = await registered.pushManager.getSubscription();
	if (!subscription) {
		const value = publicKey.replace(/-/g, '+').replace(/_/g, '/');
		const bytes = Uint8Array.from(atob(value + '='.repeat((4 - (value.length % 4)) % 4)), (char) =>
			char.charCodeAt(0)
		);
		subscription = await registered.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: bytes
		});
	}
	await save(subscription);
}
export async function restoreNotifications() {
	const subscription = await notificationSubscription();
	if (subscription && (await notificationSettings()).publicKey) await save(subscription);
	return Boolean(subscription);
}
export async function disableNotifications() {
	const subscription = await notificationSubscription();
	if (!subscription) return;
	try {
		await unsubscribeNotifications(subscription.endpoint);
	} finally {
		await subscription.unsubscribe();
	}
}
