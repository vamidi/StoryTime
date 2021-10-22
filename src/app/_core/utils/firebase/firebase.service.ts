import { EventEmitter, Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireDatabase, SnapshotAction } from '@angular/fire/database';
import { UtilsService } from '@app-core/utils/utils.service';
import { Relation } from '@app-core/data/base/relation.class';
import { StringPair } from '@app-core/data/base/string-pair.class';
import { Observable, Subscription } from 'rxjs';
import { ProxyObject } from '@app-core/data/base';
import { NbToastrService } from '@nebular/theme';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { IFoundAbleUser, IUserTicket, User, UserService } from '@app-core/data/state/users';
import { UserData } from '@app-core/data/state/users/user.model';

import { Revision } from '@app-core/data/state/tables';
import { AngularFireList, AngularFireObject, ChildEvent, QueryFn } from '@angular/fire/database/interfaces';

import { AngularFireFunctions } from '@angular/fire/functions';
import { environment } from '../../../../environments/environment';

import firebase from 'firebase/app';
import 'firebase/database';

import isEqual from 'lodash.isequal';
import { of } from 'rxjs/observable/of';
import { map } from 'rxjs/operators';

export declare type RelationDictionary<T> = Map<string, T>; // tblName, relation pair

// NOTE map with key for tblName, value for map with colName and relationTbl as value
export declare type RelationPair = RelationDictionary<StringPair>; // key, value

// key = table, value = map<key -> columnID, Relation>
export declare type MRelationPair = RelationDictionary<Map<string, Relation>>;

export interface IUserResponse {
	total: number;
	results: User[];
}

@Injectable({ providedIn: 'root' })
export class FirebaseService implements OnDestroy
{
	// protected static URL: string = 'https://buas.vamidicreations.nl/core/api/';

	protected static headers: HttpHeaders = new HttpHeaders({
		'Content-Type': 'application/json',
	});

	private static checkTbl(tbl: string): boolean
	{
		return tbl !== '';
	}

	public onTableAddEvent: EventEmitter<any> = new EventEmitter<any>();

	/**
	 * @unused
	 */
	// public get lastUsedTable()
	// {
	// 	return this.lastUsedTblName;
	// }

	public get table()
	{
		return this.tblName;
	}

	public getExcludedTables()
	{
		return this.excludedTables;
	}

	public getProxyObject(__: string): ProxyObject | null
	{
		return null;
	}

	public get permissions()
	{
		return this.userService.canEdit || this.userService.canDelete;
	}

	private excludedTables: string[] = ['users', 'revisions', 'relations', 'projects'];

	protected tblName = '';
	protected lastUsedTblName = '';

	protected relations: MRelationPair = new Map();

	protected user: User | null = null;

	// protected readonly URL: string = '';

	// TODO place this inside table data.
	// protected userRoles: Array<string>;

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	constructor(
		protected angularFireFunctions: AngularFireFunctions,
		protected afd: AngularFireDatabase,
		protected http: HttpClient,
		protected toastrService: NbToastrService,
		protected userService: UserService,
		protected router: Router)
	{
		this.mainSubscription.add(this.userService.getUser().subscribe((user: User) =>
		{
			if(!isEqual(this.user, user))
				this.user = user;
		}));
	}

	ngOnDestroy(): void
	{
		this.clear();

		// Unsubscribe to all table events
		this.mainSubscription.unsubscribe();
	}

	/**
	 * @brief -
	 * @param table
	 * @param key
	 * @param pair
	 */
	public pushRelation(table: string, key: string, pair: Relation)
	{
		let relMap: Map<string, Relation> = new Map<string, Relation>();
		if(this.relations.has(table))
			relMap = this.relations.get(table);
		relMap.set(key, pair);

		this.relations.set(table, relMap);
	}

	public clear()
	{
		this.relations.clear();
	}

	/**
	 * @param table
	 * @param key
	 */
	public getRelation(table: string, key: string)
	{
		const relMap = this.relations.get(table);
		return relMap?.get(key) ?? null;
	}

	/**
	 * @brief - Retrieve table data of the database
	 * @param tblName - Pass in the table name
	 * @param events - Events where should listen to.
	 */
	public getTableData$<T = any>(
		tblName: string = '', events: ChildEvent[] = ['child_added', 'child_changed', 'child_removed'],
	): Observable<SnapshotAction<T>[]>
	{
		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		const tableRef = this.getList<any>(tbl);

		// assign snapshot changes
		return tableRef.snapshotChanges(events);
	}

