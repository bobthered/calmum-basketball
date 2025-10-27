<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLInputElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLInputElement | null;
		readonly?: boolean;
		style?: string;
		type?: string;
		value?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		readonly,
		style,
		type,
		value = $bindable(''),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<input
	{...restProps}
	bind:this={element}
	bind:value
	class={twMerge(
		'rounded bg-white px-6 py-3 shadow-sm outline-2 outline-transparent transition duration-200 hover:outline-gray-950/30 focus:outline-primary-500 dark:bg-gray-900 dark:hover:outline-gray-50/30 dark:focus:outline-primary-500',
		className
	)}
	{readonly}
	{style}
	{type}
/>
