import * as v from 'valibot';
import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import { LEGACY_LOGIN_MIGRATION_UNTIL } from '$app/env/private';
import { connect } from '#lib/mongoose/connect.js';
import { User } from '#lib/mongoose/models/User.js';
import { createSession, destroySession, publicUser } from '#lib/server/session.js';

export const currentSession = query(() => getRequestEvent().locals.user);

// Temporary compatibility bridge explicitly authorized for existing local-storage logins.
export const migrateLegacyLogin = command(
	v.pipe(v.string(), v.regex(/^[a-f\d]{24}$/i)),
	async (id) => {
		if (getRequestEvent().locals.user) return getRequestEvent().locals.user;
		const deadline = Date.parse(LEGACY_LOGIN_MIGRATION_UNTIL);
		if (!Number.isFinite(deadline) || Date.now() >= deadline)
			error(403, 'Please sign in with your password.');
		await connect();
		const row = await User.findById(id).select('firstName lastName username isAdmin').lean();
		if (!row) error(404, 'Account not found.');
		await createSession(String(row._id));
		return publicUser(row);
	}
);

export const signOut = command(async () => {
	await destroySession();
	return { success: true };
});
