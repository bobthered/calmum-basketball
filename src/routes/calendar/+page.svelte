<script lang="ts">
	import { Div, FormControl, H1, RadioInput } from '$components';
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
	<Div class="flex space-x-2">
		{#each views as value}
			<RadioInput bind:group={view} {value} />
		{/each}
	</Div>
</FormControl>
{#if view === 'Month'}
	<Calendar />
{:else if view === 'List'}
	<List />
{/if}
