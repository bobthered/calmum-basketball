<script>
	import { Calendar, Users, ChevronRight } from '@lucide/svelte';
	import { A, Card, H1 } from '#components';
	const sections = [
		{
			href: '/admin/users',
			Icon: Users,
			title: 'Users',
			description: 'Manage players and administrator access.'
		},
		{
			href: '/admin/calendar',
			Icon: Calendar,
			title: 'Calendar',
			description: 'Add or remove basketball dates.'
		}
	];
</script>

<svelte:head><title>Admin | Cal-Mum Rec. Basketball</title></svelte:head>
<H1>Admin</H1>
<p class="text-sm text-gray-600 dark:text-gray-400">Manage users and the basketball schedule.</p>
<Card class="w-full max-w-xl gap-2">
	{#each sections as { href, Icon, title, description }, index}
		{#if index > 0}<hr class="border-0 border-t border-gray-200 dark:border-gray-700" />{/if}
		<A
			{href}
			variants={['ghost']}
			class="flex items-center gap-3 rounded-lg p-3 text-gray-950 hover:bg-gray-100 dark:text-gray-50 dark:hover:bg-gray-800"
		>
			<Icon class="size-5 shrink-0" aria-hidden="true" />
			<span class="flex-1"
				><span class="block font-semibold">{title}</span><span
					class="block text-sm text-gray-600 dark:text-gray-400">{description}</span
				></span
			>
			<ChevronRight class="size-5 shrink-0" aria-hidden="true" />
		</A>
	{/each}
</Card>