	/**
	 * @brief - Set the query to a new table
	 * @param newTblName
	 */
	public setTblName(newTblName: string)
	{
		if(newTblName === '')
			UtilsService.onError('There is no table defined!');

		this.tblName = newTblName;
	}

/*
	public getShallowQuery(location: string, query: string = ''): Observable<any>
	{
		console.log(environment.firebase.databaseURL + '/' + location + '.json?' + query + '&shallow=true');
		return this.http.get(
			environment.firebase.databaseURL + '/' + location + '.json?' + query + '&shallow=true',
			{ headers: FirebaseService.headers })
			.pipe(map((response) => response ));
	}
*/

	/**
	 * @brief -
	 * @param tblName
	 */
	public getRef(tblName: string = ''): firebase.database.Reference
	{
		let tbl = this.tblName;

		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		// get the list
		return this.afd.database.ref(tbl);
	}

	public getItem(id: string | number, tblName: string = ''): AngularFireObject<any>
	{
		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		// /tableName/id
		return this.afd.object('/'+ tbl + '/' + String(id));
	}

	public getItemByString(id: string, tblName: string = '')
	{
		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		// /tableName/id
		return this.afd.object('/'+ tbl + '/' + id);
	}

	/**
	 * @brief - Insert data
	 * @param tblRef
	 * @param data
	 * @param tblName
	 */
	public insertData(tblRef: string, data: any, tblName: string = ''): Promise<number>
	{
		if(!this.userService.canEdit)
			throw new Error('You don\'t have the permission!');

		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		if(data.hasOwnProperty('id'))
		{
			delete data['id'];
		}

		if(data.hasOwnProperty('created_at'))
			data.created_at = UtilsService.timestamp;

		if(data.hasOwnProperty('updated_at'))
			data.updated_at = UtilsService.timestamp;

		return new Promise<number>((resolve, reject) => {
			this.getId(tbl + '/metadata/lastUID').then((transactionResult) =>
			{
				const newId = transactionResult.snapshot.val();
				this.insertItem(newId, data, tblRef).then(() => {
					resolve(newId);
				});
			}, (reason) => reject(reason));
		});
	}

	/**
	 *
	 * @param id - the Id of the data.
	 * @param tblRef - tableRef to insert the revisions to
	 * @param newData - data to insert
	 * @param oldData - old data for the revisions
	 * @param tblName - tblName to override where we should store the data
	 */
	public async updateData(id: string | number, tblRef: string,
		newData: ProxyObject, oldData: ProxyObject = null, tblName: string = '',
	): Promise<void | string | firebase.database.Reference>
	{
		if(!this.userService.canEdit)
			throw new Error('You don\'t have the permission!');

		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		if(FirebaseService.checkTbl(tbl))
		{
			const copiedOldData: ProxyObject = oldData ?  UtilsService.copyObj(oldData) : null;
			if (copiedOldData && copiedOldData.hasOwnProperty('id') )
			{
				delete copiedOldData['id'];
			}

			const copiedData = UtilsService.copyObj(newData);

			// Check for the old property name to avoid a ReferenceError in strict mode.
			if (copiedData.hasOwnProperty('id'))
			{
				delete copiedData['id'];
			}

			const promise = this.updateItem(id, copiedData, true, tbl);
			if(copiedOldData) {
				return promise.then(() => {
					return this.insertRevision(tblRef, id, copiedData, copiedOldData);
				});
			}
			return promise;
		}

		return Promise.reject('Couldn\'t update data');
	}

	/**
	 *
	 * @param id - the Id of the data.
	 * @param tblRef - tableRef to insert the revisions to
	 * @param newData - data to insert
	 * @param oldData - old data for the revisions
	 * @param tblName - tblName to override where we should store the data
	 */
	public async deleteData(id: string | number, tblRef: string,
							newData: ProxyObject, oldData: ProxyObject = null, tblName: string = '',
	): Promise<void | string | firebase.database.Reference>
	{
		if(!this.userService.canDelete)
			if(environment.production) return Promise.reject('cant'); else throw new Error('Not able to delete with user permissions');


		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		if(FirebaseService.checkTbl(tbl))
		{
			const copiedOldData: ProxyObject = oldData ?  UtilsService.copyObj(oldData) : null;
			if (copiedOldData && copiedOldData.hasOwnProperty('id') )
			{
				delete copiedOldData['id'];
			}

			const copiedData = UtilsService.copyObj(newData);

			// Check for the old property name to avoid a ReferenceError in strict mode.
			if (copiedData.hasOwnProperty('id'))
			{
				delete copiedData['id'];
			}

			const promise = this.deleteItem(id, tbl);
			if(copiedOldData) {
				return promise.then(() => {
					return this.insertRevision(tblRef, id, copiedData, copiedOldData);
				});
			}
			return promise;
		}

		return Promise.reject('Couldn\'t update data');
	}

