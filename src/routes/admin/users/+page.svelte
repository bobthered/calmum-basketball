<script lang="ts">
	import {
		Button,
		Card,
		CheckboxInput,
		Div,
		Form,
		H1,
		Input,
		Modal,
		Spinner,
		SubmitButton
	} from '$components';
	import { deleteUser } from '$lib/remote/delete-user.remote';
	import { findUsers } from '$lib/remote/find-users.remote';
	import { updateUserField } from '$lib/remote/update-user-field.remote';
	import { Trash, TriangleAlert } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import { twMerge } from 'tailwind-merge';

	type BaseCell = {
		class?: string;
		rowIndex: number;
	};
	type ButtonCell = Omit<ObjectCell, 'key'>;
	type Cell = ObjectCell | ValueCell;
	type Key = 'firstName' | 'isAdmin' | 'lastName' | 'username';
	type ObjectCell = {
		key: Key;
		object: User;
	} & BaseCell;
	type ValueCell = { value: any } & BaseCell;
	type User = {
		_id: string;
		firstName: string;
		isAdmin: boolean;
		lastName: string;
		username: string;
	};

	// $state
	let deleteModal: { isOpen: boolean; isPending: boolean; user: User | null } = $state({
		isOpen: false,
		isPending: false,
		user: null
	});
	let users: User[] | null = $state(null);

	// variables
	const headings: { key: Key; label: string }[] = [
		{ key: 'firstName', label: 'First Name' },
		{ key: 'lastName', label: 'Last Name' },
		{ key: 'isAdmin', label: 'isAdmin' },
		{ key: 'username', label: 'Username' }
	];
	const onchange = async ({ key, object }: { key: Key; object: User }) => {
		let payload: Partial<Omit<User, '_id'>> & Pick<User, '_id'> = { _id: object._id };
		// @ts-ignore
		payload[key] = object[key];
		await updateUserField(payload);
	};
	const typeSnippetMap: {
		bigint: Snippet<[ObjectCell]>;
		boolean: Snippet<[ObjectCell]>;
		function: Snippet<[ObjectCell]>;
		number: Snippet<[ObjectCell]>;
		object: Snippet<[ObjectCell]>;
		string: Snippet<[ObjectCell]>;
		symbol: Snippet<[ObjectCell]>;
		undefined: Snippet<[ObjectCell]>;
	} = {
		bigint: stringSnippet,
		boolean: booleanSnippet,
		function: stringSnippet,
		number: stringSnippet,
		object: stringSnippet,
		string: stringSnippet,
		symbol: stringSnippet,
		undefined: stringSnippet
	};
	const updateUsers = async () => {
		const result = await findUsers();
		users = result;
	};

	// $effects
	$effect(() => {
		updateUsers();
	});
</script>

<H1>Admin - Users</H1>
<Card class="relative mr-auto grid max-w-full grid-cols-[repeat(5,auto)] overflow-auto p-0">
	{@render headingSnippet('')}
	{#each headings as { label }}
		{@render headingSnippet(label)}
	{/each}
	{#if users !== null}
		{#each users as user, userIndex}
			{@render buttonsSnippet({ rowIndex: userIndex, object: user })}
			{#each headings as { key }}
				{@render cellSnippet({ rowIndex: userIndex, key, object: user })}
			{/each}
		{/each}
	{:else}
		<Div class={twMerge('px-6 py-3 whitespace-nowrap')}>
			<Spinner />
		</Div>
	{/if}
</Card>
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
					<Input bind:value={deleteModal.user._id} class="sr-only" name="_id" type="hidden" />
					<TriangleAlert class="text-red-500" size={80} />
					<Div>
						Are you sure you want to delete username "{deleteModal.user.username}"? This cannot be
						undone.
					</Div>
					<Div class="flex w-full justify-end space-x-2">
						<Button onclick={() => (deleteModal.isOpen = false)}>Cancel</Button>
						<SubmitButton bind:isPending={deleteModal.isPending} class="bg-red-500"
							>Delete</SubmitButton
						>
					</Div>
				</Form>
			</Card>
		{/if}
	{/snippet}
</Modal>

{#snippet headingSnippet(label: string)}
	<Div class="sticky top-0 bg-primary-700 px-6 py-3 whitespace-nowrap text-white">{label}</Div>
{/snippet}

{#snippet buttonsSnippet({ class: className, object, rowIndex }: ButtonCell)}
	<Div
		class={twMerge(
			'flex items-center space-x-2 px-6 py-0 whitespace-nowrap',
			rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-950' : undefined,
			className
		)}
	>
		<Button
			class="bg-red-500 px-2 py-2"
			onclick={() => {
				deleteModal.isOpen = true;
				deleteModal.user = object;
			}}
		>
			<Trash size={20} />
		</Button>
	</Div>
{/snippet}

{#snippet cellSnippet({ class: className, rowIndex, ...cell }: Cell)}
	{#if 'key' in cell}
		{@const snippet = typeSnippetMap[typeof cell.object[cell.key]]}
		{#if snippet}
			{@render snippet({ class: className, key: cell.key, object: cell.object, rowIndex })}
		{/if}
	{/if}
	{#if 'value' in cell}
		<Div
			class={twMerge(
				'px-6 py-3 whitespace-nowrap',
				rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-950' : undefined,
				className
			)}
		>
			{cell.value}
		</Div>
	{/if}
{/snippet}

{#snippet booleanSnippet({ class: className, key, object, rowIndex }: ObjectCell)}
	<Div
		class={twMerge(
			'px-6 py-3 whitespace-nowrap',
			rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-950' : undefined,
			className
		)}
	>
		{#if typeof object[key] === 'boolean'}
			<CheckboxInput bind:checked={object[key]} onchange={() => onchange({ key, object })} />
		{/if}
	</Div>
{/snippet}
{#snippet stringSnippet({ class: className, key, object, rowIndex }: ObjectCell)}
	{#if typeof object[key] === 'string'}
		<Input
			bind:value={object[key]}
			class={twMerge(
				'rounded-none bg-transparent',
				rowIndex % 2 === 1 ? 'bg-gray-50 dark:bg-gray-950' : undefined,
				className
			)}
			onchange={() => onchange({ key, object })}
		/>
	{/if}
{/snippet}
