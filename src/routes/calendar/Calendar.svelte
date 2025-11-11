<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { untrack, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div } from '$components';
	import { scheduledDates } from '$lib/scheduledDates';
	import { updateCalendar } from '$lib/remote/update-calendar.remote';

	type CalendarDate = {
		date: Date;
		dateString: string;
		isScheduled: boolean;
	};
	type Calendar = CalendarDate[];
	type Props = {
		children?: Snippet;
		date: Date;
		daySnippet?: Snippet<[CalendarDate]>;
		isEditable?: boolean;
	};

	let { children, date = $bindable(new Date()), daySnippet, isEditable = false }: Props = $props();

	// $state
	let calendar: Calendar = $state([]);

	// variables
	const dayHeadings = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

	// $derives
	const calendarHeading = $derived.by(() => {
		return date.toLocaleString('default', { month: 'long', year: '2-digit' });
	});

	// $effects
	$effect(() => {
		const firstOfCurrentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
		const lastOfPreviousMonth = new Date(
			firstOfCurrentMonth.getFullYear(),
			firstOfCurrentMonth.getMonth(),
			0
		);
		const dayOfLastOfPreviousMonth = lastOfPreviousMonth.getDay();
		let currentDate = new Date(
			lastOfPreviousMonth.getFullYear(),
			lastOfPreviousMonth.getMonth(),
			lastOfPreviousMonth.getDate() - dayOfLastOfPreviousMonth
		);
		const firstDayOfNextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
		let customCalendar: Calendar = [];
		let iterations = 0;

		while (currentDate.getTime() < firstDayOfNextMonth.getTime() && iterations < 60) {
			for (let i = 0; i < 7; i++) {
				const dateString = new Date(currentDate).toISOString().split('T')[0];
				customCalendar.push({
					date: new Date(currentDate),
					dateString,
					isScheduled: scheduledDates.value.includes(dateString)
				});
				currentDate.setDate(currentDate.getDate() + 1);
				iterations++;
			}
		}

		untrack(() => {
			calendar = customCalendar;
		});
	});
</script>

<Card class="grid grid-cols-7 p-0 lg:mr-auto">
	{#if children}
		{@render children()}
	{:else}
		<Div class="col-span-7 flex items-center justify-between">
			<Div class="flex p-1">
				<Button
					class="px-2 py-2"
					onclick={() => {
						date = new Date(date.setMonth(date.getMonth() - 1));
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
						date = new Date(date.setMonth(date.getMonth() + 1));
					}}
				>
					<ChevronRight />
				</Button>
			</Div>
		</Div>
		{#each dayHeadings as dayHeading}
			<Div class="py-3 text-center">{dayHeading}</Div>
		{/each}
		{#each calendar as calendarDate}
			{#if daySnippet}
				{@render daySnippet(calendarDate)}
			{:else}
				<Div class="aspect-squre flex h-12 p-1">
					{#if isEditable}
						<Button
							class={twMerge(
								'flex h-10 w-full items-center justify-center rounded bg-transparent p-0 text-center text-current outline-1 -outline-offset-1 outline-black/10 focus:outline-primary-700 lg:aspect-square dark:outline-white/10 dark:focus:outline-primary-700',
								calendarDate.date.getMonth() !== date.getMonth()
									? 'disabled:bg-transparent disabled:text-current disabled:opacity-50'
									: undefined,
								calendarDate.isScheduled
									? 'bg-primary-700 text-white focus:outline-primary-500 dark:focus:outline-primary-500'
									: undefined
							)}
							disabled={calendarDate.date.getMonth() !== date.getMonth() ? true : undefined}
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
								calendarDate.date.getMonth() !== date.getMonth()
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
</Card>
