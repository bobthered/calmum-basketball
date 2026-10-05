import {
	notificationSettings,
	subscribeNotifications,
	unsubscribeNotifications
} from '#lib/remote/notifications.remote.js';
export const supportsNotifications = () => {
	return (
		typeof window !== 'undefined' &&
		window.isSecureContext &&
		'serviceWorker' in navigator &&
		'PushManager' in window &&
		'Notification' in window
	);
};
export const needsHomeScreenInstall = () => {
	if (typeof window === 'undefined') return false;
	const ios =
		/iPad|iPhone|iPod/.test(navigator.userAgent) ||
		(navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
	return (
		ios &&
		!window.matchMedia('(display-mode: standalone)').matches &&
		!(
			navigator as Navigator & {
				standalone?: boolean;
			}
		).standalone
	);
};
const registration = async () => {
	await navigator.serviceWorker.register('/service-worker.js', { type: 'module', scope: '/' });
	return navigator.serviceWorker.ready;
};
export const notificationSubscription = async () => {
	if (!supportsNotifications()) return null;
	const registered = await navigator.serviceWorker.getRegistration('/');
	return registered ? registered.pushManager.getSubscription() : null;
};
const save = async (subscription: PushSubscription) => {
	const json = subscription.toJSON();
	if (!json.endpoint || !json.keys?.auth || !json.keys?.p256dh)
		throw new Error('Could not register this device.');
	await subscribeNotifications({
		endpoint: json.endpoint,
		keys: { auth: json.keys.auth, p256dh: json.keys.p256dh }
	});
};
export const enableNotifications = async (publicKey: string) => {
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
};
export const restoreNotifications = async () => {
	const subscription = await notificationSubscription();
	if (subscription && (await notificationSettings()).publicKey) await save(subscription);
	return Boolean(subscription);
};
export const disableNotifications = async () => {
	const subscription = await notificationSubscription();
	if (!subscription) return;
	try {
		await unsubscribeNotifications(subscription.endpoint);
	} finally {
		await subscription.unsubscribe();
	}
};
