<script lang="ts">
	// Imports
	import { Field, Label } from '#components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';

	// Types
	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: null;
		for?: string;
		label?: string;
		labelSnippet?: Snippet;
		style?: string;
		variants?: string[];
	};

	// $props
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		for: htmlFor,
		label,
		labelSnippet,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Field {...restProps} bind:element class={twMerge('flex flex-col', className)} {style}>
	{#if labelSnippet}
		{@render labelSnippet()}
	{:else if label}
		<Label for={htmlFor}>{label}</Label>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</Field>
