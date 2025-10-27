<script lang="ts">
	import ThumbsUp from '@lucide/svelte/icons/thumbs-up';
	import { type Snippet } from 'svelte';
	import { slide } from 'svelte/transition';
	import { twMerge } from 'tailwind-merge';
	import { Button, Div } from '$components';
	import { copyToClipboard } from '$lib/copyToClipboard';

	type Props = {
		children?: Snippet;
		class?: string;
		copyContents: string;
		element?: HTMLButtonElement | null;
		onsuccess?: () => Promise<any>;
		style?: string;
		variants?: string[];
	};
	let {
		children,
		class: className,
		copyContents,
		element = $bindable(null),
		onsuccess = async () => {
			isSuccessful = true;
			setTimeout(() => {
				isSuccessful = false;
			}, 2000);
		},
		style,
		variants = [],
		...restProps
	}: Props = $props();

	let isSuccessful = $state(false);
</script>

<Button
	{...restProps}
	bind:element
	class={twMerge(className)}
	onclick={() => copyToClipboard({ contents: copyContents, onsuccess })}
	{style}
>
	<Div class="flex items-center space-x-2">
		<Div>
			{#if children}
				{@render children()}
			{:else}
				Copy
			{/if}
		</Div>
		{#if isSuccessful}
			<div transition:slide={{ axis: 'x', duration: 200 }}>
				<ThumbsUp />
			</div>
		{/if}
	</Div>
</Button>
