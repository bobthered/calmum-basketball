<script lang="ts">
	import { Card, FormControl, H1, Label, Radio } from '#components';
	import Calendar from './Calendar.svelte';
	import List from './List.svelte';

	// $state
	let date = $state(new Date());
	let view = $state('Month');

	// variables
	const views = ['Month', 'List'];
</script>

<H1>Calendar</H1>
<FormControl label="View">
	<Card class="flex-row gap-4 self-start p-2">
		{#each views as value}
			<Label class="flex cursor-pointer items-center gap-2"
				><Radio bind:group={view} {value} name="calendar-view" />{value}</Label
			>
		{/each}
	</Card>
</FormControl>
{#if view === 'Month'}
	<Calendar />
{:else if view === 'List'}
	<List />
{/if}
