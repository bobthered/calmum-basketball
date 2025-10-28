<script lang="ts">
	import { Calendar, CircleUserRound } from '@lucide/svelte';
	import { BasketballIcon, Div, H1, Header, Main, Modal, Nav, NavItem, Spinner } from '$components';
	import SignUpModal from '$components/SignUpModal.svelte';
	import { user } from '$lib/user';
	import { findCalendar } from '$lib/mongoose/remote/find/calendar.remote';
	import { scheduledDates } from '$lib/scheduledDates';
	import '../app.css';

	let { children } = $props();

	// $state
	let isScheduledDateInitiated = $state(false);
	let nav = $state([
		{ href: '/', Icon: BasketballIcon, label: 'Home' },
		{ href: '/calendar', Icon: Calendar, label: 'Calendar' },
		{ href: '/my-account', Icon: CircleUserRound, label: 'My Account' }
	]);

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

<Main class="grow">
	{#if user.value !== null}
		{@render children?.()}
	{/if}
</Main>
<Header class="bg-primary-700 text-white">
	<Div class="jusity-between mx-auto flex w-full max-w-7xl items-center lg:px-4">
		<Div class="hidden items-center space-x-4 lg:flex">
			<BasketballIcon class="h-16 w-16" />
			<H1 class="whitespace-nowrap">Cal-Mum Rec. Basketball</H1>
		</Div>
		<Nav navItemCount={nav.length}>
			{#each nav as { href, Icon, label }}
				<NavItem {href} {Icon} {label} />
			{/each}
		</Nav>
	</Div>
</Header>
<SignUpModal />
<Modal isOpen={isLoadingModalOpen}>
	<Div class="flex flex-col items-center justify-center">
		<Spinner class="h-20 w-20" />
	</Div>
</Modal>
