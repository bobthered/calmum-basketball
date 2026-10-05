import { afterEach, expect, it } from 'vitest';
import { startDisplayDiagnostics, displayReport } from './display-diagnostics.js';

let stop: (() => void) | undefined;
let shell: HTMLDivElement;
afterEach(() => {
	stop?.();
	shell?.remove();
});

it('preserves launch measurements and records changes without resizing the app', () => {
	shell = document.createElement('div');
	shell.id = 'app-shell';
	shell.style.cssText = 'height:700px;display:flex;flex-direction:column;';
	const header = document.createElement('header');
	header.style.cssText = 'height:64px;flex-shrink:0;margin-top:auto;';
	shell.append(header);
	document.body.append(shell);
	stop = startDisplayDiagnostics();
	expect(shell.style.height).toBe('700px');
	expect(shell.style.getPropertyValue('--app-viewport-height')).toBe('');
	shell.style.height = '844px';
	const report = JSON.parse(displayReport());
	expect(report.samples[0].reason).toBe('launch');
	expect(report.samples[0].shell.height).toBe(700);
	expect(report.samples.at(-1).shell.height).toBe(844);
	expect(report.samples.at(-1).navigation.height).toBe(64);
	expect(report.samples[0].safeTop).toBeTypeOf('number');
	expect(report.samples[0].safeBottom).toBeTypeOf('number');
});
