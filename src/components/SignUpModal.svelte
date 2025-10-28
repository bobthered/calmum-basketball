<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { browser } from '$app/environment';
	import {
		BasketballIcon,
		Button,
		Card,
		Div,
		Form,
		FormControl,
		H1,
		Input,
		Modal,
		SubmitButton
	} from '$components';
	import { slide } from '$lib/transition';
	import { findCurrentUser } from '$lib/remote/find-current-user.remote';
	import { signUp } from '$lib/remote/sign-up.remote';
	import { user } from '$lib/user';
	import { signIn } from '$lib/remote/sign-in.remote';

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
	let isPending = $state(false);
	let firstName = $state('');
	let lastName = $state('');
	let password = $state('');
	let username = $state('');

	const updateUser = async (_id: string) => {
		const result = await findCurrentUser({ _id });
		user.value = {
			_id: result.user._id,
			firstName: result.user.firstName,
			isAdmin: result.user.isAdmin,
			lastName: result.user.lastName,
			username: result.user.username
		};
	};

	// $effects
	$effect(() => {
		if (browser) {
			if (user.value === null) {
				const _id = localStorage.getItem('_id');
				if (!_id) isOpen = true;
				if (_id) {
					updateUser(_id);
				}
			}
		}
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
	{#snippet snippet()}
		<Card class="mx-auto my-auto flex w-full max-w-sm flex-col overflow-auto p-0">
			{#if formDisplay === 'Sign Up'}
				{@render signUpSnippet()}
			{:else}
				{@render signInSnippet()}
			{/if}
		</Card>
	{/snippet}
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
				if (signIn.result.success) {
					const userObject = {
						_id: signIn.result._doc._id,
						firstName: signIn.result._doc.firstName,
						isAdmin: signIn.result._doc.isAdmin,
						lastName: signIn.result._doc.lastName,
						username: signIn.result._doc.username
					};
					localStorage.setItem('_id', signIn.result._doc._id);
					user.value = userObject;
					isOpen = false;
				}
			} catch (err: any) {
				isPending = false;
				const {
					body: { message }
				} = err;
				errorMessage = message;
			}
		})}
	>
		<BasketballIcon class="mx-auto aspect-square h-20 w-20 text-primary-500" />
		<H1 class="text-center text-4xl">Sign In</H1>
		<Div class="flex flex-col space-y-4 overflow-auto p-4">
			<FormControl label="Username">
				<Input
					bind:value={username}
					class="bg-gray-50 dark:bg-gray-950"
					name="username"
					required={true}
				/>
			</FormControl>
			<FormControl label="Password">
				<Input
					bind:value={password}
					class="bg-gray-50 dark:bg-gray-950"
					name="password"
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
				if (signUp.result.success) {
					const userObject = {
						_id: signUp.result._doc._id,
						firstName: signUp.result._doc.firstName,
						isAdmin: signUp.result._doc.isAdmin,
						lastName: signUp.result._doc.lastName,
						username: signUp.result._doc.username
					};
					localStorage.setItem('_id', signUp.result._doc._id);
					user.value = userObject;
					isOpen = false;
				}
			} catch (err: any) {
				isPending = false;
				const {
					body: { message }
				} = err;
				errorMessage = message;
			}
		})}
	>
		<BasketballIcon class="mx-auto aspect-square h-20 w-20 shrink-0 text-primary-500" />
		<H1 class="text-center text-4xl">Sign Up</H1>
		<Div class="flex flex-col space-y-4 overflow-auto p-4">
			<FormControl label="First Name">
				<Input
					bind:value={firstName}
					class="bg-gray-50 dark:bg-gray-950"
					name="firstName"
					required={true}
				/>
			</FormControl>
			<FormControl label="Last Name">
				<Input
					bind:value={lastName}
					class="bg-gray-50 dark:bg-gray-950"
					name="lastName"
					required={true}
				/>
			</FormControl>
			<FormControl label="Username">
				<Input
					bind:value={username}
					class="bg-gray-50 dark:bg-gray-950"
					name="username"
					readonly={true}
					required={true}
					tabindex={-1}
				/>
			</FormControl>
			<FormControl label="Password">
				<Input
					bind:value={password}
					class="bg-gray-50 dark:bg-gray-950"
					name="password"
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
