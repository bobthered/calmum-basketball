import { command, getRequestEvent, query } from '$app/server';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';
import { requireUser, readSession, SESSION_COOKIE } from '#lib/server/session.js';
import {
	groupSignal,
	latestMessages,
	readMessages,
	saveGroupMessage
} from '#lib/server/group-chat.js';
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

export const groupMessages = query.live(async function* () {
	requireUser();
	const { request, cookies } = getRequestEvent();
	const token = cookies.get(SESSION_COOKIE) ?? '';
	const controller = new AbortController();
	const abort = () => controller.abort();
	request.signal.addEventListener('abort', abort, { once: true });
	if (request.signal.aborted) abort();
	const timer = setTimeout(abort, 240_000);
	let checkedAt = Date.now();
	try {
		while (!controller.signal.aborted) {
			const revision = groupSignal.revision;
			if (Date.now() - checkedAt >= 30_000) {
				if (!(await readSession(token))) error(401, 'Please sign in again.');
				checkedAt = Date.now();
			}
			yield await latestMessages();
			await groupSignal.wait(revision, controller.signal);
		}
	} finally {
		clearTimeout(timer);
		request.signal.removeEventListener('abort', abort);
		controller.abort();
	}
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
