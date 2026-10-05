<script lang="ts">
	// Imports
	import { Dialog } from '#components';
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';

	// Types
	type Props = Omit<HTMLDialogAttributes, 'open' | 'class'> & {
		children?: Snippet;
		class?: string;
		dismissible?: boolean;
		isOpen?: boolean;
		snippet?: Snippet;
	};

	// Helper functions
	const preserveRequiredChoice = (node: HTMLDialogElement) => {
		const cancel = (event: Event) => {
			if (!dismissible) {
				event.preventDefault();
				event.stopImmediatePropagation();
			}
		};
		// SvelteWind's Dialog handles Escape internally. Intercept it for login,
		// loading, and notification dialogs that require an explicit action.
		node.addEventListener('cancel', cancel, { capture: true });
		return () => node.removeEventListener('cancel', cancel, { capture: true });
	};

	// $props
	let {
		children,
		dismissible = false,
		isOpen = $bindable(false),
		snippet,
		...restProps
	}: Props = $props();
</script>

<Dialog {...restProps} bind:isVisible={isOpen} {@attach preserveRequiredChoice}>
	{#if snippet}{@render snippet()}
	{:else if children}{@render children()}{/if}
</Dialog>
