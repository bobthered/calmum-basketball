import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
	findJob: vi.fn(),
	updateJob: vi.fn(),
	findSubscriptions: vi.fn(),
	exists: vi.fn(),
	deleteSubscription: vi.fn(),
	findUsers: vi.fn(),
	send: vi.fn(),
	config: vi.fn()
}));
vi.mock('$app/env/private', () => ({
	VAPID_PUBLIC_KEY: 'public',
	VAPID_PRIVATE_KEY: 'private',
	VAPID_SUBJECT: 'mailto:basketball@example.com'
}));
vi.mock('web-push', () => ({
	default: { setVapidDetails: mocks.config, sendNotification: mocks.send }
}));
vi.mock('#lib/mongoose/connect.js', () => ({ connect: vi.fn() }));
vi.mock('#lib/mongoose/models/Message.js', () => ({
	Message: { findOneAndUpdate: mocks.findJob, updateOne: mocks.updateJob }
}));
vi.mock('#lib/mongoose/models/PushSubscription.js', () => ({
	PushSubscription: {
		find: mocks.findSubscriptions,
		exists: mocks.exists,
		deleteOne: mocks.deleteSubscription
	}
}));
vi.mock('#lib/mongoose/models/User.js', () => ({ User: { find: mocks.findUsers } }));
import { allowedPushEndpoint, deliverGroupNotifications } from './push.js';

const job = {
	_id: 'message-a',
	senderId: 'user-a',
	senderName: 'Player A',
	createdAt: new Date(),
	pushDelivered: [] as string[],
	pushAttempts: 1
};
const subscription = {
	_id: 'device-b',
	userId: 'user-b',
	endpoint: 'https://fcm.googleapis.com/fcm/send/device-b',
	keys: { auth: 'auth', p256dh: 'key' }
};
beforeEach(() => {
	vi.resetAllMocks();
	mocks.findJob.mockResolvedValue(job);
	mocks.findSubscriptions.mockReturnValue({ lean: async () => [subscription] });
	mocks.findUsers.mockReturnValue({ select: () => ({ lean: async () => [{ _id: 'user-b' }] }) });
	mocks.exists.mockResolvedValue(true);
	mocks.send.mockResolvedValue({ statusCode: 201 });
});
describe('group notifications', () => {
	it('targets other users and includes the author without exposing message text', async () => {
		await deliverGroupNotifications('message-a');
		expect(mocks.findSubscriptions.mock.calls[0][0].userId).toEqual({ $ne: 'user-a' });
		const payload = JSON.parse(mocks.send.mock.calls[0][1]);
		expect(payload).toMatchObject({
			title: 'Basketball Chat',
			body: 'Player A posted a message',
			url: '/messages'
		});
		expect(mocks.updateJob).toHaveBeenCalledWith(expect.anything(), {
			$addToSet: { pushDelivered: 'device-b' }
		});
	});
	it('removes an expired device subscription', async () => {
		mocks.send.mockRejectedValue({ statusCode: 410 });
		await deliverGroupNotifications('message-a');
		expect(mocks.deleteSubscription).toHaveBeenCalledWith({ _id: 'device-b' });
	});
	it('retains a durable retry when the push service is temporarily unavailable', async () => {
		mocks.send.mockRejectedValue({ statusCode: 503 });
		await deliverGroupNotifications('message-a');
		expect(mocks.updateJob).toHaveBeenLastCalledWith(
			expect.anything(),
			expect.objectContaining({ pushPending: true, pushAfter: expect.any(Date) })
		);
	});
	it('does not resend a successful delivery when retrying a job', async () => {
		mocks.findJob.mockResolvedValue({ ...job, pushDelivered: ['device-b'] });
		await deliverGroupNotifications('message-a');
		expect(mocks.send).not.toHaveBeenCalled();
	});
	it('skips a device unsubscribed after the job started', async () => {
		mocks.exists.mockResolvedValue(false);
		await deliverGroupNotifications('message-a');
		expect(mocks.send).not.toHaveBeenCalled();
	});
	it('rejects private, insecure and deceptive push endpoints', () => {
		expect(allowedPushEndpoint('http://fcm.googleapis.com/send')).toBe(false);
		expect(allowedPushEndpoint('https://127.0.0.1/private')).toBe(false);
		expect(allowedPushEndpoint('https://fcm.googleapis.com.evil.example/send')).toBe(false);
		expect(allowedPushEndpoint('https://web.push.apple.com/device')).toBe(true);
		expect(allowedPushEndpoint(subscription.endpoint)).toBe(true);
	});
});
