import { Injectable } from '@angular/core';
import { NbToastrService } from '@nebular/theme';

import { BehaviorSubject, Observable, of as observableOf } from 'rxjs';

import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';
import { ITable, Table, TableData } from '@app-core/data/state/tables/table.model';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { ProxyObject, StringPair } from '@app-core/data/base';
import { DebugType, QueryablePromise } from '@app-core/utils/utils.service';
import { PipelineService } from '@app-core/utils/pipeline.service';
import { IPipelineSchedule } from '@app-core/interfaces/pipelines.interface';
import { environment } from '../../../../../environments/environment';

import { Project } from '@app-core/data/state/projects';
import { ChildEvent } from '@angular/fire/database/interfaces';

import isEqual from 'lodash.isequal';
import pick from 'lodash.pick';

@Injectable({ providedIn: 'root'})
export class TablesService extends TableData implements Iterable<Table>, IPipelineSchedule {
	name: string = 'TableServiceScheduler';

	items: Map<string, Table>;

	/**
	 * @see {PipelineService}
	 * @brief - function we are going to call in the scheduler
	 * @param v
	 * @param idx
	 * @param array
	 */
	callbackFn: (v: Table, key: string, map: Map<string, Table>) => boolean = this.updateTables;

	/**
	 * @brief - Force the change even when the version is the same.
	 */
	force: boolean = false;

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
		protected pipelineService: PipelineService,
	) {
		super();

		// add to scheduler
		this.pipelineService.addSchedule(this);
	}

	public clear() {
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
	public addIfNotExists(key: string): Promise<Table | boolean> {
		if (
			(!this.tables.has(key) || !this.tables.get(key).loaded) // if the table is not found or the table is not loaded.
			&& !this.deletedTables.has(key) //
		) {
			const table: Table = new Table();
			table.id = key;

			// get the table data
			// make a separate function in order to get a reference to this.
			if (this.fetchTablePromises.has(key) && this.fetchTablePromises.get(key).isPending) {
				UtilsService.onDebug('we are still fetching data');
				return this.fetchTablePromises.get(key);
			}

			const promise = new QueryablePromise<Table>((resolve, reject) => {
				this.firebaseService.getTableData$(`tables/${key}`).subscribe((snapshots) => {
					// configure fields
					snapshots.forEach((snapshot) => {
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
	public getTable$(): BehaviorSubject<Table> {
		return this.table;
	}

	/**
	 * @brief - get the current table
	 * @return {{ BehaviourSubject<Table> }}
	 */
	public getTable(): Table {
		return this.table.getValue();
	}

	/**
	 * @brief - Get table table by id
	 * @param key
	 * @return - {{ Table | null }}
	 */
	public getTableById(key: string): Table | null {
		return this.tables.has(key) ? this.tables.get(key) : null;
	}

	/**
	 * @brief - Get table by name
	 * @param name
	 * @return {{ Table | null }}
	 */
	public getTableByName(name: string): Table | null {
		let table: Table = null;

		for (const value of this.tables.values()) {
			if (value.metadata.title === name) {
				table = value;
				break;
			}
		}

		return table;
	}

	/**
	 * @brief - Get all tables.
	 */
	public getTables(): Observable<Table[]> {
		return observableOf(Array.from(this.tables.values()));
	}

	public getRecentOpenTables(): Observable<Table[]> {
		return observableOf(this.recentTables);
	}


	/**
	 * @brief - Load tables from a specific project.
	 * @param project - Project to load the tables from.
	 * @NOTE - Included tables must be lower case!
	 * @param includedTables - The tables we want to search. empty searches everyone.
	 * @param successfulCallbackContext - Callback when we load the table.
	 */
	public loadTablesFromProject(
		project: Project, includedTables: string[] = [],
		successfulCallbackContext?: (value: Table) => void,
	): Promise<void> {
		const tables = Object.keys(project.tables);
		const promises: Promise<Table | boolean>[] = [];
		for (let i = 0; i < tables.length; i++) {
			const tbl = project.tables[tables[i]];
			const t: Table | null = this.getTableById(tables[i]);

			if (
				// if it empty or the name exists in the array.
				(includedTables.includes(tbl.name.toLowerCase()))
				&& (t === null || !t.loaded)
			) {
				promises.push(this.addIfNotExists(tables[i]));
			} else {
				if (successfulCallbackContext) successfulCallbackContext(t);
			}
		}

		return new Promise((resolve) => {
			Promise.all(promises).then((values: Table[] | boolean[]) => {
				values.forEach((value: Table | boolean) => {
					if (value instanceof Table && successfulCallbackContext) {
						successfulCallbackContext(value);
					}
				});
				resolve();
			})
		});
	}

	/**
	 * @brief - Insert the table into the collection.
	 * Also gives the user to the option to set it as the current table.
	 * @param key
	 * @param newTable
	 * @param current
	 */
	public setTable(key: string, newTable: Table, current: boolean = false): Table {
		let table: Table | null;
		if (this.tables.has(key)) {
			table = this.tables.get(key);

			// Update the current table if they are not equal
			if (!isEqual(newTable, table))
				table = this.tables.set(key, newTable).get(key);
		} else {
			table = newTable;

			if (table.metadata.deleted) {
				this.deletedTables.set(key, table);
			} else
				this.tables.set(key, table);
		}

		if (current) {
			this.table.next(table);

			if (table.relations.hasOwnProperty('columns')) {
				for (const [k, v] of Object.entries(table.relations.columns)) {
					this.firebaseRelationService.addData(table.title, k, new StringPair(v.key, v.column));
				}
			}

			// Set the breadcrumbs
			// this.breadcrumbService.removeBreadcrumbsRoute(`/dashboard/projects/${table.projectID}/tables`);
			this.breadcrumbService.addFriendlyNameForRoute(`/dashboard/projects/${table.projectID}/tables`, 'Tables');
			// this.breadcrumbService.regenerateBreadcrumbTrail();

			this.breadcrumbService.addCallbackForRouteRegex(`/dashboard/projects/${table.projectID}/tables/-[a-zA-Z]`, (id) => {
				return id === table.id ? UtilsService.titleCase(table.metadata.title).replace(/%20/g, ' ') : id;
			});

			this.items = new Map<string, Table>(this.tables);
			// this.pipelineService.run(this.name);
		}

		return table;
	}

	/**
	 * @brief - Listen to table events
	 * @param table
	 * @param events
	 */
	public listenToTableData(table: Table, events: ChildEvent[] = ['child_added', 'child_changed', 'child_removed']) {
		// TODO make a listener list to see if we don't have duplicates
		return this.firebaseService.getTableData$(
			`tables/${table.id}/data`, events)
			.subscribe((snapshots) => {
					for (let i = 0; i < snapshots.length; i++) {
						const snapshot = snapshots[i];
						if (!events.includes(snapshot.type as ChildEvent))
							continue;

						table.push(+snapshot.key, snapshot.payload.val()).then();
					}
				},
			);
	}

	/**
	 * @brief - update the table in firebase
	 * @param key
	 * @return boolean
	 */
	public update(key: string): Promise<any> {
		if (this.tables.has(key)) {
			const table: ITable = pick(this.tables.get(key),
				['id', 'projectID', 'data', 'revisions', 'relations', 'metadata']);

			return this.firebaseService.updateItem(key, table, true, `tables`);
		}

		return Promise.reject(`334 - Couldn't find table ${key}`);
	}

	/**
	 * @brief - Insert data into the table.
	 * @param key
	 * @param obj
	 */
	public insertData(
		key: string, obj: ProxyObject,
	): Promise<number>
	{
		if(this.tables.has(key)) {
			const ref = `tables/${key}`;
			return this.firebaseService.insertData(`${ref}/data`, obj, ref);
		}

		return Promise.reject(`314 - Couldn't find table ${key}`);
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

		return Promise.reject(`362 - Couldn't find table ${key}`);
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

		return Promise.reject(`390 - Couldn't find table ${key}`);
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
	 * @brief - iterate through the collection
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

	public resolve(dirty: boolean, table: Table, key: string)
	{
		if(dirty)
		{
			this.tables.set(key, table);
			this.update(key);
		}
	}

	private updateTables(v: Table, key: string, map: Map<string, Table>): boolean
	{
		UtilsService.onAssert(map.size === this.tables.size, `Amount of assets ${map.size} is not equal to amount of projects ${this.tables.size}`);

		if(environment.production) // don't run in production
			return;

		let dirty: boolean;
		dirty = this.updateTableVersion(key, v);
		if(dirty)
			this.updateDialogueTblForLocalization(key, v)
		else
			dirty = this.updateDialogueTblForLocalization(key, v);

		return dirty;
	}

	/**
	 * @brief - Simple scheduler func to update project version
	 * @private
	 */
	private updateTableVersion(key, asset: Table): boolean
	{
		// alright we check if the version exists in the project.
		if(!asset.metadata.hasOwnProperty('version'))
		{
			if(this.tables.has(key))
			{
				asset.metadata.version = {
					major: environment.MAJOR,
					minor: environment.MINOR,
					release: environment.RELEASE,
				}
			}

			return true;
		}

		return false;
	}

	/**
	 * @brief - Method to update tables that are outdated.
	 * @param key
	 * @param asset
	 * @private
	 */
	private updateDialogueTblForLocalization(key, asset: Table)
	{
		if (asset.metadata.title === 'dialogues' ||
			asset.metadata.title === 'dialogueOptions' ||
			asset.metadata.title === 'items' ||
			asset.metadata.title === 'characters' ||
			asset.metadata.title === 'stories')
		{
			if (this.tables.has(key))
			{
				console.log(`changing ${asset.metadata.title}`);

				const entries = Object.entries(asset.data);
				for (const [k, value] of entries)
				{
					// Check for the old property name to avoid a ReferenceError in strict mode.
					if (value.hasOwnProperty('id') )
					{
						UtilsService.onDebug('deleting id from table', DebugType.WARN);
						delete asset.data[k]['id'];
					}

					if (value.hasOwnProperty('text') && typeof value.text !== 'object') {
						asset.data[k].text = {
							'en': value.text,
						};
					}

					if (value.hasOwnProperty('name') && typeof value.name !== 'object') {
						asset.data[k].name = {
							'en': value.name,
						};
					}

					if (value.hasOwnProperty('title') && typeof value.title !== 'object') {
						asset.data[k].title = {
							'en': value.title,
						};
					}

					if (value.hasOwnProperty('description') && typeof value.description !== 'object') {
						asset.data[k].description = {
							'en': value.description,
						};
					}

					if (value.hasOwnProperty('Sellable') && typeof value.text !== 'object') {
						asset.data[k].sellable = value.Sellable;
						delete asset.data[k].Sellable;
					}

					UtilsService.onDebug(asset.data[k]);
				}

				return true;
			}
		}

		return false;
	}
}
