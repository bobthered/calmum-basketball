<script>
	import { TriangleAlert } from '@lucide/svelte';
	import { Button, Card, Div, Form, FormControl, Input, Modal } from '#components';
	import { deleteUser } from '#lib/remote/delete-user.remote.js';
	import { user } from '#lib/state/index.js';
	let isDeleteModalOpen = $state(false);
	let isDeletePending = $state(false);
	let deleteError = $state('');
	let deleteConfirmation = $state('');
</script>

<svelte:head><title>Delete account | Cal-Mum Rec. Basketball</title></svelte:head>
{#if user.value}
	<Card class="gap-4">
		<h2 class="text-xl font-semibold">Delete account</h2>
		<p class="text-sm text-gray-600 dark:text-gray-400">
			Permanently delete your account. This cannot be undone.
		</p>
		<Button
			type="button"
			class="bg-red-500"
			onclick={() => {
				deleteError = '';
				deleteConfirmation = '';
				isDeleteModalOpen = true;
			}}>Delete Account</Button
		>
	</Card>
	<Modal bind:isOpen={isDeleteModalOpen}>
		<Div class="flex flex-col items-center space-y-6">
			<TriangleAlert class="text-red-500" size={40} />
			<h2 class="text-xl font-semibold">Delete your account?</h2>
			<p>Are you sure you want to delete your account? This cannot be undone.</p>
			{#if deleteError}<p role="alert" class="text-red-600 dark:text-red-400">{deleteError}</p>{/if}
			<Form
				class="flex w-full flex-col gap-4"
				{...deleteUser.enhance(async ({ submit }) => {
					if (deleteConfirmation !== 'DELETE' || isDeletePending) return;
					try {
						isDeletePending = true;
						deleteError = '';
						await submit();
						if (deleteUser?.result?.success) {
							isDeleteModalOpen = false;
							localStorage.removeItem('_id');
							user.value = null;
						} else {
							deleteError = 'Could not delete your account. Please try again.';
						}
					} catch (error) {
						deleteError = 'Could not delete your account. Please try again.';
					} finally {
						isDeletePending = false;
					}
				})}
			>
				<Input
					{...deleteUser.fields._id.as('hidden', user?.value?._id ?? '')}
					class="sr-only"
					value={user?.value?._id}
					type="hidden"
				/>
				<FormControl label="Type DELETE to confirm" for="delete-confirmation">
					<Input
						id="delete-confirmation"
						bind:value={deleteConfirmation}
						autocomplete="off"
						spellcheck={false}
						disabled={isDeletePending}
					/>
				</FormControl>
				<Div class="flex w-full justify-end gap-3">
					<Button
						type="button"
						disabled={isDeletePending}
						onclick={() => (isDeleteModalOpen = false)}>Cancel</Button
					>
					<Button
						type="submit"
						disabled={isDeletePending || deleteConfirmation !== 'DELETE'}
						class="bg-red-500">{isDeletePending ? 'Deleting...' : 'Delete'}</Button
					>
				</Div>
			</Form>
		</Div>
	</Modal>
{/if}
