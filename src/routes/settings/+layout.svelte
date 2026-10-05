<script lang="ts">
	// Imports
	import { A, Div, H1 } from '#components';
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
		const isSettings = (path?: string) => path === '/settings' || path?.startsWith('/settings/');
		if (!from || !to || from === to || !isSettings(from) || !isSettings(to)) return;
		if (
			!document.startViewTransition ||
			!matchMedia('(max-width: 1023px)').matches ||
			matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			return;
		activeTransition?.skipTransition();
		document.documentElement.dataset.settingsDirection = to === '/settings' ? 'back' : 'forward';
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
						delete document.documentElement.dataset.settingsDirection;
						activeTransition = undefined;
					}
				});
		});
	});
</script>

<Div
	class="settings-page flex w-full grow flex-col bg-gray-50 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] lg:grow-0 lg:p-0 dark:bg-gray-950"
>
	<Div class="flex w-full max-w-xl flex-col gap-6">
		{#if page.url.pathname !== '/settings'}
			<A href="/settings" variants={['button.base']} class="self-start">Back to Settings</A>
		{/if}
		<H1>Settings</H1>
		{@render children()}
	</Div>
</Div>

<style>
	@media (max-width: 1023px) and (prefers-reduced-motion: no-preference) {
		:global(.settings-page) {
			view-transition-name: settings-page;
		}
	}
</style>
