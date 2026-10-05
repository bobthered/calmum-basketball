<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import type { HTMLAttributes } from 'svelte/elements';
	import { browser } from '$app/env';
	import {
		BasketballIcon,
		Button,
		Div,
		Form,
		FormControl,
		H1,
		Input,
		Modal,
		SubmitButton
	} from '#components';
	import { slide } from '#lib/transition/index.js';
	import { currentSession, migrateLegacyLogin } from '#lib/remote/session.remote.js';
	import { signUp } from '#lib/remote/sign-up.remote.js';
	import { user } from '#lib/state/user/index.js';
	import { signIn } from '#lib/remote/sign-in.remote.js';

	type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style'> & {
		attachments?: Attachment[];
		children?: Snippet;
		class?: string;
		element?: HTMLDivElement | null;
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

	// $state
	let errorMessage: string | null = $state(null);
	let formDisplay: 'Sign In' | 'Sign Up' = $state('Sign Up');
	let isOpen = $state(false);
	let restored = $state(false);
	let isPending = $state(false);
	let firstName = $state('');
	let lastName = $state('');
	let password = $state('');
	let username = $state('');

	onMount(() => {
		void (async () => {
			try {
				let account = await currentSession();
				const legacyId = localStorage.getItem('_id');
				if (!account && legacyId) account = await migrateLegacyLogin(legacyId);
				if (account) {
					user.value = account;
					localStorage.removeItem('_id');
					isOpen = false;
				} else isOpen = true;
			} catch (err) {
				errorMessage =
					err instanceof Error ? err.message : 'Could not restore your sign-in. Please try again.';
				isOpen = true;
			} finally {
				restored = true;
			}
		})();
	});
	$effect(() => {
		if (restored && browser && !user.value) isOpen = true;
	});
	$effect(() => {
		const firstNameValue = firstName;
		const lastNameValue = lastName;
		untrack(() => {
			username = `${firstNameValue?.[0] ?? ''}${lastNameValue}`.toLowerCase();
		});
	});
</script>

<Modal bind:isOpen>
	{#if formDisplay === 'Sign Up'}
		{@render signUpSnippet()}
	{:else}
		{@render signInSnippet()}
	{/if}
</Modal>

{#snippet signInSnippet()}
	<Form
		class="flex flex-col space-y-6 overflow-auto py-4"
		{...signIn.enhance(async ({ submit }) => {
			try {
				errorMessage = null;
				isPending = true;
				await submit();
				isPending = false;
				if (signIn.result?.success) {
					user.value = signIn.result.user;
					localStorage.removeItem('_id');
					isOpen = false;
				}
			} catch (err: any) {
				isPending = false;
				errorMessage = err?.body?.message ?? err?.message ?? 'Please try again.';
			}
		})}
	>
		<BasketballIcon class="mx-auto aspect-square h-20 w-20 text-primary-500" />
		<H1 class="text-center text-4xl">Sign In</H1>
		<Div class="flex flex-col space-y-4 overflow-auto p-4">
			<FormControl label="Username">
				<Input
					{...signIn.fields.username.as('text')}
					bind:value={username}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
				/>
			</FormControl>
			<FormControl label="Password">
				<Input
					{...signIn.fields.password.as('password')}
					bind:value={password}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
					type="password"
				/>
			</FormControl>
		</Div>
		{#if errorMessage}
			<div class="px-4 text-red-500" transition:slide={{ axis: 'y', duration: 200 }}>
				{errorMessage}
			</div>
		{/if}
		<Div class="flex flex-col px-4">
			<SubmitButton bind:isPending class="">Sign In</SubmitButton>
			<Div class="text-center">Or</Div>
			<Button
				type="button"
				class="bg-gray-50 text-primary-700 shadow-sm dark:bg-gray-950"
				onclick={() => {
					errorMessage = null;
					formDisplay = 'Sign Up';
				}}>Sign Up</Button
			>
		</Div>
	</Form>
{/snippet}
{#snippet signUpSnippet()}
	<Form
		class="flex flex-col space-y-6 overflow-auto py-4"
		{...signUp.enhance(async ({ submit }) => {
			try {
				errorMessage = null;
				isPending = true;
				await submit();
				isPending = false;
				if (signUp.result?.success) {
					user.value = signUp.result.user;
					localStorage.removeItem('_id');
					isOpen = false;
				}
			} catch (err: any) {
				isPending = false;
				errorMessage = err?.body?.message ?? err?.message ?? 'Please try again.';
			}
		})}
	>
		<BasketballIcon class="mx-auto aspect-square h-20 w-20 shrink-0 text-primary-500" />
		<H1 class="text-center text-4xl">Sign Up</H1>
		<Div class="flex flex-col space-y-4 overflow-auto p-4">
			<FormControl label="First Name">
				<Input
					{...signUp.fields.firstName.as('text')}
					bind:value={firstName}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
				/>
			</FormControl>
			<FormControl label="Last Name">
				<Input
					{...signUp.fields.lastName.as('text')}
					bind:value={lastName}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
				/>
			</FormControl>
			<FormControl label="Username">
				<Input
					{...signUp.fields.username.as('text')}
					bind:value={username}
					class="bg-gray-50 dark:bg-gray-950"
					readonly={true}
					required={true}
					tabindex={-1}
				/>
			</FormControl>
			<FormControl label="Password">
				<Input
					{...signUp.fields.password.as('password')}
					bind:value={password}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
					type="password"
				/>
			</FormControl>
		</Div>
		{#if errorMessage}
			<div class="px-4 text-red-500" transition:slide={{ axis: 'y', duration: 200 }}>
				{errorMessage}
			</div>
		{/if}
		<Div class="flex flex-col px-4">
			<SubmitButton bind:isPending class="">Sign Up</SubmitButton>
			<Div class="text-center">Or</Div>
			<Button
				type="button"
				class="bg-gray-50 text-primary-700 shadow-sm dark:bg-gray-950"
				onclick={() => {
					errorMessage = null;
					formDisplay = 'Sign In';
				}}
			>
				Sign In
			</Button>
		</Div>
	</Form>
{/snippet}
