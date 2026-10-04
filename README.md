# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

This project uses SvelteKit 3 and requires Node.js 22.17 or newer. Set
`MONGODB_URL` and `MONGODB_DB` in `.env` before running the app. These variables
are declared in `src/env.ts` and are read at build time; configure them in Vercel
before building a deployment.

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
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

Run `npm run check` and `npm run test:unit -- --run` to verify changes.
