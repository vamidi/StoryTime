import { EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

import { NbToastrService } from '@nebular/theme';

import { LocalDataSource } from '@vamidicreations/ng2-smart-table';

import { Util } from 'leaflet';
import trim = Util.trim;

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { FirebaseService, RelationPair } from '@app-core/utils/firebase.service';
import { BaseSettings } from '@app-core/mock/base-settings';
import { UtilsService } from '@app-core/utils';
import { ProxyObject, Relation, StringPair } from '@app-core/data/base';
import { BehaviourType } from '@app-core/types';
import {
	TextColumnComponent,
	TextRenderComponent,
	NumberColumnComponent,
	BooleanColumnRenderComponent,
} from '@app-theme/components';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { Table } from '@app-core/data/state/tables';
import { UserService } from '@app-core/data/state/users';
import { User, UserModel, defaultUser } from '@app-core/data/state/users';

import { TablesService } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';

import { Project } from '@app-core/data/state/projects';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { ObjectKeyValue, UserPreferences } from '@app-core/utils/utils.service';
import { FilterCallback, firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import {
	KeyLanguage,
	KeyLanguageObject,
} from '@app-core/data/state/node-editor/languages.model';
import { LanguageRenderComponent, LanguageColumnRenderComponent } from '@app-theme/components/render-column-layout/language-column-render.component';
import isEqual from 'lodash.isequal';

/**
 * @brief base class to get simple data information
 * from firebase
 */
export abstract class BaseFirebaseTableComponent implements OnInit, OnDestroy
{
	@Input()
	public gridMode: boolean = true;

	@Output()
	public toggleView: EventEmitter<boolean> = new EventEmitter<boolean>();

	public get isAdmin()
	{
		return this.userService.isAdmin;
	}

	public get getTable(): Table
	{
		return this.table;
	}

	public get getSource(): LocalDataSource
	{
		return this.table.getSource;
	}

	public get languages() { return this.languageService.ProjectLanguages; }

	public settings: BaseSettings = new BaseSettings();
	/*{
		mode: 'internal',
		actions: {
			add: false,
			edit: false,
			delete: false,
			position: 'right',
			width: '100px',
			custom: [
				{
					name: 'changelog',
					title: '<i class="nb-list" title="Changelog"></i>',
				},
			],
		},
		add: {
			addButtonContent: '<i class="nb-plus"></i>',
			createButtonContent: '<i class="nb-checkmark"></i>',
			cancelButtonContent: '<i class="nb-close"></i>',
			confirmCreate: true,
			width: '50px',
		},
		edit: {
			editButtonContent: '<i class="nb-edit"></i>',
			saveButtonContent: '<i class="nb-checkmark"></i>',
			cancelButtonContent: '<i class="nb-close"></i>',
			confirmSave: true,
			width: '50px',
		},
		delete: {
			deleteButtonContent: '<i class="nb-trash"></i>',
			confirmDelete: true,
			width: '50px',
		},
		columns: {
			id: {
				title: 'ID',
				type: 'number',
				editable: false,
				addable: false,
				width: '50px',
				defaultValue: 0,
			},
			deleted: {
				title: 'Deleted',
				type: 'string',
				editable: false,
				addable: false,
				hidden: true,
				defaultValue: 'false',
			},
			tstamp: {
				title: 'Date Created',
				type: 'custom',
				renderComponent: DateColumnComponent,
				editable: false,
				addable: false,
				hidden: true,
				defaultValue: UtilsService.timestamp,
			},
		},
	};
	 */

	// Table settings
	public columnData: Object = null;

	public AddTitle: string = '';
	public DeletedTittle: string = '';
	public AddButtonTitle: string = '';
	public isDeleted: boolean = false;

	protected userPreferences: UserPreferences = null;

	protected user$: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null);
	protected user: UserModel = defaultUser;

	protected tableID: string = '';
	protected table: Table = new Table();

	protected set setTblName(tblName: string)
	{
		this.tableName = tblName;
		this.firebaseService.setTblName(this.tableName);
	}

	// Table reference name
	// protected tableName: string = '';

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected constructor(
		protected router: Router,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected languageService: LanguageService,
		protected tableName: string = '',
	) {
		if(tableName !== '')
			this.firebaseService.setTblName(tableName);

		// iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
		// iconsLibrary.registerFontPack('far', { packClass: 'far', iconClassPrefix: 'fa' });
		// iconsLibrary.registerFontPack('ion', { iconClassPrefix: 'ion' });
	}

	// ngOnInit inside the base class will get the table.
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

			this.settings.columns.deleted.hidden = this.settings.columns.deleted.hidden || !this.isAdmin;
			this.settings.columns.created_at.hidden = this.settings.columns.created_at.hidden || !this.isAdmin;
			this.settings.columns.updated_at.hidden = this.settings.columns.updated_at.hidden || !this.isAdmin;
		}));
	}

	public ngOnDestroy()
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();

		// unsubscribe listening to the child_added event
		this.firebaseService.getRef(this.tableName).limitToLast(2).off('child_added');
	}

	/**
	 * @brief - Insert new row data
	 * @param event
	 */
	public onCreateConfirm(event: any)
	{
		// Check the permissions as well as the data
		if (event.hasOwnProperty('newData') && this.userService.checkTablePermissions(this.tableService))
		{
			const obj: any = { ...event.newData };

			if (event.newData.id === '')
			{
				UtilsService.showToast(
					this.toastrService,
					'Warning!',
					'Something went wrong (check console)',
					'warning',
				);
				return;
			}

			obj.deleted = !!+event.newData.deleted;

			// delete the id column
			UtilsService.deleteProperty(obj, 'id');

			// TODO resolve if data is wrong or if we also need to do something with the lastID
			this.firebaseService.insertData(this.tableName + '/data', obj)
				.then(() => {
					UtilsService.showToast(
						this.toastrService,
						'Row inserted!',
						'Data has been successfully added',
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
	public onEditConfirm(event: { data: ProxyObject, newData: ProxyObject, confirm?: any }, undo: boolean)
	{
		console.trace(event);
		if (event.hasOwnProperty('newData') && this.userService.checkTablePermissions(this.tableService))
		{
			const oldObj: ProxyObject = event.hasOwnProperty('data') ? { ...event.data } : null;
			const obj: ProxyObject = { ...event.newData };

			if (!event.newData.hasOwnProperty('id'))
			{
				UtilsService.showToast(
					this.toastrService,
					'Warning!',
					'Something went wrong (check console)',
					'warning',
				);
				return;
			}

			if(isEqual(event.data, event.newData))
			{
				UtilsService.showToast(
					this.toastrService,
					'Row not updated!',
					'Data received is the same as the old data',
					'danger',
				);
				return;
			}

			obj.updated_at = UtilsService.timestamp;
			obj.deleted = !!+event.newData.deleted;

			// TODO remove when event always has data information.
			if(event.hasOwnProperty('data'))
			{
				for (const field of Object.keys(obj)) {
					const exists = obj.hasOwnProperty(field);

					// first check if this a new field
					if (exists && event.data.hasOwnProperty(field)) {
						const objVal = obj[field]; // defines a copy

						// second check if value is adjusted
						// and also check if is suppose to be a boolean
						if (objVal !== event.data[field]
							&& (objVal === 'true' || objVal === 'false'))
							obj[field] = objVal === 'true';
					} else // this is a new field
					{
						const objVal = exists ? obj[field] : null;
						if (objVal && (objVal === 'true' || objVal === 'false'))
							obj[field] = objVal === 'true';
					}
				}
			}


			// TODO resolve if data is wrong or if we also need to do something with the lastID
			// console.log({ id: event.newData.id, tbl: this.tableName, obj, oldObj });
			this.tableService.updateData(this.tableID, event.newData.id, obj, oldObj).then(
				() => {
					if(typeof undo !== 'undefined' && undo === false) // only show the toast when we already undid the obj
					{
						UtilsService.showToast(
							this.toastrService,
							'Row updated!',
							'Data has been successfully updated',
						);

						event.confirm.resolve();
					}
					else {
						this.snackbarService.show('Data has been successfully updated', 'UNDO', {
							click: () => {
								this.onEditConfirm({
									newData: oldObj,
									data: obj,
									confirm: event.confirm,
								}, false);
							},
						});
					}
				},
			);

			event.confirm.resolve();
			return;
		}

		event.confirm.reject();
	}

	/**
	 * @brief - Delete a row from the table
	 * @param event
	 * @param callback
	 */
	public onDeleteConfirm(event: { data: ProxyObject, confirm?: any }, callback = () => {})
	{
		if (event.hasOwnProperty('data') && this.userService.checkTablePermissions(this.tableService))
		{
			if (confirm('Are you sure you want to delete this item? This can\'t be undone'))
			{
				const oldObj: ProxyObject = { ...event.data };
				const obj: ProxyObject = { ...event.data };

				obj.updated_at = UtilsService.timestamp;
				obj.deleted = true;

				// We don't have to make a revision for deleted items.
				this.tableService.updateData(this.tableID, event.data.id, obj, null, false)
					.then(() => {
						UtilsService.showToast(
							this.toastrService,
						'Row deleted!',
						'Row has been successfully deleted',
						);

						UtilsService.showSnackbar(
							this.snackbarService,
							'UNDO',
							'Row has been successfully reverted',
							() => {
								this.onEditConfirm({
									data: obj,
									newData: oldObj,
									confirm: event.confirm,
								}, false);
							},
						);

						callback();
					},
				);

				event.confirm.resolve();
				return;
			}
		}

		event.confirm.reject().then();
	}

	public saveForm($event: any)
	{
		// see if we have a valid event
		if ($event && $event['event'] !== undefined)
		{
			// see what kind of behaviour this is
			if ($event['type'] !== undefined) {
				const type: BehaviourType = $event.type;

				const newSettings: BaseSettings =
				{
					...this.settings,
					columns: {
						...this.settings.columns,
					},
				};

				switch (type)
				{
					case BehaviourType.INSERT: // if we want to insert new column
					{
						const columns: Object = $event.event.columns;

						if (columns)
						{
							for (const [key, value] of Object.entries(columns))
							{
								if (!newSettings.columns.hasOwnProperty(key.toString()))
								{
									newSettings.columns[key] =
									{
										title: value.title,
										type: value.type,
									};

									if (this.table.length === 0) // if there is no data we need to put in default data
									{
										this.table.push(0, this.processData({
											created_at: 0,
											deleted: false,
											updated_at: 0,
										}, key, value, newSettings));
									}

									this.table.forEach((d, index) =>
									{
										d.updated_at = UtilsService.timestamp;

										if (index === this.table.length - 1)
										{
											this.table.update(d, this.processData(d, key, value, newSettings))
												.then(() => this.tableService.updateData(this.tableID, d.id, d, null, false)
													.then(() => this.updateSettings(newSettings)).catch((error) => this.onError(error)));
										}
										else
											this.table.update({ ...d }, this.processData({ ...d }, key, value, newSettings))
												.catch((error) => this.onError(error));

										// array[index] = this.processData({ ...d }, key, value, newSettings);
									});
								}
							}
						}
					}
						break;
					case BehaviourType.UPDATE:
					{
						const oldKey = $event.event.oldKey;
						const newKey = $event.event.newKey;

						const camelCaseOldKey = UtilsService.camelize(oldKey);
						const camelCaseNewKey = UtilsService.camelize(newKey);

						// rename the property in the columns
						UtilsService.renameProperty(newSettings.columns, camelCaseOldKey, camelCaseNewKey);

						// change the title of the column as well
						newSettings.columns[camelCaseNewKey].title = newKey;

						// Delete the old key from the column list.
						UtilsService.deleteProperty(newSettings.columns, camelCaseOldKey);

						this.table.forEach((d) =>
						{
							d.updated_at = UtilsService.timestamp;

							UtilsService.renameProperty(d, camelCaseOldKey, camelCaseNewKey);

							// we only have to delete the field from each object.
							this.tableService.deleteData(this.tableID, `${d.id}/${camelCaseOldKey}`, d, null, false).then(() =>
							{
								// Update changes in the database
								// Firebase is efficient enough to only update the field that is changed to a new value.
								this.tableService.updateData(this.tableID, d.id, d, null, false)
									.catch((error) => this.onError(error));
							});
						});

						this.updateSettings(newSettings);
					}
						break;
					case BehaviourType.DELETE:
					{
						const key = UtilsService.camelize($event.event.key);

						UtilsService.deleteProperty(newSettings.columns, key);

						this.table.forEach((d) =>
						{
							d.updated_at = UtilsService.timestamp;

							UtilsService.deleteProperty(d, key);

							// this.afd.object('/' + tbl + '/' + String(id))

							// we only have to delete the field from each object.
							this.tableService.deleteData(this.tableID, `${d.id}/${key}`, d, null, false).then(() =>
							{
								// Firebase is efficient enough to only update the field that is changed to a new value.
								this.tableService.updateData(this.tableID, d.id, d, null, false)
									.catch((error) => this.onError(error));
							});
						});

						this.updateSettings(newSettings);
					}
					break;
				}
			}
		}
	}

	public toggleColumn(event: { key: string, value: boolean })
	{
		if(this.settings.columns[event.key].hidden === event.value)
			return;

		const container = this.userPreferences.visibleColumns;

		if(!container.has(this.table.metadata.title))
		{
			const o = {};
			o[event.key] = event.value;
			container.set(this.table.metadata.title, o);
		}
		else
			container.get(this.table.metadata.title)[event.key] = event.value;

		this.userPreferencesService.setUserPreferences(this.userPreferences);
	}

	public onColumnOrderChange(event: any)
	{
		if(event.hasOwnProperty('columns'))
		{
			const container = this.userPreferences.indexColumns;

			if(!container.has(this.table.metadata.title))
				container.set(this.table.metadata.title, {});

			for(const key of Object.keys(event.columns))
			{
				container.get(this.table.metadata.title)[key] = event.columns[key].index;
			}

			this.userPreferencesService.setUserPreferences(this.userPreferences);
		}
	}

	public onLanguageChange(event: KeyLanguage)
	{
		this.languageService.SetLanguage = event;
	}

	/**
	 *
	 * @brief - Process data to change the settings data.
	 * @param obj
	 * @param key
	 * @param value
	 * @param additionalSettings
	 */
	protected processData(obj: ProxyObject, key: string, value: any, additionalSettings: BaseSettings)
	{
		if (!obj.hasOwnProperty(key))
		{
			if (value.type.toLowerCase() === 'string')
			{
				obj[key] = '';
			}

			if (value.type.toLowerCase() === 'number')
			{
				// TODO make this value max_integer when this is marked as foreign key.
				obj[key] = 0;
				additionalSettings.columns[key] = {
					...additionalSettings.columns[key],
					editor: {
						type: 'custom',
						component: NumberColumnComponent,
					},
				};
			}
			if (value.type.toLowerCase() === 'boolean')
			{
				obj[key] = false;

				// the column should be string because we render string.
				// In the end we send true of false bool to the server.
				additionalSettings.columns[key].type = 'string';
				additionalSettings.columns[key] = {
					...additionalSettings.columns[key],
					editor: {
						type: 'custom',
						component: BooleanColumnRenderComponent,
					},
				};
			}
			obj = Object.assign({}, obj);
			return obj;
		}
	}

	/**
	 *
	 * @param newSettings
	 * @param overrideTitle
	 * @protected
	 */
	protected processColumnData(newSettings: BaseSettings, overrideTitle: string = '')
	{
		let tbl = this.table.metadata.title;

		// if we override the tblName
		if(overrideTitle !== '')
			tbl = overrideTitle;

		if(this.userPreferences.indexColumns.has(tbl))
		{
			const indexColumns = this.userPreferences.indexColumns.get(tbl);

			Object.keys(indexColumns).forEach((key) => {
				newSettings.columns[key].index = indexColumns[key];
			});
		}
	}

	/**
	 * @brief update the settings with latest columns
	 * @param newSettings
	 */
	protected updateSettings(newSettings: BaseSettings)
	{
		console.log(newSettings);
		this.settings = Object.assign({}, newSettings);
		this.columnData = this.settings.columns;
	}

	protected onError(error)
	{
		UtilsService.onError(error);
	}

	/**
	 * @brief -
	 * @param settings
	 * @param tblName
	 */
	protected getTableData(settings: any = null, tblName = '')
	{
		let tbl = this.tableName;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		// check if it does not end with game-db
		if (this.tableName === 'game-db' || tbl === 'game-db')
			return;

		// get the table data
		// make a separate function in order to get a reference to this.
		const fetchTable$: Observable<Table> = this.firebaseService.getTableData$(tbl).pipe(
			map((snapshots) =>
			{
				const table: Table = new Table();
				table.id = this.tableID;

				// configure fields
				snapshots.forEach((snapshot) =>
				{
					table[snapshot.key] = snapshot.payload.val();
				});

				return table;
			}),
		);

		this.mainSubscription.add(fetchTable$.subscribe((table: Table) =>
		{
			this.projectService.set(table.projectID, true).then(() => {
				this.userService.setUserPermissions(this.projectService);
				this.onDataReceived(table)
			});
		}/*, () => this.router.navigateByUrl('/dashboard/error')*/ ));
	}

	/**
	 * @brief - Process table data to generate columns
	 * @param tableData
	 * @param verify
	 * @param overrideTbl
	 */
	protected processTableData(tableData: Table, verify: boolean = false, overrideTbl: string = ''): BaseSettings
	{
		// noinspection JSUnusedGlobalSymbols
		const newSettings: BaseSettings = { ...this.settings };

		let tbl = tableData.title;

		// if we override the tblName
		if(overrideTbl !== '')
			tbl = overrideTbl;

		for(const dataKey of Object.keys(tableData.data))
		{
			const dataValue = tableData.data[dataKey];
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
							this.processRelation(pair, key, newSettings, tbl);
						}

						if(!newSettings.columns[key].hasOwnProperty('type'))
							newSettings.columns[key]['type'] = type;
					}
				}
			}

/*
			const idx = this.data.findIndex((data) => data.id === dataKey);
			const q = { id: dataKey, ...dataValue };
			if (idx === -1)
			{
				this.data.push(q);
			}
			else
			{
				// update with new data
				this.data[idx] = q;
			}
 */
		}


		for(const key of Object.keys(newSettings.columns))
		{
			// Configure hide/non hidden columns
			if(this.userPreferences.visibleColumns.has(this.table.metadata.title))
			{
				const visibleColumns = this.userPreferences.visibleColumns.get(this.table.metadata.title);

				if(visibleColumns && visibleColumns.hasOwnProperty(key))
				{
					this.toggleColumn({key: key, value: visibleColumns[key]});
					newSettings.columns[key].hidden = visibleColumns[key];
				}
			}

			if(this.userPreferences.indexColumns.has(this.table.metadata.title))
			{
				const indexColumns = this.userPreferences.indexColumns.get(this.table.metadata.title);

				if(indexColumns && indexColumns.hasOwnProperty(key))
					newSettings.columns[key].index = indexColumns[key];
			}
		}

		return newSettings;
	}

	/**
	 *
	 * @param pair
	 * @param key
	 * @param newSettings
	 * @param overrideTbl
	 */
	protected processRelation(pair: StringPair, key: string, newSettings: BaseSettings, overrideTbl: string = '')
	{
		if (pair)
		{
			let tbl = this.table.metadata.title;

			// if we override the tblName
			if(overrideTbl !== '')
				tbl = overrideTbl;

			const project: Project | null = this.projectService.getProjectById(this.table.projectID);
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

			if(newPair.key === '')
				UtilsService.onError(`Relation not found! Trying to find table "${pair.key}" for column "${pair.value}"`);

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

			const rel = new Relation(
				this.table.id, this.firebaseService, this.firebaseRelationService, this.tableService, newPair,
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
					tblName: tbl, relationTable: pair.key, projectID: this.table.projectID, tableID: this.table.id,
				},
				config: { /* data: { relation: rel }, */ },
			}
		}
	}

	/*
	protected retrieveLastId(settings: any = null)
	{
		this.firebaseService.getRef(this.tableName).limitToLast(2).on('child_added', (snapshot) =>
		{
			if (snapshot && snapshot.ref) // also increment
			{
				// see if the key is a number
				const key: number = +snapshot.ref.key;
				this.lastUID = isNaN(key) ? this.lastUID : key + 1;
			}

			if(settings)
				settings.columns.id.defaultValue = this.lastUID
		});
	}
	 */

	protected onDataReceived(tableData: Table): void
	{
		this.table = tableData;
		if(tableData.hasOwnProperty('data') && Object.values(tableData.data).length !== 0)
		{
			// reset the filter as well
			tableData.getSource.setFilter([]);

			const filterFunc: FilterCallback<ProxyObject> =
				firebaseFilterConfig.tableFilters.find((t) => t.table === this.tableName);

			// filter the data if needed
			tableData.load([
				(d: ProxyObject) => !!+d.deleted === false,
				filterFunc,
			]).then(() => this.onTableDataLoaded());
		}

		this.table = this.tableService.setTable(tableData.id, tableData, true);
		// Get the relations from the database as well.
		const newSettings: BaseSettings = this.processTableData(this.table, true);
		this.settings = Object.assign({}, newSettings);
	}

	protected onUserReceived(__: User) { }

	protected onTableDataLoaded() { }
}
