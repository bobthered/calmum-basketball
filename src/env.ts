import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	MONGODB_DB: { static: true },
	MONGODB_URL: { static: true },
	LEGACY_LOGIN_MIGRATION_UNTIL: { schema: (value) => value ?? '2026-11-04T00:00:00Z' },
	VAPID_PUBLIC_KEY: { schema: (value) => value ?? '' },
	VAPID_PRIVATE_KEY: { schema: (value) => value ?? '' },
	VAPID_SUBJECT: { schema: (value) => value ?? '' },
	CRON_SECRET: { schema: (value) => value ?? '' }
});
