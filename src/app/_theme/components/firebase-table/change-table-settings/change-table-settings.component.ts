import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input, OnDestroy,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import { KeyValue } from '@angular/common';
import {
	ButtonFieldComponent,
	DynamicFormComponent,
} from '@app-theme/components/form';
import { BaseSettings } from '@app-core/mock/base-settings';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { UserService } from '@app-core/data/state/users';
import { NbDialogRef, NbDialogService, NbSelectComponent, NbToastrService } from '@nebular/theme';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { FirebaseService, RelationPair } from '@app-core/utils/firebase.service';
import { IRelation, Revision, Table } from '@app-core/data/state/tables';
import { DefaultEditor, LocalDataSource } from '@vamidicreations/ng2-smart-table';
import { ProxyObject, StringPair } from '@app-core/data/base';
import { DropDownQuestion, Option } from '@app-core/data/forms/form-types';
import { UtilsService } from '@app-core/utils';
import { TablesService } from '@app-core/data/state/tables';
import { ProjectsService } from '@app-core/data/state/projects';
import { Util } from 'leaflet';
import trim = Util.trim;
import { BehaviorSubject, Subscription } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { InsertRelationDialogComponent } from '@app-theme/components/firebase-table/insert-relation-items/insert-relation-dialog.component';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

import * as firebase from 'firebase';
import 'firebase/database';

import isEqual from 'lodash.isequal';

interface ColumnSetting {
	id: string,
	column: string,
	oColumn: string,
	oTable: string,
	table: string,
}

