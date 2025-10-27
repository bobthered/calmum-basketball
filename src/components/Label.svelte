<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLLabelElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLLabelElement | null;
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

<label
	{...restProps}
	bind:this={element}
	class={twMerge('text-sm whitespace-nowrap', className)}
	{style}
>
	{#if children}
		{@render children()}
	{/if}
</label>
