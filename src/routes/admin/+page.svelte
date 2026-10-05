<script lang="ts">
	// Imports
	import { Calendar, ChevronRight, Users } from '@lucide/svelte';
	import { A, Card, H1, Hr, Span } from '#components';

	// Constants
	const sections = [
		{
			description: 'Manage players and administrator access.',
			href: '/admin/users',
			Icon: Users,
			title: 'Users'
		},
		{
			description: 'Add or remove basketball dates.',
			href: '/admin/calendar',
			Icon: Calendar,
			title: 'Calendar'
		}
	];
</script>

<svelte:head><title>Admin | Cal-Mum Rec. Basketball</title></svelte:head>
<H1>Admin</H1>
<Card class="w-full max-w-xl gap-2">
	{#each sections as { href, Icon, title, description }, index}
		{#if index > 0}<Hr class="border-0 border-t border-gray-200 dark:border-gray-700" />{/if}
		<A
			{href}
			variants={['ghost']}
			class="flex items-center gap-3 rounded-lg p-3 text-gray-950 hover:bg-gray-100 dark:text-gray-50 dark:hover:bg-gray-800"
		>
			<Icon class="size-5 shrink-0" aria-hidden="true" />
			<Span class="flex-1"
				><Span class="block font-semibold">{title}</Span><Span
					class="block text-sm text-gray-600 dark:text-gray-400">{description}</Span
				></Span
			>
			<ChevronRight class="size-5 shrink-0" aria-hidden="true" />
		</A>
	{/each}
</Card>
