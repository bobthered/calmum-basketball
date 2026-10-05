import { afterEach, expect, it, vi } from 'vitest';
import { syncPwaViewport } from './pwa-viewport.js';

let stop: (() => void) | undefined;
let shell: HTMLDivElement;
afterEach(() => {
	stop?.();
	stop = undefined;
	shell?.remove();
	vi.restoreAllMocks();
});
function setup(standalone = true) {
	shell = document.createElement('div');
	shell.style.minHeight = 'var(--app-viewport-height, 700px)';
	shell.style.maxHeight = 'var(--app-viewport-height, 700px)';
	document.body.append(shell);
	vi.spyOn(window, 'matchMedia').mockImplementation(
		(query) => ({ matches: standalone && query === '(display-mode: standalone)' }) as MediaQueryList
	);
	vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(390);
	return vi.spyOn(window, 'innerHeight', 'get');
}

it('corrects an initially short shell using the measured PWA window height', () => {
	setup().mockReturnValue(844);
	stop = syncPwaViewport(shell);
	expect(shell.getBoundingClientRect().height).toBe(844);
	expect(shell.style.overflow).toBe('');
	stop();
	expect(shell.style.getPropertyValue('--app-viewport-height')).toBe('');
});

it('remeasures after resize and after returning to the PWA, and cleans up listeners', async () => {
	const height = setup().mockReturnValue(700);
	stop = syncPwaViewport(shell);
	height.mockReturnValue(844);
	window.dispatchEvent(new Event('pageshow'));
	await vi.waitFor(() => expect(shell.getBoundingClientRect().height).toBe(844));
	height.mockReturnValue(600);
	window.dispatchEvent(new Event('resize'));
	await vi.waitFor(() => expect(shell.getBoundingClientRect().height).toBe(600));
	stop();
	height.mockReturnValue(900);
	window.dispatchEvent(new Event('resize'));
	await new Promise((resolve) => requestAnimationFrame(resolve));
	expect(shell.style.getPropertyValue('--app-viewport-height')).toBe('');
});

it('leaves browser tabs and desktop sizing on their existing CSS behavior', () => {
	setup(false).mockReturnValue(844);
	stop = syncPwaViewport(shell);
	expect(shell.style.getPropertyValue('--app-viewport-height')).toBe('');
	stop();
	shell.remove();
	vi.restoreAllMocks();
	setup().mockReturnValue(844);
	vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440);
	stop = syncPwaViewport(shell);
	expect(shell.style.getPropertyValue('--app-viewport-height')).toBe('');
});
