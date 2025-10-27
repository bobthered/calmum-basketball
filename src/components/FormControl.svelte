<script lang="ts">
	import { Div, Label } from '$components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: null;
		label?: string;
		labelSnippet?: Snippet;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		label,
		labelSnippet,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div {...restProps} bind:element class={twMerge('flex flex-col', className)} {style}>
	{#if labelSnippet}
		{@render labelSnippet()}
	{:else if label}
		<Label>{label}</Label>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</Div>
