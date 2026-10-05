import { Message } from '#lib/mongoose/models/Message.js';
import { connect } from '#lib/mongoose/connect.js';
import { LiveSignal } from './live-signal.js';
import type { ChatMessage, MessageCursor, MessagePage } from '#lib/types/messages.js';
import type { PublicUser } from './session.js';

export const groupSignal = new LiveSignal();
let cached: MessagePage | null = null;
let cachedAt = 0;
let loading: Promise<MessagePage> | null = null;
export function invalidateGroup() {
	cachedAt = 0;
	groupSignal.notify();
}
export function serializeMessage(row: {
	_id: unknown;
	senderId: unknown;
	senderName: string;
	text: string;
	createdAt: Date;
	clientId: string;
}): ChatMessage {
	return {
		id: String(row._id),
		senderId: String(row.senderId),
		senderName: row.senderName,
		text: row.text,
		createdAt: row.createdAt.toISOString(),
		clientId: row.clientId
	};
}
export async function saveGroupMessage(
	user: PublicUser,
	input: { text: string; clientId: string }
) {
	await connect();
	await Message.init();
	const identity = { senderId: user._id, clientId: input.clientId };
	let row = await Message.findOne(identity);
	if (!row) {
		try {
			row = await Message.create({
				...identity,
				text: input.text,
				senderName: `${user.firstName} ${user.lastName}`,
				conversationId: 'basketball'
			});
		} catch (err) {
			if (!(err && typeof err === 'object' && 'code' in err && err.code === 11000)) throw err;
			row = await Message.findOne(identity);
		}
	}
	if (!row) throw new Error('Could not save your message.');
	invalidateGroup();
	return serializeMessage(row);
}
export async function readMessages(before?: MessageCursor): Promise<MessagePage> {
	await connect();
	const filter = before
		? {
				conversationId: 'basketball',
				$or: [
					{ createdAt: { $lt: new Date(before.createdAt) } },
					{ createdAt: new Date(before.createdAt), _id: { $lt: before.id } }
				]
			}
		: { conversationId: 'basketball' };
	const rows = await Message.find(filter)
		.select('_id senderId senderName text createdAt clientId')
		.sort({ createdAt: -1, _id: -1 })
		.limit(51)
		.lean();
	return { messages: rows.slice(0, 50).reverse().map(serializeMessage), hasMore: rows.length > 50 };
}
export async function latestMessages(): Promise<MessagePage> {
	if (cached && Date.now() - cachedAt < 4000) return cached;
	if (loading) return loading;
	const revision = groupSignal.revision;
	loading = readMessages()
		.then((result) => {
			cached = result;
			cachedAt = groupSignal.revision === revision ? Date.now() : 0;
			return result;
		})
		.finally(() => {
			loading = null;
		});
	return loading;
}
