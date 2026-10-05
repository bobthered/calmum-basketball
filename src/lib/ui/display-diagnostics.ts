type Sample = ReturnType<typeof measure>;
const samples: Sample[] = [];
let startedAt = 0;

function measure(reason: string) {
	const shell = document.getElementById('app-shell');
	const header = document.querySelector('header');
	const viewport = window.visualViewport;
	const probe = document.createElement('div');
	probe.style.cssText =
		'position:fixed;visibility:hidden;pointer-events:none;width:0;height:100dvh;box-sizing:content-box;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
	document.body.append(probe);
	const style = getComputedStyle(probe);
	const dynamicHeight = parseFloat(style.height);
	const safeTop = parseFloat(style.paddingTop);
	const safeBottom = parseFloat(style.paddingBottom);
	probe.remove();
	const rect = (node: Element | null) => {
		if (!node) return null;
		const { top, bottom, height } = node.getBoundingClientRect();
		return { top, bottom, height };
	};
	return {
		reason,
		elapsedMs: Date.now() - startedAt,
		path: window.location.pathname,
		innerHeight: window.innerHeight,
		innerWidth: window.innerWidth,
		clientHeight: document.documentElement.clientHeight,
		dynamicHeight,
		safeTop,
		safeBottom,
		visualViewport: viewport
			? { height: viewport.height, offsetTop: viewport.offsetTop, scale: viewport.scale }
			: null,
		shell: rect(shell),
		navigation: rect(header)
	};
}

export function captureDisplaySample(reason: string) {
	if (samples.length >= 32) samples.splice(8, 1); // Keep the launch samples.
	samples.push(measure(reason));
}

export function startDisplayDiagnostics(): () => void {
	if (!document.getElementById('app-shell')) return () => {};
	startedAt = Date.now();
	samples.length = 0;
	let frame = 0;
	let reason = '';
	const record = (event: Event) => {
		reason = event.type;
		if (frame) return;
		frame = requestAnimationFrame(() => {
			frame = 0;
			captureDisplaySample(reason);
		});
	};
	captureDisplaySample('launch');
	const timers = [250, 1000].map((delay) =>
		setTimeout(() => captureDisplaySample(`launch+${delay}ms`), delay)
	);
	window.addEventListener('resize', record);
	window.addEventListener('pageshow', record);
	document.addEventListener('scroll', record, { capture: true, passive: true });
	window.visualViewport?.addEventListener('resize', record);
	window.visualViewport?.addEventListener('scroll', record);
	return () => {
		cancelAnimationFrame(frame);
		timers.forEach(clearTimeout);
		window.removeEventListener('resize', record);
		window.removeEventListener('pageshow', record);
		document.removeEventListener('scroll', record, true);
		window.visualViewport?.removeEventListener('resize', record);
		window.visualViewport?.removeEventListener('scroll', record);
	};
}

export function displayReport(): string {
	captureDisplaySample('report');
	return JSON.stringify(
		{
			userAgent: navigator.userAgent,
			standalone:
				matchMedia('(display-mode: standalone)').matches ||
				(navigator as Navigator & { standalone?: boolean }).standalone === true,
			viewportMeta: Array.from(document.querySelectorAll('meta[name="viewport"]'), (node) =>
				node.getAttribute('content')
			),
			samples
		},
		null,
		2
	);
}
