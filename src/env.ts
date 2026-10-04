import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	MONGODB_DB: { static: true },
	MONGODB_URL: { static: true }
});
