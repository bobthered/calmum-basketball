import { command, query } from '$app/server';
import * as v from 'valibot';
import { requireUser } from '#lib/server/session.js';
import { latestMessages, readMessages, saveGroupMessage } from '#lib/server/group-chat.js';
import { deliverGroupNotifications } from '#lib/server/push.js';

const objectId = v.pipe(v.string(), v.regex(/^[a-f\d]{24}$/i));
export const olderGroupMessages = query(
	v.object({
		id: objectId,
		createdAt: v.pipe(v.string(), v.isoTimestamp())
	}),
	async (before) => {
		requireUser();
		return readMessages(before);
	}
);

export const groupMessages = query(async () => {
	requireUser();
	return latestMessages();
});

export const sendGroupMessage = command(
	v.object({
		text: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(2000)),
		clientId: v.pipe(v.string(), v.uuid())
	}),
	async ({ text, clientId }) => {
		const user = requireUser();
		const message = await saveGroupMessage(user, { text, clientId });
		// The notification job is embedded in the saved message so a failed send can be retried.
		try {
			await deliverGroupNotifications(message.id);
		} catch (err) {
			console.error(
				'Group notification delivery failed',
				err instanceof Error ? err.message : 'Unknown error'
			);
		}
		return message;
	}
);
