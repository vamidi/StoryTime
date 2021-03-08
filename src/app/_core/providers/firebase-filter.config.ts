export type FilterCallback<T> = (value: T, index: number, array: T[]) => {};

export interface FirebaseFilter<T> {
	table: string,
	columns?: string[],
	filter: FilterCallback<T>,
}



export const firebaseFilterConfig =
{
	// filter table data from some tables
	tableFilters: [
		// { table: '', filter: () => { } }
	],

	/**
	 * @brief - filter columns from some tables
	 * @param table - The tables what we should filter
	 * @param columns - The columns that should be filtered
	 * @param filter - The filter function we should apply.
	 *
	 * @example
	 * firebaseFilterConfig.columnFilters.push({
	 * 		table: 'dialogueOptions', columns: ['parentId'], filter: (item: any) =>
	 * 			this.ids.includes(item.id),
	 * 	});
	 *
	 * 	parentId is the column that we will search for.
	 * 	this.ids are the ids of the parent of each of the row in the current table.
	 */
	columnFilters: [
		// { table: '', column: '', filter: () => { } }
	],

	// Replace route regular expression with a friendly name
	regexNames: [
		// { table: '[a-zA-Z]', column: 'parentId', filter: () => {} },
	],
};

