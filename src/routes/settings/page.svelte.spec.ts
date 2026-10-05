import { page } from 'vitest/browser';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { user } from '#lib/state/index.js';

const mocks = vi.hoisted(() => ({ submit: vi.fn(), update: vi.fn() }));
vi.mock('#lib/remote/delete-user.remote.js', () => ({
	deleteUser: {
		fields: { _id: { as: () => ({ name: '_id', type: 'hidden' }) } },
		result: { success: true },
		enhance: (callback: (context: { submit: () => Promise<void> }) => Promise<void>) => ({
			onsubmit: async (event: SubmitEvent) => {
				event.preventDefault();
				const id = new FormData(event.currentTarget as HTMLFormElement).get('_id');
				await callback({ submit: () => mocks.submit(id) });
			}
		})
	}
}));
vi.mock('#lib/remote/update-user.remote.js', () => ({
	updateUser: {
		result: { success: true },
		fields: Object.fromEntries(
			['_id', 'firstName', 'lastName'].map((name) => [
				name,
				{ as: (type: string) => ({ name, type }) }
			])
		),
		enhance: (callback: (context: { submit: () => Promise<void> }) => Promise<void>) => ({
			onsubmit: async (event: SubmitEvent) => {
				event.preventDefault();
				const data = new FormData(event.currentTarget as HTMLFormElement);
				await callback({ submit: () => mocks.update(Object.fromEntries(data)) });
			}
		})
	}
}));
vi.mock('#lib/remote/notifications.remote.js', () => ({
	notificationSettings: async () => ({ publicKey: '' })
}));
vi.mock('#lib/notifications.js', () => ({
	supportsNotifications: () => false,
	needsHomeScreenInstall: () => false,
	notificationSubscription: vi.fn(),
	restoreNotifications: vi.fn(),
	enableNotifications: vi.fn(),
	disableNotifications: vi.fn()
}));
import DeleteAccount from './delete-account/+page.svelte';
import PersonalInformation from './personal-information/+page.svelte';

beforeEach(() => {
	vi.clearAllMocks();
	mocks.submit.mockResolvedValue(undefined);
	mocks.update.mockResolvedValue(undefined);
	user.value = {
		_id: 'test-user',
		firstName: 'Test',
		lastName: 'Player',
		username: 'testplayer',
		isAdmin: false
	};
	localStorage.setItem('_id', 'test-user');
});
afterEach(() => {
	cleanup();
	user.value = null;
	localStorage.removeItem('_id');
});

it('Cancel preserves the account; only Delete submits and signs out', async () => {
	render(DeleteAccount);
	await page.getByRole('button', { name: 'Delete Account', exact: true }).click();
	await expect.element(page.getByRole('button', { name: 'Delete', exact: true })).toBeDisabled();
	await page.getByRole('textbox', { name: 'Type DELETE to confirm' }).fill('delete');
	(document.querySelector('dialog form') as HTMLFormElement).requestSubmit();
	expect(mocks.submit).not.toHaveBeenCalled();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(mocks.submit).not.toHaveBeenCalled();
	expect(user.value?._id).toBe('test-user');
	expect(localStorage.getItem('_id')).toBe('test-user');
	await expect
		.element(page.getByRole('button', { name: 'Cancel', exact: true }))
		.not.toBeInTheDocument();
	await page.getByRole('button', { name: 'Delete Account', exact: true }).click();
	await expect
		.element(page.getByRole('textbox', { name: 'Type DELETE to confirm' }))
		.toHaveValue('');
	await page.getByRole('textbox', { name: 'Type DELETE to confirm' }).fill('DELETE');
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	await vi.waitFor(() => expect(user.value).toBeNull());
	expect(mocks.submit).toHaveBeenCalledExactlyOnceWith('test-user');
	expect(localStorage.getItem('_id')).toBeNull();
	await expect
		.element(page.getByRole('button', { name: 'Delete', exact: true }))
		.not.toBeInTheDocument();
});

it('a failed deletion preserves the account and allows Cancel', async () => {
	mocks.submit.mockRejectedValueOnce(new Error('Network unavailable'));
	render(DeleteAccount);
	await page.getByRole('button', { name: 'Delete Account', exact: true }).click();
	await page.getByRole('textbox', { name: 'Type DELETE to confirm' }).fill('DELETE');
	await page.getByRole('button', { name: 'Delete', exact: true }).click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('Could not delete your account. Please try again.');
	expect(user.value?._id).toBe('test-user');
	expect(localStorage.getItem('_id')).toBe('test-user');
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(mocks.submit).toHaveBeenCalledTimes(1);
});

it('saves personal information and shows confirmation', async () => {
	render(PersonalInformation);
	await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('New');
	await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('Name');
	await page.getByRole('button', { name: 'Save changes', exact: true }).click();
	await expect
		.element(page.getByText('Personal information saved.', { exact: true }))
		.toBeVisible();
	expect(mocks.update).toHaveBeenCalledExactlyOnceWith({
		_id: 'test-user',
		firstName: 'New',
		lastName: 'Name'
	});
	expect(user.value?.firstName).toBe('New');
	expect(user.value?.lastName).toBe('Name');
	expect(mocks.submit).not.toHaveBeenCalled();
});
