<script>
	import { page } from '$app/state';
	import { A } from '#components';
	let { children } = $props();
</script>

<div class="flex w-full min-w-0 flex-col gap-6">
	{#if page.url.pathname !== '/admin'}
		<A href="/admin" variants={['button.base']} class="self-start">Back to Admin</A>
	{/if}
	{@render children()}
</div>
