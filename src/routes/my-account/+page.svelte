<script>
	import {
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
	import { findOneAndDeleteUser } from '$lib/mongoose/remote/findOneAndDelete/user.remote';
	import { findOneAndUpdateUser } from '$lib/mongoose/remote/findOneAndUpdate/user.remote';
	import { user } from '$lib/user';
	import { TriangleAlert } from '@lucide/svelte';

	// $state
	let isDeleteModalOpen = $state(false);
	let isPending = $state(false);
	let tempUser = $state({ _id: '', firstName: '', isAdmin: false, lastName: '' });

	// $effects
	$effect(() => {
		if (user.value) {
			tempUser = $state.snapshot(user.value);
		}
	});
</script>

<H1>My Account</H1>
{#if user.value}
	<Card class="lg:mr-auto">
		<Form
			class="flex flex-col space-y-6"
			{...findOneAndUpdateUser.enhance(async ({ submit }) => {
				try {
					isPending = true;
					await submit();
					isPending = false;
					if (findOneAndUpdateUser?.result?.success) {
						user.value = $state.snapshot(tempUser);
					}
				} catch (error) {}
			})}
		>
			<Input class="sr-only" name="_id" value={tempUser._id} />
			<FormControl label="First Name">
				<Input
					bind:value={tempUser.firstName}
					class="bg-gray-50 dark:bg-gray-950"
					name="firstName"
					required={true}
				/>
			</FormControl>
			<FormControl label="Last Name">
				<Input
					bind:value={tempUser.lastName}
					class="bg-gray-50 dark:bg-gray-950"
					name="lastName"
					required={true}
				/>
			</FormControl>
			<SubmitButton bind:isPending class="ml-auto">Update</SubmitButton>
		</Form>
	</Card>
	<Button class="bg-red-500" onclick={() => (isDeleteModalOpen = true)}>Delete Account</Button>
{/if}
<Modal bind:isOpen={isDeleteModalOpen}>
	<Div class="flex flex-col items-center space-y-6">
		<TriangleAlert class="text-red-500" size={72} />
		<p>Are you sure you want to delete your account? This cannot be undone.</p>
		<Div class="flex w-full justify-end space-x-4">
			<Button onclick={() => (isDeleteModalOpen = false)}>Cancel</Button>
			<Form
				{...findOneAndDeleteUser.enhance(async ({ submit }) => {
					try {
						isPending = true;
						await submit();
						isPending = false;
						if (findOneAndDeleteUser?.result?.success) {
							localStorage.removeItem('_id');
							user.value = null;
						}
					} catch (error) {}
				})}
			>
				<Input class="sr-only" name="_id" value={user?.value?._id} type="hidden" />
				<SubmitButton bind:isPending class="bg-red-500">Delete</SubmitButton>
			</Form>
		</Div>
	</Div>
</Modal>
