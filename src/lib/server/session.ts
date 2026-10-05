import { createHash, randomBytes } from 'node:crypto';
import { error, type Cookies } from '@sveltejs/kit';
import { getRequestEvent } from '$app/server';
import { connect } from '#lib/mongoose/connect.js';
import { Session } from '#lib/mongoose/models/Session.js';
import { User } from '#lib/mongoose/models/User.js';
import type { User as UserState } from '#lib/state/user/user.svelte.js';

export type PublicUser = NonNullable<UserState>;
export const SESSION_COOKIE = 'basketball_session';
const lifetime = 90 * 24 * 60 * 60 * 1000;
export const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const publicUser = (row: {
	_id: unknown;
	firstName: string;
	lastName: string;
	username: string;
	isAdmin: boolean;
}): PublicUser => ({
	_id: String(row._id),
	firstName: row.firstName,
	lastName: row.lastName,
	username: row.username,
	isAdmin: row.isAdmin
});
function setCookie(cookies: Cookies, token: string, expires: Date) {
	cookies.set(SESSION_COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', expires });
}
export async function createSession(userId: string) {
	const { cookies } = getRequestEvent();
	await connect();
	const oldToken = cookies.get(SESSION_COOKIE);
	if (oldToken) await Session.deleteOne({ _id: hashToken(oldToken) });
	const token = randomBytes(32).toString('base64url');
	const expiresAt = new Date(Date.now() + lifetime);
	await Session.create({ _id: hashToken(token), userId, expiresAt });
	setCookie(cookies, token, expiresAt);
}
export async function readSession(
	token: string
): Promise<{ user: PublicUser; expiresAt: Date } | null> {
	if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
	await connect();
	const session = await Session.findOne({ _id: hashToken(token), expiresAt: { $gt: new Date() } });
	if (!session) return null;
	const row = await User.findById(session.userId)
		.select('firstName lastName username isAdmin')
		.lean();
	if (!row) return null;
	return { user: publicUser(row), expiresAt: session.expiresAt };
}
export async function renewSession(cookies: Cookies, token: string, expiresAt: Date) {
	if (expiresAt.getTime() - Date.now() > lifetime / 2) return;
	const renewed = new Date(Date.now() + lifetime);
	await Session.updateOne({ _id: hashToken(token) }, { expiresAt: renewed });
	setCookie(cookies, token, renewed);
}
export async function destroySession() {
	const { cookies } = getRequestEvent();
	const token = cookies.get(SESSION_COOKIE);
	if (token) {
		await connect();
		await Session.deleteOne({ _id: hashToken(token) });
	}
	cookies.delete(SESSION_COOKIE, { path: '/' });
}
export function requireUser(): PublicUser {
	const user = getRequestEvent().locals.user;
	if (!user) error(401, 'Please sign in to continue.');
	return user;
}
export function requireAdmin() {
	const user = requireUser();
	if (!user.isAdmin) error(403, 'Administrator access required.');
	return user;
}
