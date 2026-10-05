<script>
	import { goto } from '$app/navigation';
	import { UserRound, Bell, Trash2, LogOut, ChevronRight } from '@lucide/svelte';
	import { A, Button, Card, Modal } from '#components';
	import { signOut } from '#lib/remote/session.remote.js';
	import { disableNotifications } from '#lib/notifications.js';
	import { user } from '#lib/state/index.js';
	let isSignOutOpen = $state(false);
	let isPending = $state(false);
	let error = $state('');
	const sections = [
		{
			href: '/settings/personal-information',
			Icon: UserRound,
			title: 'Personal information',
			description: 'Change your first and last name.'
		},
		{
			href: '/settings/notification',
			Icon: Bell,
			title: 'Notifications',
			description: 'Manage message alerts on this device.'
		},
		{
			href: '/settings/delete-account',
			Icon: Trash2,
			title: 'Delete account',
			description: 'Permanently delete your account.'
		}
	];
	async function confirmSignOut() {
		if (isPending) return;
		isPending = true;
		error = '';
		try {
			try {
				await disableNotifications();
			} catch {
				/* Continue signing out if push cleanup fails. */
			}
			await signOut();
			localStorage.removeItem('_id');
			isSignOutOpen = false;
			user.value = null;
			await goto('/');
		} catch {
			error = 'Could not sign out. Please try again.';
		} finally {
			isPending = false;
		}
	}
</script>

<svelte:head><title>Settings | Cal-Mum Rec. Basketball</title></svelte:head>
{#if user.value}
	<Card class="gap-2">
		{#each sections as { href, Icon, title, description }}
			<A
				{href}
				variants={['ghost']}
				class="flex items-center gap-3 rounded-lg p-3 text-gray-950 hover:bg-gray-100 dark:text-gray-50 dark:hover:bg-gray-800"
			>
				<Icon class="size-5 shrink-0" aria-hidden="true" />
				<span class="flex-1"
					><span class="block font-semibold">{title}</span><span
						class="block text-sm text-gray-600 dark:text-gray-400">{description}</span
					></span
				>
				<ChevronRight class="size-5 shrink-0" aria-hidden="true" />
			</A>
			<hr class="border-0 border-t border-gray-200 dark:border-gray-700" />
		{/each}
		<Button
			type="button"
			aria-label="Sign out"
			variants={['ghost']}
			class="flex w-full items-center gap-3 rounded-lg p-3 text-left text-gray-950 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-50 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
			onclick={() => {
				error = '';
				isSignOutOpen = true;
			}}
			><LogOut class="size-5 shrink-0" aria-hidden="true" /><span class="flex-1"
				><span class="block font-semibold">Sign out</span><span
					class="block text-sm font-normal text-gray-600 dark:text-gray-400"
					>Sign out on this device.</span
				></span
			><ChevronRight class="size-5 shrink-0" aria-hidden="true" /></Button
		>
	</Card>
{/if}
<Modal bind:isOpen={isSignOutOpen} aria-labelledby="sign-out-title">
	<div class="flex flex-col gap-4">
		<h2 id="sign-out-title" class="text-xl font-semibold">Sign out?</h2>
		<p>You will need to sign in again to use the app on this device.</p>
		{#if error}<p role="alert" class="text-red-600 dark:text-red-400">{error}</p>{/if}
		<div class="flex justify-end gap-3">
			<Button type="button" disabled={isPending} onclick={() => (isSignOutOpen = false)}
				>Cancel</Button
			>
			<Button type="button" disabled={isPending} onclick={confirmSignOut}
				>{isPending ? 'Signing out...' : 'Sign out'}</Button
			>
		</div>
	</div>
</Modal>
