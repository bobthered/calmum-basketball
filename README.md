# Cal-Mum Basketball

A progressive web app for coordinating basketball attendance, guest counts,
and conversations among players. Users can view the basketball calendar,
manage their account, and participate in a shared group chat. Administrators
manage users and calendar entries. Direct messaging is planned for a later phase.

Built with SvelteKit 3, Svelte 5, TypeScript, Tailwind CSS, and
[SvelteWind](https://sveltewind.com). MongoDB stores
application data through Mongoose, and Vercel hosts the app.

## UI components

Shared UI primitives come from `sveltewind/components`, re-exported through
`src/components/index.ts`. The app's central theme in `src/lib/ui/theme.ts`
extends SvelteWind's Classic preset. `src/app.css` includes SvelteWind's Tailwind
sources and preserves the custom burgundy and gray palettes.

App-specific components compose these primitives: mobile navigation, labeled
form fields, pending submit buttons, and the login and notification flows.
`Modal.svelte` wraps SvelteWind's native Dialog, preserving explicit-choice
behavior for dialogs that must remain open until the user answers. The admin
menu uses SvelteWind's native Popover with its complete trigger attributes.

## Local development

Use Node.js 22.17 or newer. Install the dependencies:

```sh
npm ci
```

Copy `.env.example` to `.env` and fill in `MONGODB_URL` and `MONGODB_DB`.
Keep `.env` private; it is ignored by Git. Start the development server:

```sh
npm run dev

# Open the app in a browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

The app uses the Vercel adapter. Its remote-function packaging creates a symlink,
so a local Windows build requires permission to create symlinks. Client and server
compilation can succeed while the final packaging step fails with `EPERM`.

Run `npm run check` and `npm test` to verify changes. Use `npm run format` to
format the project and `npm run lint` for formatting and ESLint checks.

## Vercel deployment

Configure these environment variables for the intended Vercel environment:

| Variable                       | Purpose                                                      |
| ------------------------------ | ------------------------------------------------------------ |
| `MONGODB_URL`                  | MongoDB connection string.                                   |
| `MONGODB_DB`                   | Application database name.                                   |
| `VAPID_PUBLIC_KEY`             | Public key used to subscribe devices to notifications.       |
| `VAPID_PRIVATE_KEY`            | Private key used by the server to send notifications.        |
| `VAPID_SUBJECT`                | Push sender contact, as a `mailto:` address or HTTPS URL.    |
| `CRON_SECRET`                  | Authenticates the notification retry endpoint.               |
| `LEGACY_LOGIN_MIGRATION_UNTIL` | Optional cutoff for migrating existing local-storage logins. |

The MongoDB variables are read at build time. Redeploy after changing environment
variables so the deployment uses the intended configuration. Vercel uses the
adapter configured in `vite.config.ts`; `vercel.json` schedules notification
retries once daily at 12:00 UTC.

## Group chat

The Chat tab contains one shared, text-only basketball conversation. Messages are
stored in MongoDB, with a bounded server cache of the latest 50 messages. Older
messages load on demand. SvelteKit `query.live` uses immediate process-local
wakeups and five-second database reconciliation to synchronize separate Vercel
instances. Live connections renew before the Hobby function duration limit.

Login now uses a persistent, HttpOnly session cookie with a 90-day lifetime,
renewed after half its lifetime. Existing local-storage user IDs automatically
migrate on the next visit without a password. This deliberately accepts the
existing user-ID impersonation risk during migration. The bridge stops accepting
IDs on November 4, 2026 UTC by default. Set `LEGACY_LOGIN_MIGRATION_UNTIL` to a past
date after everyone has migrated, or explicitly extend it if needed. Existing
sessions remain valid after the cutoff. Deleted accounts cannot migrate or use
old sessions.

### Device notifications

1. Run `npm run setup:push`. It generates keys and a cron secret in the ignored
   `.env` file, preserving existing keys.
2. Copy `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, and `CRON_SECRET`
   from `.env` into Vercel's production environment variables and redeploy. Keep
   the same VAPID keys on future deployments; changing them requires devices to
   resubscribe. `VAPID_SUBJECT` can be a real contact `mailto:` address or HTTPS URL.
3. Each user answers the notification dialog after login on each device.
   Choose **Enable notifications** to subscribe or **Not now** to skip.
   The dialog stays open until a choice is made, and the answer is remembered
   in local storage for that account on that browser/device. Clearing browser
   storage can cause it to appear again. Notification controls are available
   in **Settings** afterward; enabling notifications is optional.
   iPhone/iPad users need iOS/iPadOS 16.4+ and must open the installed Home Screen
   app to grant permission. HTTPS is required outside localhost.

New messages trigger notification attempts for subscribed devices belonging to
other users. Notification text contains the author's name, without message text.
Tapping opens Chat. Logout unsubscribes the current device; account deletion
removes every subscription belonging to that account.

Notification jobs are embedded in messages, leased in MongoDB, and record
successful recipients. The Hobby-compatible daily cron retries pending jobs;
normal sends attempt delivery immediately. Failed notifications may therefore
wait until the daily retry. Jobs expire after 24 hours. Push services/device
settings can delay or suppress delivery, and crash recovery is at-least-once
(the service worker uses a message-specific notification tag to replace repeats).
For frequent background retries, replace the daily cron with a durable queue or
a more frequent scheduler on an appropriate plan. No chat data or live responses
are cached by the service worker.

Before rollout, test with two accounts on actual Android and iOS devices: migrate
an existing login, send/receive, close and reopen, enable notifications, receive a
notification with the app closed, tap it, and verify logout. Automated tests cover
session behavior, persistence/retry handling, live wakeups, notification delivery
rules, and the chat composer; they do not prove real-device push delivery.
