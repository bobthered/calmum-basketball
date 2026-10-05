<script lang="ts">
	import { onMount, tick, untrack } from 'svelte';
	import { Button, Form, H1, Textarea } from '#components';
	import {
		groupMessages,
		olderGroupMessages,
		sendGroupMessage
	} from '#lib/remote/messages.remote.js';
	import { user } from '#lib/state/index.js';
	import { mergeMessages, type ChatMessage } from '#lib/types/messages.js';

	const live = groupMessages();
	let received: ChatMessage[] = $state([]);
	let sent: ChatMessage[] = $state([]);
	let history: ChatMessage[] = $state([]);
	let text = $state('');
	let sending = $state(false);
	let loadingOlder = $state(false);
	let hasMore = $state(false);
	let initialized = $state(false);
	let sendError = $state('');
	let historyError = $state('');
	let pending: { text: string; clientId: string } | null = $state(null);
	let scrollArea: HTMLDivElement;
	let composer: HTMLTextAreaElement | null = $state(null);
	const messages = $derived(mergeMessages(history, received, sent));
	const errorText = (err: unknown, fallback: string) =>
		err instanceof Error ? err.message : fallback;

	$effect(() => {
		const current = live.current;
		if (current)
			untrack(() => {
				received = mergeMessages(received, current.messages);
				if (!initialized) {
					hasMore = current.hasMore;
					initialized = true;
				}
			});
	});
	$effect(() => {
		if (initialized && !live.connected && !live.error) {
			const timer = setTimeout(() => {
				void live.reconnect();
			}, 1000);
			return () => clearTimeout(timer);
		}
	});
	$effect(() => {
		const latestId = messages.at(-1)?.id;
		if (latestId)
			untrack(() => {
				const atBottom =
					!scrollArea ||
					scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 160;
				if (atBottom)
					void tick().then(() => scrollArea?.scrollTo({ top: scrollArea.scrollHeight }));
			});
	});
	onMount(() => {
		const reconnect = () => {
			if (document.visibilityState === 'visible') void live.reconnect();
		};
		document.addEventListener('visibilitychange', reconnect);
		return () => document.removeEventListener('visibilitychange', reconnect);
	});
	async function send(event: SubmitEvent) {
		event.preventDefault();
		if (sending || !text.trim()) return;
		const draft = text.trim();
		if (!pending || pending.text !== draft)
			pending = { text: draft, clientId: crypto.randomUUID() };
		sending = true;
		sendError = '';
		try {
			const saved = await sendGroupMessage(pending);
			sent = mergeMessages(sent, [saved]);
			text = '';
			pending = null;
			await tick();
			scrollArea?.scrollTo({ top: scrollArea.scrollHeight });
			composer?.focus();
		} catch (err) {
			sendError = errorText(err, 'Could not send. Your message is still here; try again.');
		} finally {
			sending = false;
		}
	}
	async function loadOlder() {
		const first = messages[0];
		if (!first || loadingOlder) return;
		loadingOlder = true;
		historyError = '';
		const height = scrollArea.scrollHeight;
		try {
			const result = await olderGroupMessages({ id: first.id, createdAt: first.createdAt });
			history = mergeMessages(history, result.messages);
			hasMore = result.hasMore;
			await tick();
			scrollArea.scrollTop += scrollArea.scrollHeight - height;
		} catch (err) {
			historyError = errorText(err, 'Could not load older messages.');
		} finally {
			loadingOlder = false;
		}
	}
</script>

<svelte:head><title>Basketball Chat | Cal-Mum Rec. Basketball</title></svelte:head>

<div class="flex min-h-0 flex-1 flex-col gap-4">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<H1>Basketball Chat</H1>
		<span class="text-sm text-gray-600 dark:text-gray-400" role="status">
			{live.connected ? 'Live' : 'Reconnecting...'}
		</span>
	</div>
	<p class="text-sm text-gray-600 dark:text-gray-400">
		A group conversation for everyone playing basketball.
	</p>
	{#if live.error}
		<div role="alert" class="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
			<p>Could not connect to chat. {live.error.message}</p>
			<Button onclick={() => live.reconnect()}>Reconnect</Button>
		</div>
	{/if}
	<div
		bind:this={scrollArea}
		class="min-h-48 flex-1 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-3 dark:bg-gray-950"
		aria-label="Group messages"
	>
		{#if hasMore}<Button class="mx-auto block" disabled={loadingOlder} onclick={loadOlder}
				>{loadingOlder ? 'Loading...' : 'Load older messages'}</Button
			>{/if}
		{#if historyError}<p role="alert" class="text-red-600 dark:text-red-400">{historyError}</p>{/if}
		{#if !initialized}<p role="status">Loading messages...</p>
		{:else if messages.length === 0}<p class="py-6 text-center text-gray-500">
				No messages yet. Start the conversation!
			</p>{/if}
		{#each messages as message (message.id)}
			<article
				id={`message-${message.id}`}
				class={`max-w-[90%] rounded-lg p-3 ${message.senderId === user.value?._id ? 'ml-auto bg-primary-700 text-white' : 'mr-auto bg-white shadow-sm dark:bg-gray-800'}`}
			>
				<div class="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<span class="text-sm font-semibold">{message.senderName}</span>
					<time datetime={message.createdAt} class="text-xs opacity-70"
						>{new Date(message.createdAt).toLocaleString(undefined, {
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit'
						})}</time
					>
				</div>
				<p class="break-words whitespace-pre-wrap">{message.text}</p>
			</article>
		{/each}
	</div>
	<Form onsubmit={send} class="flex shrink-0 flex-col gap-2">
		<label for="group-message" class="sr-only">Message to the group</label>
		<Textarea
			bind:element={composer}
			bind:value={text}
			id="group-message"
			rows={2}
			maxlength={2000}
			disabled={sending}
			placeholder="Message the group"
			class="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 focus:outline-primary-700 dark:border-gray-700 dark:bg-gray-900"
		></Textarea>
		<div class="flex items-center justify-between gap-3">
			<span class="text-xs text-gray-500">{text.length}/2000</span>
			<Button type="submit" class="bg-primary-700 text-white" disabled={sending || !text.trim()}
				>{sending ? 'Sending...' : 'Send'}</Button
			>
		</div>
		{#if sendError}<p role="alert" class="text-sm text-red-600 dark:text-red-400">
				{sendError}
			</p>{/if}
	</Form>
</div>
