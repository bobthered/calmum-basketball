<script lang="ts">
	import { Div, Input, Label } from '$components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import RadioInputHandle from './RadioInputHandle.svelte';

	type Props = Omit<HTMLAttributes<HTMLLabelElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLLabelElement | null;
		group?: any;
		inputSnippet?: Snippet;
		handleSnippet?: Snippet;
		style?: string;
		value?: any;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		group = $bindable(),
		inputSnippet,
		handleSnippet,
		style,
		value,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Label {...restProps} bind:element class={twMerge(className)} {style}>
	{#if inputSnippet}
		{@render inputSnippet()}
	{:else}
		<input bind:group class="sr-only" type="radio" {value} />
	{/if}
	{#if handleSnippet}
		{@render handleSnippet()}
	{:else}
		<RadioInputHandle {group} {value}>
			{#if children}
				{@render children()}
			{:else}
				{value}
			{/if}
		</RadioInputHandle>
	{/if}
</Label>
