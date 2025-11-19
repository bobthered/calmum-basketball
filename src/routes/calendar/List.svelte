<script lang="ts">
	import { type Snippet } from 'svelte';
	import { Card, Div } from '$components';
	import { scheduledDates } from '$lib/state';

	type Props = {
		children?: Snippet;
	};

	let { children }: Props = $props();

	// $derives
	const listDatesMap = $derived.by(() =>
		scheduledDates.value
			.map((dateString) => {
				const [year, month, day] = dateString.split('-').map(Number);
				const date = new Date(year, month - 1, day);
				date.setUTCHours(24);
				return date;
			})
			.filter((date) => date.getTime() >= new Date().getTime())
			.sort((a, b) => a.getTime() - b.getTime())
			.reduce((map, date) => {
				const key = `${date.getFullYear()}-${date.getMonth().toString().padStart(2, '0')}`;
				if (!map.has(key)) {
					const month = date.toLocaleString('default', { month: 'long' });
					map.set(key, { dates: [], month });
				}
				const keyValue = map.get(key);
				if (keyValue) {
					keyValue.dates.push(date);
					map.set(key, keyValue);
				}
				return map;
			}, new Map<string, { dates: Date[]; month: string }>())
	);
	const listDates = $derived.by(() => [...listDatesMap].sort((a, b) => a[0].localeCompare(b[0])));
</script>

<Card class="space-y-6 overflow-auto lg:mr-auto lg:min-w-sm">
	{#if children}
		{@render children()}
	{:else}
		{#each listDates as [_, { dates, month }]}
			<Div class="flex flex-col">
				<Div class="text-lg font-semibold">{month}</Div>
				{#each dates as listDate}
					<Div
						>{listDate.toLocaleString('default', {
							month: 'long',
							day: 'numeric',
							weekday: 'long'
						})}</Div
					>
				{/each}
			</Div>
		{/each}
	{/if}
</Card>
