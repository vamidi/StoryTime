
export type NbNullableInput = string | null | undefined;
export type NbBooleanInput = boolean | NbNullableInput;

/*
 * @breaking-change Remove @6.0.0
 */
export function emptyStatusWarning(source: string) {
	console.warn(`${source}: Using empty string as a status is deprecated. Use \`basic\` instead.`);
}

export function convertToBoolProperty(val: any): boolean {
	if (typeof val === 'string') {
		val = val.toLowerCase().trim();

		return (val === 'true' || val === '');
	}

	return !!val;
}
