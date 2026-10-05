import { expect, it, vi } from 'vitest';
const loadModels = async () => {
	return Promise.all([
		import('./Calendar'),
		import('./User'),
		import('./UserCalendarStatus'),
		import('./Message'),
		import('./Session'),
		import('./PushSubscription')
	]).then(([calendar, user, status, message, session, subscription]) => [
		calendar.Calendar,
		user.User,
		status.UserCalendarStatus,
		message.Message,
		session.Session,
		subscription.PushSubscription
	]);
};
it('reuses compiled models after repeated server module reloads without connecting to MongoDB', async () => {
	const original = await loadModels();
	for (let reload = 0; reload < 2; reload++) {
		vi.resetModules();
		const models = await loadModels();
		models.forEach((model, index) => {
			expect(model).toBe(original[index]);
			expect(model.schema).toBe(original[index].schema);
		});
	}
});
