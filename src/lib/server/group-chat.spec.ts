import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ init: vi.fn(), findOne: vi.fn(), create: vi.fn() }));
vi.mock('#lib/mongoose/models/Message.js', () => ({ Message: mocks }));
vi.mock('#lib/mongoose/connect.js', () => ({ connect: vi.fn() }));
import { groupSignal, saveGroupMessage } from './group-chat.js';

const user = { _id: 'user-a', firstName: 'Player', lastName: 'A', username: 'pa', isAdmin: false };
const row = {
	_id: 'message-a',
	senderId: 'user-a',
	senderName: 'Player A',
	text: 'Hello',
	clientId: 'request-a',
	createdAt: new Date('2026-10-04T10:00:00Z')
};
beforeEach(() => vi.resetAllMocks());
describe('saving group messages', () => {
	it('derives sender identity from the session and broadcasts only after saving', async () => {
		mocks.findOne.mockResolvedValue(null);
		const revision = groupSignal.revision;
		mocks.create.mockImplementation(async () => {
			expect(groupSignal.revision).toBe(revision);
			return row;
		});
		const saved = await saveGroupMessage(user, { text: 'Hello', clientId: 'request-a' });
		expect(mocks.create).toHaveBeenCalledWith({
			senderId: 'user-a',
			senderName: 'Player A',
			text: 'Hello',
			clientId: 'request-a',
			conversationId: 'basketball'
		});
		expect(saved.id).toBe('message-a');
		expect(groupSignal.revision).toBe(revision + 1);
	});
	it('returns the original message on a repeated send', async () => {
		mocks.findOne.mockResolvedValue(row);
		const saved = await saveGroupMessage(user, { text: 'Hello', clientId: 'request-a' });
		expect(saved.id).toBe('message-a');
		expect(mocks.create).not.toHaveBeenCalled();
	});
	it('handles simultaneous retries racing on the unique message index', async () => {
		mocks.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(row);
		mocks.create.mockRejectedValue({ code: 11000 });
		expect((await saveGroupMessage(user, { text: 'Hello', clientId: 'request-a' })).id).toBe(
			'message-a'
		);
		expect(mocks.findOne).toHaveBeenCalledTimes(2);
	});
	it('does not broadcast a message when persistence fails', async () => {
		mocks.findOne.mockResolvedValue(null);
		mocks.create.mockRejectedValue(new Error('Database unavailable'));
		const revision = groupSignal.revision;
		await expect(saveGroupMessage(user, { text: 'Hello', clientId: 'request-a' })).rejects.toThrow(
			'Database unavailable'
		);
		expect(groupSignal.revision).toBe(revision);
	});
});
