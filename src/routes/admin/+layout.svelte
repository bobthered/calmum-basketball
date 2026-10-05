<script lang="ts">
	// Imports
	import { A, Div } from '#components';
	import { onNavigate } from '$app/navigation';
	import { page } from '$app/state';

	// $props
	let { children } = $props();

	// $state
	let activeTransition: ViewTransition | undefined;

	// $effects
	onNavigate((navigation) => {
		const from = navigation.from?.url.pathname;
		const to = navigation.to?.url.pathname;
		const isAdmin = (path?: string) => path === '/admin' || path?.startsWith('/admin/');
		if (!from || !to || from === to || !isAdmin(from) || !isAdmin(to)) return;
		if (
			!document.startViewTransition ||
			!matchMedia('(max-width: 1023px)').matches ||
			matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			return;
		activeTransition?.skipTransition();
		document.documentElement.dataset.adminDirection = to === '/admin' ? 'back' : 'forward';
		return new Promise<void>((resolve) => {
			const transition = document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
			activeTransition = transition;
			void transition.finished
				.catch(() => {})
				.finally(() => {
					if (activeTransition === transition) {
						delete document.documentElement.dataset.adminDirection;
						activeTransition = undefined;
					}
				});
		});
	});
</script>

<Div
	class="admin-page flex w-full grow flex-col bg-gray-50 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] lg:grow-0 lg:p-0 dark:bg-gray-950"
>
	<Div class="flex w-full min-w-0 flex-col gap-6">
		{#if page.url.pathname !== '/admin'}
			<A href="/admin" variants={['button.base']} class="self-start">Back to Admin</A>
		{/if}
		{@render children()}
	</Div>
</Div>

<style>
	@media (max-width: 1023px) and (prefers-reduced-motion: no-preference) {
		:global(.admin-page) {
			view-transition-name: admin-page;
		}
	}
</style>
