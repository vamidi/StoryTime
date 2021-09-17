import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';

import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table';

import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { UserService } from '@app-core/data/state/users';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BaseTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-tab.component';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { ICharacter, ICharacterClass } from '@app-core/data/database/interfaces';
import { Relation, StringPair } from '@app-core/data/base';
import { UtilsService } from '@app-core/utils';
import {
	DropDownFieldComponent,
	DynamicFormComponent,
	TextColumnComponent,
	TextFieldComponent,
	TextRenderComponent,
} from '@app-theme/components';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { Option } from '@app-core/data/forms/form-types';

@Component({
	selector: 'ngx-character-tab',
	templateUrl: 'characters-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class CharactersTabComponent extends BaseTabComponent<ICharacter> implements OnInit
{
	@Input()
	public characterSettings: BaseSettings = null;

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('characterNameField', { static: true})
	public characterNameField: TextFieldComponent = null;

	@ViewChild('classField', { static: true})
	public classField: DropDownFieldComponent<number> = null;

	@ViewChild('initialLevelField', { static: true})
	public initialLevelField: TextFieldComponent<number> = null;

	@ViewChild('maxLevelField', { static: true})
	public maxLevelField: TextFieldComponent<number> = null;

	@ViewChild('descriptionField', { static: true})
	public descriptionField: TextFieldComponent = null;

	public traitSettings: ISettings = {
		mode: 'external',
		selectMode: '', // 'multi';
		noDataMessage: 'No items found', // default: -> 'No data found'
		actions: {
			add: true,
			edit: true,
			delete: true,
			position: 'right',
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
			type: {
				title: 'Type',
			},
			content: {
				title: 'Content',
			},
		},
	};

	public traitSource: LocalDataSource = new LocalDataSource();

	public source: BaseFormSettings = {
		title: 'Project Settings',
		alias: 'project-settings',
		requiredText: 'Settings',
		fields: {},
	};

	private characterClasses: Table<ICharacterClass> = null;

	/**
	 * @brief -
	*/
	constructor(
		public tablesService: TablesService,

		protected router: Router,
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected userService: UserService,

		protected projectsService: ProjectsService,

		protected dialogService: NbDialogService,

		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected languageService: LanguageService,
	)
	{
		super(route, firebaseService, userService, projectsService, router, toastrService, snackbarService, dialogService,
			userPreferencesService, tableService, firebaseRelationService, languageService, '-MhSKPfKb9XeqqYrW74q');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.characterNameField, {
			controlType: 'textbox',
			value: '',
			name: 'name',
			text: 'Name',
			placeholder: 'Name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		// Text box question
		this.formComponent.addInput<number>(this.classField, {
			controlType: 'dropdown',
			value: this.defaultValue,
			name: 'class',
			text: 'Class',
			placeholder: 'Class',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.initialLevelField, {
			controlType: 'number',
			value: 0,
			name: 'initial-level',
			text: 'Initial level',
			placeholder: 'Initial level',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.maxLevelField, {
			controlType: 'number',
			value: 0,
			name: 'max-level',
			text: 'Max level',
			placeholder: 'Max level',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.descriptionField, {
			controlType: 'textarea',
			value: '',
			name: 'description',
			text: 'Description',
			placeholder: 'Description',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		});

		this.mainSubscription.add(this.project$.subscribe((project) => {
			if(project)
				this.tablesService.loadTablesFromProject(project, ['classes'], (table) => this.loadTable(table))
					.then(() => {
						const options: Option<number>[] = [];
						this.characterClasses.forEach((charClass) => {
							options.push(new Option({
								key: this.languageService.getLanguageFromProperty(charClass.className, this.selectedLanguage),
								value: charClass.id,
								selected: false,
							}));
						});
						this.classField.question.options$.next(options);
					});

			// Important or data will not be caught.
			this.getTableData(this.settings);
		}));
	}

	protected loadTable(value: Table)
	{
		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'classes')
		{
			// store the dialogues.
			this.characterClasses = <Table<ICharacterClass>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tablesService.listenToTableData(this.characterClasses, ['child_added']),
			);
		}
	}

	public addMultiple()
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent, {
			context: {
				title: 'Add a new character',
				tblName: 'characters',
				settings: this.characterSettings,
			},
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) =>
			this.onCreateConfirm(event, this.characters.id));
	}

	public createEquipment(event: { source: LocalDataSource})
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent,
			{
				context: {
					title: 'Add a new equipment',
					tblName: 'equipments',
					settings: this.settings,
				},
			});

		const instance = ref.componentRef.instance;
		instance.insertEvent.subscribe(($event: any) => this.onCreateConfirm($event, this.table.id));
		instance.closeEvent.subscribe(() => ref.close());
		ref.componentRef.onDestroy(() => {
			instance.insertEvent.unsubscribe();
			instance.closeEvent.unsubscribe();
		});
	}

	public createTrait(event: { source: LocalDataSource})
	{
		/*
		const ref = this.dialogService.open(InsertTraitComponent,
			{
				context: {
					behaviourType$: this.behaviourSubject,
					behaviourType: this.behaviourType,
					project: this.project,
					items: this.items,
					itemTypes: this.itemTypes,
				},
			});

		const instance = ref.componentRef.instance;
		instance.saveEvent.subscribe(($event: any) => {});
		instance.closeEvent.subscribe(() => ref.close());
		ref.componentRef.onDestroy(() => {
			instance.saveEvent.unsubscribe();
			instance.closeEvent.unsubscribe();
		});
		 */
	}

	public onCreate(event: { source: LocalDataSource })
	{

	}

	public onColumnOrderChange(event)
	{

	}

	public onActiveSelection(event: number)
	{
		super.onActiveSelection(event);

		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedObject = { ...this.characters.find(event) } as ICharacter;
			if(this.selectedObject)
			{
				this.characterNameField.setValue =
					this.languageService.getLanguageFromProperty(this.selectedObject.name, this.selectedLanguage);

				this.classField.setValue = this.selectedObject.classId;
				this.initialLevelField.setValue = this.selectedObject.initialLevel;
				this.maxLevelField.setValue = this.selectedObject.maxLevel;
				this.descriptionField.setValue =
					this.languageService.getLanguageFromProperty(this.selectedObject.description, this.selectedLanguage);

				// second parameter specifying whether to perform 'AND' or 'OR' search
				// (meaning all columns should contain search query or at least one)
				// 'AND' by default, so changing to 'OR' by setting false here
				this.validate();
			}
		} else this.validate();

		this.getSource.setFilter([
			// fields we want to include in the search
			{
				field: 'characterId',
				search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
			},
		], false);
	}

	public onEditConfirmed(event: any)
	{
		event.stopPropagation();
		console.log('editing');
	}

	public onDeletedConfirmed(event: any)
	{
		event.stopPropagation();
		console.log('deleting');
	}

	protected override validate()
	{
		super.validate();

		this.characterNameField.setDisabledState(this.selectedObject === null);
		this.classField.setDisabledState(this.selectedObject === null);
		this.initialLevelField.setDisabledState(this.selectedObject === null);
		this.maxLevelField.setDisabledState(this.selectedObject === null);
		this.descriptionField.setDisabledState(this.selectedObject === null);
	}

	protected process(table: Table, pair: StringPair, key: string, settings: ISettings = null)
	{
		const newSettings: ISettings = { ...settings };
		if (pair)
		{
			if(pair.key === '')
				UtilsService.onError(`Relation not found! Trying to find table "${pair.key}" for column "${pair.value}"`);

			const rel = new Relation(
				table.id, this.firebaseService, this.firebaseRelationService, this.tablesService, pair,
			);
			this.firebaseService.pushRelation(table.title, key, rel);

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
					tblName: table.title, relationTable: pair.key, projectID: table.projectID, tableID: table.id,
				},
				config: { /* data: { relation: rel }, */ },
			}
		}

		return newSettings;
	}

	public onSendForm()
	{
		if(this.formComponent.isValid)
		{
			const dbCharacter: ICharacter = this.characters.find(this.selectedObject.id);
			const event = {
				data: dbCharacter,
				newData: null,
				confirm: {
					resolve: () => {
						this.characters.update(dbCharacter, this.selectedObject).then();
						return true;
					},
					reject: (): boolean => true,
				},
			};

			// set the name
			this.selectedObject.name[this.selectedLanguage] = this.characterNameField.getValue as string;
			// set the class id
			this.selectedObject.class = this.classField.getValue;
			// set the initial level the player starts with
			this.selectedObject.initialLevel = this.initialLevelField.getValue;
			// set the max level the player can reach
			this.selectedObject.maxLevel = this.maxLevelField.getValue;
			// set the description
			this.selectedObject.description[this.selectedLanguage] = this.descriptionField.getValue as string;

			event.newData = this.selectedObject;
			this.onEditConfirm(event,true, this.characters.id);
		}
	}

	protected override onDataReceived(tableData: Table)
	{
		// Filter is being reset, that is why this function exist.
		super.onDataReceived(tableData);

		if(
			tableData.hasOwnProperty('data') && Object.values(tableData.data).length !== 0
		) {
			this.getSource.setFilter([
				// fields we want to include in the search
				{
					field: 'characterId',
					search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
				},
			], false);
		}
	}
}
