<script lang="ts">
	// Imports
	import { Bell, ChevronRight, LogOut, Trash2, UserRound } from '@lucide/svelte';
	import { A, Button, Card, Div, H2, Hr, Modal, P, Span } from '#components';
	import { disableNotifications } from '#lib/notifications.js';
	import { signOut } from '#lib/remote/session.remote.js';
	import { user } from '#lib/state/index.js';
	import { goto } from '$app/navigation';

	// Constants
	const sections = [
		{
			description: 'Change your first and last name.',
			href: '/settings/personal-information',
			Icon: UserRound,
			title: 'Personal information'
		},
		{
			description: 'Manage message alerts on this device.',
			href: '/settings/notification',
			Icon: Bell,
			title: 'Notifications'
		},
		{
			description: 'Permanently delete your account.',
			href: '/settings/delete-account',
			Icon: Trash2,
			title: 'Delete account'
		}
	];

	// Helper functions
	const confirmSignOut = async () => {
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
	};

	// $state
	let error = $state('');

	let isPending = $state(false);

	let isSignOutOpen = $state(false);
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
				<Span class="flex-1"
					><Span class="block font-semibold">{title}</Span><Span
						class="block text-sm text-gray-600 dark:text-gray-400">{description}</Span
					></Span
				>
				<ChevronRight class="size-5 shrink-0" aria-hidden="true" />
			</A>
			<Hr class="border-0 border-t border-gray-200 dark:border-gray-700" />
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
			><LogOut class="size-5 shrink-0" aria-hidden="true" /><Span class="flex-1"
				><Span class="block font-semibold">Sign out</Span><Span
					class="block text-sm font-normal text-gray-600 dark:text-gray-400"
					>Sign out on this device.</Span
				></Span
			><ChevronRight class="size-5 shrink-0" aria-hidden="true" /></Button
		>
	</Card>
{/if}
<Modal bind:isOpen={isSignOutOpen} aria-labelledby="sign-out-title">
	<Div class="flex flex-col gap-4">
		<H2 id="sign-out-title" class="text-xl font-semibold">Sign out?</H2>
		<P>You will need to sign in again to use the app on this device.</P>
		{#if error}<P role="alert" class="text-red-600 dark:text-red-400">{error}</P>{/if}
		<Div class="flex justify-end gap-3">
			<Button type="button" disabled={isPending} onclick={() => (isSignOutOpen = false)}
				>Cancel</Button
			>
			<Button type="button" disabled={isPending} onclick={confirmSignOut}
				>{isPending ? 'Signing out...' : 'Sign out'}</Button
			>
		</Div>
	</Div>
</Modal>