	/**
	 * @brief - Insert data into firebase.
	 * Firebase will generate a key for you.
	 * @param data - data you want to insert
	 * @param tblName - (optional)
	 * @return
	 */
	public insert(data: any, tblName: string = ''): firebase.database.ThenableReference
	{
		if(!this.userService.canEdit)
			throw new Error('You don\'t have the permission!');

		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		if(data.hasOwnProperty('id'))
		{
			delete data['id'];
		}

		return this.getList<any>(tbl).push(data);
	}

	/**
	 * @brief - Insert data into firebase.
	 * Hereby you have to give firebase an ID to work with.
	 * @param id
	 * @param data
	 * @param tblName
	 */
	public insertItem(id: number | string, data: any, tblName: string = ''): Promise<void>
	{
		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		return this.getList<any>(tbl).set(String(id), data);
	}

	/**
	 *
	 * @param tableName
	 * @param data
	 * @param update
	 */
	public update(tableName: string, data: Object, update: boolean = true): Promise<void>
	{
		if(!this.userService.canEdit)
			throw new Error('You don\'t have the permission!');

		let tbl = this.tblName;

		// if we override the tblName
		if(tableName !== '')
			tbl = tableName;

		this.lastUsedTblName = tbl;

		if(FirebaseService.checkTbl(tbl))
		{
			if(update)
				return this.afd.object('/' + tbl).update(data);
			else
				return this.afd.object('/' + tbl).set(data);
		}

		return Promise.resolve();
	}

	/**
	 *
	 * @param id
	 * @param newData
	 * @param update
	 * @param tblName
	 */
	public updateItem(
		id: number | string, newData: any, update: boolean = true, tblName: string = ''): Promise<void|string>
	{
		if(!this.userService.canEdit)
			throw new Error('You don\'t have the permission!');

		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		if(FirebaseService.checkTbl(tbl))
		{
			// Copy the data to a new object because we don't want to delete properties
			const copiedData = UtilsService.copyObj(newData);

			// Check for the old property name to avoid a ReferenceError in strict mode.
			if (copiedData.hasOwnProperty('id') )
			{
				delete copiedData['id'];
			}

			if(update)
			{
				return this.afd.object(tbl + '/' + String(id)).update(copiedData);
			}

			return this.afd.object('/' + tbl + '/' + String(id)).set(copiedData);
		}

		return Promise.reject('Couldn\'t insert or update item');
	}

	public deleteItem(id: number | string, tblName: string = ''): Promise<void|string>
	{
		if(!this.userService.canDelete)
			if(environment.production) return Promise.reject('cant'); else throw new Error('Not able to delete with user permissions');

		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		return this.afd.object('/' + tbl + '/' + String(id)).remove();
	}

	public revertRevision(tblRef: string, revision: Revision)
	{
		// get the revision of the current element
		return this.getRef(tblRef).orderByChild('currentRevID')
			.equalTo(revision.currentRevID).limitToLast(1).once('value', null,(_) => {
			// if we don't have one at all.
			return Promise.reject('Couldn\'t revert revisions');
		}).then(async _ =>
		{
			// if we found an item.
			return this.updateItem(revision.id, revision, true, tblRef);
		});
	}

	/**
	 * @brief - find the users in the database
	 * TODO Make it possible to not show the ones we already added.
	 */
	public search(): Observable<{ users: IFoundAbleUser[] }>
	{
		return this.angularFireFunctions.httpsCallable('findUsers')({});
	}

	/**
	 * @brief - find the users in the database
	 * @param ticket
	 * TODO Make it possible to not show the ones we already added.
	 */
	public addUserToProject(ticket: IUserTicket): Observable<any>
	{
		return this.angularFireFunctions.httpsCallable('addUserToProject')(ticket);
	}

	public updateInvite(ticket: IUserTicket): Observable<any>
	{
		return this.angularFireFunctions.httpsCallable('updateInvite')(ticket);
	}

