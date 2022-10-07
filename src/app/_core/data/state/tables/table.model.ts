import { ProxyObject } from '@app-core/data/base';
import { Observable } from 'rxjs';
import { Collection } from '@app-core/data/collection';
import { DefaultEditor, LocalDataSource, ViewCell } from '@vamidicreations/ng2-smart-table';
import { map } from 'rxjs/operators';
import { SnapshotAction } from '@angular/fire/compat/database/interfaces';
import { FilterCallback } from '@app-core/providers/firebase-filter.config';
import { UtilsService } from '@app-core/utils';
import { IVersion, PipelineAsset } from '@app-core/interfaces/pipelines.interface';
import { DebugType } from '@app-core/utils/utils.service';
import { FileUpload } from '@app-core/data/file-upload.model';
import { Type } from '@angular/core';
import { DEFAULT_LANGUAGE_OBJ, MAX_SAFE_INTEGER, validateLanguageObject } from '@app-core/data/database/constants';
import { environment } from '../../../../../environments/environment';
import { IProject } from '@app-core/data/state/projects';
import { RelationPair } from '@app-core/utils/firebase/firebase.service';

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

export declare type ColumnType = null | 'number' | 'string' | 'custom'
	// TODO implement more types
	// 'string' | 'long string' | 'float' | 'int' | 'bool' | 'Single Select'
	// | 'Multi Select' | 'Line Reference' | 'Sheet Reference' | 'List' | 'File'

/**
 * @brief - Column definition
 */
export interface IColumn {
	name: string,
	description: string,
	type: ColumnType, // how to render the column
	min?: any, // A minimum value that this vaue shouldn' go below
	max?: any, // A maximum value that this vaue shouldn't go above
	defaultValue: any, // A default value for this column
	// TODO make functions for the default value that the user can use.
}
export class Column implements IColumn {
	name: string = '';
	description: string = '';
	type: ColumnType = null;
	defaultValue: any = null;
	readonly: boolean = false;
}

export declare interface TableColumnMap { [key:string]: Column }

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
	itemId: number;             // Story associated with this file.
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
	// TODO move this to the metadata section.
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
			release: '0',
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

	public static create(data: {
		project: IProject,
		columnObject: ProxyObject,
		title: string,
		description: string,
		owner: string,
		private: boolean,
	}): ITable
	{
		return {
			id: '',
				projectID: data.project.id,
			revisions: {},
			relations: {},
			data: {
				0: data.columnObject,
			},
			metadata: {
				title: data.title,
				description: data.description,
				created_at: UtilsService.timestamp,
				updated_at: UtilsService.timestamp,
				owner: data.owner,
				lastUID: 0,
				private: data.private,
				deleted: false,
				version: {
				major: environment.MAJOR,
					minor: environment.MINOR,
					release: environment.RELEASE,
				},
			},
		};
	}

	public static toColumns(columnObject: ProxyObject): TableColumnMap
	{
		const columnData: TableColumnMap = {};
		const properties = Object.entries(columnObject);
		for(const [propKey, propValue] of properties)
		{
			// See if column key exists
			if(!columnData[propKey])
				columnData[propKey] = Table.toColumn(propKey, propValue);
		}

		return columnData;
	}

	public static toColumn(propKey: string, propValue: any, relationData?: RelationPair): Column
	{
		const columnDefinition: Column = {
			name: UtilsService.title(UtilsService.replaceCharacter(propKey, /_/g, ' ')),
			description: '',
			type: null,
			defaultValue: propValue,
			readonly: false,
		};

		// get the type of the column
		switch(typeof propValue)
		{
			case 'undefined':
				UtilsService.onWarn(`Property ${propValue} is undefined`);
				break;
			case 'object':
			{
				// We are probably dealing with a language object.
				columnDefinition.type = 'custom';
				if(validateLanguageObject(propValue))
					columnDefinition.defaultValue = DEFAULT_LANGUAGE_OBJ;
			}
				// Do something with the other objects.
				break;
			case 'boolean':
				columnDefinition.type = 'custom';
				columnDefinition.defaultValue = false;
				break;
			case 'function':
			case 'symbol':
			case 'bigint':
				columnDefinition.type = 'custom';
				break;
			case 'number': {
				columnDefinition.type = 'number';
				columnDefinition.defaultValue = 0;
				// if we are dealing with relational data
				if (relationData && relationData.has(propKey)) {
					columnDefinition.defaultValue = MAX_SAFE_INTEGER;
				}
			}
			break;
			case 'string':
				columnDefinition.type = 'string';
				columnDefinition.defaultValue = '';
				break;
		}

		return columnDefinition;
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

	/**
	 * Loop through the filtered data.
	 * @param callbackFn
	 * @param thisArg
	 */
	public forEach(callbackFn: (v: T, idx: number, array: T[]) => void, thisArg?: any): void
	{
		this.filteredData.forEach((value, index, arr) =>
		{
			callbackFn(value, index, arr);
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

		if(entries.length)
		{
			const data: T[] = Object.values(this.data);

			// Loop through the data to validate the columns.
			data.forEach((entry, idx) =>
			{
				entry.id = idx;
				// get all the keys from the table.
				if(this.metadata.hasOwnProperty('columns')) {
					/*
					const propKeys = Object.keys(this.metadata.columns);
					//
					propKeys.forEach((propKey) => {
						// see if the entry has the key. if not log it.
						if(!entry.hasOwnProperty(propKey))
						{
							// TODO maybe also delete the prop.
							UtilsService.onDebug(
								`${ this.id } - ${propKey} key is not defined.. removing property from entry`, DebugType.WARN, data[idx],
							);
							delete data[idx][propKey];
						}
					});
					 */
				}
			});


			if(filters.length !== 0)
			{
				filters.forEach((filter: FilterCallback<T>) => {
					if(filter) this.filteredData = data.filter(filter)
				});
				// if(dataSize !== Object.keys(value).length) {
					// UtilsService.onDebug(dataSize, DebugType.LOG, value, this.data[0]);
					/*
					UtilsService.onDebug(
						`${key} data size is not equal in table ${ this.id }`, DebugType.WARN, dataSize, this.data[0],
					);
					 */
				// }
			}
		}


		// Load the source
		const promise = this.source.load(this.filteredData);

		promise.then(() =>
		{
			this.source.refresh();
			this.loaded = true;
		}); // refresh list

		return promise;
	}

	/** ITERATIONS **/
	public find(id: number, columnName: string = 'id', dataSearch: boolean = false): T | null
	{
		if(this.empty || id === Number.MAX_SAFE_INTEGER) return null;

		if(!dataSearch)
			return this.filteredData.find((r: T) => r[columnName] === id);

		return Object.values(this.data).find((r: T) => r[columnName] === id);
	}

	public search(
		predicate: (value: T, index: number, obj: T[]) => unknown, thisArg?: any, dataSearch: boolean = false,
	): T | null
	{
		if(this.empty) return null;

		if(!dataSearch)
			return this.filteredData.find(predicate, thisArg);

		return Object.values(this.data).find(predicate, thisArg);
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

export const onSimpleTableMap = map(({ snapshots }) =>
{
	const table: Table = new Table();
	// table.id = that.tableID;

	// configure fields
	snapshots.forEach((snapshot: SnapshotAction<any>) => table[snapshot.key] = snapshot.payload.val());

	return table;
})
