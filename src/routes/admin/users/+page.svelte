<script lang="ts">
	// Imports
	import { Pencil, Trash, TriangleAlert } from '@lucide/svelte';
	import {
		Button,
		Card,
		Checkbox,
		Div,
		Form,
		H1,
		H2,
		Input,
		Label,
		Modal,
		P,
		Spinner,
		SubmitButton,
		Table,
		Tbody,
		Td,
		Th,
		Thead,
		Tr
	} from '#components';
	import { deleteUser } from '#lib/remote/delete-user.remote.js';
	import { findUsers } from '#lib/remote/find-users.remote.js';
	import { updateUserField } from '#lib/remote/update-user-field.remote.js';

	// Types
	type Key = 'firstName' | 'isAdmin' | 'lastName' | 'username';

	type User = {
		_id: string;
		firstName: string;
		isAdmin: boolean;
		lastName: string;
		username: string;
	};

	// Constants
	const headings: {
		key: Key;
		label: string;
	}[] = [
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'username', label: 'Username' },
		{ key: 'isAdmin', label: 'isAdmin' }
	];

	// Helper functions
	const saveUser = async (event: SubmitEvent) => {
		event.preventDefault();
		if (!editUser || isSaving) return;
		const draft = { ...editUser };
		isSaving = true;
		editError = '';
		try {
			const result = await updateUserField(draft);
			if (!result.success) throw new Error('Save failed');
			users =
				users
					?.map((user) => (user._id === draft._id ? draft : user))
					.sort((a, b) =>
						(a.firstName + ' ' + a.lastName).localeCompare(b.firstName + ' ' + b.lastName)
					) ?? null;
			isEditOpen = false;
		} catch {
			editError = 'Could not save this user. Please try again.';
		} finally {
			isSaving = false;
		}
	};

	const updateUsers = async () => {
		const result = await findUsers();
		users = result.sort((a: any, b: any) =>
			`${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
		);
	};

	// $state
	let deleteModal: {
		isOpen: boolean;
		isPending: boolean;
		user: User | null;
	} = $state({
		isOpen: false,
		isPending: false,
		user: null
	});

	let editError = $state('');

	let editUser: User | null = $state(null);

	let isEditOpen = $state(false);

	let isSaving = $state(false);

	let users: User[] | null = $state(null);

	// $effects
	$effect(() => {
		updateUsers();
	});
</script>

<H1>Admin - Users</H1>
<Card
	class="w-full max-w-full min-w-0 overflow-x-auto p-0"
	tabindex={0}
	aria-label="User table; scroll horizontally to see all columns"
>
	<Table aria-label="Manage users" class="w-full border-collapse text-left">
		<Thead class="bg-primary-700 text-white"
			><Tr>
				<Th scope="col" class="sticky left-0 bg-primary-700 px-3 py-3">Actions</Th>
				{#each headings as { label }}<Th scope="col" class="px-3 py-3 whitespace-nowrap">{label}</Th
					>{/each}
			</Tr></Thead
		>
		<Tbody>
			{#if users !== null}
				{#each users as user (user._id)}
					<Tr class="border-b border-gray-200 last:border-b-0 dark:border-gray-700">
						<Td class="sticky left-0 bg-white px-3 py-3 dark:bg-gray-900">
							<Div class="flex gap-2">
								<Button
									type="button"
									aria-label={`Edit ${user.username}`}
									class="p-2"
									onclick={() => {
										editUser = { ...user };
										editError = '';
										isEditOpen = true;
									}}><Pencil size={20} /></Button
								>
								<Button
									type="button"
									aria-label={`Delete ${user.username}`}
									class="bg-red-500 p-2"
									onclick={() => {
										deleteModal.isOpen = true;
										deleteModal.user = user;
									}}><Trash size={20} /></Button
								>
							</Div>
						</Td>
						{#each headings as { key }}<Td class="px-3 py-3 whitespace-nowrap"
								>{typeof user[key] === 'boolean' ? (user[key] ? 'Yes' : 'No') : user[key]}</Td
							>{/each}
					</Tr>
				{/each}
			{:else}<Tr><Td colspan={5} class="px-3 py-3"><Spinner /></Td></Tr>{/if}
		</Tbody>
	</Table>
</Card>
<Modal bind:isOpen={isEditOpen}>
	{#snippet snippet()}
		{#if editUser}
			<Card class="mx-auto my-auto w-full max-w-sm overflow-auto">
				<Form onsubmit={saveUser} class="flex flex-col gap-4">
					<H2 class="text-xl font-semibold">Edit user</H2>
					<Label for="edit-first-name">First Name</Label>
					<Input
						id="edit-first-name"
						bind:value={editUser.firstName}
						disabled={isSaving}
						required
					/>
					<Label for="edit-last-name">Last Name</Label>
					<Input id="edit-last-name" bind:value={editUser.lastName} disabled={isSaving} required />
					<Label for="edit-username">Username</Label>
					<Input id="edit-username" bind:value={editUser.username} disabled={isSaving} required />
					<Checkbox
						class="relative"
						aria-label="isAdmin"
						bind:checked={editUser.isAdmin}
						disabled={isSaving}>isAdmin</Checkbox
					>
					{#if editError}<P role="alert" class="text-red-600 dark:text-red-400">{editError}</P>{/if}
					<Div class="flex justify-end gap-2">
						<Button type="button" disabled={isSaving} onclick={() => (isEditOpen = false)}
							>Cancel</Button
						>
						<Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save'}</Button>
					</Div>
				</Form>
			</Card>
		{/if}
	{/snippet}
</Modal>
<Modal bind:isOpen={deleteModal.isOpen}>
	{#snippet snippet()}
		{#if deleteModal.user !== null}
			<Card class="mx-auto my-auto flex w-full max-w-sm flex-col overflow-auto">
				<Form
					class="flex flex-col items-center space-y-6"
					{...deleteUser.enhance(async ({ submit }) => {
						try {
							deleteModal.isPending = true;
							await submit();
							deleteModal.isPending = false;
							deleteModal.isOpen = false;
							if (deleteUser?.result?.success && users !== null) {
								users = users.filter((user) => {
									if (deleteModal.user === null) return true;
									return user._id !== deleteModal.user._id;
								});
							}
						} catch (error) {}
					})}
				>
					<Input
						{...deleteUser.fields._id.as('hidden', deleteModal.user._id)}
						bind:value={deleteModal.user._id}
						class="sr-only"
						type="hidden"
					/>
					<TriangleAlert class="text-red-500" size={80} />
					<Div>
						Are you sure you want to delete username "{deleteModal.user.username}"? This cannot be
						undone.
					</Div>
					<Div class="flex w-full justify-end space-x-2">
						<Button
							type="button"
							disabled={deleteModal.isPending}
							onclick={() => (deleteModal.isOpen = false)}>Cancel</Button
						>
						<SubmitButton bind:isPending={deleteModal.isPending} class="bg-red-500"
							>Delete</SubmitButton
						>
					</Div>
				</Form>
			</Card>
		{/if}
	{/snippet}
</Modal>
