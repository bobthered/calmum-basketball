<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import { Button, H1 } from '$components';
	import { updateCalendar } from '$lib/remote/update-calendar.remote';
	import { scheduledDates } from '$lib/scheduledDates';
	import { user } from '$lib/user';
	import Calendar from '../../calendar/Calendar.svelte';

	type CalendarDate = {
		date: Date;
		dateString: string;
		isScheduled: boolean;
	};

	// $state
	let date = $state(new Date());
</script>

<H1>Admin - Calendar</H1>
<Calendar bind:date {daySnippet} />

{#snippet daySnippet(calendarDate: CalendarDate)}
	{#if user.value}
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
	{/if}
{/snippet}
