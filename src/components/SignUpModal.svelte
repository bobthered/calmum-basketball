<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { browser } from '$app/environment';
	import { Card, Div, Form, FormControl, H1, Input, SubmitButton } from '$components';
	import { fade } from '$lib/transition';
	import { createUser } from '$lib/mongoose/remote/create/user.remote';
	import { user } from '$lib/user';
	import { findOneUser } from '$lib/mongoose/remote/findOne/user.remote';

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
	let isInitiated = $state(true);
	let isPending = $state(false);
	let firstName = $state('');
	let lastName = $state('');

	const updateUser = async (_id: string) => {
		const result = await findOneUser({ _id });
		user.value = {
			_id: result.user._id,
			firstName: result.user.firstName,
			isAdmin: result.user.isAdmin,
			lastName: result.user.lastName
		};
	};

	// $effects
	$effect(() => {
		if (browser) {
			if (user.value === null) {
				const _id = localStorage.getItem('_id');
				if (!_id) isInitiated = false;
				if (_id) {
					updateUser(_id);
				}
			}
		}
	});
</script>

{#if !isInitiated}
	<div
		{...restProps}
		bind:this={element}
		class={twMerge(
			'fixed top-0 left-0 flex h-screen w-screen flex-col overflow-auto bg-black/70 p-4',
			className
		)}
		{style}
		transition:fade={{ duration: 200 }}
	>
		{#if children}
			{@render children()}
		{:else}
			<Card class="mx-auto my-auto flex w-full max-w-sm flex-col">
				<Form
					class="flex flex-col space-y-6"
					{...createUser.enhance(async ({ submit }) => {
						try {
							isPending = true;
							await submit();
							isPending = false;
							if (createUser.result.success) {
								const userObject = {
									_id: createUser.result._doc._id,
									firstName: createUser.result._doc.firstName,
									isAdmin: createUser.result._doc.isAdmin,
									lastName: createUser.result._doc.lastName
								};
								localStorage.setItem('_id', createUser.result._doc._id);
								user.value = userObject;
								isInitiated = true;
							}
						} catch (error) {}
					})}
				>
					<H1 class="normal-case">Sign Up</H1>
					<Div class="flex flex-col space-y-4">
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
					</Div>
					<SubmitButton bind:isPending class="ml-auto">Sign Up</SubmitButton>
				</Form>
			</Card>
		{/if}
	</div>
{/if}
