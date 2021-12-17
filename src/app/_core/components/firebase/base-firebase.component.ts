import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AngularFireAction } from '@angular/fire/database';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NbDialogConfig } from '@nebular/theme/components/dialog/dialog-config';
import { BehaviorSubject, of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ObjectKeyValue, UserPreferences, UtilsService } from '@app-core/utils/utils.service';
import { FirebaseService, RelationPair } from '@app-core/utils/firebase/firebase.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { User, UserModel, defaultUser, UserService } from '@app-core/data/state/users';
import { ProxyObject, Relation, StringPair } from '@app-core/data/base';
import { Column, Table, TableColumnMap, TablesService } from '@app-core/data/state/tables';
import { ISettings } from '@app-core/mock/base-settings';
import {
	BooleanColumnRenderComponent,
	LanguageColumnRenderComponent,
	LanguageRenderComponent,
	NumberColumnComponent, TextColumnComponent, TextRenderComponent,
} from '@app-theme/components';
import { KeyLanguage, KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { environment } from '../../../../environments/environment';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table';

import { Util } from 'leaflet';
import trim = Util.trim;

import isEqual from 'lodash.isequal';

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

	/**
	 *
	 * @param tblId
	 * @protected
	 */
	protected set setTblName(tblId: string)
	{
		this.tableId = tblId;
		this.firebaseService.setTblName(this.tableId);
	}

	protected project: Project = null;
	protected project$: BehaviorSubject<Project> = new BehaviorSubject<Project>(null);
	protected projectId: string = '';

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected constructor(
		protected route: ActivatedRoute,

		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected toastrService: NbToastrService,
		protected dialogService: NbDialogService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected languageService: LanguageService,
		@Inject(String) protected tableId = '',
	) {
		if(tableId !== '') this.firebaseService.setTblName(tableId);
	}

	public ngOnInit(): void
	{
		// Get the stories table
		// this.tableName = 'characters';
		// Let firebase search with current table name
		if(this.tableId !== '') this.firebaseService.setTblName(this.tableId);

		// Load the user preferences
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

		// Load the user
		this.mainSubscription.add(this.userService.getUser().pipe(
			switchMap((user: User) => {
				// Set the user
				// Only push changed users.
				if(!isEqual(this.user, user))
				{
					this.user = user;
					this.user$.next(this.user);
					// const canDelete: boolean = !_.isEmpty(_.intersection( ['admin', 'author'], allowedRoles));
					this.onUserReceived(user);
				}

				return this.route.params;
			}),
			// load the params from the url
			switchMap((params) => {
				this.projectId = params['id'];

				if(this.projectService.getProject())
					return this.projectService.getProject$();
				else if(this.projectId !== '' && !UtilsService.isNull(this.projectId))
					return this.firebaseService.getItem(this.projectId, `projects`).snapshotChanges();
				else
					return of(null)
			}),
		).subscribe((snapshot: Project | AngularFireAction<any>) =>
		{
			// console.log(snapshot, typeof snapshot, snapshot instanceof Project);
			let project: Project = new Project();
			if(snapshot !== null )
			{
				if(!snapshot.hasOwnProperty('payload') || snapshot instanceof Project)
				{
					project = snapshot as Project;
				} else if(snapshot.payload.exists())
				{
					project = UtilsService.assignProperties(project, snapshot.payload.val());
				}
			}

			if (project && !isEqual(this.project, project) && project.hasOwnProperty('tables'))
			{
				this.project = project;
				this.onProjectLoaded(this.project);
				this.project$.next(this.project);
			}

			this.userService.setUserPermissions(this.projectService);
		}));

		// Important or data will not be cached
		/*
		this.firebaseService.getRef(`tables/${tableID}/data/${id}`).on('value', (snapshot) => {
			if(snapshot.exists())
			{
				this.characterData = snapshot.val();
			}
		});
		*/
	}

	public ngOnDestroy(): void
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();
	}

	/**
	 * @brief - Add objects to the database through a dialog.
	 * @param userConfig
	 * @param id - id of the table we want to insert the data into
	 */
	public addMultiple<C>(userConfig?: Partial<NbDialogConfig<Partial<C> | string>>, id?: string)
	{
		let tableId = this.tableId;
		if(id !== null || typeof id !== 'undefined')
			tableId = id;

		const ref = this.dialogService.open(InsertMultipleDialogComponent, userConfig);

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) =>
			this.onCreateConfirm(event, tableId));
	}


	/**
	 * @brief - Insert new row data
	 * @param event
	 * @param tableId
	 */
	public onCreateConfirm(event: any, tableId: string = '')
	{
		// Check the permissions as well as the data
		if (event.hasOwnProperty('newData') && this.userService.checkTablePermissions(this.tableService))
		{
			let tblId = this.tableId;

			// if we override the tblName
			if(tableId !== '')
				tblId = tableId;

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
			this.tableService.insertData(tblId, obj)
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
		{
			UtilsService.showToast(
				this.toastrService,
				'Warning!',
				'Something went wrong',
				'warning',
				5000,
			);
			event.confirm.reject();
		}
	}


	/**
	 * @brief - edit the data of the table
	 * @param event
	 * @param undo - To show the undo redo option.
	 */
	public onEditConfirm(event: { data: ProxyObject, newData: ProxyObject, confirm?: any }, undo: boolean = false) { }

	/**
	 * @brief - Process table data to generate columns
	 * table settings for the ng2-smart-table
	 * @param table
	 * @param verify
	 * @param settings
	 * @param overrideTbl
	 */
	protected processTableData(
		table: Table, verify: boolean = false, settings: ISettings = null, overrideTbl: string = '',
	): ISettings
	{
		// noinspection JSUnusedGlobalSymbols
		const newSettings: ISettings = { ...settings };

		let tbl: string = table.title;

		// if we override the tblName
		if(overrideTbl !== '')
			tbl = overrideTbl;

		// if we need to verify we need to check if it is a valid item
		if (verify)
		{
			// Only execute this when we are at the right version.
			if(UtilsService.versionCompare(environment.appVersion, '2020.1.6f1', { lexicographical: true }) >= 0)
			{
				if(this.project)
				{
					const dataValue: TableColumnMap = this.project.getColumns(table.id);
					// Now we have the information only once.
					// TODO make this generic.
					for (const [k, val] of Object.entries<Column>(dataValue)) {
						console.log(k, val);

						const key: string = trim(k);

						if (!newSettings.columns.hasOwnProperty(key.toString()))
						{
							const entry: RelationPair = this.firebaseRelationService.getData().get(tbl);

							newSettings.columns[key] =
							{
								title: val.name,
								defaultValue: val.defaultValue,
								type: val.type,
								class: 'input input-form-control',
								filter: false,
								hidden: false,
								editor: {},
							};

							let type: string = '';

							// TODO generate type from function
							if (typeof val.defaultValue === 'string') {
								type = 'html';
								newSettings.columns[key].valuePrepareFunction = (cell /*, row */) => {
									return UtilsService.replaceCharacter(cell,/<\/>/g, '</b>');
								}
							}

							if (typeof val.defaultValue === 'number')
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

							if (typeof val.defaultValue === 'boolean')
							{
								type = 'string';
								newSettings.columns[key].editor = {
									type: 'custom',
									component: BooleanColumnRenderComponent,
								};
							}

							if(typeof val.defaultValue === 'object')
							{
								const keyValue = val.defaultValue as KeyLanguageObject;
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
				else {
					if(environment.production === false)
						throw new Error('Settings could not be generated, because the project is not found!');

					UtilsService.onWarn('Settings could not be generated, because the project is not found!');

					return newSettings;
				}
			}
			else {
				for(const dataKey of Object.keys(table.data)) {
					const dataValue: ProxyObject = table.data[dataKey];
					this.generateSettings(table, newSettings, dataValue, tbl);
				}
			}
		}

		return newSettings;
	}

	protected generateSettings(table: Table, newSettings: ISettings, dataValue: ProxyObject, tbl: string)
	{
		for (const [k, value] of Object.entries(dataValue))
		{
			const key: string = trim(k);

			// We only need this information once
			if (!newSettings.columns.hasOwnProperty(key.toString()))
			{
				const titleName = UtilsService.title(key.toString());
				const entry: RelationPair = this.firebaseRelationService.getData().get(tbl);

				newSettings.columns[key] =
					{
						title: titleName,
						class: 'input input-form-control',
						filter: false,
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

	/**
	 * Process the relation between the columns to other tables
	 * @param table
	 * @param pair
	 * @param key
	 * @param newSettings
	 * @param overrideTbl
	 */
	protected processRelation(
		table: Table, pair: StringPair, key: string, newSettings: ISettings, overrideTbl: string = '',
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
				if(project.tables[k].metadata.name === pair.key)
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
				// TODO make expandable row.
				// instance.classType = pair.key;
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
		return this.tableService.insertData(this.tableId, obj);
	}

	protected updateFirebaseData(
		event: { data: ProxyObject, newData: ProxyObject, confirm?: any },
	): Promise<void | string | firebase.database.Reference>
	{
		const oldObj: ProxyObject = event.hasOwnProperty('data') ? { ...event.data } : null;
		const obj: ProxyObject = { ...event.newData };

		// TODO resolve if data is wrong or if we also need to do something with the lastID
		// console.log({ id: event.newData.id, tbl: this.tableName, obj, oldObj });
		return this.tableService.updateData(this.tableId, event.newData.id, obj, oldObj);
	}

	protected onUserReceived(__: User) { }

	protected onProjectLoaded(_: Project) { }
}
