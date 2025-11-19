export type User = {
	_id: string;
	firstName: string;
	isAdmin: boolean;
	lastName: string;
	username: string;
} | null;

export const user: { value: User } = $state({ value: null });
