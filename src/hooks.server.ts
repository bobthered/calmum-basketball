import type { Handle } from '@sveltejs/kit/hooks';
import { readSession, renewSession, SESSION_COOKIE } from '#lib/server/session.js';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const session = await readSession(token);
		if (session) {
			event.locals.user = session.user;
			await renewSession(event.cookies, token, session.expiresAt);
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}
	return resolve(event);
};
