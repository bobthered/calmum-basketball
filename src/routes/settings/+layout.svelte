<script>
	import { page } from '$app/state';
	import { A, H1 } from '#components';
	let { children } = $props();
</script>

<div class="flex w-full max-w-xl flex-col gap-6">
	{#if page.url.pathname !== '/settings'}
		<A href="/settings" class="self-start">Back to Settings</A>
	{/if}
	<H1>Settings</H1>
	{@render children()}
</div>
