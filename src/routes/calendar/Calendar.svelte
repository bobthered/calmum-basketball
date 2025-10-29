<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { untrack, type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div } from '$components';
	import { scheduledDates } from '$lib/scheduledDates';

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
	};

	let { children, date = $bindable(new Date()), daySnippet }: Props = $props();

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
			<Button
				class="px-3"
				onclick={() => {
					date = new Date(date.setMonth(date.getMonth() - 1));
				}}
			>
				<ChevronLeft />
			</Button>
			<Div>{calendarHeading}</Div>
			<Button
				class="px-3"
				onclick={() => {
					date = new Date(date.setMonth(date.getMonth() + 1));
				}}
			>
				<ChevronRight />
			</Button>
		</Div>
		{#each dayHeadings as dayHeading}
			<Div class="py-3 text-center">{dayHeading}</Div>
		{/each}
		{#each calendar as calendarDate}
			{#if daySnippet}
				{@render daySnippet(calendarDate)}
			{:else}
				<Div
					class={twMerge(
						'flex h-12 items-center justify-center rounded lg:aspect-square',
						calendarDate.date.getMonth() !== date.getMonth() ? 'opacity-50' : undefined,
						calendarDate.date.getDay() === 1 || calendarDate.date.getDay() === 5
							? 'bg-primary-700 text-white'
							: undefined
					)}
				>
					{calendarDate.date.getDate()}
				</Div>
			{/if}
		{/each}
	{/if}
</Card>
