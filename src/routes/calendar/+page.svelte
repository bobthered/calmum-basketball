<script lang="ts">
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import { Button, Card, Div, FormControl, H1, RadioInput } from '$components';
	import { updateCalendar } from '$lib/mongoose/remote/update/calendar.remote';
	import { scheduledDates } from '$lib/scheduledDates';
	import { user } from '$lib/user';

	type CalendarDate = {
		date: Date;
		dateString: string;
		isScheduled: boolean;
	};
	type Calendar = CalendarDate[];

	// $state
	let calendar: Calendar = $state([]);
	let date = $state(new Date());
	let view = $state('Month');

	// variables
	const dayHeadings = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const views = ['Month', 'List'];

	// $derives
	const calendarHeading = $derived.by(() => {
		return date.toLocaleString('default', { month: 'long', year: '2-digit' });
	});
	const listDates = $derived.by(() =>
		scheduledDates.value
			.map((dateString) => {
				const date = new Date(dateString);
				date.setUTCHours(24);
				return date;
			})
			.filter((date) => date.getTime() >= new Date().getTime())
			.sort((a, b) => a.getTime() - b.getTime())
	);

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

<Div class="flex flex-col space-y-6 overflow-auto p-4">
	<H1>Calendar</H1>
	<FormControl label="View">
		<Div class="flex space-x-2">
			{#each views as value}
				<RadioInput bind:group={view} {value} />
			{/each}
		</Div>
	</FormControl>
	{#if view === 'Month'}
		{@render monthView()}
	{:else if view === 'List'}
		{@render listView()}
	{/if}
</Div>

{#snippet daySnippet(calendarDate: CalendarDate)}
	{#if user.value}
		{#if user.value.isAdmin}
			<Button
				class={twMerge(
					'flex h-12 items-center justify-center rounded bg-transparent p-0 text-center text-current lg:aspect-square',
					calendarDate.date.getMonth() !== date.getMonth()
						? 'disabled:bg-transparent disabled:text-current disabled:opacity-50'
						: undefined,
					calendarDate.isScheduled ? 'bg-primary-700 text-white' : undefined
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
					'flex h-12 items-center justify-center rounded lg:aspect-square',
					calendarDate.date.getMonth() !== date.getMonth() ? 'opacity-50' : undefined,
					calendarDate.date.getDay() === 1 || calendarDate.date.getDay() === 5
						? 'bg-primary-700'
						: undefined
				)}
			>
				{calendarDate.date.getDate()}
			</Div>
		{/if}
	{/if}
{/snippet}

{#snippet monthView()}
	<Card class="grid grid-cols-7 p-0 lg:mr-auto">
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
			{@render daySnippet(calendarDate)}
		{/each}
	</Card>
{/snippet}

{#snippet listView()}
	<Card class="overflow-auto lg:mr-auto lg:min-w-sm">
		{#each listDates as listDate}
			<Div>{listDate.toLocaleString('default', { month: 'long', day: 'numeric' })}</Div>
		{/each}
	</Card>
{/snippet}
