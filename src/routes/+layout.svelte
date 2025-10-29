<script lang="ts">
	import { Calendar, CircleUserRound, LogOut, ShieldUser, Users } from '@lucide/svelte';
	import { twMerge } from 'tailwind-merge';
	import {
		BasketballIcon,
		Card,
		Div,
		H1,
		Header,
		Main,
		Modal,
		Nav,
		NavItem,
		Popover,
		Spinner
	} from '$components';
	import SignUpModal from '$components/SignUpModal.svelte';
	import { findCalendar } from '$lib/remote/find-calendar.remote';
	import { scheduledDates } from '$lib/scheduledDates';
	import { user } from '$lib/user';
	import '../app.css';

	let { children } = $props();

	// $state
	let adminNav = $state([
		{ href: '/admin/calendar', Icon: Calendar, label: 'Calendar' },
		{ href: '/admin/users', Icon: Users, label: 'Users' }
	]);
	let isAdminPopoverOpen = $state(false);
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
	const navItemCount = $derived.by(() => nav.length + 1 + (user?.value?.isAdmin ? 1 : 0));

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
	<Header class="z-2 bg-primary-700 text-white">
		<Div class="jusity-between mx-auto flex w-full max-w-7xl items-center lg:px-4">
			<Div class="hidden items-center space-x-4 lg:flex">
				<BasketballIcon class="h-16 w-16" />
				<H1 class="text-3xl whitespace-nowrap">Cal-Mum Rec. Basketball</H1>
			</Div>
			<Nav {navItemCount}>
				{#each nav as { href, Icon, label }}
					<NavItem {href} {Icon} {label} />
				{/each}
				{#if user.value.isAdmin}
					<Popover bind:isOpen={isAdminPopoverOpen} class="flex flex-col items-center">
						{#snippet triggerSnippet()}
							<NavItem
								class={twMerge(
									'w-full',
									isAdminPopoverOpen ? 'bg-primary-800 lg:bg-white' : undefined
								)}
								Icon={ShieldUser}
								label="Admin"
								onclick={() => (isAdminPopoverOpen = !isAdminPopoverOpen)}
								tag="button"
							/>
						{/snippet}
						<Card
							class={twMerge(
								'rounded-b-none bg-primary-800 p-0 text-white dark:bg-primary-800',
								'lg:rounded lg:bg-white lg:text-primary-700 dark:lg:bg-white'
							)}
						>
							{#each adminNav as { href, Icon, label }}
								<a class="flex items-center space-x-2 px-6 py-3" {href} title={label}>
									<Icon />
									<Div>
										{label}
									</Div>
								</a>
							{/each}
						</Card>
					</Popover>
				{/if}
				<NavItem Icon={LogOut} label="Sign Out" onclick={() => signOut()} tag="button" />
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
