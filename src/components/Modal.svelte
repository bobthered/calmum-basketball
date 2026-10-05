<script lang="ts">
	import { Dialog } from '#components';
	import type { Snippet } from 'svelte';
	import type { HTMLDialogAttributes } from 'svelte/elements';

	type Props = Omit<HTMLDialogAttributes, 'open' | 'class'> & {
		class?: string;
		children?: Snippet;
		snippet?: Snippet;
		isOpen?: boolean;
		dismissible?: boolean;
	};
	let {
		children,
		snippet,
		isOpen = $bindable(false),
		dismissible = false,
		...restProps
	}: Props = $props();
	function preserveRequiredChoice(node: HTMLDialogElement) {
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
	}
</script>

<Dialog {...restProps} bind:isVisible={isOpen} {@attach preserveRequiredChoice}>
	{#if snippet}{@render snippet()}
	{:else if children}{@render children()}{/if}
</Dialog>
