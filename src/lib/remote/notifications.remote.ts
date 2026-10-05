import { command, query } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { VAPID_PUBLIC_KEY } from '$app/env/private';
import { connect } from '#lib/mongoose/connect.js';
import { PushSubscription } from '#lib/mongoose/models/PushSubscription.js';
import { requireUser } from '#lib/server/session.js';
import { allowedPushEndpoint, pushConfigured } from '#lib/server/push.js';

export const notificationSettings = query(() => {
	requireUser();
	return { publicKey: pushConfigured() ? VAPID_PUBLIC_KEY : '' };
});
export const subscribeNotifications = command(
	v.object({
		endpoint: v.pipe(v.string(), v.maxLength(2048)),
		keys: v.object({
			auth: v.pipe(v.string(), v.minLength(16), v.maxLength(128)),
			p256dh: v.pipe(v.string(), v.minLength(64), v.maxLength(256))
		})
	}),
	async ({ endpoint, keys }) => {
		const user = requireUser();
		if (!pushConfigured()) error(503, 'Notifications are not configured yet.');
		if (!allowedPushEndpoint(endpoint)) error(400, 'This push service is not supported.');
		await connect();
		await PushSubscription.init();
		const existing = await PushSubscription.findOne({ endpoint });
		await PushSubscription.findOneAndUpdate(
			{ endpoint },
			{
				userId: user._id,
				keys,
				...(existing && String(existing.userId) === user._id ? {} : { createdAt: new Date() })
			},
			{ upsert: true, runValidators: true }
		);
		return { success: true };
	}
);
export const unsubscribeNotifications = command(
	v.pipe(v.string(), v.maxLength(2048)),
	async (endpoint) => {
		const user = requireUser();
		await connect();
		await PushSubscription.deleteOne({ endpoint, userId: user._id });
		return { success: true };
	}
);
