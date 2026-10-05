import { expect, it } from 'vitest';
import { mergeMessages, type ChatMessage } from './messages.js';
const message = (id: string, date: string): ChatMessage => ({
	id,
	createdAt: date,
	senderId: 'a',
	senderName: 'Player A',
	clientId: id,
	text: 'Hello'
});
it('merges history, live snapshots and send responses without duplicate messages', () => {
	const first = message('1', '2026-10-04T10:00:00.000Z');
	const second = message('2', '2026-10-04T10:00:00.000Z');
	const third = message('3', '2026-10-04T10:00:01.000Z');
	expect(mergeMessages([first], [third, second], [third])).toEqual([first, second, third]);
});
