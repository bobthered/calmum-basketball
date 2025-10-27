export type User = {
	_id: string;
	firstName: string;
	lastName: string;
} | null;

export const user: { value: User } = $state({ value: null });
