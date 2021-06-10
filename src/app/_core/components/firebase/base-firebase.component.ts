import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ObjectKeyValue, UserPreferences, UtilsService } from '@app-core/utils/utils.service';
import { FirebaseService, RelationPair } from '@app-core/utils/firebase/firebase.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User, UserModel, defaultUser, UserService } from '@app-core/data/state/users';
import isEqual from 'lodash.isequal';
import { ProxyObject, Relation, StringPair } from '@app-core/data/base';
import { Table, TablesService } from '@app-core/data/state/tables';
import { BaseSettings } from '@app-core/mock/base-settings';
import {
	BooleanColumnRenderComponent,
	LanguageColumnRenderComponent,
	LanguageRenderComponent,
	NumberColumnComponent, TextColumnComponent, TextRenderComponent,
} from '@app-theme/components';
import { KeyLanguage, KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';

import { Util } from 'leaflet';
import trim = Util.trim;

import firebase from 'firebase/app';

/**
 * simple base firebase implementation
 * where the class calculates the user permissions.
 */
@Component({
	template: '',
})
export abstract class BaseFirebaseComponent implements OnInit, OnDestroy
{
	public get isAdmin()
	{
		return this.userService.isAdmin;
	}

	protected userPreferences: UserPreferences = null;

	protected user$: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null);
	protected user: UserModel = defaultUser;

	protected set setTblName(tblName: string)
	{
		this.tableName = tblName;
		this.firebaseService.setTblName(this.tableName);
	}

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected constructor(
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected toastrService: NbToastrService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected languageService: LanguageService,
		@Inject(String) protected tableName: string = '',
	) {
		if(tableName !== '')
			this.firebaseService.setTblName(tableName);
	}

	public ngOnInit(): void
	{
		this.mainSubscription.add(this.userPreferencesService.getUserPreferences().subscribe((userPreferences) =>
		{
			this.userPreferences = { ...userPreferences };

			if(!this.userPreferences.hasOwnProperty('visibleColumns'))
			{
				this.userPreferences.visibleColumns = new Map<string, ObjectKeyValue<boolean>>();
				this.userPreferencesService.setUserPreferences(this.userPreferences);
			}

			if(this.userPreferences.visibleColumns.length > 0)
				this.userPreferences.visibleColumns = new Map(this.userPreferences.visibleColumns);
			else
				this.userPreferences.visibleColumns = new Map<string, ObjectKeyValue<boolean>>();

			// Indexes
			if(!this.userPreferences.hasOwnProperty('indexColumns'))
			{
				this.userPreferences.indexColumns = new Map<string, ObjectKeyValue<number>>();
				this.userPreferencesService.setUserPreferences(this.userPreferences);
			}

			if(this.userPreferences.indexColumns.length > 0)
				this.userPreferences.indexColumns = new Map(this.userPreferences.indexColumns);
			else
				this.userPreferences.indexColumns = new Map<string, ObjectKeyValue<number>>();
		}));

		this.mainSubscription.add(this.userService.getUser().subscribe((user: User) =>
		{
			// Only push changed users.
			if(!isEqual(this.user, user))
			{
				this.user = user;
				this.user$.next(this.user);
				// const canDelete: boolean = !_.isEmpty(_.intersection( ['admin', 'author'], allowedRoles));
				this.onUserReceived(user);
			}
		}));
	}

	public ngOnDestroy(): void
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();
	}


	/**
	 * @brief - Process table data to generate columns
	 * @param table
	 * @param verify
	 * @param settings
	 * @param overrideTbl
	 */
	protected processTableData(
		table: Table, verify: boolean = false, settings: BaseSettings = null, overrideTbl: string = '',
	): BaseSettings
	{
		// noinspection JSUnusedGlobalSymbols
		const newSettings: BaseSettings = { ...settings };

		let tbl: string = table.title;

		// if we override the tblName
		if(overrideTbl !== '')
			tbl = overrideTbl;

		for(const dataKey of Object.keys(table.data))
		{
			const dataValue = table.data[dataKey];
			// if we need to verify we need to check if it is a valid item
			if (verify)
			{
				for (const [k, value] of Object.entries(dataValue))
				{
					const key: string = trim(k);

					// We only need this information once
					if (!newSettings.columns.hasOwnProperty(key.toString()))
					{
						let titleName = key.toString();
						titleName = titleName.replace(/([A-Z])/g, ' $1').trim();
						titleName = titleName.charAt(0).toUpperCase() + titleName.substr(1);

						const entry: RelationPair = this.firebaseRelationService.getData().get(tbl);

						newSettings.columns[key] =
						{
							title: titleName,
							class: 'input input-form-control',
							hidden: false,
							editor: {},
						};

						let type: string = '';

						if (typeof value === 'string') {
							type = 'html';
							newSettings.columns[key].valuePrepareFunction = (cell /*, row */) => {
								return UtilsService.replaceCharacter(cell,/<\/>/g, '</b>');
							}
						}

						if (typeof value === 'number')
						{
							type = 'number';
							// if entry is not found or
							// if we don't have a relation found make a number column
							if ((entry === undefined || entry === null)
								|| entry && !entry.has(key))
							{
								// We need a custom renderer for a number input
								newSettings.columns[key].editor = {
									type: 'custom',
									component: NumberColumnComponent,
								};
							}
						}

						if (typeof value === 'boolean')
						{
							type = 'string';
							newSettings.columns[key].editor = {
								type: 'custom',
								component: BooleanColumnRenderComponent,
							};
						}

						if(typeof value === 'object')
						{
							const keyValue = value as KeyLanguageObject;
							if(keyValue !== null)
							{
								const languages = Object.keys(keyValue);
								// Are we dealing with a language object
								if (this.languageService.SystemLanguages.has(languages[0] as KeyLanguage))
								{
									type = 'custom';
									newSettings.columns[key] = {
										...newSettings.columns[key],
										renderComponent: LanguageRenderComponent,
										editor: {
											type: 'custom',
											component: LanguageColumnRenderComponent,
										},
									};

									// Do nothing for now.
								}
							}
						}

						// if we found an entry link it
						if (entry)
						{
							// if we found the relation
							const pair: StringPair = entry.get(key);
							this.processRelation(table, pair, key, newSettings, tbl);
						}

						if(!newSettings.columns[key].hasOwnProperty('type'))
							newSettings.columns[key]['type'] = type;
					}
				}
			}
		}

		return newSettings;
	}

	/**
	 * Process the relation between the columns to other tables
	 * @param table
	 * @param pair
	 * @param key
	 * @param newSettings
	 * @param overrideTbl
	 */
	protected processRelation(
		table: Table, pair: StringPair, key: string, newSettings: BaseSettings, overrideTbl: string = '',
	): void
	{
		if (pair)
		{
			let tbl = table.title;

			// if we override the tblName
			if(overrideTbl !== '')
				tbl = overrideTbl;

			const project: Project | null = this.projectService.getProjectById(table.projectID);
			const newPair: StringPair = { key: '', value: pair.value, locked: pair.locked };
			for(const k of Object.keys(project.tables))
			{
				if(project.tables[k].name === pair.key)
				{
					newPair.key = k;
					// Add the tables to the service when they not exist
					this.tableService.addIfNotExists(k).then();
				}
			}

			// const result = await this.firebaseService.getRef(`tables/${key}/metadata`)
			// 	.once('value', null, (error) => {
			// 		UtilsService.onError(error);
			// 	});
			//
			// const tblData: ITableData = result.val();
			// if(result.exists() && tblData.title === this.tblColumnRelation.key)
			// {
			// 	now listen to a certain column
			// 	'tables'
			// this.relationRef = this.firebaseService.getItem(+this.id, `tables/${result.ref.parent.key}/data/`);
			// this.relationReceiver$ = this.relationRef.snapshotChanges(['child_added', 'child_changed', 'child_removed']);
			// this.relationRef = this.firebaseService.getItem(+this.id, this.tblColumnRelation.key);
			// console.log(tblData.title, this.tblColumnRelation.key, this.relationReceiver$ !== null);
			// return Promise.resolve();
			// }

			if(newPair.key === '')
				UtilsService.onError(`Relation not found! Trying to find table "${pair.key}" for column "${pair.value}"`);

			const rel = new Relation(
				table.id, this.firebaseService, this.firebaseRelationService, this.tableService, newPair,
			);
			this.firebaseService.pushRelation(tbl, key, rel);

			newSettings.columns[key]['type'] = 'custom';
			newSettings.columns[key]['renderComponent'] = TextRenderComponent;
			newSettings.columns[key]['onComponentInitFunction'] = (instance: TextRenderComponent) => {
				// firebase, tableName, value => id
				instance.relation = rel;
			};

			newSettings.columns[key]['tooltip'] = { enabled: true, text: 'Relation to ' + pair.key };

			newSettings.columns[key]['editor'] =
			{
				type: 'custom',
				component: TextColumnComponent,
				data: {
					tblName: tbl, relationTable: pair.key, projectID: table.projectID, tableID: table.id,
				},
				config: { /* data: { relation: rel }, */ },
			}
		}
	}

	protected insertFirebaseData(
		event: { data: ProxyObject, confirm?: any },
	): Promise<number>
	{
		const obj: ProxyObject = { ...event.data };
		return this.firebaseService.insertData(`${this.tableName}/data`, obj, this.tableName);
	}

	protected updateFirebaseData(
		event: { data: ProxyObject, newData: ProxyObject, confirm?: any },
	): Promise<void | string | firebase.database.Reference>
	{
		const oldObj: ProxyObject = event.hasOwnProperty('data') ? { ...event.data } : null;
		const obj: ProxyObject = { ...event.newData };

		// TODO resolve if data is wrong or if we also need to do something with the lastID
		// console.log({ id: event.newData.id, tbl: this.tableName, obj, oldObj });
		return this.firebaseService.updateData(
			event.newData.id,this.tableName + '/revisions', obj, oldObj, this.tableName + '/data');
	}


	/**
	 * @brief - Insert new row data
	 * @param event
	 * @param tblName
	 */
	public onCreateConfirm(event: any, tblName: string = '')
	{
		// Check the permissions as well as the data
		if (event.hasOwnProperty('newData') && this.userService.checkTablePermissions(this.tableService))
		{
			// if we override the tblName
			if(tblName !== '')
				this.tableName = tblName;

			const obj: any = { ...event.newData };

			if (event.newData.id === '')
			{
				UtilsService.showToast(
					this.toastrService,
					'Warning!',
					'Something went wrong',
					'warning',
					5000,
				);
				return;
			}

			obj.deleted = !!+event.newData.deleted;

			// delete the id column
			UtilsService.deleteProperty(obj, 'id');

			// TODO resolve if data is wrong or if we also need to do something with the lastID
			this.firebaseService.insertData(this.tableName + '/data', obj, this.tableName)
			.then(() => {
					UtilsService.showToast(
						this.toastrService,
						'Row inserted!',
						'Data has been successfully added',
						'success',
						5000,
					)
				},
			);

			event.confirm.resolve();
		} else
			event.confirm.reject();
	}


	/**
	 * @brief - edit the data of the table
	 * @param event
	 * @param undo - To show the undo redo option.
	 */
	public onEditConfirm(event: { data: ProxyObject, newData: ProxyObject, confirm?: any }, undo: boolean) { }

	protected onUserReceived(__: User) { }
}
