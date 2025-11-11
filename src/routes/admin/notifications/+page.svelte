<script lang="ts">
	import { Button, Div, H1 } from '$components';

	// $state
	let isIOS = $state(false);
	let isNotificationShowable = $state(false);
	let isStandalone = $state(false);
	let isSupported = $state(false);

	// functions
	const requestPermission = async () => {
		if (!isStandalone) return;
		if (!isSupported) return;

		if (Notification.permission === 'granted') {
			await showTestNotification();
			return;
		}

		const result = await Notification.requestPermission();
		if (result === 'granted') {
			await showTestNotification();
		}
	};
	const showTestNotification = async () => {
		if (!isNotificationShowable) return;
		const registration = await navigator.serviceWorker.ready;

		await registration.showNotification('Notifications enabled', {
			badge: '/icons/icon-192x192.png',
			body: 'You will receive alerts from now on.',
			data: { url: '/' },
			icon: '/icons/icon-192x192.png',
			tag: 'notification-test'
		});
	};

	// $effects
	$effect(() => {
		isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
		isNotificationShowable =
			typeof window !== 'undefined' &&
			'serviceWorker' in navigator &&
			'showNotification' in ServiceWorkerRegistration.prototype;
		isStandalone =
			matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true;
		isSupported = typeof window !== 'undefined' && 'Notification' in window;
	});
</script>

<H1 class="text-4xl sm:text-5xl">Admin - Notifications</H1>
<pre>isNotificationShowable: {isNotificationShowable};
isStandalone: {isStandalone};
isSupported: {isSupported};
</pre>
{#if isSupported}
	<Button onclick={requestPermission}>Enable Notifications</Button>
{:else}
	<Div>This browser doesn't support notifications</Div>
{/if}
