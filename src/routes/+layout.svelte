<script lang="ts">
	import { Calendar, CircleUserRound, LogOut } from '@lucide/svelte';
	import {
		BasketballIcon,
		Button,
		Div,
		H1,
		Header,
		Main,
		Modal,
		Nav,
		NavItem,
		Spinner
	} from '$components';
	import SignUpModal from '$components/SignUpModal.svelte';
	import { findCalendar } from '$lib/remote/find-calendar.remote';
	import { scheduledDates } from '$lib/scheduledDates';
	import { user } from '$lib/user';
	import '../app.css';

	let { children } = $props();

	// $state
	let isScheduledDateInitiated = $state(false);
	let nav = $state([
		{ href: '/', Icon: BasketballIcon, label: 'Home' },
		{ href: '/calendar', Icon: Calendar, label: 'Calendar' },
		{ href: '/my-account', Icon: CircleUserRound, label: 'My Account' }
	]);

	const signOut = () => {
		localStorage.removeItem('_id');
		user.value = null;
	};
	const updateScheduledDates = async () => {
		const result = await findCalendar();
		scheduledDates.value = result.map(({ date }: { date: string }) => date);
		isScheduledDateInitiated = true;
	};

	// $derives
	const isLoadingModalOpen = $derived.by(() => !isScheduledDateInitiated);

	// $effects
	$effect(() => {
		updateScheduledDates();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href="/icons/icon.svg" />
	<link rel="alternate icon" href="/icons/icon-16x16.png" />
	<link rel="apple-touch-icon" href="/icons/icon-apple-touch.png" />
	<link rel="manifest" href="/manifest.json" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="mobile-web-app-capable" content="yes" />
	<meta name="theme-color" content="#6a1931" />
	<meta
		name="viewport"
		content="width=device-width, initial-scale=1, user-scalable=no, viewport-fit=cover"
	/>
	<title>Cal-Mum Rec. Basketball</title>
</svelte:head>

<Main
	class="flex grow flex-col space-y-6 overflow-auto p-4 pt-[calc(env(safe-area-inset-top)+1rem)]"
>
	{#if user.value !== null}
		{@render children?.()}
	{/if}
</Main>
{#if user.value !== null}
	<Header class="bg-primary-700 text-white">
		<Div class="jusity-between mx-auto flex w-full max-w-7xl items-center lg:px-4">
			<Div class="hidden items-center space-x-4 lg:flex">
				<BasketballIcon class="h-16 w-16" />
				<H1 class="whitespace-nowrap">Cal-Mum Rec. Basketball</H1>
			</Div>
			<Nav navItemCount={nav.length + 1}>
				{#each nav as { href, Icon, label }}
					<NavItem {href} {Icon} {label} />
				{/each}
				<Button
					class="flex flex-col items-center text-white lg:bg-primary-200 lg:text-primary-700 lg:hover:bg-primary-100"
					onclick={() => signOut()}
				>
					<LogOut class="lg:hidden" />
					<Div class="text-xs lg:text-base">Sign Out</Div>
				</Button>
			</Nav>
		</Div>
	</Header>
{/if}
<SignUpModal />
<Modal isOpen={isLoadingModalOpen}>
	<Div class="flex flex-col items-center justify-center">
		<Spinner class="h-20 w-20" />
	</Div>
</Modal>
