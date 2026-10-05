import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';

const mocks = vi.hoisted(() => ({ submit: vi.fn(), update: vi.fn() }));
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
vi.mock('#lib/remote/update-user-field.remote.js', () => ({ updateUserField: mocks.update }));
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
import '../../../app.css';

afterEach(() => {
	cleanup();
	vi.clearAllMocks();
});

describe('admin user deletion', () => {
	it('keeps a standard table on mobile and saves dialog changes only on Save', async () => {
		await page.viewport(390, 844);
		render(Page);
		await page.getByRole('button', { name: 'Edit testplayer', exact: true }).click();
		await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Changed');
		expect(mocks.update).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Cancel', exact: true }).click();
		expect(mocks.update).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Edit testplayer', exact: true }).click();
		await expect
			.element(page.getByRole('textbox', { name: 'First Name', exact: true }))
			.toHaveValue('Test');
		await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Changed');
		(document.querySelector('[data-checkbox-control]') as HTMLElement).click();
		mocks.update.mockResolvedValueOnce({ success: true });
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
			_id: 'test-user',
			firstName: 'Changed',
			lastName: 'Player',
			username: 'testplayer',
			isAdmin: true
		});
		await expect
			.element(page.getByRole('textbox', { name: 'First Name', exact: true }))
			.not.toBeInTheDocument();
		expect(getComputedStyle(document.querySelector('tbody tr')!).display).toBe('table-row');
		await expect.element(page.getByRole('cell', { name: 'Changed', exact: true })).toBeVisible();
	});
	it('preserves the draft and table when saving fails', async () => {
		render(Page);
		await page.getByRole('button', { name: 'Edit testplayer', exact: true }).click();
		await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Retry');
		mocks.update.mockRejectedValueOnce(new Error('offline'));
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect
			.element(page.getByRole('alert'))
			.toHaveTextContent('Could not save this user. Please try again.');
		await expect
			.element(page.getByRole('textbox', { name: 'First Name', exact: true }))
			.toHaveValue('Retry');
		mocks.update.mockResolvedValueOnce({ success: true });
		await page.getByRole('button', { name: 'Save', exact: true }).click();
		await expect.element(page.getByRole('cell', { name: 'Retry', exact: true })).toBeVisible();
	});
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
