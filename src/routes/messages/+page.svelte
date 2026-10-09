<script lang="ts">
	// Imports
	import { Article, Button, Div, Form, H1, Label, P, Span, Textarea, Time } from '#components';
	import {
		groupMessages,
		olderGroupMessages,
		sendGroupMessage
	} from '#lib/remote/messages.remote.js';
	import { user } from '#lib/state/index.js';
	import { type ChatMessage, mergeMessages } from '#lib/types/messages.js';
	import { onMount, tick, untrack } from 'svelte';

	// Constants
	const live = groupMessages();

	// Helper functions
	const errorText = (err: unknown, fallback: string) =>
		err instanceof Error ? err.message : fallback;

	const loadOlder = async () => {
		const first = messages[0];
		if (!first || loadingOlder) return;
		loadingOlder = true;
		historyError = '';
		const height = scrollArea?.scrollHeight ?? 0;
		try {
			const result = await olderGroupMessages({ createdAt: first.createdAt, id: first.id });
			history = mergeMessages(history, result.messages);
			hasMore = result.hasMore;
			await tick();
			if (scrollArea) scrollArea.scrollTop += scrollArea.scrollHeight - height;
		} catch (err) {
			historyError = errorText(err, 'Could not load older messages.');
		} finally {
			loadingOlder = false;
		}
	};

	const send = async (event: SubmitEvent) => {
		event.preventDefault();
		if (sending || !text.trim()) return;
		const draft = text.trim();
		if (!pending || pending.text !== draft)
			pending = { clientId: crypto.randomUUID(), text: draft };
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
	};

	// $state
	let composer: HTMLTextAreaElement | null = $state(null);

	let hasMore = $state(false);

	let history: ChatMessage[] = $state([]);

	let historyError = $state('');

	let initialized = $state(false);

	let isInitialScrollPending = $state(true);

	let loadingOlder = $state(false);

	let pending: {
		clientId: string;
		text: string;
	} | null = $state(null);

	let received: ChatMessage[] = $state([]);

	let scrollArea: HTMLDivElement | null = $state(null);

	let sendError = $state('');

	let sending = $state(false);

	let sent: ChatMessage[] = $state([]);

	let text = $state('');

	// $derived
	const messages = $derived(mergeMessages(history, received, sent));

	// $effects
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
		const area = scrollArea;
		const latestId = messages.at(-1)?.id;
		if (area && latestId)
			untrack(() => {
				const atBottom = area.scrollHeight - area.scrollTop - area.clientHeight < 160;
				if (isInitialScrollPending || atBottom) {
					isInitialScrollPending = false;
					void tick().then(() => area.scrollTo({ top: area.scrollHeight }));
				}
			});
	});

	onMount(() => {
		const reconnect = () => {
			if (document.visibilityState === 'visible') void live.reconnect();
		};
		document.addEventListener('visibilitychange', reconnect);
		return () => document.removeEventListener('visibilitychange', reconnect);
	});
</script>

<svelte:head><title>Basketball Chat | Cal-Mum Rec. Basketball</title></svelte:head>

<Div class="flex min-h-0 flex-1 flex-col gap-6">
	<Div class="flex flex-wrap items-center justify-between gap-2">
		<H1>Chat</H1>
		<Span class="text-sm text-gray-600 dark:text-gray-400" role="status">
			{live.connected ? 'Live' : 'Reconnecting...'}
		</Span>
	</Div>
	{#if live.error}
		<Div role="alert" class="flex flex-wrap items-center gap-2 text-red-600 dark:text-red-400">
			<P>Could not connect to chat. {live.error.message}</P>
			<Button onclick={() => live.reconnect()}>Reconnect</Button>
		</Div>
	{/if}
	<Div
		bind:element={scrollArea}
		class="min-h-48 flex-1 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-3 dark:bg-gray-950"
		aria-label="Group messages"
	>
		{#if hasMore}<Button class="mx-auto block" disabled={loadingOlder} onclick={loadOlder}
				>{loadingOlder ? 'Loading...' : 'Load older messages'}</Button
			>{/if}
		{#if historyError}<P role="alert" class="text-red-600 dark:text-red-400">{historyError}</P>{/if}
		{#if !initialized}<P role="status">Loading messages...</P>
		{:else if messages.length === 0}<P class="py-6 text-center text-gray-500">
				No messages yet. Start the conversation!
			</P>{/if}
		{#each messages as message (message.id)}
			<Article
				id={`message-${message.id}`}
				class={`max-w-[90%] rounded-lg p-3 ${message.senderId === user.value?._id ? 'ml-auto bg-primary-700 text-white' : 'mr-auto bg-white shadow-sm dark:bg-gray-800'}`}
			>
				<Div class="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
					<Span class="text-sm font-semibold">{message.senderName}</Span>
					<Time datetime={message.createdAt} class="text-xs opacity-70"
						>{new Date(message.createdAt).toLocaleString(undefined, {
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit'
						})}</Time
					>
				</Div>
				<P class="break-words whitespace-pre-wrap">{message.text}</P>
			</Article>
		{/each}
	</Div>
	<Form onsubmit={send} class="flex shrink-0 flex-col gap-2">
		<Label for="group-message" class="sr-only">Message to the group</Label>
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
		<Div class="flex items-center justify-between gap-3">
			<Span class="text-xs text-gray-500">{text.length}/2000</Span>
			<Button type="submit" class="bg-primary-700 text-white" disabled={sending || !text.trim()}
				>{sending ? 'Sending...' : 'Send'}</Button
			>
		</Div>
		{#if sendError}<P role="alert" class="text-sm text-red-600 dark:text-red-400">
				{sendError}
			</P>{/if}
	</Form>
</Div>
