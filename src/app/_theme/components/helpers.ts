
/*
 * @breaking-change Remove @6.0.0
 */
export function emptyStatusWarning(source: string) {
	console.warn(`${source}: Using empty string as a status is deprecated. Use \`basic\` instead.`);
}
