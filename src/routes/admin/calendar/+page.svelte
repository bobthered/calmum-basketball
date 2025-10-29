<script lang="ts">
	import { H1 } from '$components';
	import Calendar from '../../calendar/Calendar.svelte';

	// $state
	let date = $state(new Date());
</script>

<H1>Admin - Calendar</H1>
<Calendar bind:date isEditable={true} />
