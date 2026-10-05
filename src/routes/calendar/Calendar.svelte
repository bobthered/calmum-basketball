<script lang="ts">
	import { onMount } from 'svelte';
	import { Theme } from 'sveltewind/theme';
	import { theme } from '#lib/ui/theme.js';
	import { Button, Calendar as WindCalendar, Spinner } from '#components';
	import { findCalendar } from '#lib/remote/find-calendar.remote.js';
	import { updateCalendar } from '#lib/remote/update-calendar.remote.js';
	import { calendar, scheduledDates } from '#lib/state/index.js';

	let { isEditable = false }: { isEditable?: boolean } = $props();
	let isLoading = $state(true);
	let error = $state('');
	let pendingDate: string | null = $state(null);
	const month = $derived(
		`${calendar.currentDate.getFullYear()}-${String(calendar.currentDate.getMonth() + 1).padStart(2, '0')}-01`
	);
	const calendarTheme = new Theme($state.snapshot(theme.get.theme()));
	// This is a schedule with multiple highlighted dates, rather than a single-date picker.
	calendarTheme.set.variant('calendarDay', 'selected', '');
	calendarTheme.set.variant('calendarDay', 'disabled', 'cursor-default');

	async function load() {
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
	}
	onMount(() => {
		void load();
	});
	function changeMonth(value: string) {
		const [year, month] = value.split('-').map(Number);
		calendar.currentDate = new Date(year, month - 1, 1);
	}
	async function toggleDate(date: string) {
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
	}
</script>

<div class="relative w-full max-w-sm space-y-3 lg:mr-auto">
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
			<span
				class={`flex h-full w-full items-center justify-center rounded-md ${scheduledDates.value.includes(date) ? 'bg-primary-700 text-white' : ''}`}
				title={scheduledDates.value.includes(date)
					? 'Basketball scheduled'
					: 'No basketball scheduled'}
			>
				{#if pendingDate === date}<Spinner class="size-4" />{:else}{day}{/if}
			</span>
		{/snippet}
	</WindCalendar>
	<p class="text-sm text-gray-600 dark:text-gray-400">
		Burgundy dates have basketball scheduled.{#if isEditable}
			Click a date to add or remove basketball.{/if}
	</p>
	{#if isLoading}<p role="status" class="text-sm">Loading schedule...</p>{/if}
	{#if error}
		<p role="alert" class="text-sm text-red-600 dark:text-red-400">{error}</p>
		{#if error.startsWith('Could not load')}<Button type="button" onclick={load}>Retry</Button>{/if}
	{/if}
</div>