@Component({
	selector: 'ngx-change-table-settings-dialog',
	templateUrl: './change-table-settings.component.html',
	styles: [
		`
			nb-card {
				min-width: 700px;
				max-width: 1000px;
				max-height: 800px;
			}
		`,
	],
	// styleUrls: ['./change-table-settings.component.scss'],
})
export class ChangeTableSettingsComponent implements
	OnInit, AfterViewInit
{
	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	public onRelationInserted: EventEmitter<any> = new EventEmitter<any>();

	public onRelationDeleted: EventEmitter<any> = new EventEmitter<any>();

	@Input()
	public table: Table = null;

	@Input()
	public settings: BaseSettings = new BaseSettings();

	@Output()
	public onToggleEvent: EventEmitter<{ key: string, value: boolean }> =
		new EventEmitter<{ key: string, value: boolean }>();

	@Output()
	public onInsertAccept: Function | null = (): boolean => true;

	@Output()
	public onInsertRejected: Function | null = (): boolean => true;

	public get isAdmin()
	{
		return this.userService.isAdmin;
	}

	public source: BaseFormSettings = {
		title: 'Table Settings',
		alias: 'table-settings',
		requiredText: 'Settings',
		fields: {},
	};

	public relSource: LocalDataSource = new LocalDataSource();

	public relSettings: BaseSettings = new BaseSettings();

	public relations: IRelation = null;

	public currentRevID: number = -1;

	public get revisions(): Map<string, Revision> {
		const mp: Map<string, Revision> = new Map<string, Revision>();
		Object.keys(this.table.revisions).map((key) => {
			const rev: Revision = this.table.revisions[key];
			rev.id = key;

			// Set the current revision to latest
			if(this.currentRevID <= rev.currentRevID)
				this.currentRevID = rev.currentRevID;

			mp.set(key, rev);
		})

		return mp;
	}

	protected columns: Map<string, any> = new Map<string, any>();

	constructor(
		protected ref: NbDialogRef<ChangeTableSettingsComponent>,
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected tablesService: TablesService,
		protected userService: UserService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected cd: ChangeDetectorRef,
	) { }

	public ngOnInit(): void
	{
		const columns = Object.entries(this.settings.columns);

		// only include hidden values that we can see
		this.columns = new Map(columns.filter((item: [string, any] ) =>
		{
			if(this.userService.isAdmin)
				return true;

			return (
				// if this is the deleted or tstamp column hide it.
				(item[0] === 'deleted' || item[0] === 'created_at' || item[0] === 'updated_at') && this.userService.isAdmin
				// if we are not admin and it is not the deleted or timestamp column show it.
				|| this.userService.isAdmin === false
			)
		}));

		for(const [key, value] of this.columns)
		{
			this.source.fields[key] = {
				value: value.hidden,
				name: value.title.toLowerCase(),
				controlType: 'checkbox',
				// readOnly: !!column.defaultValue,
				// hidden: column.hidden,
				text: 'Hide/Unhide - ' + value.title,
				placeholder: value.title,
				required: true,
				onSelectEvent: (event: any) => this.OnToggle(event),
			};
		}

		// Pair('dialogues', Pair('nextId', new StringPair('dialogues', 'text')));
		this.relSettings.actions.custom = [];

		// Remove unnecessary cells
		delete this.relSettings.columns['id'];
		delete this.relSettings.columns['created_at'];
		delete this.relSettings.columns['updated_at'];
		delete this.relSettings.columns['deleted'];

		this.relSettings.columns['table'] = {
			title: 'Table',
			type: 'string',
			editable: false,
			addable: false,
			width: '25%',
		}

		this.relSettings.columns['column'] = {
			title: 'Column',
			type: 'string',
			editor: {
				type: 'custom',
				component: TableColumnRendererComponent,
				data: { type: 'column', settings: null, projectID: this.table.projectID },
			},
		}

		this.relSettings.columns['oTable'] = {
			title: 'Other Table',
			type: 'text',
			editor: {
				type: 'custom',
				component: TableColumnRendererComponent,
				data: { type: 'table', projectID: this.table.projectID },
			},
		}

		this.relSettings.columns['oColumn'] = {
			title: 'Other Column',
			type: 'string',
			editor: {
				type: 'custom',
				component: TableColumnRendererComponent,
				data: { type: 'column', projectID: this.table.projectID, tableID: this.table.id },
			},
		}

		this.relations = this.table.relations ? this.table.relations : {};

		const data = [];
		if(this.relations && this.relations.hasOwnProperty('columns'))
		{
			// key is the column of the current table
			// value --> column = column other table, key = other table
			for(const [key, value] of
				Object.entries<{ key: string, column: string, locked?: boolean }>(this.relations.columns))
			{
				data.push({
					table: this.table.metadata.title,
					column: key,
					oTable: value.key,
					oColumn: value.column,
					locked: value.locked,
				});
			}
		}

		this.relSource.load(data).then();

		const settings: any = {};
		for(const key of Object.keys(this.settings.columns))
		{
			settings[key] = {
				type: this.settings.columns[key].type,
			};
		}

		this.relSettings.columns['column'].editor.data.settings = settings;
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public OnToggle(event: any)
	{
		this.onToggleEvent.emit({ key: event.key, value: event.value });
	}

	/**
	 * @brief - Open the dialog to insert a new relation
	 */
	public openRelationDialogue()
	{
		let AddTitle = this.table.metadata.title;
		AddTitle = AddTitle.replace(/([A-Z])/g, ' $1').trim();
		AddTitle = AddTitle.charAt(0).toUpperCase() + AddTitle.substr(1);

		const ref: NbDialogRef<InsertRelationDialogComponent> = this.dialogService.open(InsertRelationDialogComponent, {
			context: {
				title: 'Add relation to ' + AddTitle,
				settings: this.settings,
				table: this.table,
			},
		});

		ref.componentRef.instance.onRelationInserted.subscribe((event: { newData: { key: string, pair: StringPair } }) => {
			this.onRelationInserted.emit(event);

			this.relSource.add({
				table: this.table.metadata.title,
				column: event.newData.key,
				oTable: event.newData.pair.key,
				oColumn: event.newData.pair.value,
				locked: event.newData.pair.locked,
			}).then(() => this.relSource.refresh());
		});
		ref.componentRef.onDestroy(() => ref.componentRef.instance.onRelationInserted.unsubscribe());
	}

	/**
	 * @brief - Update an existing relation.
	 * @param event
	 * @param enabledUndo
	 */
	public onEditConfirm(
		event: { data: ColumnSetting, newData: ColumnSetting, confirm?: any }, enabledUndo: boolean,
	)
	{
		if (event.hasOwnProperty('newData'))
		{
			// TODO undo redo functionality
			const oldObj: ColumnSetting = event.hasOwnProperty('data') ? { ...event.data } : null;
			const obj:  ColumnSetting = { ...event.newData };

			if (event.newData.id === '') {
				UtilsService.showToast(
					this.toastrService,
					'Warning!',
					environment.production ? 'Something went wrong (check console)'
					: 'Something went wrong with inserting relation',
					'warning',
				);
				return;
			}

			if (isEqual(event.data, event.newData)) {
				UtilsService.showToast(
					this.toastrService,
					'Relation not updated!',
					'Data received is the same as the old data',
					'danger',
				);
				return;
			}

			// if we don't have the columns yet. (because of new table
			if(!this.table.relations.hasOwnProperty('columns'))
			{
				this.table.relations = {
					columns: {},
				}
			}

			this.table.relations.columns[obj['column']] = {
				key: obj['oTable'],
				column: obj['oColumn'],
			};

			// if we are using a different column name
			// delete the old one
			if(
				obj['column'] !== oldObj['column'] &&
				this.table.relations.columns.hasOwnProperty(oldObj['column']))
			{
				// TODO we need to delete the current one.
				// this.table.relations.columns)
			}

			/**
			 * @brief relation data
			 * @param key - other table key
			 * @param pair - other table name + other table column
			 */
			const data = {
				newData: {
					// table: UtilsService.camelize(val[this.tableField.question.key]),
					key: obj['column'],
					pair: new StringPair(
						obj['oTable'],
						obj['oColumn'],
					),
				},
				confirm: {
					resolve: this.onInsertAccept,
					reject: this.onInsertRejected,
				},
			};

			// Add the relation the database
			this.firebaseRelationService.addData(this.table.metadata.title, data.newData.key, data.newData.pair);

			this.onRelationInserted.emit(data);

			if(enabledUndo) // only show the toast when we already undid the obj
			{
				// push the relation to the server
				this.tablesService.update(this.table.id).then(() => {
					UtilsService.showToast(
						this.toastrService,
						'Relation updated!',
						'Relation has been successfully updated',
					)
				});

				UtilsService.showSnackbar(
					this.snackbarService,
					'UNDO',
					'UNDO RELATION',
					() => this.onEditConfirm({ ...event, newData: oldObj, data: obj }, false),
				);
			}
			// if undo is disabled we probably already undid it so only change the table and show we have reverted the changes
			else
			{
				this.relSource.update(oldObj, obj).then(() => {
					// push the relation to the server
					UtilsService.showToast(
						this.toastrService,
						'Relation reverted!',
						'Relation has been successfully reverted',
					);
				});
			}

			event.confirm.resolve();
		}
		else
			event.confirm.reject().then();
	}

	/**
	 * @brief - Delete an existing relation
	 * @param event
	 */
	public onDeleteConfirm(event: any)
	{
		if(event.hasOwnProperty('data') && this.userService.checkTablePermissions(this.tablesService))
		{
			// TODO implement Undo/Redo
			const obj: ProxyObject = { ...event.data };

			const editable = this.firebaseRelationService.isEditable(obj['table'], obj['column']);

			if(!editable)
			{
				UtilsService.showToast(
					this.toastrService,
					'Warning!',
					'Relation couldn\'t be deleted',
					'warning',
				)
				event.confirm.reject();
				return;
			}

			if (confirm('Are you sure you want to delete this item?'))
			{
				if(editable &&
					this.table.relations.hasOwnProperty('columns') &&
					this.table.relations.columns.hasOwnProperty(obj['column'])
				) {
					/**
					 * @brief relation data
					 * @param key - other table key
					 */
					const data = {
						newData: {
							key: obj['column'],
							pair: new StringPair(
								obj['oTable'],
								obj['oColumn'],
							),
						},
						confirm: {
							resolve: this.onInsertAccept,
							reject: this.onInsertRejected,
						},
					};

					const redo = { ...this.table.relations.columns[obj['column']] };
					delete this.table.relations.columns[obj['column']];

					// push the relation to the server
					this.tablesService.update(this.table.id).then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Relation deleted!',
							'Relation has been successfully deleted',
						)
					});

					// this.onRelationDeleted.emit(data);

					UtilsService.showSnackbar(
						this.snackbarService,
						'UNDO',
						'UNDO DELETION RELATION',
						() =>
						{
							this.relSource.add(obj).then(() =>
							{
								// Add the relation the database
								this.firebaseRelationService.addData(this.table.metadata.title, data.newData.key, data.newData.pair);

								// add the relation back to the table
								this.table.relations.columns[obj['column']] = redo;

								// push the relation to the server
								this.tablesService.update(this.table.id).then(() => {
									UtilsService.showToast(
										this.toastrService,
										'Relation reverted!',
										'Relation has been successfully reverted',
									);
								});

								// push the relation to the main table to make the connection visible
								this.onRelationInserted.emit(data);

								// refresh current table.
								this.relSource.refresh();
							});
						},
					);

					event.confirm.resolve();
					return;
				}
			}
		}

		event.confirm.reject();
	}

	public revert(revision: Revision)
	{
		// remove all things above this revision
		const revID = revision.revision + 1;

		const oldValue: ProxyObject = this.table.data[revision.rowID];

		const newValue: ProxyObject = {...revision.oldValue };
		newValue.updated_at = UtilsService.timestamp;

		this.applyRevision(revision.rowID, revID, oldValue, this.checkNewValue(newValue));
	}

	public apply(revision: Revision)
	{
		// remove all things above this revision
		const revID = revision.revision + 1;

		const oldValue: ProxyObject = this.table.data[revision.rowID];

		const newValue: ProxyObject = { ...revision.newValue };
		newValue.updated_at = UtilsService.timestamp;

		this.applyRevision(revision.rowID, revID, oldValue, this.checkNewValue(newValue));
	}

	public onRevisionDeleted(event, revision: KeyValue<string, Revision>)
	{
		// stop the header from folding out.
		event.stopPropagation();

		if(window.confirm('Are your sure you want to delete this revision?'))
		{
			// push the relation to the server
			this.firebaseService.deleteItem(revision.key, `tables/${this.table.id}/revisions`).then(() => {
				UtilsService.showToast(
					this.toastrService,
					'Revision deleted!',
					'Revision has been successfully deleted',
				)

				UtilsService.showSnackbar(this.snackbarService, 'UNDO', 'Revision deleted', () => {
					this.firebaseService.revertRevision(`tables/${this.table.id}/revisions`, revision.value).then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Revision reverted!',
							`Revision ${revision.key} has been reverted`,
						);
					});
				});
			}).catch(() => {
				UtilsService.showToast(
					this.toastrService,
					'Permission denied!',
					'You do not have the right permissions',
					'danger',
				)
			});
		}
	}

	public onSendForm()
	{

	}

	public dismiss()
	{
		this.ref.close();
	}

	protected checkNewValue(newValue: ProxyObject): ProxyObject
	{
		const keys = Object.keys(this.settings.columns);
		keys.forEach((key) => {
			// if the new value doesn't contains the right values we need to create it
			if(!newValue.hasOwnProperty(key))
			{
				const type = this.settings.columns[key].type;
				if (type.toLowerCase() === 'string')
				{
					newValue[key] = '';
				}

				if (type.toLowerCase() === 'number')
				{
					// TODO make this value max_integer when this is marked as foreign key.
					newValue[key] = 0;
				}
				if (type.toLowerCase() === 'boolean')
				{
					newValue[key] = false;
				}
			}
		});

		return newValue;
	}

	protected applyRevision(rowID: string | number, revID: number, oldValue: ProxyObject, newValue: ProxyObject)
	{
		if (window.confirm('Are you sure you want to revert to this version'))
		{
			// delete the old ones
			this.firebaseService.getRef(`/tables/${this.table.id}/revisions`)
				.orderByChild('revision').startAt(revID).once('value').then((snapshots) => {
				snapshots.forEach((child) => {
					child.ref.remove().then();
				});
			});

			// update row to value
			this.firebaseService.updateData(
				rowID, `tables/${this.table.id}/revisions`, newValue, oldValue, `tables/${this.table.id}/data`,
			).then((result) => {
				const ref: firebase.database.Reference = <firebase.database.Reference>result;
				if (ref) {
					ref.once('value')
						.then((dataSnapshot) =>
							this.currentRevID = dataSnapshot.exists() ? dataSnapshot.val().currentRevID : this.currentRevID);
				}
			}).catch((error) => UtilsService.onError(error));
		}
	}
}

