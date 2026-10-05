<script lang="ts">
	// Imports
	import Calendar from './Calendar.svelte';
	import List from './List.svelte';
	import { H1, Tabs } from '#components';

	// Constants
	const views = [
		{ title: 'Month', value: 'Month' },
		{ title: 'List', value: 'List' }
	];

	// $state
	let view = $state('Month');
</script>

<H1>Calendar</H1>
<Tabs tabs={views} bind:value={view} class="self-start" aria-label="Calendar view" />
{#if view === 'Month'}
	<Calendar />
{:else if view === 'List'}
	<List />
{/if}
