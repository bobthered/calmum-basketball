import { page } from 'vitest/browser';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { user } from '#lib/state/index.js';
const mocks = vi.hoisted(() => ({ send: vi.fn(), older: vi.fn(), reconnect: vi.fn() }));
vi.mock('#lib/remote/messages.remote.js', () => ({
	groupMessages: () => ({
		current: {
			messages: [
				{
					id: 'a',
					senderId: 'other',
					senderName: 'Player A',
					text: '<script>alert("hello")</script>',
					createdAt: '2026-10-04T10:00:00.000Z',
					clientId: 'a'
				}
			],
			hasMore: false
		},
		connected: true,
		error: undefined,
		reconnect: mocks.reconnect
	}),
	sendGroupMessage: mocks.send,
	olderGroupMessages: mocks.older
}));
vi.mock('#lib/remote/notifications.remote.js', () => ({
	notificationSettings: async () => ({ publicKey: '' })
}));
vi.mock('#lib/notifications.js', () => ({
	supportsNotifications: () => false,
	needsHomeScreenInstall: () => false,
	restoreNotifications: vi.fn(),
	disableNotifications: vi.fn(),
	enableNotifications: vi.fn()
}));
import Page from './+page.svelte';
afterEach(() => {
	cleanup();
	user.value = null;
	vi.clearAllMocks();
});
function openChat() {
	user.value = {
		_id: 'viewer',
		firstName: 'Viewer',
		lastName: 'User',
		username: 'viewer',
		isAdmin: false
	};
	render(Page);
}
describe('group chat', () => {
	it('renders message text safely and sends a message from the composer', async () => {
		mocks.send.mockResolvedValue({
			id: 'b',
			senderId: 'viewer',
			senderName: 'Viewer User',
			text: 'See you tonight',
			createdAt: '2026-10-04T10:01:00.000Z',
			clientId: 'b'
		});
		openChat();
		await expect
			.element(page.getByText('<script>alert("hello")</script>', { exact: true }))
			.toBeInTheDocument();
		await page.getByRole('textbox', { name: 'Message to the group' }).fill('See you tonight');
		await page.getByRole('button', { name: 'Send', exact: true }).click();
		await expect.element(page.getByText('See you tonight', { exact: true })).toBeInTheDocument();
		await expect
			.element(page.getByRole('textbox', { name: 'Message to the group' }))
			.toHaveValue('');
		expect(mocks.send.mock.calls[0][0].text).toBe('See you tonight');
	});
	it('keeps a failed draft and reuses its send identifier on retry', async () => {
		mocks.send.mockRejectedValueOnce(new Error('Network unavailable')).mockResolvedValueOnce({
			id: 'b',
			senderId: 'viewer',
			senderName: 'Viewer User',
			text: 'Hello',
			createdAt: '2026-10-04T10:01:00.000Z',
			clientId: 'b'
		});
		openChat();
		await page.getByRole('textbox', { name: 'Message to the group' }).fill('Hello');
		await page.getByRole('button', { name: 'Send', exact: true }).click();
		await expect.element(page.getByRole('alert')).toHaveTextContent('Network unavailable');
		await expect
			.element(page.getByRole('textbox', { name: 'Message to the group' }))
			.toHaveValue('Hello');
		await page.getByRole('button', { name: 'Send', exact: true }).click();
		await expect.element(page.getByText('Hello', { exact: true })).toBeInTheDocument();
		expect(mocks.send.mock.calls[0][0].clientId).toBe(mocks.send.mock.calls[1][0].clientId);
	});
});