// These render component need a way to talk with each other
const onTableChanged: BehaviorSubject<string> = new BehaviorSubject('');

/**
 * @brief - this class represent a table or column connection
 *
 */
@Component({
	template: `
		<span *ngIf="!isEditable">{{ cell.getValue() }}</span>
		<nb-select #selectComponent *ngIf="isEditable" id="{{ question.key }}--dropdown"
		           fullWidth
		           [(selected)]="defaultValue"
		           [placeholder]="question.placeholder"
				   (selectedChange)="onChange($event)">
			<nb-option *ngFor="let o of question.options$ | async" [value]="o.value">{{ o.key }}</nb-option>
		</nb-select>
	`,
})
export class TableColumnRendererComponent extends DefaultEditor implements OnInit, OnDestroy
{
	@ViewChild('selectComponent', { static: false })
	public selectComponent: NbSelectComponent = null;

	public renderType: 'table' | 'column' = 'table';

	public defaultValue: string = '';

	public question: DropDownQuestion = new DropDownQuestion({});

	public isEditable = true;

	protected settings: any = null;
	protected table: Table = null;
	protected projectID: string = '';

	protected mainSubscription: Subscription = new Subscription();

	public constructor(
		protected firebaseRelationService: FirebaseRelationService,
		protected projectService: ProjectsService,
		protected tablesService: TablesService,
	)
	{
		super();
	}

