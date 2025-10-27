export const copyToClipboard = async ({
	contents,
	onsuccess
}: {
	contents: string;
	onsuccess?: () => Promise<any>;
}) => {
	try {
		await navigator.clipboard.writeText(contents);
		if (onsuccess) await onsuccess();
	} catch (error) {}
};
