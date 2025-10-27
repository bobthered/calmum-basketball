<script lang="ts">
	import { Div } from '$components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { quadInOut } from 'svelte/easing';
	import { type TransitionConfig } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: null;
		isOpen?: boolean;
		position?: (typeof positions)[number][0];
		style?: string;
		triggerSnippet?: Snippet;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		isOpen = $bindable(false),
		position = $bindable('bottom-right'),
		style,
		triggerSnippet,
		variants = [],
		...restProps
	}: Props = $props();

	const customTransition = (
		_: HTMLDivElement,
		{ duration }: { duration: number }
	): TransitionConfig => {
		return {
			duration,
			css: (t) => {
				const eased = quadInOut(t);

				if (outerWidth < 1024) {
					return `
					transform: translate(0, ${(1 - eased) * 100}%)`;
				} else {
					const scaleMinimum = 0.95;

					return `
                    opacity: ${eased};
					transform: scale(${scaleMinimum + eased * (1 - scaleMinimum)});
                `;
				}
			}
		};
	};
	let outerWidth: number = $state(0);
	const positions = [
		['bottom', ''],
		['bottom-left', ''],
		['bottom-right', 'lg:-bottom-2 lg:right-0 lg:origin-top-right lg:translate-y-full'],
		['left', ''],
		['right', ''],
		['top', ''],
		['top-left', ''],
		['top-right', '']
	] as const;
	const positionsMap = new Map(positions);
</script>

<svelte:window bind:outerWidth />

<Div {...restProps} bind:element class={twMerge('relative', className)} {style}>
	{#if triggerSnippet}
		{@render triggerSnippet()}
	{/if}
	{#if isOpen}
		<div
			class={twMerge(
				'fixed bottom-12 left-0 z-1 max-h-[calc(100vh-6rem)] max-w-full min-w-full origin-bottom lg:absolute lg:left-auto lg:max-w-max',
				positionsMap.get(position)
			)}
			transition:customTransition={{ duration: 200 }}
		>
			{#if children}
				{@render children()}
			{/if}
		</div>
	{/if}
</Div>
