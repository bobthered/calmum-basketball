import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));
vi.mock('#lib/remote/find-users.remote.js', () => ({
	findUsers: async () => [
		{
			_id: 'test-user',
			firstName: 'Test',
			lastName: 'Player',
			username: 'testplayer',
			isAdmin: false
		}
	]
}));
vi.mock('#lib/remote/update-user-field.remote.js', () => ({ updateUserField: vi.fn() }));
vi.mock('#lib/remote/delete-user.remote.js', () => ({
	deleteUser: {
		fields: { _id: { as: () => ({ name: '_id', type: 'hidden' }) } },
		result: { success: true },
		enhance: (callback: (context: { submit: () => Promise<void> }) => Promise<void>) => ({
			onsubmit: async (event: SubmitEvent) => {
				event.preventDefault();
				await callback({
					submit: async () => {
						mocks.submit(new FormData(event.currentTarget as HTMLFormElement).get('_id'));
					}
				});
			}
		})
	}
}));
import Page from './+page.svelte';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('admin user deletion', () => {
	it('Cancel closes confirmation without submitting, while Delete submits the selected user', async () => {
		render(Page);
		await page.getByRole('button', { name: 'Delete testplayer', exact: true }).click();
		await expect.element(page.getByText(/Are you sure you want to delete username/)).toBeVisible();
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();
		expect(mocks.submit).not.toHaveBeenCalled();
		await expect
			.element(page.getByRole('button', { name: 'Cancel', exact: true }))
			.not.toBeInTheDocument();
		await expect
			.element(page.getByRole('button', { name: 'Delete testplayer', exact: true }))
			.toBeVisible();
		await page.getByRole('button', { name: 'Delete testplayer', exact: true }).click();
		await page.getByRole('button', { name: 'Delete', exact: true }).click();
		expect(mocks.submit).toHaveBeenCalledExactlyOnceWith('test-user');
		await expect
			.element(page.getByRole('button', { name: 'Delete testplayer', exact: true }))
			.not.toBeInTheDocument();
	});
});
