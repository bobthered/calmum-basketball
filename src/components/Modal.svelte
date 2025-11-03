<script lang="ts">
	import { Card } from '$components';
	import { fade } from '$lib/transition';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLDivElement | null;
		isOpen?: boolean;
		snippet?: Snippet;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		isOpen = $bindable(false),
		snippet,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

{#if isOpen}
	<div
		{...restProps}
		bind:this={element}
		class={twMerge(
			'fixed top-0 left-0 flex h-svh w-svw flex-col overflow-auto bg-black/70 p-4 lg:h-lvh lg:w-lvw',
			className
		)}
		{style}
		transition:fade={{ duration: 200 }}
	>
		{#if snippet}
			{@render snippet()}
		{:else}
			<Card class="mx-auto my-auto flex w-full max-w-sm flex-col overflow-auto">
				{#if children}
					{@render children()}
				{/if}
			</Card>
		{/if}
	</div>
{/if}
