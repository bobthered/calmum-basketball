import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { user, scheduledDates } from '#lib/state/index.js';

const account = vi.hoisted(() => ({
	_id: 'admin',
	firstName: 'Admin',
	lastName: 'Player',
	username: 'admin',
	isAdmin: true
}));
vi.mock('$app/state', () => ({ page: { url: new URL('https://basketball.example/') } }));
vi.mock('#lib/remote/session.remote.js', () => ({
	currentSession: async () => account,
	migrateLegacyLogin: vi.fn(),
	signOut: vi.fn()
}));
vi.mock('#lib/remote/find-calendar.remote.js', () => ({ findCalendar: async () => [] }));
vi.mock('#lib/remote/sign-in.remote.js', () => ({ signIn: {} }));
vi.mock('#lib/remote/sign-up.remote.js', () => ({ signUp: {} }));
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
import Layout from './+layout.svelte';

afterEach(() => {
	cleanup();
	user.value = null;
	scheduledDates.value = [];
});

it('opens and closes the SvelteWind admin popover using the complete trigger attributes', async () => {
	await page.viewport(390, 844);
	user.value = account;
	render(Layout);
	const trigger = page.getByRole('button', { name: 'Admin', exact: true });
	await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	await trigger.click();
	await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
	await expect.element(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
	const panel = document.querySelector('[popover]')!;
	expect(panel.matches(':popover-open')).toBe(true);
	await trigger.click();
	await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	await expect
		.element(page.getByRole('link', { name: 'Users', exact: true }))
		.not.toBeInTheDocument();
});

it('toggles the sliding desktop menu in place and closes it on outside clicks', async () => {
	await page.viewport(1100, 800);
	user.value = account;
	render(Layout);
	const trigger = page.getByRole('button', { name: 'Open navigation' });
	await expect.element(trigger).toBeVisible();
	const title = document.querySelector('header h1')!.getBoundingClientRect();
	const button = document
		.querySelector('button[aria-controls="desktop-navigation"]')!
		.getBoundingClientRect();
	expect(title.right).toBeLessThan(button.left);
	expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
	await trigger.click();
	await expect.element(page.getByRole('navigation', { name: 'Desktop navigation' })).toBeVisible();
	await expect.element(page.getByRole('link', { name: 'Chat', exact: true })).toBeVisible();
	await expect.element(page.getByRole('link', { name: 'Users', exact: true })).toBeVisible();
	const panel = document.getElementById('desktop-navigation')!.getBoundingClientRect();
	expect(Math.abs(panel.right - button.right)).toBeLessThan(1);
	expect(panel.top).toBeGreaterThanOrEqual(button.bottom);
	const close = page.getByRole('button', { name: 'Close navigation' });
	await expect.element(close).toBeVisible();
	const openButton = document
		.querySelector('button[aria-controls="desktop-navigation"]')!
		.getBoundingClientRect();
	expect(openButton.x).toBe(button.x);
	expect(openButton.y).toBe(button.y);
	await close.click();
	await expect
		.element(page.getByRole('navigation', { name: 'Desktop navigation' }))
		.not.toBeInTheDocument();
	await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
	await trigger.click();
	await expect.element(page.getByRole('navigation', { name: 'Desktop navigation' })).toBeVisible();
	await page.getByRole('main').click();
	await expect
		.element(page.getByRole('navigation', { name: 'Desktop navigation' }))
		.not.toBeInTheDocument();
});
