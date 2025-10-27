<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';

	type Props = Omit<HTMLAttributes<SVGElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: SVGElement | null;
		style?: string;
		variants?: string[];
	};
	let {
		attachments = $bindable([]),
		children,
		class: className,
		element = $bindable(null),
		style,
		variants = [],
		...restProps
	}: Props = $props();
</script>

<svg
	{...restProps}
	bind:this={element}
	class={twMerge('h-6 w-6', className)}
	fill="currentColor"
	{style}
	viewBox="0 0 24 24"
>
	<path
		d="M10.72,19.9a8,8,0,0,1-6.5-9.79A7.77,7.77,0,0,1,10.4,4.16a8,8,0,0,1,9.49,6.52A1.54,1.54,0,0,0,21.38,12h.13a1.37,1.37,0,0,0,1.38-1.54,11,11,0,1,0-12.7,12.39A1.54,1.54,0,0,0,12,21.34h0A1.47,1.47,0,0,0,10.72,19.9Z"
	>
		<animateTransform
			attributeName="transform"
			type="rotate"
			dur="0.75s"
			values="0 12 12;360 12 12"
			repeatCount="indefinite"
		/>
	</path>
</svg>
