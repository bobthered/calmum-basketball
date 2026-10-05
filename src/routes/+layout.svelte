<script lang="ts">
	import { Calendar, Settings, Menu, MessageCircle, ShieldUser, X } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import { page } from '$app/state';
	import { isActiveRoute } from '#lib/ui/navigation.js';
	import {
		BasketballIcon,
		A,
		Button,
		Card,
		Div,
		H1,
		Header,
		Main,
		Modal,
		Nav,
		NavItem,
		Spinner
	} from '#components';
	import SignUpModal from '#components/SignUpModal.svelte';
	import NotificationPreferences from '#components/NotificationPreferences.svelte';
	import { findCalendar } from '#lib/remote/find-calendar.remote.js';
	import { scheduledDates, user } from '#lib/state/index.js';
	import { subtleReveal } from 'sveltewind/transitions';
	import '../app.css';

	let { children } = $props();

	// $state

	let isDesktopMenuOpen = $state(false);
	let menuButton: HTMLButtonElement | null = $state(null);
	function closeOutsideMenu(node: HTMLElement) {
		const close = (event: PointerEvent) => {
			if (isDesktopMenuOpen && !node.contains(event.target as Node)) isDesktopMenuOpen = false;
		};
		document.addEventListener('pointerdown', close, true);
		return () => document.removeEventListener('pointerdown', close, true);
	}
	let isScheduledDateInitiated = $state(false);
	let calendarError = $state('');
	let nav = $state([
		{ href: '/', Icon: BasketballIcon, label: 'Home' },
		{ href: '/calendar', Icon: Calendar, label: 'Calendar' },
		{ href: '/messages', Icon: MessageCircle, label: 'Chat' },
		{ href: '/settings', Icon: Settings, label: 'Settings' }
	]);
	function desktopLinkClass(href: string) {
		return twMerge(
			'flex items-center gap-3 rounded p-3 text-gray-950 hover:bg-gray-100 hover:text-gray-950 focus:text-gray-950 dark:text-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-50 dark:focus:text-gray-50',
			isActiveRoute(page.url.pathname, href)
				? 'bg-primary-50 font-semibold text-primary-800 ring-1 ring-primary-200 hover:bg-primary-100 hover:text-primary-800 focus:text-primary-800 dark:bg-gray-800 dark:text-primary-200 dark:ring-gray-700 dark:hover:text-primary-200 dark:focus:text-primary-200'
				: ''
		);
	}

	const updateScheduledDates = async () => {
		calendarError = '';
		try {
			const result = await findCalendar();
			scheduledDates.value = result.map(({ date }: { date: string }) => date);
		} catch {
			calendarError = 'Could not load the basketball calendar. Refresh to try again.';
		} finally {
			isScheduledDateInitiated = true;
		}
	};

	// $derives
	const isLoadingModalOpen = $derived.by(() => Boolean(user.value) && !isScheduledDateInitiated);
	const visibleNav = $derived(
		user.value?.isAdmin ? [...nav, { href: '/admin', Icon: ShieldUser, label: 'Admin' }] : nav
	);
	const navItemCount = $derived(visibleNav.length);

	// $effects
	$effect(() => {
		if (user.value && !isScheduledDateInitiated) updateScheduledDates();
	});
</script>

<svelte:window
	onkeydown={(event) => {
		if (event.key === 'Escape' && isDesktopMenuOpen) {
			isDesktopMenuOpen = false;
			menuButton?.focus();
		}
	}}
	onresize={() => {
		if (window.innerWidth < 1024) isDesktopMenuOpen = false;
	}}
/>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
	<link rel="alternate icon" href="/icons/icon-16x16.png" />
	<link rel="apple-touch-icon" href="/icons/icon-apple-touch.png" />
	<link rel="manifest" href="/manifest.json" />
	<meta name="theme-color" content="#6a1931" />
	<title>Cal-Mum Rec. Basketball</title>
</svelte:head>

<Main
	class={twMerge(
		'flex grow flex-col space-y-6 overflow-auto p-4 pt-[calc(env(safe-area-inset-top)+1rem)]',
		page.url.pathname.startsWith('/settings') || page.url.pathname.startsWith('/admin')
			? 'p-0 pt-0 lg:p-4'
			: ''
	)}
>
	{#if user.value !== null}
		{#if calendarError}<p role="alert" class="text-red-600">{calendarError}</p>{/if}
		{@render children?.()}
	{/if}
</Main>
{#if user.value !== null}
	<Header class="relative z-2 bg-primary-700 text-white">
		<Div class="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 lg:px-4">
			<Div class="hidden min-w-0 items-center gap-4 lg:flex">
				<BasketballIcon class="h-16 w-16 shrink-0" />
				<H1 class="truncate text-3xl sm:text-3xl">Cal-Mum Rec. Basketball</H1>
			</Div>
			<Nav {navItemCount} class="lg:hidden">
				{#each visibleNav as { href, Icon, label }}
					<NavItem {href} {Icon} {label} />
				{/each}
			</Nav>
			<Div class="relative hidden shrink-0 lg:block" {@attach closeOutsideMenu}>
				<Button
					class="hidden shrink-0 bg-primary-700 p-3 text-white hover:bg-primary-800 lg:flex"
					type="button"
					bind:element={menuButton}
					aria-label={isDesktopMenuOpen ? 'Close navigation' : 'Open navigation'}
					aria-expanded={isDesktopMenuOpen}
					aria-controls="desktop-navigation"
					onclick={() => (isDesktopMenuOpen = !isDesktopMenuOpen)}
					>{#if isDesktopMenuOpen}<X aria-hidden="true" />{:else}<Menu
							aria-hidden="true"
						/>{/if}</Button
				>
				{#if isDesktopMenuOpen}
					<div
						id="desktop-navigation"
						class="absolute top-full right-0 mt-4 hidden w-80 max-w-[calc(100vw-2rem)] origin-top-right lg:block"
						transition:subtleReveal={{ duration: 200 }}
					>
						<Card class="max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-t-none shadow-lg">
							<nav aria-label="Desktop navigation" class="flex flex-col gap-2">
								{#each visibleNav as { href, Icon, label } (href)}
									<A
										{href}
										variants={['ghost']}
										class={desktopLinkClass(href)}
										aria-current={isActiveRoute(page.url.pathname, href) ? 'page' : undefined}
										onclick={() => (isDesktopMenuOpen = false)}
										><Icon class="size-5 shrink-0" />{label}</A
									>
								{/each}
							</nav>
						</Card>
					</div>
				{/if}
			</Div>
		</Div>
	</Header>
{/if}
<SignUpModal />
{#if user.value && isScheduledDateInitiated}
	{#key user.value._id}
		<NotificationPreferences userId={user.value._id} prompt />
	{/key}
{/if}
<Modal isOpen={isLoadingModalOpen}>
	<Div class="flex flex-col items-center justify-center">
		<Spinner class="h-20 w-20" />
	</Div>
</Modal>
