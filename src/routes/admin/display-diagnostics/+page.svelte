<script>
	import { onMount } from 'svelte';
	import { Button, Card, H1, Textarea } from '#components';
	import { displayReport } from '#lib/ui/display-diagnostics.js';
	let report = $state('');
	let message = $state('');
	onMount(() => {
		report = displayReport();
	});
	async function copyReport() {
		report = displayReport();
		try {
			await navigator.clipboard.writeText(report);
			message = 'Report copied.';
		} catch {
			message = 'Select and copy the report below.';
		}
	}
</script>

<svelte:head><title>Display check | Cal-Mum Rec. Basketball</title></svelte:head>
<H1>Display check</H1>
<Card class="w-full max-w-xl gap-4">
	<p>
		To investigate the launch gap, fully close and reopen the installed app. Scroll slightly until
		the gap disappears, then return to Admin, open this page, and copy the report.
	</p>
	<Button type="button" class="self-start" onclick={copyReport}>Copy display report</Button>
	{#if message}<p role="status">{message}</p>{/if}
	<label for="display-report" class="text-sm font-semibold">Display report</label>
	<Textarea
		id="display-report"
		value={report}
		readonly
		rows={12}
		class="w-full font-mono text-xs"
	/>
</Card>
