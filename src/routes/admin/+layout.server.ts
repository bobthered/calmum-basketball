import { requireAdmin } from '#lib/server/session.js';

export const load = () => {
	requireAdmin();
};
