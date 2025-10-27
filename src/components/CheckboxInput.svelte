<script lang="ts">
	import { CheckboxInputHandle, Div, Input, Label } from '$components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import RadioInputHandle from './RadioInputHandle.svelte';

	type Props = Omit<HTMLAttributes<HTMLLabelElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		checked?: boolean;
		children?: Snippet;
		class?: string;
		element?: HTMLLabelElement | null;
		inputSnippet?: Snippet;
		handleSnippet?: Snippet;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		checked = $bindable(false),
		children,
		class: className,
		element = $bindable(null),
		inputSnippet,
		handleSnippet,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Label {...restProps} bind:element class={twMerge(className)} {style}>
	{#if inputSnippet}
		{@render inputSnippet()}
	{:else}
		<input bind:checked class="sr-only" type="checkbox" />
	{/if}
	{#if handleSnippet}
		{@render handleSnippet()}
	{:else}
		<CheckboxInputHandle {checked}>
			{#if children}
				{@render children()}
			{/if}
		</CheckboxInputHandle>
	{/if}
</Label>
