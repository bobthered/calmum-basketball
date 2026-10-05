<script lang="ts">
	import { page } from '$app/state';
	import { A, Button, Div } from '#components';
	import { type Component, type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';
	import { isActiveRoute } from '#lib/ui/navigation.js';

	type AnchorProps = BaseProps & { element?: HTMLAnchorElement | null; href: string; tag?: 'a' };
	type BaseProps = {
		active?: boolean;
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		Icon?: Component;
		label: string;
		style?: string | null;
		variants?: string[];
	};
	type ButtonProps = BaseProps & {
		element?: HTMLButtonElement | null;
		onclick?: import('svelte/elements').HTMLButtonAttributes['onclick'];
		tag: 'button';
	};
	type Props = AnchorProps | ButtonProps;
	let {
		active,
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		Icon,
		label,
		style,
		variants = [],
		...restProps
	}: Props = $props();

	// $derived
	const href = $derived.by(() => {
		if ('href' in restProps) return restProps.href;
		return '';
	});
	const tag = $derived.by(() => restProps?.tag ?? 'a');
	const isActive = $derived(active ?? (href !== '' && isActiveRoute(page.url.pathname, href)));
</script>

{#if tag === 'a' && 'href' in restProps}
	<A
		{...restProps}
		bind:element={element as HTMLAnchorElement | null}
		class={twMerge(
			'z-2 flex flex-col items-center bg-primary-700 px-0 pt-3 pb-[max(env(safe-area-inset-bottom),.75rem)] text-white/60 no-underline transition duration-200 hover:bg-primary-800 hover:text-white focus:text-white lg:rounded lg:px-6 lg:pb-3 lg:text-primary-700 dark:text-white/60',
			isActive
				? 'bg-primary-800 font-semibold text-white lg:bg-white lg:hover:bg-white dark:text-white'
				: 'lg:bg-primary-200 lg:hover:bg-primary-100',
			className
		)}
		{href}
		aria-current={isActive ? 'page' : undefined}
		{style}
		title={label}
	>
		{@render childrenSnippet()}
	</A>
{:else if tag === 'button'}
	<Button
		{...restProps}
		bind:element={element as HTMLButtonElement | null}
		aria-current={isActive ? 'location' : undefined}
		class={twMerge(
			'z-2 flex flex-col items-center rounded-none px-0 pb-[max(env(safe-area-inset-bottom),.75rem)] text-white/60 no-underline focus:text-white lg:rounded lg:bg-primary-200 lg:px-6 lg:pb-3 lg:text-primary-700 lg:hover:bg-primary-100 lg:focus:text-primary-700 dark:text-white/60',
			isActive
				? 'bg-primary-800 font-semibold text-white shadow-[inset_0_3px_0_0_var(--color-primary-300)] dark:text-white'
				: '',
			className
		)}
	>
		{@render childrenSnippet()}
	</Button>
{/if}

{#snippet childrenSnippet()}
	{#if children}
		{@render children()}
	{:else}
		{#if Icon}
			<Icon class="lg:hidden" />
		{/if}
		<Div class="text-xs whitespace-nowrap lg:text-base">{label}</Div>
	{/if}
{/snippet}
