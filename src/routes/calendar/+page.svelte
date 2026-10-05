<script lang="ts">
	import { H1, Tabs } from '#components';
	import Calendar from './Calendar.svelte';
	import List from './List.svelte';

	// $state
	let view = $state('Month');

	// variables
	const views = [
		{ title: 'Month', value: 'Month' },
		{ title: 'List', value: 'List' }
	];
</script>

<H1>Calendar</H1>
<Tabs tabs={views} bind:value={view} class="self-start" aria-label="Calendar view" />
{#if view === 'Month'}
	<Calendar />
{:else if view === 'List'}
	<List />
{/if}
