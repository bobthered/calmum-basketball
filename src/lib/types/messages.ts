export type ChatMessage = {
	clientId: string;
	createdAt: string;
	id: string;
	senderId: string;
	senderName: string;
	text: string;
};
export type MessageCursor = {
	createdAt: string;
	id: string;
};
export type MessagePage = {
	hasMore: boolean;
	messages: ChatMessage[];
};
export const mergeMessages = (...groups: ChatMessage[][]): ChatMessage[] => {
	const rows = new Map<string, ChatMessage>();
	for (const group of groups) for (const row of group) rows.set(row.id, row);
	return [...rows.values()].sort(
		(a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
	);
};
