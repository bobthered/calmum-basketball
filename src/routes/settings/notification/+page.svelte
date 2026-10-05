<script>
	import NotificationPreferences from '#components/NotificationPreferences.svelte';
	import { user } from '#lib/state/index.js';
</script>

<svelte:head><title>Notifications | Cal-Mum Rec. Basketball</title></svelte:head>
{#if user.value}
	{#key user.value._id}
		<NotificationPreferences userId={user.value._id} />
	{/key}
{/if}
