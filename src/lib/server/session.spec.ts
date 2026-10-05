import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
	create: vi.fn(),
	deleteOne: vi.fn(),
	findOne: vi.fn(),
	updateOne: vi.fn(),
	findById: vi.fn(),
	cookies: { get: vi.fn(), set: vi.fn(), delete: vi.fn() },
	locals: { user: null as { _id: string; isAdmin: boolean } | null }
}));
vi.mock('$app/server', () => ({
	getRequestEvent: () => ({ cookies: mocks.cookies, locals: mocks.locals })
}));
vi.mock('#lib/mongoose/connect.js', () => ({ connect: vi.fn() }));
vi.mock('#lib/mongoose/models/Session.js', () => ({ Session: mocks }));
vi.mock('#lib/mongoose/models/User.js', () => ({ User: { findById: mocks.findById } }));
import {
	createSession,
	destroySession,
	hashToken,
	readSession,
	requireAdmin,
	requireUser,
	SESSION_COOKIE
} from './session.js';

beforeEach(() => {
	vi.resetAllMocks();
	mocks.locals.user = null;
});
describe('persistent sessions', () => {
	it('sets a persistent HttpOnly cookie and stores only the token hash', async () => {
		await createSession('user-a');
		const [name, token, options] = mocks.cookies.set.mock.calls[0];
		expect(name).toBe(SESSION_COOKIE);
		expect(options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
		expect(options.expires.getTime() - Date.now()).toBeGreaterThan(89 * 86400_000);
		expect(mocks.create).toHaveBeenCalledWith({
			_id: hashToken(token),
			userId: 'user-a',
			expiresAt: options.expires
		});
		expect(hashToken(token)).not.toBe(token);
	});
	it('rejects expired sessions even before MongoDB TTL cleanup', async () => {
		mocks.findOne.mockResolvedValue(null);
		expect(await readSession('a'.repeat(43))).toBeNull();
		expect(mocks.findOne.mock.calls[0][0].expiresAt.$gt).toBeInstanceOf(Date);
		expect(mocks.findById).not.toHaveBeenCalled();
	});
	it('restores the user without returning a password hash', async () => {
		mocks.findOne.mockResolvedValue({
			userId: 'user-a',
			expiresAt: new Date(Date.now() + 86400_000)
		});
		mocks.findById.mockReturnValue({
			select: () => ({
				lean: async () => ({
					_id: 'user-a',
					firstName: 'A',
					lastName: 'Player',
					username: 'aplayer',
					isAdmin: false,
					passwordHash: 'secret'
				})
			})
		});
		const restored = await readSession('a'.repeat(43));
		expect(restored?.user).toEqual({
			_id: 'user-a',
			firstName: 'A',
			lastName: 'Player',
			username: 'aplayer',
			isAdmin: false
		});
	});
	it('revokes the server session and clears the cookie on logout', async () => {
		mocks.cookies.get.mockReturnValue('a'.repeat(43));
		await destroySession();
		expect(mocks.deleteOne).toHaveBeenCalledWith({ _id: hashToken('a'.repeat(43)) });
		expect(mocks.cookies.delete).toHaveBeenCalledWith(SESSION_COOKIE, { path: '/' });
	});
	it('requires authenticated users and verifies administrator privileges', () => {
		expect(() => requireUser()).toThrow();
		mocks.locals.user = { _id: 'user-a', isAdmin: false };
		expect(() => requireAdmin()).toThrow();
		mocks.locals.user.isAdmin = true;
		expect(requireAdmin()._id).toBe('user-a');
	});
});
