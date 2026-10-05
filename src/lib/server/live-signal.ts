// Process-local wakeups give immediate updates. Polling reconciles other Vercel instances.
export class LiveSignal {
	revision = 0;
	private listeners = new Set<() => void>();
	get listenerCount() {
		return this.listeners.size;
	}
	notify() {
		this.revision++;
		for (const listener of [...this.listeners]) listener();
	}
	wait(revision: number, signal: AbortSignal, milliseconds = 5000): Promise<void> {
		if (signal.aborted || revision !== this.revision) return Promise.resolve();
		return new Promise((resolve) => {
			const finish = () => {
				clearTimeout(timer);
				this.listeners.delete(finish);
				signal.removeEventListener('abort', finish);
				resolve();
			};
			const timer = setTimeout(finish, milliseconds);
			this.listeners.add(finish);
			signal.addEventListener('abort', finish, { once: true });
			if (signal.aborted || revision !== this.revision) finish();
		});
	}
}
