<script lang="ts">
	import { Div } from '$components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLDivElement | null;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div
	{...restProps}
	bind:element
	class={twMerge(
		'flex flex-col rounded bg-white p-4 text-current shadow-sm dark:bg-gray-900',
		className
	)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</Div>
