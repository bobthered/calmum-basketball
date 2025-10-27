<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLButtonElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		disabled?: boolean;
		element?: HTMLButtonElement | null;
		style?: string;
		tabindex?: number;
		type?: 'button' | 'submit' | 'reset' | null;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		disabled,
		element = $bindable(null),
		style,
		tabindex,
		type,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<button
	{...restProps}
	bind:this={element}
	class={twMerge(
		'cursor-pointer rounded bg-primary-700 px-6 py-3 text-white outline-2 outline-transparent transition duration-200 hover:outline-gray-950/30 focus:outline-primary-700/30 dark:outline-transparent dark:hover:outline-gray-50/30 dark:focus:outline-primary-700/30',
		'disabled:cursor-default disabled:bg-gray-500 disabled:text-white disabled:outline-0',
		className
	)}
	{disabled}
	{style}
	{tabindex}
	{type}
>
	{#if children}
		{@render children()}
	{/if}
</button>
