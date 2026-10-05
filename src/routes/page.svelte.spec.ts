import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { scheduledDates, user } from '#lib/state/index.js';
import Page from './+page.svelte';
import '../app.css';

const { findStatus, updateStatus } = vi.hoisted(() => ({
	findStatus: vi.fn(),
	updateStatus: vi.fn()
}));
vi.mock('#lib/remote/find-user-calendar-status.remote.js', () => ({
	findUserCalendarStatus: (input: { date: string }) =>
		Object.assign(findStatus(input), { refresh: async () => {} })
}));
vi.mock('#lib/remote/update-user-calendar-status.remote.js', () => ({
	updateUserCalendarStatus: updateStatus
}));

describe('/+page.svelte', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		updateStatus.mockResolvedValue({ success: true });
		const today = new Date();
		scheduledDates.value = [
			`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
		];
		vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(0);
	});
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		user.value = null;
		scheduledDates.value = [];
	});
	it.each([0, 1, 2])(
		'shows each user’s guests when the viewer has %i guests',
		async (guestCount) => {
			user.value = {
				_id: 'viewer',
				firstName: 'Viewer',
				lastName: 'User',
				username: 'viewer',
				isAdmin: false
			};
			findStatus.mockResolvedValue({
				success: true,
				rows: [
					{
						_userId: { _id: 'a', firstName: 'User', lastName: 'A' },
						status: 'Yes',
						numberOfGuests: 2
					},
					{
						_userId: { _id: 'b', firstName: 'User', lastName: 'B' },
						status: 'Yes',
						numberOfGuests: 1
					},
					{ _userId: user.value, status: 'Yes', numberOfGuests: guestCount }
				]
			});
			render(Page);
			await expect.element(page.getByRole('heading', { level: 1 })).toHaveTextContent('Hi Viewer!');
			await expect.element(page.getByText('User A Guest 1', { exact: true })).toBeInTheDocument();
			await expect.element(page.getByText('User A Guest 2', { exact: true })).toBeInTheDocument();
			await expect.element(page.getByText('User B Guest 1', { exact: true })).toBeInTheDocument();
			await expect
				.element(page.getByText('User B Guest 2', { exact: true }))
				.not.toBeInTheDocument();
			await expect
				.element(page.getByText(`We currently have ${6 + guestCount} committed`, { exact: false }))
				.toBeInTheDocument();
		}
	);
	it('updates guests immediately and blocks overlapping guest and attendance saves', async () => {
		user.value = {
			_id: 'viewer',
			firstName: 'Viewer',
			lastName: 'User',
			username: 'viewer',
			isAdmin: false
		};
		findStatus.mockResolvedValue({
			success: true,
			rows: [{ _userId: user.value, status: 'Yes', numberOfGuests: 0 }]
		});
		let finish!: (value: { success: boolean }) => void;
		updateStatus.mockReturnValueOnce(
			new Promise((resolve) => {
				finish = resolve;
			})
		);
		render(Page);
		const add = page.getByRole('button', { name: 'Add guest' });
		const remove = page.getByRole('button', { name: 'Remove guest' });
		await expect.element(add).toBeEnabled();
		const controlsTop = document
			.querySelector('button[aria-label="Add guest"]')!
			.getBoundingClientRect().top;
		await add.click();
		const toaster = document.querySelector('[aria-label="Attendance notifications"]')!;
		expect(getComputedStyle(toaster).position).toBe('fixed');
		expect(
			document.querySelector('button[aria-label="Add guest"]')!.getBoundingClientRect().top
		).toBe(controlsTop);
		await expect.element(page.getByText('Guests - 1', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Viewer User Guest 1', { exact: true })).toBeVisible();
		await expect.element(add).toBeDisabled();
		await expect.element(remove).toBeDisabled();
		await expect.element(page.getByRole('button', { name: 'No', exact: true })).toBeDisabled();
		document.querySelector<HTMLButtonElement>('button[aria-label="Add guest"]')!.click();
		expect(updateStatus).toHaveBeenCalledTimes(1);
		expect(updateStatus).toHaveBeenLastCalledWith({
			_userId: 'viewer',
			date: scheduledDates.value[0],
			numberOfGuests: 1,
			status: 'Yes'
		});
		finish({ success: true });
		await expect.element(remove).toBeEnabled();
		await remove.click();
		await expect.element(page.getByText('Guests - 0', { exact: true })).toBeVisible();
		await expect.element(remove).toBeDisabled();
		expect(updateStatus).toHaveBeenLastCalledWith({
			_userId: 'viewer',
			date: scheduledDates.value[0],
			numberOfGuests: 0,
			status: 'Yes'
		});
		expect(findStatus).toHaveBeenCalledTimes(1);
	});

	it('rolls back a failed guest save and allows retry', async () => {
		user.value = {
			_id: 'viewer',
			firstName: 'Viewer',
			lastName: 'User',
			username: 'viewer',
			isAdmin: false
		};
		findStatus.mockResolvedValue({
			success: true,
			rows: [{ _userId: user.value, status: 'Yes', numberOfGuests: 1 }]
		});
		updateStatus.mockRejectedValueOnce(new Error('Network unavailable'));
		render(Page);
		const remove = page.getByRole('button', { name: 'Remove guest' });
		await expect.element(remove).toBeEnabled();
		await remove.click();
		await expect
			.element(
				page.getByText('Could not save your attendance or guests. Please try again.', {
					exact: true
				})
			)
			.toBeVisible();
		await expect.element(page.getByText('Guests - 1', { exact: true })).toBeVisible();
		await expect.element(page.getByText('Viewer User Guest 1', { exact: true })).toBeVisible();
		await remove.click();
		await expect.element(page.getByText('Guests - 0', { exact: true })).toBeVisible();
		expect(updateStatus).toHaveBeenCalledTimes(2);
	});

	it('requires an attendance selection before enabling guest controls', async () => {
		user.value = {
			_id: 'viewer',
			firstName: 'Viewer',
			lastName: 'User',
			username: 'viewer',
			isAdmin: false
		};
		findStatus.mockResolvedValue({ success: true, rows: [] });
		render(Page);
		await expect
			.element(page.getByText('Select your attendance before adding guests.'))
			.toBeVisible();
		await expect.element(page.getByRole('button', { name: 'Add guest' })).toBeDisabled();
		await page.getByRole('button', { name: 'Yes', exact: true }).click();
		await expect.element(page.getByRole('button', { name: 'Add guest' })).toBeEnabled();
		await page.getByRole('button', { name: 'Add guest' }).click();
		await expect.element(page.getByText('Guests - 1', { exact: true })).toBeVisible();
		expect(updateStatus).toHaveBeenCalledTimes(2);
	});
});
