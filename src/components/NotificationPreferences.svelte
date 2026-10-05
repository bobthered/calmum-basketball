<script lang="ts">
	import { onMount } from 'svelte';
	import { Button, Card, Modal } from '#components';
	import { notificationSettings } from '#lib/remote/notifications.remote.js';
	import {
		disableNotifications,
		enableNotifications,
		needsHomeScreenInstall,
		notificationSubscription,
		restoreNotifications,
		supportsNotifications
	} from '#lib/notifications.js';

	let { userId, prompt = false }: { userId: string; prompt?: boolean } = $props();
	let enabled = $state(false);
	let busy = $state(false);
	let ready = $state(false);
	let supported = $state(false);
	let installNeeded = $state(false);
	let blocked = $state(false);
	let publicKey = $state('');
	let message = $state('');
	let showPrompt = $state(false);

	const preferenceKey = () => `basketball:notifications:answered:${userId}`;
	function hasAnswered() {
		try {
			return localStorage.getItem(preferenceKey()) !== null;
		} catch {
			return false;
		}
	}
	function answer(choice: string) {
		try {
			localStorage.setItem(preferenceKey(), choice);
		} catch {
			/* Still honor the choice for this visit if storage is unavailable. */
		}
		showPrompt = false;
		window.dispatchEvent(new Event('basketball-notification-preference'));
	}
	onMount(() => {
		let disposed = false;
		const refresh = () => {
			if (prompt) return;
			void notificationSubscription()
				.then((subscription) => {
					if (!disposed) {
						enabled = Boolean(subscription);
						blocked = supported && Notification.permission === 'denied';
					}
				})
				.catch(() => {
					/* Existing settings remain visible until the next visit. */
				});
		};
		window.addEventListener('basketball-notification-preference', refresh);
		void (async () => {
			supported = supportsNotifications();
			installNeeded = needsHomeScreenInstall();
			blocked = supported && Notification.permission === 'denied';
			try {
				publicKey = (await notificationSettings()).publicKey;
				if (supported && !installNeeded && publicKey) enabled = await restoreNotifications();
				if (disposed) return;
				if (enabled || blocked) answer(enabled ? 'enabled' : 'denied');
				else
					showPrompt =
						prompt && supported && !installNeeded && Boolean(publicKey) && !hasAnswered();
			} catch (err) {
				message =
					err instanceof Error
						? err.message
						: 'Could not check notification settings. Reload to try again.';
			} finally {
				if (!disposed) ready = true;
			}
		})();
		return () => {
			disposed = true;
			window.removeEventListener('basketball-notification-preference', refresh);
		};
	});
	async function toggle() {
		busy = true;
		message = '';
		try {
			if (enabled) await disableNotifications();
			else await enableNotifications(publicKey);
			enabled = !enabled;
			answer(enabled ? 'enabled' : 'disabled');
		} catch (err) {
			blocked = supported && Notification.permission === 'denied';
			if (blocked) answer('denied');
			message =
				err instanceof Error ? err.message : 'Could not change notifications. Please try again.';
		} finally {
			busy = false;
		}
	}
</script>

{#if prompt}
	{#if showPrompt}
		<Modal
			bind:isOpen={showPrompt}
			aria-labelledby="notification-title"
			aria-describedby="notification-description"
			class="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl bg-white p-6 text-gray-900 shadow-xl backdrop:bg-black/60 dark:bg-gray-900 dark:text-white"
		>
			<h2 id="notification-title" class="mb-3 text-xl font-semibold">
				Stay in the basketball conversation
			</h2>
			<p id="notification-description">
				Enable notifications to know when another player posts a message, even when the app is
				closed. This helps you keep up with basketball plans without checking Chat.
			</p>
			<p class="mt-3 text-sm text-gray-600 dark:text-gray-400">
				Notifications are optional and apply to this device. You can change your choice anytime in
				My Account.
			</p>
			{#if message}<p role="alert" class="mt-3 text-sm text-red-600 dark:text-red-400">
					{message}
				</p>{/if}
			<div class="mt-6 flex flex-wrap justify-end gap-3">
				<Button disabled={busy} onclick={() => answer('later')}>Not now</Button>
				<Button disabled={busy} onclick={toggle} class="bg-primary-700 text-white"
					>{busy ? 'Enablingâ€¦' : 'Enable notifications'}</Button
				>
			</div>
		</Modal>
	{/if}
{:else}
	<Card class="flex flex-col gap-3 lg:mr-auto">
		<h2 class="text-xl font-semibold">Notifications</h2>
		<p class="text-sm">
			Get an alert on this device when another player posts a message, even when the app is closed.
		</p>
		{#if !ready}<p role="status">Checking notification settingsâ€¦</p>
		{:else if installNeeded}<p class="text-sm">
				On iPhone or iPad, add this app to your Home Screen and open it there to enable
				notifications.
			</p>
		{:else if !supported}<p class="text-sm">
				Notifications are unavailable in this browser. You can still use Chat.
			</p>
		{:else if !publicKey}<p class="text-sm">Notifications are not configured yet.</p>
		{:else if blocked}<p class="text-sm">
				Notifications are blocked. Allow notifications for this app in your device or browser
				settings, then reopen this page.
			</p>
		{:else}
			<p class="text-sm" role="status">
				Notifications are {enabled ? 'on' : 'off'} for this device.
			</p>
			<Button class="self-start bg-primary-700 text-white" disabled={busy} onclick={toggle}
				>{busy
					? 'Updatingâ€¦'
					: enabled
						? 'Turn off notifications'
						: 'Enable notifications'}</Button
			>
		{/if}
		{#if message}<p role="alert" class="text-sm text-red-600 dark:text-red-400">{message}</p>{/if}
	</Card>
{/if}
