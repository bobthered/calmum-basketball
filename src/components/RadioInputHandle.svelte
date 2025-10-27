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
		group?: any;
		style?: string;
		value?: any;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		group,
		style,
		value,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div
	{...restProps}
	bind:element
	class={twMerge(
		'flex cursor-pointer items-center space-x-2 rounded bg-white px-6 py-3 shadow-sm outline-1 transition duration-200 dark:bg-gray-900',
		group === value
			? 'bg-primary-700 text-white dark:bg-primary-700'
			: 'outline-gray-950/10 hover:outline-gray-950/30 dark:outline-gray-50/10 dark:hover:outline-gray-50/30',
		className
	)}
	{style}
>
	<Div
		class={twMerge(
			'h-4 w-4 rounded-full transition duration-200',
			group === value
				? 'bg-primary-700 outline-2 -outline-offset-2 outline-white '
				: 'bg-gray-950/30 dark:bg-gray-50/30'
		)}
	/>
	<Div>
		{#if children}
			{@render children()}
		{/if}
	</Div>
</Div>
