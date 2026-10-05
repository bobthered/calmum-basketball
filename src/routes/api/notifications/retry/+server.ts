import { error } from '@sveltejs/kit';
import { CRON_SECRET } from '$app/env/private';
import { deliverGroupNotifications } from '#lib/server/push.js';

export async function GET({ request }: { request: Request }) {
	if (!CRON_SECRET || request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`)
		error(401, 'Unauthorized');
	await deliverGroupNotifications();
	return Response.json({ success: true });
}
