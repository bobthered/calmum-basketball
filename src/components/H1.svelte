<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLHeadingElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLHeadingElement | null;
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

<h1 {...restProps} bind:this={element} class={twMerge('text-5xl font-bold', className)} {style}>
	{#if children}
		{@render children()}
	{/if}
</h1>
