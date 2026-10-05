import { page } from 'vitest/browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';

const mocks = vi.hoisted(() => ({ enable: vi.fn(), restore: vi.fn(), subscription: vi.fn() }));
vi.mock('#lib/remote/notifications.remote.js', () => ({
	notificationSettings: async () => ({ publicKey: 'test-key' })
}));
vi.mock('#lib/notifications.js', () => ({
	supportsNotifications: () => true,
	needsHomeScreenInstall: () => false,
	restoreNotifications: mocks.restore,
	notificationSubscription: mocks.subscription,
	enableNotifications: mocks.enable,
	disableNotifications: vi.fn()
}));
import NotificationPreferences from './NotificationPreferences.svelte';

beforeEach(() => {
	localStorage.clear();
	vi.clearAllMocks();
	mocks.restore.mockResolvedValue(false);
	mocks.subscription.mockResolvedValue(null);
	mocks.enable.mockResolvedValue(undefined);
});
afterEach(() => cleanup());

describe('notification choices', () => {
	it('requires a choice and remembers Not now across visits for this account', async () => {
		render(NotificationPreferences, { userId: 'player-a', prompt: true });
		await expect.element(page.getByRole('dialog')).toBeVisible();
		await page.getByRole('button', { name: 'Not now' }).click();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(localStorage.getItem('basketball:notifications:answered:player-a')).toBe('later');
		cleanup();
		render(NotificationPreferences, { userId: 'player-a', prompt: true });
		await vi.waitFor(() => expect(mocks.restore).toHaveBeenCalledTimes(2));
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		cleanup();
		render(NotificationPreferences, { userId: 'player-b', prompt: true });
		await expect.element(page.getByRole('dialog')).toBeVisible();
		const dialog = document.querySelector('dialog')!;
		const cancel = new Event('cancel', { cancelable: true });
		dialog.dispatchEvent(cancel);
		expect(cancel.defaultPrevented).toBe(true);
		expect(dialog.open).toBe(true);
	});
	it('requests permission only on Enable and remembers a successful subscription', async () => {
		render(NotificationPreferences, { userId: 'player-a', prompt: true });
		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(mocks.enable).not.toHaveBeenCalled();
		await page.getByRole('button', { name: 'Enable notifications' }).click();
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
		expect(mocks.enable).toHaveBeenCalledWith('test-key');
		expect(localStorage.getItem('basketball:notifications:answered:player-a')).toBe('enabled');
	});
	it('keeps the dialog available after a subscription failure', async () => {
		mocks.enable.mockRejectedValueOnce(new Error('Network unavailable'));
		render(NotificationPreferences, { userId: 'player-a', prompt: true });
		await page.getByRole('button', { name: 'Enable notifications' }).click();
		await expect.element(page.getByRole('alert')).toHaveTextContent('Network unavailable');
		await expect.element(page.getByRole('dialog')).toBeVisible();
		expect(localStorage.getItem('basketball:notifications:answered:player-a')).toBeNull();
	});
	it('recognizes an existing subscription without prompting', async () => {
		mocks.restore.mockResolvedValue(true);
		render(NotificationPreferences, { userId: 'player-a', prompt: true });
		await vi.waitFor(() =>
			expect(localStorage.getItem('basketball:notifications:answered:player-a')).toBe('enabled')
		);
		await expect.element(page.getByRole('dialog')).not.toBeInTheDocument();
	});
});
