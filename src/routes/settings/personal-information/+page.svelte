<script lang="ts">
	// Imports
	import { Card, Form, FormControl, H2, Input, P, SubmitButton } from '#components';
	import { updateUser } from '#lib/remote/update-user.remote.js';
	import { user } from '#lib/state/index.js';

	// $state
	let isPending = $state(false);

	let saveError = $state('');

	let saveMessage = $state('');

	let tempUser = $state({ _id: '', firstName: '', isAdmin: false, lastName: '', username: '' });

	// $effects
	$effect(() => {
		if (user.value) tempUser = $state.snapshot(user.value);
	});
</script>

<svelte:head><title>Personal information | Cal-Mum Rec. Basketball</title></svelte:head>
{#if user.value}
	<Card class="gap-4">
		<H2 class="text-xl font-semibold">Personal information</H2>
		<P class="text-sm text-gray-600 dark:text-gray-400">Update the name other players see.</P>
		<Form
			class="flex flex-col space-y-6"
			{...updateUser.enhance(async ({ submit }) => {
				try {
					isPending = true;
					saveError = '';
					saveMessage = '';
					await submit();
					if (updateUser?.result?.success) {
						user.value = $state.snapshot(tempUser);
						saveMessage = 'Personal information saved.';
					} else {
						saveError = 'Could not save your information. Please try again.';
					}
				} catch (error) {
					saveError = 'Could not save your information. Please try again.';
				} finally {
					isPending = false;
				}
			})}
		>
			<Input
				{...updateUser.fields._id.as('hidden', tempUser._id)}
				class="sr-only"
				type="hidden"
				value={tempUser._id}
			/>
			<FormControl label="First Name" for="settings-first-name">
				<Input
					id="settings-first-name"
					{...updateUser.fields.firstName.as('text')}
					bind:value={tempUser.firstName}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
				/>
			</FormControl>
			<FormControl label="Last Name" for="settings-last-name">
				<Input
					id="settings-last-name"
					{...updateUser.fields.lastName.as('text')}
					bind:value={tempUser.lastName}
					class="bg-gray-50 dark:bg-gray-950"
					required={true}
				/>
			</FormControl>
			{#if saveMessage}<P role="status" class="text-sm">{saveMessage}</P>{/if}
			{#if saveError}<P role="alert" class="text-sm text-red-600 dark:text-red-400">
					{saveError}
				</P>{/if}
			<SubmitButton bind:isPending class="ml-auto">Save changes</SubmitButton>
		</Form>
	</Card>
{/if}
