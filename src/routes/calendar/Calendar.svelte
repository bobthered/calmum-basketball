<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div, Spinner } from '$components';
	import { findCalendar } from '$lib/remote/find-calendar.remote';
	import { updateCalendar } from '$lib/remote/update-calendar.remote';
	import { calendar, scheduledDates } from '$lib/state';
	import { fade } from '$lib/transition';

	type CalendarDate = {
		date: Date;
		dateString: string;
		isScheduled: boolean;
	};
	type Props = {
		children?: Snippet;
		daySnippet?: Snippet<[CalendarDate]>;
		isEditable?: boolean;
	};

	let { children, daySnippet, isEditable = false }: Props = $props();

	// $state
	let isLoading = $state(true);

	// variables
	const dayHeadings = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const updateScheduledDates = async () => {
		await findCalendar().refresh();
		const result = await findCalendar();
		scheduledDates.value = result.map(({ date }: { date: string }) => date);
		isLoading = false;
	};

	// $derives
	const calendarHeading = $derived.by(() => {
		return calendar.currentDate.toLocaleString('default', { month: 'long', year: '2-digit' });
	});

	// $effects
	$effect(() => {
		updateScheduledDates();
	});
</script>

<Card class="relative grid grid-cols-7 overflow-hidden p-0 lg:mr-auto">
	{#if children}
		{@render children()}
	{:else}
		<Div class="col-span-7 flex items-center justify-between">
			<Div class="flex p-1">
				<Button
					class="px-2 py-2"
					onclick={() => {
						calendar.currentDate = new Date(
							calendar.currentDate.setMonth(calendar.currentDate.getMonth() - 1)
						);
					}}
				>
					<ChevronLeft />
				</Button>
			</Div>
			<Div>{calendarHeading}</Div>
			<Div class="flex p-1">
				<Button
					class="px-2 py-2"
					onclick={() => {
						calendar.currentDate = new Date(
							calendar.currentDate.setMonth(calendar.currentDate.getMonth() + 1)
						);
					}}
				>
					<ChevronRight />
				</Button>
			</Div>
		</Div>
		{#each dayHeadings as dayHeading}
			<Div class="py-3 text-center">{dayHeading}</Div>
		{/each}
		{#each calendar.calendar as calendarDate}
			{#if daySnippet}
				{@render daySnippet(calendarDate)}
			{:else}
				<Div class="aspect-squre flex h-12 p-1">
					{#if isEditable}
						<Button
							class={twMerge(
								'flex h-10 w-full items-center justify-center rounded bg-transparent p-0 text-center text-current outline-1 -outline-offset-1 outline-black/10 focus:outline-primary-700 lg:aspect-square dark:outline-white/10 dark:focus:outline-primary-700',
								calendarDate.date.getMonth() !== calendar.currentDate.getMonth()
									? 'disabled:bg-transparent disabled:text-current disabled:opacity-50'
									: undefined,
								calendarDate.isScheduled
									? 'bg-primary-700 text-white focus:outline-primary-500 dark:focus:outline-primary-500'
									: undefined
							)}
							disabled={calendarDate.date.getMonth() !== calendar.currentDate.getMonth()
								? true
								: undefined}
							onclick={async () => {
								calendarDate.isScheduled = !calendarDate.isScheduled;
								if (calendarDate.isScheduled) scheduledDates.value.push(calendarDate.dateString);
								if (!calendarDate.isScheduled)
									scheduledDates.value = scheduledDates.value.filter(
										(scheduledDate) => scheduledDate !== calendarDate.dateString
									);
								await updateCalendar({
									date: calendarDate.dateString,
									isScheduled: calendarDate.isScheduled
								});
							}}
						>
							{calendarDate.date.getDate()}
						</Button>
					{:else}
						<Div
							class={twMerge(
								'flex h-10 w-full items-center justify-center rounded outline-1 -outline-offset-1 outline-black/10 lg:aspect-square dark:outline-white/10',
								calendarDate.isScheduled ? 'bg-primary-700 text-white' : undefined,
								calendarDate.date.getMonth() !== calendar.currentDate.getMonth()
									? 'bg-transparent opacity-50 outline-0'
									: undefined
							)}
						>
							{calendarDate.date.getDate()}
						</Div>
					{/if}
				</Div>
			{/if}
		{/each}
	{/if}
	{#if isLoading}
		<div
			class="absolute top-0 left-0 flex h-full w-full items-center justify-center bg-white/70 backdrop-blur dark:bg-black/70"
			transition:fade={{ duration: 200 }}
		>
			<Spinner class="h-20 w-20" />
		</div>
	{/if}
</Card>
