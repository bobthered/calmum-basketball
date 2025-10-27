<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { Div } from '$components';
	import { scale } from 'svelte/transition';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		checked?: boolean;
		children?: Snippet;
		class?: string;
		element?: HTMLDivElement | null;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		checked,
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
	class={twMerge('flex cursor-pointer items-center space-x-2', className)}
	{style}
>
	<Div
		class={twMerge(
			'flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white text-white shadow-sm outline-1 transition duration-200 dark:bg-gray-900',
			checked ? 'bg-primary-700 dark:bg-primary-700' : 'outline-gray-950/10 dark:outline-gray-50/10'
		)}
	>
		{#if checked}
			<div transition:scale={{ duration: 200 }}>
				<Check size={16} />
			</div>
		{/if}
	</Div>
	{#if children}
		<Div>
			{@render children()}
		</Div>
	{/if}
</Div>