	public ngOnInit(): void
	{
		const editor: { data:any } = <any>(this.cell.getColumn().editor);
		this.renderType = editor.data.type;
		this.projectID = editor.data.projectID;
		this.settings = editor.data.settings;

		this.defaultValue = this.cell.getValue();

		const rowData = this.cell.getRow().getData();
		this.isEditable = this.firebaseRelationService.isEditable(rowData['table'], rowData['column'] );

		let options: Option<string>[] = [];

		switch(this.renderType)
		{
			case 'column':
				// for local settings
				if(this.settings)
				{
					for (const key of Object.keys(this.settings))
					{
						const columnType = this.settings[key].type;
						const isString = columnType === 'string' || columnType === 'html';
						options.push(
							new Option<string>({
								key: UtilsService.title(key), value: key,
								selected: false,
								// User is not able to select string to make a relation
								disabled: isString,
							}),
						);
					}
				}
				else
				{
					// load the other table
					this.table = this.tablesService.getTableByName(rowData['oTable']) ?? null;
				}

				// for the other table
				if(this.table)
				{
					this.mainSubscription.add(onTableChanged.subscribe((tableName) =>
					{
						if(tableName !== '' && this.selectComponent)
						{
							this.selectComponent.selectedChange.emit('');
							this.loadTable(tableName).then((newOptions) => this.question.options$.next(newOptions));
						}
					}));
					//  we already have the table
					options = this.loadOptions();
				}

				break;
			case 'table':
				const project = this.projectService.getProjectById(this.projectID);
				if(project)
				{
					let found = false;
					Object.keys(project.tables).forEach((tableID) =>
					{
						const table = this.tablesService.getTableById(tableID);
						if(table)
						{
							options.push(
								new Option<string>({
									key: UtilsService.title(table.metadata.title),
									value: table.metadata.title,
									selected: false,
								}),
							);
						}
						else
							options.push(
								new Option<string>({
									key: UtilsService.title(project.tables[tableID].name),
									value: project.tables[tableID].name,
									selected: false,
								}),
							);

						console.log()

						if (!found && (
							table && table.metadata.title === this.cell.getValue() || project.tables[tableID].name === this.cell.getValue())
						) {
							found = true;
						}
					});
				}
				break;
		}

		this.question.options$.next(options);

	}

