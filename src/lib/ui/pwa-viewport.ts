// Recheck installed-app viewport sizing after iOS finishes restoring its window.
// Keep CSS dvh as the fallback and use the measured window, never screen.height.
export function syncPwaViewport(shell: HTMLElement): () => void {
	const standalone = () =>
		matchMedia('(display-mode: standalone)').matches ||
		matchMedia('(display-mode: fullscreen)').matches ||
		(navigator as Navigator & { standalone?: boolean }).standalone === true;
	if (!standalone()) return () => {};
	const previous = shell.style.getPropertyValue('--app-viewport-height');
	let frame = 0;
	let stopped = false;
	function measure() {
		frame = 0;
		if (stopped) return;
		if (!standalone() || window.innerWidth >= 1024) {
			shell.style.removeProperty('--app-viewport-height');
			return;
		}
		if (document.visibilityState === 'hidden' || (window.visualViewport?.scale ?? 1) !== 1) return;
		const height = window.innerHeight;
		if (Number.isFinite(height) && height > 0) {
			shell.style.setProperty('--app-viewport-height', `${height}px`);
		}
	}
	function schedule() {
		if (frame) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(measure);
	}
	measure();
	schedule();
	const timers = [setTimeout(schedule, 250), setTimeout(schedule, 1000)];
	window.addEventListener('resize', schedule);
	window.addEventListener('pageshow', schedule);
	document.addEventListener('visibilitychange', schedule);
	window.visualViewport?.addEventListener('resize', schedule);
	return () => {
		stopped = true;
		cancelAnimationFrame(frame);
		for (const timer of timers) clearTimeout(timer);
		window.removeEventListener('resize', schedule);
		window.removeEventListener('pageshow', schedule);
		document.removeEventListener('visibilitychange', schedule);
		window.visualViewport?.removeEventListener('resize', schedule);
		if (previous) shell.style.setProperty('--app-viewport-height', previous);
		else shell.style.removeProperty('--app-viewport-height');
	};
}
