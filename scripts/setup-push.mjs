import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import webpush from 'web-push';

const envPath = new URL('../.env', import.meta.url);
let contents = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
const has = (name) => new RegExp(`^${name}=.+`, 'm').test(contents);
const append = (name, value) => {
	contents = contents.replace(new RegExp(`^${name}=.*(?:\r?\n|$)`, 'm'), '');
	contents += `${contents.endsWith('\n') || !contents ? '' : '\n'}${name}=${value}\n`;
};
if (has('VAPID_PUBLIC_KEY') !== has('VAPID_PRIVATE_KEY')) {
	throw new Error('Both VAPID keys must be present or absent. Existing keys were left unchanged.');
}
if (!has('VAPID_PUBLIC_KEY')) {
	const keys = webpush.generateVAPIDKeys();
	append('VAPID_PUBLIC_KEY', keys.publicKey);
	append('VAPID_PRIVATE_KEY', keys.privateKey);
}
if (!has('VAPID_SUBJECT'))
	append('VAPID_SUBJECT', 'https://github.com/bobthered/calmum-basketball');
if (!has('CRON_SECRET')) append('CRON_SECRET', randomBytes(32).toString('base64url'));
writeFileSync(envPath, contents);
console.log(
	'Push configuration is ready in .env. Existing keys were preserved. Copy the four VAPID/CRON values into Vercel environment variables before deploying.'
);
