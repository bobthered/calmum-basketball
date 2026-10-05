export const isActiveRoute = (pathname: string, href: string): boolean => {
	const path = pathname.replace(/\/+$/, '') || '/';
	const route = href.replace(/\/+$/, '') || '/';
	return path === route || (route !== '/' && path.startsWith(`${route}/`));
};
