<script lang="ts">
	import Dice4 from '@lucide/svelte/icons/dice-4';
	import Pipette from '@lucide/svelte/icons/pipette';
	// @ts-ignore
	import isDarkColor from 'is-dark-color';
	import { Button, Div, Input } from '$components';
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { twMerge } from 'tailwind-merge';

	type Props = {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		colorSnippet?: Snippet;
		element?: null;
		paletteVariable?: string;
		style?: string;
		value?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		colorSnippet,
		element = $bindable(null),
		paletteVariable,
		style,
		value = $bindable(''),
		variants = [],
		...restProps
	}: Props = $props();
</script>

<Div {...restProps} class={twMerge('relative flex flex-col lg:w-[200px]', className)}>
	{#if children}
		{@render children()}
	{:else}
		<Input
			bind:value
			class={paletteVariable
				? 'focus:outline-(--palette-500) dark:focus:outline-(--palette-500)'
				: undefined}
			placeholder="Add New Color..."
			style={paletteVariable ? `--palette-500: ${paletteVariable};` : undefined}
		/>
	{/if}
	{#if colorSnippet}
		{@render colorSnippet()}
	{:else}
		<Div
			class="absolute top-2 right-2 flex h-8 space-x-2"
			style={paletteVariable ? `--palette-500: ${paletteVariable};` : undefined}
		>
			<Div class="relative">
				<Input
					bind:value
					class={twMerge(
						'h-8 w-8 p-0',
						paletteVariable
							? 'focus:outline-(--palette-500)/30 dark:focus:outline-(--palette-500)/30'
							: undefined
					)}
					type="color"
				/>
				<Button
					class={twMerge(
						'pointer-events-none absolute top-0 left-0 flex h-full w-full items-center justify-center p-0',
						isDarkColor(value) ? 'text-white outline-white/10' : 'text-black outline-black/10',
						paletteVariable
							? 'focus:outline-(--palette-500)/30 dark:focus:outline-(--palette-500)/30'
							: undefined
					)}
					style="background: {value};"
					tabindex={-1}
				>
					<Pipette size={16} />
				</Button>
			</Div>
			<Button
				class={twMerge(
					'flex h-8 w-8 items-center justify-center p-0',
					isDarkColor(value) ? 'text-white outline-white/10' : 'text-black outline-black/10',
					paletteVariable
						? 'focus:outline-(--palette-500)/30 dark:focus:outline-(--palette-500)/30'
						: undefined
				)}
				onclick={() => {
					const n = (Math.random() * 0xfffff * 1000000).toString(16);
					value = '#' + n.slice(0, 6);
				}}
				style="background: {value};"
			>
				<Dice4 size={16} />
			</Button>
		</Div>
	{/if}
</Div>
