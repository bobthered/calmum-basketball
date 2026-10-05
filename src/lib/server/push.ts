import { randomUUID } from 'node:crypto';
import webpush from 'web-push';
import { VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, VAPID_SUBJECT } from '$app/env/private';
import { connect } from '#lib/mongoose/connect.js';
import { Message } from '#lib/mongoose/models/Message.js';
import { PushSubscription } from '#lib/mongoose/models/PushSubscription.js';
import { User } from '#lib/mongoose/models/User.js';
export const pushConfigured = () => Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY && VAPID_SUBJECT);
export const allowedPushEndpoint = (endpoint: string) => {
	try {
		const url = new URL(endpoint);
		return (
			url.protocol === 'https:' &&
			!url.username &&
			!url.password &&
			(!url.port || url.port === '443') &&
			(url.hostname === 'fcm.googleapis.com' ||
				url.hostname.endsWith('.push.apple.com') ||
				url.hostname.endsWith('.push.services.mozilla.com') ||
				url.hostname.endsWith('.notify.windows.com'))
		);
	} catch {
		return false;
	}
};
export const deliverGroupNotifications = async (messageId?: string) => {
	if (!pushConfigured()) return;
	await connect();
	webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
	const deadline = Date.now() + 200000;
	for (let job = 0; job < (messageId ? 1 : 10); job++) {
		if (Date.now() >= deadline) break;
		const lease = randomUUID();
		const now = new Date();
		const message = await Message.findOneAndUpdate(
			{
				...(messageId ? { _id: messageId } : {}),
				pushPending: true,
				pushAfter: { $lte: now }
			},
			{
				$set: { pushLease: lease, pushAfter: new Date(Date.now() + 120000) },
				$inc: { pushAttempts: 1 }
			},
			{ new: true, sort: { createdAt: 1 } }
		);
		if (!message) break;
		if (Date.now() - message.createdAt.getTime() > 24 * 60 * 60 * 1000) {
			await Message.updateOne({ _id: message._id, pushLease: lease }, { pushPending: false });
			continue;
		}
		try {
			const subscriptions = await PushSubscription.find({
				userId: { $ne: message.senderId },
				createdAt: { $lte: message.createdAt }
			}).lean();
			const users = await User.find({ _id: { $in: subscriptions.map((row) => row.userId) } })
				.select('_id')
				.lean();
			const activeUsers = new Set(users.map((row) => String(row._id)));
			let failed = false;
			// Bounded batches prevent one device from delaying all the other recipients.
			for (let offset = 0; offset < subscriptions.length; offset += 6) {
				if (Date.now() >= deadline) {
					failed = true;
					break;
				}
				await Promise.all(
					subscriptions.slice(offset, offset + 6).map(async (subscription) => {
						const id = String(subscription._id);
						if (!activeUsers.has(String(subscription.userId)) || message.pushDelivered.includes(id))
							return;
						try {
							// Recheck ownership immediately before dispatch, including logout/unsubscribe.
							if (
								!(await PushSubscription.exists({
									_id: subscription._id,
									userId: subscription.userId
								}))
							)
								return;
							if (!allowedPushEndpoint(subscription.endpoint))
								throw new Error('Unsupported push endpoint');
							await webpush.sendNotification(
								{
									endpoint: subscription.endpoint,
									keys: { auth: subscription.keys.auth, p256dh: subscription.keys.p256dh }
								},
								JSON.stringify({
									title: 'Basketball Chat',
									body: `${message.senderName} posted a message`,
									messageId: String(message._id),
									url: '/messages'
								}),
								{ TTL: 86400, timeout: 10000, urgency: 'normal' }
							);
							await Message.updateOne(
								{ _id: message._id, pushLease: lease },
								{ $addToSet: { pushDelivered: id } }
							);
						} catch (err) {
							const status =
								err && typeof err === 'object' && 'statusCode' in err ? err.statusCode : 0;
							if (status === 404 || status === 410)
								await PushSubscription.deleteOne({ _id: subscription._id });
							else failed = true;
						}
					})
				);
			}
			await Message.updateOne(
				{ _id: message._id, pushLease: lease },
				{
					pushPending: failed && message.pushAttempts < 8,
					pushAfter: new Date(Date.now() + Math.min(3600000, 30000 * 2 ** message.pushAttempts)),
					pushLease: ''
				}
			);
		} catch (err) {
			await Message.updateOne(
				{ _id: message._id, pushLease: lease },
				{
					pushAfter: new Date(Date.now() + 60000),
					pushLease: ''
				}
			);
			throw err;
		}
	}
};
