import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { scheduledDates, user } from '#lib/state/index.js';
import Page from './+page.svelte';

const { findStatus } = vi.hoisted(() => ({ findStatus: vi.fn() }));
vi.mock('#lib/remote/find-user-calendar-status.remote.js', () => ({
	findUserCalendarStatus: findStatus
}));
vi.mock('#lib/remote/update-user-calendar-status.remote.js', () => ({
	updateUserCalendarStatus: vi.fn()
}));

describe('/+page.svelte', () => {
	beforeEach(() => {
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
});
