<script lang="ts">
	import { FormControl, H1, RadioGroup, RadioInput } from '$components';
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
	<RadioGroup class="self-start">
		{#each views as value}
			<RadioInput bind:group={view} {value} />
		{/each}
	</RadioGroup>
</FormControl>
{#if view === 'Month'}
	<Calendar />
{:else if view === 'List'}
	<List />
{/if}