	public ngOnDestroy(): void
	{
		this.mainSubscription.unsubscribe();
	}

	public onChange(event: string)
	{
		this.cell.setValue(event);
		if(this.renderType === 'table')
			onTableChanged.next(event);
	}

	public loadTable(event: string = ''): Promise<Option<string>[]>
	{
		if(event !== '')
			this.table = this.tablesService.getTableByName(event);

		if(this.table && this.table.length !== 0)
		{
			return Promise.resolve(this.loadOptions());
		}
		else
		{
			let promise:  Promise<Option<string>[]>;
			console.log(this.projectID);
			const project = this.projectService.getProjectById(this.projectID);
			console.log(project);
			if(project)
			{
				const key = Object.keys(project.tables).find((tableID) => project.tables[tableID].name === event);
				console.log(key);
				if(key)
				{
					promise = this.tablesService.addIfNotExists(key)
						.then((value) => {
							if (value instanceof Table) {
								this.table = value;
							}
							console.log(this.table);
							return this.loadOptions();
						});

					console.log(promise);
					return promise;
				}
			}
		}
	}

	protected loadOptions(): Option<string>[]
	{
		const options: Option<string>[] = [];

		const columns = {};
		this.table.forEach((snapshot: ProxyObject) =>
		{
			for (const k of Object.keys(snapshot))
			{
				const key: string = trim(k);

				// We only need this information once
				if (!columns.hasOwnProperty(key.toString()))
				{
					const titleName = UtilsService.title(key.toString());

					columns[key] = { title: titleName };

					options.push(
						new Option<string>({ key: titleName, value: key, selected: false }),
					);
				}
			}
		});

		const entry: RelationPair = this.firebaseRelationService.getData().get(this.table.metadata.title);

		// if we found an entry link it
		if (entry)
		{
			this.question.options$.getValue().forEach((option: Option<string>) =>
			{
				// if we found the relation
				const pair: StringPair = entry.get(option.value);
				if (pair && pair.key === this.table.metadata.title)
				{
					for(let i = 0; i < options.length; ++i)
					{
						// if the option already contains a relation --> mark it
						if(options[i].value === option.value)
						{
							let titleName = options[i].key.toString() + ' --- Exists Already';
							titleName = titleName.replace(/([A-Z])/g, ' $1').trim();
							titleName = titleName.charAt(0).toUpperCase() + titleName.substr(1);

							options[i].key = titleName;
							options[i].disabled = true;
							options[i].value = titleName;
						}
					}
				}
			});
		}

		return options;
	}
}
