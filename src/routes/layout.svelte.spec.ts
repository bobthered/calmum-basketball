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
const route = vi.hoisted(() => ({ url: new URL('https://basketball.example/') }));
vi.mock('$app/state', () => ({ page: route }));
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
	route.url = new URL('https://basketball.example/');
});

it.each([
	'/settings',
	'/settings/personal-information',
	'/settings/notification',
	'/settings/delete-account'
])('highlights Settings on mobile and desktop for %s', async (path) => {
	route.url = new URL(path, 'https://basketball.example');
	user.value = account;
	await page.viewport(390, 844);
	render(Layout);
	const mobile = page.getByRole('link', { name: 'Settings', exact: true });
	await expect.element(mobile).toHaveAttribute('aria-current', 'page');
	await expect.element(mobile).toHaveClass('font-semibold');
	await expect
		.element(page.getByRole('link', { name: 'Home', exact: true }))
		.not.toHaveAttribute('aria-current');
	await page.viewport(1100, 900);
	await page.getByRole('button', { name: 'Open navigation' }).click();
	const desktop = page.getByRole('navigation', { name: 'Desktop navigation' });
	await expect
		.element(desktop.getByRole('link', { name: 'Settings', exact: true }))
		.toHaveAttribute('aria-current', 'page');
	await expect
		.element(desktop.getByRole('link', { name: 'Settings', exact: true }))
		.toHaveClass('font-semibold');
	await expect
		.element(desktop.getByRole('link', { name: 'Home', exact: true }))
		.not.toHaveAttribute('aria-current');
});

it('highlights the admin section and its selected link in both navigation layouts', async () => {
	route.url = new URL('https://basketball.example/admin/users');
	user.value = account;
	await page.viewport(390, 844);
	render(Layout);
	const admin = page.getByRole('button', { name: 'Admin', exact: true });
	await expect.element(admin).toHaveAttribute('aria-current', 'location');
	await admin.click();
	await expect
		.element(page.getByRole('link', { name: 'Users', exact: true }))
		.toHaveAttribute('aria-current', 'page');
	await page.viewport(1100, 900);
	await page.getByRole('button', { name: 'Open navigation' }).click();
	await expect
		.element(
			page
				.getByRole('navigation', { name: 'Desktop navigation' })
				.getByRole('link', { name: 'Users', exact: true })
		)
		.toHaveAttribute('aria-current', 'page');
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
