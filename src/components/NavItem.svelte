<script lang="ts">
	import { page } from '$app/state';
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
		'flex flex-col items-center bg-primary-700 px-0 pt-3 pb-[max(env(safe-area-inset-bottom),.75rem)] text-white transition duration-200 hover:bg-primary-800 lg:rounded lg:px-6 lg:pb-3 lg:text-primary-700',
		href === page.url.pathname
			? 'cursor-default bg-primary-800 lg:bg-white lg:hover:bg-white'
			: 'lg:bg-primary-200 lg:hover:bg-primary-100',
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
