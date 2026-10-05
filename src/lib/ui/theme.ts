import { theme } from 'sveltewind/theme';
import { classic } from 'sveltewind/themes';

// One fixed application theme, shared by all SvelteWind components.
// Keep account-specific settings out of this server-shared configuration.
theme.set.theme(structuredClone(classic));
theme.update.base(
	'button',
	'bg-primary-700 text-white hover:bg-primary-800 focus:bg-primary-800 disabled:cursor-default disabled:bg-gray-500 disabled:text-white disabled:outline-0'
);
theme.set.base(
	'card',
	'flex flex-col rounded border-0 bg-white p-4 text-current shadow-sm inset-ring-0 outline-0 dark:bg-gray-900'
);
theme.update.variant('card', 'outline', 'border-0 inset-ring-0 outline-0');
theme.set.base('h1', 'text-4xl font-bold sm:text-5xl');
theme.set.base('main', 'mx-auto flex w-full max-w-7xl flex-col overflow-auto');
theme.set.base('header', 'lg:py-4');
theme.set.base('form', '');
theme.update.base(
	'dialog',
	'w-[calc(100%-2rem)] max-w-sm max-h-[calc(100dvh-2rem)] border-0 bg-white p-4 text-gray-950 inset-ring-0 outline-0 backdrop:bg-black/60 dark:bg-gray-900 dark:text-gray-50'
);

export { theme };
