<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLFormElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLFormElement | null;
		onsubmit?: (e: SubmitEvent) => any;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		onsubmit,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<form {...restProps} bind:this={element} class={twMerge(className)} {onsubmit} {style}>
	{#if children}
		{@render children()}
	{/if}
</form>
