import { page } from 'vitest/browser';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { user } from '#lib/state/index.js';

const mocks = vi.hoisted(() => ({ signOut: vi.fn(), disable: vi.fn(), goto: vi.fn() }));
vi.mock('$app/navigation', () => ({
	goto: mocks.goto,
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn(),
	onNavigate: vi.fn()
}));
vi.mock('#lib/remote/session.remote.js', () => ({
	signOut: mocks.signOut,
	currentSession: vi.fn(),
	migrateLegacyLogin: vi.fn()
}));
vi.mock('#lib/remote/sign-in.remote.js', () => ({ signIn: {} }));
vi.mock('#lib/remote/sign-up.remote.js', () => ({ signUp: {} }));
vi.mock('#lib/remote/find-calendar.remote.js', () => ({ findCalendar: async () => [] }));
vi.mock('#lib/remote/notifications.remote.js', () => ({
	notificationSettings: async () => ({ publicKey: '' })
}));
vi.mock('#lib/notifications.js', () => ({
	disableNotifications: mocks.disable,
	supportsNotifications: () => false,
	needsHomeScreenInstall: () => false,
	notificationSubscription: vi.fn(),
	restoreNotifications: vi.fn(),
	enableNotifications: vi.fn()
}));
import Settings from './+page.svelte';

beforeEach(() => {
	vi.clearAllMocks();
	mocks.signOut.mockResolvedValue(undefined);
	mocks.disable.mockResolvedValue(undefined);
	mocks.goto.mockResolvedValue(undefined);
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

it('links to each settings subroute and signs out only after confirmation', async () => {
	render(Settings);
	for (const route of ['personal-information', 'notification', 'delete-account']) {
		expect(document.querySelector(`a[href="/settings/${route}"]`)).not.toBeNull();
	}
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	expect(mocks.signOut).not.toHaveBeenCalled();
	expect(mocks.disable).not.toHaveBeenCalled();
	expect(user.value?._id).toBe('test-user');
	expect(localStorage.getItem('_id')).toBe('test-user');
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await page
		.getByRole('dialog', { name: 'Sign out?' })
		.getByRole('button', { name: 'Sign out', exact: true })
		.click();
	await vi.waitFor(() => expect(user.value).toBeNull());
	expect(mocks.signOut).toHaveBeenCalledTimes(1);
	expect(mocks.disable).toHaveBeenCalledTimes(1);
	expect(localStorage.getItem('_id')).toBeNull();
	expect(mocks.goto).toHaveBeenCalledExactlyOnceWith('/');
});

it('keeps the user signed in when sign-out fails and allows cancellation', async () => {
	mocks.signOut.mockRejectedValueOnce(new Error('Network unavailable'));
	render(Settings);
	await page.getByRole('button', { name: 'Sign out', exact: true }).click();
	await page
		.getByRole('dialog', { name: 'Sign out?' })
		.getByRole('button', { name: 'Sign out', exact: true })
		.click();
	await expect
		.element(page.getByRole('alert'))
		.toHaveTextContent('Could not sign out. Please try again.');
	expect(user.value?._id).toBe('test-user');
	expect(localStorage.getItem('_id')).toBe('test-user');
	expect(mocks.goto).not.toHaveBeenCalled();
	await page.getByRole('button', { name: 'Cancel', exact: true }).click();
	await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
});
