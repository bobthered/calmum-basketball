<script lang="ts">
	import { Main } from '$components';
	import '../app.css';

	let { children } = $props();
</script>

<Main>
	{@render children?.()}
</Main>
