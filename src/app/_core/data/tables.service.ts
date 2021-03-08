import { Injectable } from '@angular/core';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';
import { NbToastrService } from '@nebular/theme';
import { ITable, Table, TableData } from '@app-core/data/table';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { ProxyObject, StringPair } from '@app-core/data/base';
import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';
import { QueryablePromise } from '@app-core/utils/utils.service';
import isEqual from 'lodash.isequal';
import pick from 'lodash.pick';

@Injectable({ providedIn: 'root'})
export class TablesService extends TableData implements Iterable<Table>
{
	private counter: number = 0;

	private table: BehaviorSubject<Table | null> = new BehaviorSubject<Table>(null);

	private tables: Map<string, Table> = new Map<string, Table>();

	private deletedTables: Map<string, Table> = new Map<string, Table>();

	private recentTables: Table[] = [];

	private fetchTablePromises: Map<string, QueryablePromise<Table>> = new Map<string, QueryablePromise<Table>>();

	constructor(
		protected toastrService: NbToastrService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected breadcrumbService: BreadcrumbsService,
	)
	{
		super();
	}

	public clear()
	{
		this.table.next(null);
		this.tables.clear();
		this.deletedTables.clear();
		this.recentTables = [];
	}

	/**
	 * @brief - Add table if it not exists.
	 * example usage is for loading relation data.
	 * @param key
	 */
	public addIfNotExists(key: string): Promise<Table | boolean>
	{
		if(
			(!this.tables.has(key) || !this.tables.get(key).loaded) // if the table is not found or the table is not loaded.
			&& !this.deletedTables.has(key) //
		)
		{
			const table: Table = new Table();
			table.id = key;

			// get the table data
			// make a separate function in order to get a reference to this.
			if(this.fetchTablePromises.has(key) && this.fetchTablePromises.get(key).isPending) {
				UtilsService.onDebug('we are still fetching data');
				return this.fetchTablePromises.get(key);
			}

			const promise = new QueryablePromise<Table>((resolve, reject) =>
			{
				this.firebaseService.getTableData$( `tables/${key}`).subscribe((snapshots) =>
				{
					// configure fields
					snapshots.forEach((snapshot) =>
					{
						table[snapshot.key] = snapshot.payload.val();
					});

					this.tables.set(key, table);

					table.load([
						(d: ProxyObject) => !!+d.deleted === false,
						// TODO see if you can get the filters
						// filterFunc,
					]).then(() => {
						resolve(table);
					});
				}, reject);
			});

			return this.fetchTablePromises.set(key, promise).get(key);
		}

		return Promise.resolve(true);
	}

	/**
	 * @brief - get the current table
	 * @return {{ BehaviourSubject<Table> }}
	 */
	public getTable$(): BehaviorSubject<Table>
	{
		return this.table;
	}

	/**
	 * @brief - get the current table
	 * @return {{ BehaviourSubject<Table> }}
	 */
	public getTable(): Table
	{
		return this.table.getValue();
	}

	/**
	 * @brief - Get table table by id
	 * @param key
	 * @return - {{ Table | null }}
	 */
	public getTableById(key: string): Table | null
	{
		return this.tables.has(key) ? this.tables.get(key) : null;
	}

	/**
	 * @brief - Get table by name
	 * @param name
	 * @return {{ Table | null }}
	 */
	public getTableByName(name: string): Table | null
	{
		let table: Table = null;

		for(const value of this.tables.values())
		{
			if(value.metadata.title === name)
			{
				table = value;
				break;
			}
		}

		return table;
	}

	/**
	 * @brief - Get all tables.
	 */
	public getTables(): Observable<Table[]>
	{
		return observableOf(Array.from(this.tables.values()));
	}

	public getRecentOpenTables(): Observable<Table[]> {
		return observableOf(this.recentTables);
	}

	public setTable(key: string, newTable: Table, current: boolean = false): Table
	{
		let table: Table | null;
		if(this.tables.has(key))
		{
			table = this.tables.get(key);

			// Update the current table if they are not equal
			if(!isEqual(newTable, table))
				table = this.tables.set(key, newTable).get(key);
		}
		else
		{
			table = newTable;

			if(table.metadata.deleted)
			{
				this.deletedTables.set(key, table);
			}
			else
				this.tables.set(key, table);
		}

		if(current)
		{
			this.table.next(table);

			if(table.relations.hasOwnProperty('columns'))
			{
				for (const [k, v] of Object.entries(table.relations.columns))
				{
					this.firebaseRelationService.addData(table.title, k, new StringPair(v.key, v.column));
				}
			}

			// Set the breadcrumbs
			// this.breadcrumbService.removeBreadcrumbsRoute(`/dashboard/projects/${table.projectID}/tables`);
			this.breadcrumbService.addFriendlyNameForRoute(`/dashboard/projects/${table.projectID}/tables`, 'Tables');
			// this.breadcrumbService.regenerateBreadcrumbTrail();

			this.breadcrumbService.addCallbackForRouteRegex(`/dashboard/projects/${table.projectID}/tables/-[a-zA-Z]`, (id) => {
				console.log(id);
				return id === table.id ? UtilsService.titleCase(table.metadata.title).replace(/%20/g, ' ') : id;
			});
		}

		return table;
	}

