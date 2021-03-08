/**
 * @brief - This is a collection of the data collected in the
 * firebase database.
 */

export class Collection<T> /* extends IndexedDB */ implements Iterable<T>
{
	private counter: number = 0;

	/**
	 * @brief - Primary field of the data inside this collection
	 */
	public primaryKey: string | number;

	/**
	 * @brief - Data that the collection is holding
	 */
	protected data: T[] = [];

	/**
	 * @brief - find a object in the collection
	 * @param id - the id of the object.
	 */
	public find(id: string | number): any | null
	{
		const found = this.data.find((object: T) => {
			if(object[this.primaryKey] === id)
			{
				return object;
			}
		});

		return found ?? null;
	}

	/**
	 * @brief - find the index in the collection
	 * @param id - the id of the object.
	public findIndex(id: string | number): number
	{
		return this.data.findIndex((object) => {
			if(object[this.primaryKey] === id)
			{
				return object;
			}
		});
	}
	*/

	/**
	 * @brief - Add entry to the collection
	 * @param newEntry
	 */
	public add(newEntry: T): boolean
	{
		this.data.push(newEntry);
		return true;
	}

	/** ITERATIONS **/
	public next(): IteratorResult<T>
	{
		if(this.data.length > 0 && this.counter <= this.data.length - 1)
			return { value: this.data[this.counter++], done: false };
		return { value: null, done: true };
	}

	[Symbol.iterator](): Iterator<T> {
		const that = this;
		let step = 0;
		return {
			next() {
				if(that.data.length > 0 && step <= that.data.length - 1)
					return { value: that.data[step++], done: false };
				return { value: null, done: true };
			},
		};
	}
}
