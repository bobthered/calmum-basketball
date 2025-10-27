<script lang="ts">
	import { type Snippet } from 'svelte';
	import { type Attachment } from 'svelte/attachments';
	import { type HTMLAttributes } from 'svelte/elements';
	import { twMerge } from 'tailwind-merge';
	import { browser } from '$app/environment';
	import { Button, Card, Div, Form, FormControl, H1, Input, SubmitButton } from '$components';
	import { fade } from '$lib/transition';
	import { signUp } from '$lib/mongoose/signUp.remote';
	import { user } from '$lib/user';

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

	let isInitiated = $state(true);
	let isSubmitting = $state(false);
	let firstName = $state('');
	let lastName = $state('');

	// $effects
	$effect(() => {
		if (browser) {
			const userString = localStorage.getItem('user');
			if (!userString) isInitiated = false;
			if (userString) {
				user.value = JSON.parse(userString);
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
					{...signUp.enhance(async ({ submit }) => {
						try {
							isSubmitting = true;
							await submit();
							isSubmitting = false;
							if (signUp.result.success) {
								const userObject = {
									_id: signUp.result._doc._id,
									firstName: signUp.result._doc.firstName,
									lastName: signUp.result._doc.lastName
								};
								localStorage.setItem('user', JSON.stringify(userObject));
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
					<SubmitButton bind:isSubmitting class="ml-auto">Sign Up</SubmitButton>
				</Form>
			</Card>
		{/if}
	</div>
{/if}
