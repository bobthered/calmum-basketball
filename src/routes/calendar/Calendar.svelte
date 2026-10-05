<script lang="ts">
	// Imports
	import { Button, Div, P, Span, Spinner, Calendar as WindCalendar } from '#components';
	import { findCalendar } from '#lib/remote/find-calendar.remote.js';
	import { updateCalendar } from '#lib/remote/update-calendar.remote.js';
	import { calendar, scheduledDates } from '#lib/state/index.js';
	import { theme } from '#lib/ui/theme.js';
	import { onMount } from 'svelte';
	import { Theme } from 'sveltewind/theme';

	// Types
	type Props = { isEditable?: boolean };

	// Constants
	const calendarTheme = new Theme($state.snapshot(theme.get.theme()));

	// This is a schedule with multiple highlighted dates, rather than a single-date picker.
	calendarTheme.set.variant('calendarDay', 'selected', '');

	calendarTheme.set.variant('calendarDay', 'disabled', 'cursor-default');

	// Helper functions
	const changeMonth = (value: string) => {
		const [year, month] = value.split('-').map(Number);
		calendar.currentDate = new Date(year, month - 1, 1);
	};

	const load = async () => {
		isLoading = true;
		error = '';
		try {
			const query = findCalendar();
			await query.refresh();
			const rows = await findCalendar();
			scheduledDates.value = rows.map(({ date }: { date: string }) => date);
		} catch {
			error = 'Could not load the basketball schedule. Please try again.';
		} finally {
			isLoading = false;
		}
	};

	const toggleDate = async (date: string) => {
		if (!isEditable || isLoading || pendingDate) return;
		const isScheduled = !scheduledDates.value.includes(date);
		pendingDate = date;
		error = '';
		try {
			const result = await updateCalendar({ date, isScheduled });
			if (!result.success) throw new Error('Save failed');
			scheduledDates.value = isScheduled
				? [...new Set([...scheduledDates.value, date])]
				: scheduledDates.value.filter((value) => value !== date);
		} catch {
			error = 'Could not save the schedule. The date has not changed; please try again.';
		} finally {
			pendingDate = null;
		}
	};

	// $props
	let { isEditable = false }: Props = $props();

	// $state
	let error = $state('');

	let isLoading = $state(true);

	let pendingDate: string | null = $state(null);

	// $derived
	const month = $derived(
		`${calendar.currentDate.getFullYear()}-${String(calendar.currentDate.getMonth() + 1).padStart(2, '0')}-01`
	);

	// $effects
	onMount(() => {
		void load();
	});
</script>

<Div class="relative w-full max-w-sm space-y-3 lg:mr-auto">
	<WindCalendar
		{month}
		onMonthChange={changeMonth}
		theme={calendarTheme}
		class="w-full"
		label="Basketball schedule"
		disabled={isLoading}
		isDateDisabled={() => !isEditable || pendingDate !== null}
		onValueChange={(date) => {
			void toggleDate(date);
		}}
	>
		{#snippet day({ date, day })}
			<Span
				class={`flex h-full w-full items-center justify-center rounded-md ${scheduledDates.value.includes(date) ? 'bg-primary-700 text-white' : ''}`}
				title={scheduledDates.value.includes(date)
					? 'Basketball scheduled'
					: 'No basketball scheduled'}
			>
				{#if pendingDate === date}<Spinner class="size-4" />{:else}{day}{/if}
			</Span>
		{/snippet}
	</WindCalendar>
	<P class="text-sm text-gray-600 dark:text-gray-400">
		Maroon dates have basketball scheduled.{#if isEditable}
			Click a date to add or remove basketball.{/if}
	</P>
	{#if isLoading}<P role="status" class="text-sm">Loading schedule...</P>{/if}
	{#if error}
		<P role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</P>
		{#if error.startsWith('Could not load')}<Button type="button" onclick={load}>Retry</Button>{/if}
	{/if}
</Div>