	/**
	 * @brief - update the table in firebase
	 * @param key
	 * @return boolean
	 */
	public update(key: string): Promise<any>
	{
		if(this.tables.has(key))
		{
			const table: ITable = pick(this.tables.get(key),
				['id', 'projectID', 'data', 'revisions', 'relations', 'metadata']);
			return this.firebaseService.updateItem(key, table, true, `tables`);
		}

		return Promise.reject(`Couldn't find table ${key}`);
	}

	/**
	 * @brief update the data in the table.
	 * We are reference it immediately to reduce the amount of data send.
	 * @param key
	 * @param id
	 * @param obj
	 * @param oldObj
	 * @param createRev
	 */
	public updateData(
		key: string, id: string | number, obj: ProxyObject, oldObj: ProxyObject, createRev: boolean = true,
	): Promise<any>
	{
		if(this.tables.has(key))
		{
			const ref = `tables/${key}`;
			// TODO resolve if data is wrong or if we also need to do something with the lastID
			// console.log({ id: event.newData.id, tbl: this.tableName, obj, oldObj });
			if(createRev)
			{
				return this.firebaseService.updateData(id,ref + '/revisions', obj, oldObj, ref + '/data');
			}
			return this.firebaseService.updateData(id, ref + '/data', obj, null, ref + '/data');
		}

		return Promise.reject(`Couldn't find table ${key}`);
	}

	/**
	 * @brief delete data in the table.
	 * We are reference it immediately to reduce the amount of data send.
	 * @param key
	 * @param id
	 * @param obj
	 * @param oldObj
	 * @param createRev
	 */
	public deleteData(
		key: string, id: string | number, obj: ProxyObject, oldObj: ProxyObject, createRev: boolean = true,
	): Promise<any>
	{
		if(this.tables.has(key))
		{
			const ref = `tables/${key}`;
			// TODO resolve if data is wrong or if we also need to do something with the lastID
			// console.log({ id: event.newData.id, tbl: this.tableName, obj, oldObj });
			if(createRev)
			{
				return this.firebaseService.deleteData(id,ref + '/revisions', obj, oldObj, ref + '/data');
			}
			return this.firebaseService.deleteData(id, ref + '/data', obj, null, ref + '/data');
		}

		return Promise.reject(`Couldn't find table ${key}`);
	}

	/**
	 * @brief - Mark the project as deleted.
	 * @param key
	 */
	public markAsDelete(key: string)
	{
		if(this.tables.has(key))
		{
			const table = this.tables.get(key);
			table.metadata.updated_at = UtilsService.timestamp;
			table.metadata.deleted = true;

			const tblName = UtilsService.title(table.metadata.title);

			this.firebaseService.updateItem(table.id, <ITable>(table), true, 'tables').then(() => {
				UtilsService.showToast(this.toastrService, 'Table deleted',
					`Table ${ tblName } deleted!`);

				this.tables.delete(table.id);
				this.deletedTables.set(table.id, table);
			}, () => {
				// if we have an error we need to invalidate the project
				table.metadata.deleted = false;
			});
		}
	}

	/**
	 * @brief - Generates table data based on the projects
	 * @param columns
	 * @param onItemAdded
	 */
	public getSource(columns: string[], onItemAdded: Function = null): any[]
	{
		const source: any[] = [];

		this.tables.forEach((value: Table, key) =>
		{
			const obj = { id: key };
			columns.forEach((column) =>
			{
				if(value.metadata.hasOwnProperty(column))
				{
					obj[column] = value.metadata[column];
				}
			});

			source.push(obj);
		});
		return source;
	}

	/** ITERATIONS **/

	/**
	 * @brief - iterate through the loaded tables.
	 */
	public next(): IteratorResult<Table>
	{
		const data = Array.from(this.tables.values());
		if(data.length > 0 && this.counter <= data.length - 1)
			return { value: data[this.counter++], done: false };
		return { value: null, done: true };
	}

	/**
	 * @brief -
	 */
	[Symbol.iterator](): Iterator<Table>
	{
		const that = this;
		let step = 0;
		return {
			next() {
				const data = Array.from(that.tables.values());
				if(data.length > 0 && step <= data.length - 1)
					return { value: data[step++], done: false };
				return { value: null, done: true };
			},
		};
	}
}
