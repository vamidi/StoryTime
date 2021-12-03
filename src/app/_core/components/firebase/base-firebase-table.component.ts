import { Component, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';

import { NbToastrService } from '@nebular/theme';

import { LocalDataSource } from '@vamidicreations/ng2-smart-table';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BaseSettings, Column, ISettings } from '@app-core/mock/base-settings';
import { UtilsService } from '@app-core/utils';
import { ProxyObject } from '@app-core/data/base';
import { BehaviourType } from '@app-core/types';
import {
	NumberColumnComponent,
	BooleanColumnRenderComponent,
} from '@app-theme/components';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { IColumn, Table } from '@app-core/data/state/tables';
import { UserService } from '@app-core/data/state/users';
import { User, UserModel, defaultUser } from '@app-core/data/state/users';

import { TablesService } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';

import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { UserPreferences } from '@app-core/utils/utils.service';
import { FilterCallback, firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import {
	KeyLanguage,
	// KeyLanguageObject,
} from '@app-core/data/state/node-editor/languages.model';
// import {
// LanguageRenderComponent, LanguageColumnRenderComponent
// } from '@app-theme/components/render-column-layout/language-column-render.component';
import { BaseFirebaseComponent } from '@app-core/components/firebase/base-firebase.component';
import isEqual from 'lodash.isequal';

/**
 * @brief base class to get simple data information
 * from firebase
 */
@Component({
	template: '',
})
export abstract class BaseFirebaseTableComponent extends BaseFirebaseComponent implements OnDestroy
{
	@Input()
	public gridMode: boolean = true;

	@Output()
	public toggleView: EventEmitter<boolean> = new EventEmitter<boolean>();

	public get getTable(): Table
	{
		return this.table;
	}

	public get getSource(): LocalDataSource
	{
		return this.table.getSource;
	}

	public get languages() { return this.languageService.ProjectLanguages; }

	public settings: ISettings = new BaseSettings();
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

	protected table: Table = new Table();

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
		@Inject(String)protected tableId = '',
	) {
		super(
			firebaseService, firebaseRelationService, toastrService, projectService, tableService,
			userService, userPreferencesService, languageService, tableId,
		);

		// iconsLibrary.registerFontPack('fa', { packClass: 'fa', iconClassPrefix: 'fa' });
		// iconsLibrary.registerFontPack('far', { packClass: 'far', iconClassPrefix: 'fa' });
		// iconsLibrary.registerFontPack('ion', { iconClassPrefix: 'ion' });
	}

	public ngOnDestroy()
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();

		// unsubscribe listening to the child_added event
		this.firebaseService.getRef(this.tableId).limitToLast(2).off('child_added');
	}

	/**
	 * @brief - edit the data of the table
	 * @param event
	 * @param undo - To show the undo redo option.
	 * @param tableId - Override the table if you want to store the data somewhere else.
	 */
	public onEditConfirm(
		event: { data: ProxyObject, newData: ProxyObject, confirm?: any }, undo: boolean = false, tableId: string = '',
	)
	{
		super.onEditConfirm(event, undo);
		if (event.hasOwnProperty('newData') && this.userService.checkTablePermissions(this.tableService))
		{
			let tblId = this.tableId;

			// if we override the tblName
			if(tableId !== '')
				tblId = tableId;

			const oldObj: ProxyObject = event.hasOwnProperty('data') ? { ...event.data } : null;
			const obj: ProxyObject = { ...event.newData };

			if (!event.newData.hasOwnProperty('id'))
			{
				UtilsService.showToast(
					this.toastrService,
					'Warning!',
					'Something went wrong',
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
					5000,
				);
				event.confirm.resolve();
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
			this.tableService.updateData(tblId, event.newData.id, obj, oldObj).then(
				() => {
					if(typeof undo !== 'undefined' && undo === false) // only show the toast when we already undid the obj
					{
						UtilsService.showToast(
							this.toastrService,
							'Row updated!',
							'Data has been successfully updated',
							'success',
						);

						event.confirm.resolve();
					}
					else {
						this.snackbarService.show('Data has been successfully updated', 'UNDO', {
							duration: 10000,
							click: () => {
								this.onEditConfirm({
									newData: oldObj,
									data: obj,
									confirm: event.confirm,
								}, false, tblId);
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
	 * @param event - Data
	 * @param callback - Callback when the deletion is complete.
	 * @param tableId - Override to delete data somewhere else.
	 */
	public onDeleteConfirm(event: { data: ProxyObject, confirm?: any }, callback = () => {}, tableId: string = '')
	{
		if (event.hasOwnProperty('data') && this.userService.checkTablePermissions(this.tableService))
		{
			if (confirm('Are you sure you want to delete this item? This can\'t be undone'))
			{
				let tblId = this.tableId;

				// if we override the tblName
				if(tableId !== '')
					tblId = tableId;

				const oldObj: ProxyObject = { ...event.data };
				const obj: ProxyObject = { ...event.data };

				obj.updated_at = UtilsService.timestamp;
				obj.deleted = true;

				// We don't have to make a revision for deleted items.
				this.tableService.updateData(tblId, event.data.id, obj, null, false)
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
								}, false, tblId);
							},
							'basic',
							10000,
						);

						callback();
					},
				);

				event.confirm?.resolve();
				return;
			}
		}

		event.confirm?.reject().then();
	}

	public saveForm($event: any)
	{
		// see if we have a valid event
		if ($event && $event['event'] !== undefined)
		{
			// see what kind of behaviour this is
			if ($event['type'] !== undefined) {
				const type: BehaviourType = $event.type;

				const newSettings: ISettings =
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
						const columns: { [key:string]: Column } = $event.event.columns;

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
										this.table.push(0, BaseSettings.processData({
											created_at: 0,
											deleted: false,
											updated_at: 0,
										}, key, value, newSettings));
									}

									this.table.forEach((d, index) =>
									{
										if (index === this.table.length - 1)
										{
											const updateData = () =>
											{
												d.updated_at = UtilsService.timestamp;
												return this.tableService.updateData(this.tableId, d.id, d, null, false);
											};

											this.table.update(d, BaseSettings.processData(d, key, value, newSettings))
												.then(() => updateData())
												.then(() => this.updateSettings(newSettings)).catch((error) => this.onError(error));
										}
										else
											this.table.update({ ...d }, BaseSettings.processData({ ...d }, key, value, newSettings))
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
							this.tableService.deleteData(this.tableId, `${d.id}/${camelCaseOldKey}`, d, null, false).then(() =>
							{
								// Update changes in the database
								// Firebase is efficient enough to only update the field that is changed to a new value.
								this.tableService.updateData(this.tableId, d.id, d, null, false)
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
							this.tableService.deleteData(this.tableId, `${d.id}/${key}`, d, null, false).then(() =>
							{
								// Firebase is efficient enough to only update the field that is changed to a new value.
								this.tableService.updateData(this.tableId, d.id, d, null, false)
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
	protected processData(obj: ProxyObject, key: string, value: any, additionalSettings: ISettings)
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
	protected processColumnData(newSettings: ISettings, overrideTitle: string = '')
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
	protected updateSettings(newSettings: ISettings)
	{
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
	protected getTableData(settings: ISettings = null, tblName = '')
	{
		let tbl = this.tableId;

		// if we override the tblName
		if(tblName !== '')
			tbl = tblName;

		// check if it does not end with game-db
		if (this.tableId === 'game-db' || tbl === 'game-db')
			return;

		// get the table data
		// make a separate function in order to get a reference to this.
		const fetchTable$: Observable<Table> = this.firebaseService.getTableData$(`tables/${tbl}`).pipe(
			map((snapshots) =>
			{
				const table: Table = new Table();
				table.id = tbl;

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

	protected processTableData(
		tableData: Table, verify: boolean = false, settings: ISettings = null, overrideTbl: string = '',
	): ISettings
	{
		const newSettings = super.processTableData(tableData, verify, settings, overrideTbl);

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
				firebaseFilterConfig.tableFilters.find((t) => t.table === this.tableId);

			// filter the data if needed
			tableData.load([
				(d: ProxyObject) => !!+d.deleted === false,
				filterFunc,
			]).then(() => this.onTableDataLoaded());
		}

		this.table = this.tableService.setTable(tableData.id, tableData, true);
		// Get the relations from the database as well.
		const newSettings: ISettings = this.processTableData(this.table, true, this.settings);
		this.settings = Object.assign({}, newSettings);
	}

	protected onUserReceived(__: User)
	{
		this.validateSettings(this.settings);
	}

	protected onTableDataLoaded()
	{
		this.columnData = this.settings.columns;

		// If the user has a canEdit privileges
		// then he can make changes to the table,
		// if the has made the table he is also able to change things
		// TODO see if we need the action add
		this.validateSettings(this.settings, true);
	}

	protected validateSettings(settings: ISettings, verifyUser: boolean = false)
	{
		if(verifyUser)
		{
			// If the user has a canEdit privileges
			// then he can make changes to the table,
			// if the has made the table he is also able to change things
			// TODO see if we need the action add
			settings.actions.add    = this.userService.canEdit || this.userService.checkTablePermissions(this.tableService);
			settings.actions.edit   = this.userService.canEdit || this.userService.checkTablePermissions(this.tableService);
			settings.actions.delete = this.userService.canEdit || this.userService.checkTablePermissions(this.tableService);
		}

		settings.columns.deleted.hidden     = settings.columns.deleted.hidden || !this.userService.isAdmin;
		settings.columns.created_at.hidden  = settings.columns.created_at.hidden || !this.userService.isAdmin;
		settings.columns.updated_at.hidden  = settings.columns.updated_at.hidden || !this.userService.isAdmin;
	}
}
