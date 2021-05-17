import { ProxyObject } from '@app-core/data/base';
import { Observable } from 'rxjs';
import { Collection } from '@app-core/data/collection';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';
import { map } from 'rxjs/operators';
import { SnapshotAction } from '@angular/fire/database/interfaces';
import { FilterCallback } from '@app-core/providers/firebase-filter.config';
import { UtilsService } from '@app-core/utils';
import { IVersion, PipelineAsset } from '@app-core/interfaces/pipelines.interface';
import { DebugType } from '@app-core/utils/utils.service';
import { FileUpload } from '@app-core/data/file-upload.model';
import { Data } from 'visualne/types/core/data';

interface IMetaData {
	created_at: Object;
	updated_at: Object;
	deleted: boolean;
}

export interface ITableData extends IMetaData
{
	title: string;
	description: string;
	lastUID: number;
	created_at: Object;
	updated_at: Object;
	owner: string;
	private: boolean;
	deleted: boolean;

	// Pipeline settings
	version: IVersion;
}

export interface Revision<T extends ProxyObject = ProxyObject> {
	id?: string,
	currentRevID: number,						// - CurrentRevID - Current revision of the element
	revision: number, 							// - Revisions - Rev number of the element
	created_at: Object,						 	// - created_at - Data changed with the new value
	updated_at: Object,						 	// - updated_at - Data changed with the new value
	rowID: string | number,						// - Id - Id of the element in that table
	oldValue: T,								// - oldValue - old value it got now
	newValue: T,	 							// - newValue - new value it had.
	uid: string,		 						// - uid - user id that changed it.
	deleted: boolean,
}

export interface IRelation {

	/**
	 * @brief - Add relation data to a collection
	 * @param key - column key of the current table
	 * @param value - key value pair of the other table and column
	 */
	columns?: { [key: string ]: { key: string, column: string, locked?: boolean } }
}

export interface TableTemplate<T extends ProxyObject = ProxyObject>
{
	[key: string]: T;
}

export interface ITable<T extends ProxyObject = ProxyObject> extends PipelineAsset {
	id: string,
	projectID: string,
	data: TableTemplate<T>,
	revisions: { [key: string]: Revision<T> },
	relations: IRelation,
	metadata: ITableData,
}

/**
 * @brief - Craftable file that belongs to the table.
 */
export class CraftableFileUpload extends FileUpload
{
	id: string;                 // Id of the file
	metadata: {
		name: string,           // name of the file without json
		projectID: string,      // Project id
	};
	itemId: number;             // Story associated with this file.
	data: Data;                 // JSON data of the story

	constructor(file: File) {
		super(file);
	}
}

export class Table<T extends ProxyObject = ProxyObject> implements ITable<T>, Iterable<ProxyObject>
{
	/**
	 * @brief - Unique ID of the project
	 */
	public id: string = '';

	/**
	 * @brief - Project ID of where this table belongs to.
	 */
	public projectID: string = '';

	/**
	 * @brief - data that belongs to this table.
	 */
	public data: TableTemplate<T> = {};

	public loaded: boolean = false;

	/**
	 * @example
	 * 	Pair('dialogues', Pair('nextId', new StringPair('dialogues', 'text')));
	 */
	public relations: IRelation = new class implements IRelation {
		columns: { [p: string]: { key: string; column: string } };
	};

	public revisions: { [key: string]: Revision<T> } = {};

	/**
	 * @brief - Meta data of the table
	 */
	public metadata: ITableData = {
		title: '',
		description: '',
		lastUID: 0,
		owner: '',
		created_at: {},
		updated_at: {},
		private: false,
		deleted: false,

		// Pipeline settings
		version: {
			major: 0,
			minor: 0,
			patch: 0,
		},
	}

	public constructor(data?: ITable<T>)
	{
		if(data)
		{
			for(const [key, value] of Object.entries(data))
			{
				if(this.hasOwnProperty(key))
					this[key] = value ?? value;
			}
		}
	}

	public get empty(): boolean
	{
		return this.length === 0;
	}

	public get length(): number
	{
		return this.filteredData.length;
	}

	/**
	 * @brief get the title in camelize form.
	 */
	public get title(): string
	{
		return UtilsService.camelize(this.metadata.title);
	}