	public updateRoles(ticket: IUserTicket): Observable<any>
	{
		return this.angularFireFunctions.httpsCallable('updateRoles')(ticket);
	}

	public getList<T>(tblName: string = '', queryFn?: QueryFn): AngularFireList<T>
	{
		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		this.lastUsedTblName = tbl;

		return this.afd.list<T>(tbl, queryFn);
	}

	/**
	 * @brief - Save the sheets
	public saveSheet(title: string, id: string, data: any)
	{
		// return this.http.put<any>(FirebaseService.URL + 'projects/management/' + title,
		// 	JSON.stringify(data), FirebaseService.httpOptions)
		// 	.pipe(
		// 		retry(1),
		// 		catchError(this.errorHandl)
		// 	)
	}
	 */

	/**
	 * @brief - Get latest id of the table we are querying from.
	 * Declare a function that increment a counter in a transaction
	 */
	protected getId(tblName: string): Promise<any>
	{
		let tbl = this.tblName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		const counterRef = this.getRef(tbl);
		return counterRef.transaction((lastUID) => {
			return lastUID + 1;
		});

		// for simple increment use
		// return this.getRef(tbl).set(firebase.database.ServerValue.increment(1));
	}

	/**
	 *
	 * @param tblRef
	 * @param id
	 * @param copiedData
	 * @param copiedOldData
	 */
	protected async insertRevision(tblRef: string, id: string | number,
		copiedData: ProxyObject, copiedOldData: ProxyObject,
	): Promise<void | string | firebase.database.Reference>
	{
		// create the revision
		const revisionData: Revision = {
			revision: 0, 									// - Revisions - Rev number of the element
			currentRevID: 0,								// - CurrentRevID - Current revision we are currently at.
			created_at: UtilsService.timestamp, 			// - updated_at - Data changed with the new value
			updated_at: UtilsService.timestamp, 			// - updated_at - Data changed with the new value
			rowID: id,										// - Id - Id of the element in that table
			oldValue: copiedOldData,						// - oldValue - old value it got now
			newValue: copiedData, 							// - newValue - new value it had.
			uid: this.user.uid, 							// - uid - user id that changed it.
			deleted: false,
		};

		// get the revision of the current element
		return this.getRef(tblRef).orderByChild('rowID').equalTo(id).limitToLast(1).once('value', null,(_) => {
			// if we don't have one at all.
			return Promise.reject('Couldn\'t insert new revisions');
		}).then(async result =>
		{
			let promise: Promise<void> | firebase.database.ThenableReference = Promise.resolve();
			// if we found an item.
			if(result.exists())
			{
				// insert a new one
				Object.values(result.val()).forEach((r) =>
				{
					const revData: Revision = <Revision>(r);
					revisionData.created_at = revData.created_at;
					revisionData.revision = ++revData.revision;
					revisionData.currentRevID = revisionData.revision;

					promise = this.insert(revisionData, tblRef);
					promise.then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Revision updated!',
							``,
							'success',
						);
					});
				});
			}

			if(!result.exists())
			{
				console.log(`We don\'t have revisions under ${id}`);
				// if we don;t have any data on this yet.
				promise = this.insert(revisionData, tblRef);
				promise.then(() => {
					UtilsService.showToast(
						this.toastrService,
						'Revision inserted!',
						``,
						'success',
					);
				});
			}

			return promise;
		});

/*


		this.getRef('revisions').orderByChild('tableName').equalTo(tbl).limitToLast(1).on('value', (snapshots) =>
		{
			if(snapshots.hasChildren())
			{
				snapshots.forEach((snapshot) =>
				{
					if (snapshot.exists()) {
						const payload: Revision = snapshot.val();

						if(payload.rowID === id)
							revisionData.revision = +payload.revision + 1;
						// only go further if old + new value or not the same

						// Only make a new revision once
						if(!_.isEqual(revisionData.oldValue, payload.oldValue)
							&& !_.isEqual(revisionData.newValue, payload.newValue)
							&& revisionData.updated_at !== payload.updated_at)
						{
							// if the snapshot exist we can have the current revision
							// get the latest id of the table

							// TODO get the id
							/*
							this.updateItem(result.val(), revisionData, null, true, 'revisions').then(() => {
								UtilsService.showToast(
									this.toastrService,
									'Revision updated!',
									``,
								);
							});
						}
					}
				});
			}
		});
*/
	}
}
