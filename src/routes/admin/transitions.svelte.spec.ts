import { page } from 'vitest/browser';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import type { OnNavigate } from '$app/navigation';
const mocks = vi.hoisted(() => ({ onNavigate: vi.fn() }));
vi.mock('$app/navigation', () => ({
	onNavigate: mocks.onNavigate,
	afterNavigate: vi.fn(),
	beforeNavigate: vi.fn()
}));
vi.mock('$app/state', () => ({ page: { url: new URL('https://basketball.example/admin') } }));
import Layout from './+layout.svelte';
import '../../app.css';
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	mocks.onNavigate.mockClear();
	delete document.documentElement.dataset.adminDirection;
});
const mount = () => {
	render(Layout, {
		children: createRawSnippet(() => ({ render: () => '<p>Admin content</p>' }))
	});
	return mocks.onNavigate.mock.calls[0][0] as (navigation: OnNavigate) => Promise<void> | undefined;
};
const navigation = (from: string, to: string) => {
	return {
		from: { url: new URL(from, 'https://basketball.example') },
		to: { url: new URL(to, 'https://basketball.example') },
		complete: Promise.resolve()
	} as OnNavigate;
};
it('slides mobile admin pages in from the right and out to the right when returning', async () => {
	await page.viewport(390, 844);
	const callback = mount();
	const surface = document.querySelector<HTMLElement>('.admin-page')!;
	const parent = surface.parentElement!;
	const previousStyle = parent.style.cssText;
	Object.assign(parent.style, {
		display: 'flex',
		flexDirection: 'column',
		width: '390px',
		height: '844px'
	});
	expect(surface.getBoundingClientRect().width).toBe(390);
	expect(surface.getBoundingClientRect().height).toBe(844);
	expect(getComputedStyle(surface).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	parent.style.cssText = previousStyle;
	const start = document.startViewTransition.bind(document);
	let transition!: ViewTransition;
	vi.spyOn(document, 'startViewTransition').mockImplementation((update) => {
		transition = start(update);
		return transition;
	});
	await callback(navigation('/admin', '/admin/users'));
	await transition.ready;
	expect(document.documentElement.dataset.adminDirection).toBe('forward');
	expect(
		getComputedStyle(document.documentElement, '::view-transition-new(admin-page)').animationName
	).toBe('settings-enter');
	await transition.finished;
	await vi.waitFor(() => expect(document.documentElement.dataset.adminDirection).toBeUndefined());
	await callback(navigation('/admin/users', '/admin'));
	await transition.ready;
	expect(document.documentElement.dataset.adminDirection).toBe('back');
	expect(
		getComputedStyle(document.documentElement, '::view-transition-old(admin-page)').animationName
	).toBe('settings-exit');
	expect(
		getComputedStyle(document.documentElement, '::view-transition-old(admin-page)').zIndex
	).toBe('2');
	await transition.finished;
});
it('skips animations on desktop, outside Admin, and when reduced motion is enabled', async () => {
	await page.viewport(1100, 900);
	const callback = mount();
	const start = vi.spyOn(document, 'startViewTransition');
	expect(callback(navigation('/admin', '/admin/users'))).toBeUndefined();
	await page.viewport(390, 844);
	expect(callback(navigation('/', '/admin'))).toBeUndefined();
	const original = window.matchMedia.bind(window);
	vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
		query.includes('prefers-reduced-motion')
			? ({ ...original(query), matches: true } as MediaQueryList)
			: original(query)
	);
	expect(callback(navigation('/admin', '/admin/calendar'))).toBeUndefined();
	expect(start).not.toHaveBeenCalled();
});