	public forEach(callbackfn: (v: T, idx: number, array: T[]) => void, thisArg?: any): void
	{
		this.filteredData.forEach((value, index, arr) =>
		{
			callbackfn(value, index, arr);
		}, thisArg)
	}

	public get getSource(): LocalDataSource
	{
		return this.source;
	}

	private counter: number = 0;

	public filteredData: T[] = [];

	private source: LocalDataSource = new LocalDataSource();

	/**
	 *
	 * @param id
	 * @param obj
	 */
	public push(id: number, obj: T): Promise<T>
	{
		if(this.data[id]) throw new Error(`${this.metadata.title}: Element already exist in this table ${id}`);

		obj['id'] = id;
		this.data[id] = obj;
		this.filteredData.push(this.data[id]);

		return Promise.resolve(this.data[id]);
	}

	public update(element: T, values: any): Promise<T>
	{
		console.trace(element, values);
		const promise = this.getSource.update(element, values);

		promise.then(() =>
		{
			// update all the values with the new ones
			if(this.data[element.id])
			{
				const ownKeys = Reflect.ownKeys(values) as (keyof T)[];
				for (const prop of ownKeys) {
					this.data[element.id][prop] = values[prop];
				}
			}

		}).catch((error) => UtilsService.onError(error));

		return promise;
	}

	public load(filters: FilterCallback<T>[] = []): Promise<T>
	{
		this.loaded = false;
		const entries = Object.entries(this.data);

		const entry = entries[0];
		if(entry)
		{
			const dataSize = Object.keys(entry[1]).length + 1; // becuz id

			// assign the key to the id of the table data.
			for(const [key, value] of entries)
			{
				value.id = +key;

				if(dataSize !== Object.keys(value).length) {
					UtilsService.onDebug(dataSize, DebugType.LOG, value, this.data[0]);
					UtilsService.onError(`${key} data size is not equal in table ${ this.id }`);
				}
			}
		}

		const data: T[] = Object.values(this.data);

		if(filters.length !== 0)
		{
			filters.forEach((filter: FilterCallback<T>) => {
				if(filter) this.filteredData = data.filter(filter)
			});
		}

		// Load the source
		const promise = this.source.load(this.filteredData);

		promise.then(() =>
		{
			console.log(this.filteredData);
			this.source.refresh();
			this.loaded = true;
		}); // refresh list

		return promise;
	}

	/** ITERATIONS **/
	public find(id: number, columnName: string = 'id'): T | null
	{
		if(this.empty) return null;

		return this.filteredData.find((r: ProxyObject) => r[columnName] === id);
	}

	public some(id: number): boolean
	{
		return this.filteredData.some((el) => el.id === id);
	}

	public next(): IteratorResult<ProxyObject>
	{
		if(this.filteredData.length > 0 && this.counter <= this.filteredData.length - 1)
			return { value: this.filteredData[this.counter++], done: false };
		return { value: null, done: true };
	}

	[Symbol.iterator](): Iterator<ProxyObject> {
		const that = this;
		let step = 0;
		return {
			next() {
				const data = Array.from(that.filteredData.values());
				if(data.length > 0 && step <= data.length - 1)
					return { value: data[step++], done: false };
				return { value: null, done: true };
			},
		};
	}

	/**
	 * @brief find an object in the haystack
	 * @param tClass
	 * @param id
	 */
	static find(tClass: Table[], id: number): Table | null
	{
		if(Table.empty(tClass)) return null;

		const foundQuest = tClass.filter((r: any) => r.id === id );

		if(Table.empty(foundQuest)) return null;

		return foundQuest[0];
	}

	/**
	 * @brief - see if the arr is filled.
	 * @param tClass
	 */
	static empty(tClass: Table[]) { return tClass.length === 0; }
}

export abstract class TableData
{
	abstract setTable(key: string, newTable: Table, current: boolean);

	abstract getTable$(): Observable<Table>;

	abstract getTable(): Table;

	abstract getTables(): Observable<Table[]>;

	abstract getRecentOpenTables(): Observable<Table[]>;

	abstract markAsDelete(key: string);

	protected tableData: Collection<Table> = new Collection();
}

export const onSimpleTableMap = map((snapshots: SnapshotAction<any>[]) =>
{
	const table: Table = new Table();
	// table.id = that.tableID;

	// configure fields
	snapshots.forEach((snapshot: SnapshotAction<any>) => table[snapshot.key] = snapshot.payload.val());

	return table;
})
