<script lang="ts">
	import { Button, Div, Spinner } from '$components';
	import { type Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		children?: Snippet;
		class?: string;
		element?: null;
		isSubmitting: boolean;
		style?: string;
	};
	let {
		children,
		class: className,
		element = $bindable(null),
		isSubmitting = $bindable(false),
		style,
		...restProps
	}: Props = $props();
</script>

<Button
	{...restProps}
	bind:element
	class={twMerge('relative overflow-hidden', className)}
	{style}
	type="submit"
>
	<Div
		class={twMerge(
			'flex h-full w-full items-center justify-center transition duration-200',
			isSubmitting ? 'translate-y-[200%]' : 'translate-y-0'
		)}
	>
		{#if children}
			{@render children()}
		{/if}
	</Div>
	<Div
		class={twMerge(
			'absolute top-0 left-0 flex h-full w-full items-center justify-center transition duration-200',
			isSubmitting ? 'translate-y-0' : 'translate-y-[-200%]'
		)}
	>
		<Spinner />
	</Div>
</Button>
