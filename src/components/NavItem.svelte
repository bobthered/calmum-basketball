<script lang="ts">
	import { Div } from '$components';
	import { type Component, type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<HTMLAnchorElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLAnchorElement | null;
		href: string;
		Icon?: Component;
		label: string;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		href,
		Icon,
		label,
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<a
	{...restProps}
	bind:this={element}
	class={twMerge(
		'flex flex-col items-center bg-primary-700 pt-3 pb-[calc(env(safe-area-inset-bottom)+.75rem)] text-white transition duration-200 hover:bg-primary-800 lg:rounded-lg lg:px-6 lg:pb-3',
		className
	)}
	{href}
	{style}
	title={label}
>
	{#if children}
		{@render children()}
	{:else}
		{#if Icon}
			<Icon class="lg:hidden" />
		{/if}
		<Div class="text-xs lg:text-base">{label}</Div>
	{/if}
</a>
