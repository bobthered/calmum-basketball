<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLElement | null;
		navItemCount: number;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		navItemCount,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<nav
	{...restProps}
	bind:this={element}
	class={twMerge(
		'grid w-full grid-cols-[repeat(var(--nav-item-count),minmax(0,1fr))] shadow-[-0px_-1px_0px_0px_var(--color-primary-500)] lg:flex lg:justify-end lg:space-x-4 lg:shadow-none',
		className
	)}
	style="--nav-item-count: {navItemCount};"
>
	{#if children}
		{@render children()}
	{/if}
</nav>
