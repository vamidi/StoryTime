import { AfterViewInit, ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { NbDialogRef, NbDialogService, NbStepComponent, NbToastrService } from '@nebular/theme';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { Option } from '@app-core/data/forms/form-types';
import { ICharacter, ICraftable, IItem } from '@app-core/data/database/interfaces';
import { UtilsService } from '@app-core/utils';
import { Table, TablesService } from '@app-core/data/state/tables';
import { DropDownFieldComponent, DynamicFormComponent } from '@app-theme/components/form';
import { BehaviorSubject } from 'rxjs';
import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { createCharacter, createCraftable, createItem } from '@app-core/functions/helper.functions';
import { DataSourceColumnHandler } from '@app-core/data/data-source-column-handler';
import { BaseSettings, Column, ISettings } from '@app-core/mock/base-settings';
import { BaseFirebaseComponent } from '@app-core/components/firebase/base-firebase.component';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { InsertItemsDialogComponent } from '@app-theme/components/firebase-table/insert-items/insert-items-dialog.component';
import { ProxyObject, Relation, StringPair } from '@app-core/data/base';
import { TextColumnComponent, TextRenderComponent } from '@app-theme/components';
import { FormField } from '@app-core/mock/base-form-settings';
import { FilterCallback, FirebaseFilter, firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';

@Component({
	selector: ' ngx-insert-craftable',
	templateUrl: './insert-craftable.component.html',
	styles: [`
		nb-card {
			min-width: 500px;
		}
	`,
	],
})
export class InsertCraftableComponent extends BaseFirebaseComponent implements OnInit, AfterViewInit
{
	public get Ref(): NbDialogRef<InsertCraftableComponent> { return this.ref; }

	public set Characters(characters: Table<ICharacter>)
	{
		this.characters = characters;
		// if(this.characterList) this.characterList.question.options$.next(this.getCharacterOptions());
	}

	public set Craftables(craftables: Table<ICraftable>)
	{
		this.craftables = craftables;
	}

	@Input()
	public characters: Table<ICharacter> = null;

	@Input()
	public items: Table<IItem> = null;

	@Input()
	public craftables: Table<ICraftable> = null;

	@Input()
	public selectedLanguage: KeyLanguage = 'en';

	// region Craftable form
	/* ----------------- Craftable form ------------------------- */

	@ViewChild('craftFormComponent', { static: true })
	public craftFormComponent: DynamicFormComponent = null;

	public characterList: DropDownFieldComponent = null;

	@ViewChild('craftStepper', { static: true })
	public craftStepper: NbStepComponent = null;

	public craftHandler = new DataSourceColumnHandler(
		{
			title: 'Character Form',
			alias: 'character-form',
			requiredText: 'Fill in all fields',
			fields: {},
	});

	public craftSettings: ISettings = new BaseSettings();
	public itemSettings: ISettings = new BaseSettings();

	// endregion

	/* ------------------ Item form --------------------- */
	public itemSource = {
		title: 'Character Form',
		alias: 'character-form',
		requiredText: 'Fill in all fields',
		fields: {},
	}

	/* ----------------- Other ------------------------- */

	public title: string = 'New Craftable';
	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	private craftable: ICraftable = createCraftable();
	private item: IItem = createItem();
	private character: ICharacter = createCharacter();

	constructor(
		protected ref: NbDialogRef<InsertCraftableComponent>,
		protected toastrService: NbToastrService,
		protected dialogService: NbDialogService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected languageService: LanguageService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected cd: ChangeDetectorRef)
	{
		super(
			firebaseService, firebaseRelationService, toastrService, projectService, tableService,
			userService, userPreferencesService, languageService,
		);
	}

	public ngOnInit(): void
	{
		this.craftFormComponent.showLabels = true;
		this.initCraftForm();
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public dismiss()
	{
		// TODO first create the story and pass it to the node editor
		// TODO create local storage for auto save feature
		// TODO validate the story
		this.createCraftable().then(() => this.ref.close(this.craftable));
	}

	/* ----------------- Item form ------------------------- */

	protected getItemOptions(): Option<number>[]
	{
		const options: Option<number>[] = [];
		this.items.filteredData.forEach((pObj) =>
		{
			options.push(
					new Option<number>({
						key: pObj.id + '. ' + UtilsService.truncate(pObj.name[this.selectedLanguage], 50),
						value: +pObj.id,
						selected: false,
			}))
		},
		);

		return options;
	}

	public cancelInsertItem()
	{
		// this.itemList.setDisabledState(false);
		this.craftFormComponent.questions['insert']?.setDisabledState(false);
	}

	/* ----------------- Craft form ------------------------- */

	public createCraftable(): Promise<void|boolean>
	{
		if (this.craftFormComponent.formContainer.isValid())
		{
			const formValue = this.craftFormComponent.Form.getRawValue();
			const keys = Object.keys(this.craftSettings.columns);
			keys.forEach((key) => {
				this.craftable[key] = formValue[key];
			});

			return this.tableService.insertData(this.craftables.id, this.craftable)
			.then((data) => {
					UtilsService.showToast(
						this.toastrService,
						'Item created!',
						'Craftable item has been successfully created',
					);

					if (data && typeof data === 'number') {
						this.craftable.id = data;
					}

					return Promise.resolve(true);
				},
			);
		}
	}

	public addItem()
	{
		// TODO validate?
		// this.itemList.setDisabledState(true);
		this.craftFormComponent.get('insert')?.setDisabledState(true);

		const ref = this.dialogService.open(InsertItemsDialogComponent, {
			context: {
				title: 'Add item to items',
				tblName: 'items',
				settings: this.itemSettings,
			},
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm(event));
		ref.onClose.subscribe(() => {
			this.cancelInsertItem();
			ref.componentRef.instance.insertEvent.unsubscribe()
		}).unsubscribe();
	}

	public onCreateConfirm(event: any)
	{
		super.onCreateConfirm(event);

		// Check the permissions as well as the data
		if (event.hasOwnProperty('newData') && this.userService.checkTablePermissions(this.tableService))
		{
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

			this.tableId = `tables/${this.items.id}`;
			// TODO resolve if data is wrong or if we also need to do something with the lastID
			this.tableService.insertData(this.tableId, obj)
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

		this.cancelInsertItem();
	}

	protected initCraftForm() {
		// make item settings for when we want to open the add item menu
		if (this.items && this.items.filteredData.length) {
			const newItemSettings = this.processTableData(this.items, true, this.itemSettings);
			this.itemSettings = Object.assign({}, newItemSettings);
		}

		const newSettings = this.processTableData(this.craftables, true, this.craftSettings);
		this.craftSettings = Object.assign({}, newSettings);
		this.craftHandler.initialize(this.craftSettings.columns,
			(key, column, index) => this.configureRelation(this.craftables, key, column, index));
		this.craftHandler.source.fields['insert'] = {
			...this.craftHandler.configureField<string>('insert', {
				title: 'Next',
				type: 'string',
				index: 99,
				defaultValue: 'Next',
				hidden: false,
			}, 'stepper', 'Next', 99),
			ghost: false,
		};
		this.craftHandler.createFields();

		const selectField = this.craftHandler.source.fields['childId'];
		selectField.enableLabelIcon = true;
		selectField.labelIcon = 'plus-outline';
		selectField.onSelectEvent = (event) => this.craftable.childId = event;
		selectField.onIconClickEvent = () => this.addItem();

		// this.craftFormComponent.init();

		this.craftStepper.stepControl = this.craftFormComponent.Form;
	}

	protected configureRelation(table: Table, key: string, column: Column, index: number): FormField<any>
	{
		let field: FormField<any>;
		if (key /* && Number(value) !== Number.MAX_SAFE_INTEGER */)
		{
			const relation: Relation = this.firebaseService.getRelation(table.metadata.title, key);

			if (relation)
			{
				field = this.craftHandler.configureField<number>(key, column, 'dropdown', Number.MAX_SAFE_INTEGER, index);
				field.options$ = new BehaviorSubject([]);

				this.craftHandler.source.fields[key] = field;

				// Set the dropdown to relation
				field.relationDropDown = true;

				const table$: Table = this.tableService.getTableById(relation.tblColumnRelation.key);

				if(table$)
				{
					this.onDataReceived(key, table$, relation, field);
				}

				return field;
			}
		}

		field = this.craftHandler.configureField<number>(key, column, 'number', Number.MAX_SAFE_INTEGER, index);
		return field;
	}

	protected processRelation(table: Table, pair: StringPair, key: string, newSettings: BaseSettings, overrideTbl: string = '')
	{
		super.processRelation(table, pair, key, newSettings, overrideTbl);

		if (pair)
		{
			let tbl = table.metadata.title;

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

			if(newPair.key === '') UtilsService.onError(`Relation not found! Trying to find table "${pair.key}" for column "${pair.value}"`);

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

	protected onDataReceived(key: string, snapshots: Table, relation: Relation, field: FormField<any>)
	{

		let selected: boolean = false;
		const item: FirebaseFilter<any> = firebaseFilterConfig.columnFilters.find((name) =>
			name.table === snapshots.metadata.title && name.columns.some((column: string) => column === key),
		);

		let filterFunc: FilterCallback<ProxyObject> = null;

		if(item)
		{
			filterFunc = item.filter;
		}

		snapshots.load([
			(d: ProxyObject) => !!+d.deleted === false,
			filterFunc,
		]).then(() => {
			const keyValue = /* this.data[key] ?? */ null;
			snapshots.forEach((snapshot) =>
			{
				const options = field.options$.getValue();

				if (!options.some((el) => el.id === snapshot.id ))
				{
					// We need to convert or else we cant compare
					const snapshotKey: number = Number(snapshot.id);

					let option: Option<number>;
					const relData: string | number | KeyLanguageObject = snapshot[relation.tblColumnRelation.value];
					if(typeof relData === 'string')
					{
						option = new Option<number>({
							id: snapshotKey,
							key: snapshotKey + '. ' + UtilsService.truncate(relData as string, 50),
							value: snapshotKey,
							selected: false,
						});
					}
					else if(typeof relData === 'object')
						option =
							this.handleLanguageValue({ prevSnapshotKey: snapshotKey, selected: selected }, relData as KeyLanguageObject);
					else if (!isNaN(Number(relData))) // if this is a number that we got
					{
						option = new Option<number>({
							id: snapshotKey,
							key: snapshotKey + '. ' + UtilsService.truncate(relData.toString(), 50),
							value: snapshotKey,
							selected: false,
						});
					}
					// 	this.handleDeeperRelation({ prevSnapshotKey: snapshotKey, selected: selected }, relation, relData);

					// Sort the options descending.
					options.sort((a, b) => Number(b.value) - Number(a.value));

					if(option.value === keyValue)
					{
						field.value = option.value;
						option.selected = selected = true;
					}

					options.push(option);
				}

				field.options$.next(options);
			});
		});
	}

	private handleLanguageValue({ prevSnapshotKey = -1, selected = false }, prevRelData: KeyLanguageObject)
	{
		const languages = Object.keys(prevRelData);
		// Are we dealing with a language object
		if (systemLanguages.has(languages[0] as KeyLanguage))
		{
			const newValue: string = prevRelData['en'];
			return new Option<number>({
				id: prevSnapshotKey,
				key: prevSnapshotKey + '. ' + UtilsService.truncate(newValue, 50),
				value: prevSnapshotKey,
				selected: selected,
			});
		}
	}
}
