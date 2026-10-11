// Short requests let Vercel release provisioned memory between chat updates.
export const startChatPolling = (refresh: () => Promise<void>, interval = 5000) => {
	let isDisposed = false;
	let isPageActive = true;
	let isRefreshing = false;
	let isRefreshRequested = false;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const isActive = () =>
		!isDisposed && isPageActive && document.visibilityState === 'visible' && navigator.onLine;
	const run = async () => {
		clearTimeout(timer);
		if (!isActive()) return;
		if (isRefreshing) {
			isRefreshRequested = true;
			return;
		}
		isRefreshing = true;
		try {
			await refresh();
		} catch {
			// The caller presents errors; retry on the next scheduled update.
		} finally {
			isRefreshing = false;
			if (isActive()) {
				timer = setTimeout(() => void run(), isRefreshRequested ? 0 : interval);
			}
			isRefreshRequested = false;
		}
	};
	const hide = () => {
		isPageActive = false;
		clearTimeout(timer);
	};
	const show = () => {
		isPageActive = true;
		void run();
	};
	const update = () => void run();
	document.addEventListener('visibilitychange', update);
	window.addEventListener('offline', update);
	window.addEventListener('online', update);
	window.addEventListener('pagehide', hide);
	window.addEventListener('pageshow', show);
	void run();
	return () => {
		isDisposed = true;
		clearTimeout(timer);
		document.removeEventListener('visibilitychange', update);
		window.removeEventListener('offline', update);
		window.removeEventListener('online', update);
		window.removeEventListener('pagehide', hide);
		window.removeEventListener('pageshow', show);
	};
};
