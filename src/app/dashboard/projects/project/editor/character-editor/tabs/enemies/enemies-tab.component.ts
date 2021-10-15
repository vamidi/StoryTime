import { Component, OnInit, ViewChild } from '@angular/core';

import { BaseParameterTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-stat-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { NbDialogService, NbMenuService, NbThemeService, NbToastrService } from '@nebular/theme';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import {
	IEnemy, IEnemyActionPattern,
	IEnemyCategory, IEnemyParameterCurve,
	IItemDrop,
} from '@app-core/data/database/interfaces';
import { DropDownFieldComponent, DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { Option } from '@app-core/data/forms/form-types';
import { UtilsService } from '@app-core/utils';

@Component({
	selector: 'ngx-enemies-tab',
	templateUrl: 'enemies-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class EnemiesTabComponent extends BaseParameterTabComponent<IEnemy> implements OnInit
{
	@ViewChild('itemSmartTableComponent', { static: false })
	public itemSmartTableComponent: any = null;

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('enemyNameField', { static: true })
	public enemyNameField: TextFieldComponent<string> = null;

	@ViewChild('enemyCategoryField', { static: true})
	public enemyCategoryField: DropDownFieldComponent<number> = null;

	@ViewChild('expRewardField', { static: true })
	public expRewardField: TextFieldComponent<number> = null;

	@ViewChild('moneyRewardField', { static: true })
	public moneyRewardField: TextFieldComponent<number> = null;

	public source: BaseFormSettings = {
		title: 'Enemy Settings',
		alias: 'enemy-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

	public actionSettings: ISettings = new BaseSettings();
	public enemyActionPatterns: Table<IEnemyActionPattern> = new Table();

	public itemDropsSettings: ISettings = new BaseSettings();
	public itemDrops: Table<IItemDrop> = new Table();

	private enemyCategories: Table<IEnemyCategory> = null;

	public constructor(
		protected router: Router,
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected userService: UserService,
		protected projectsService: ProjectsService,
		protected themeService: NbThemeService,
		protected menuService: NbMenuService,

		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected languageService: LanguageService,
	) {
		super(route, firebaseService, userService, projectsService, router, toastrService, snackbarService, dialogService,
			userPreferencesService, tableService, firebaseRelationService, languageService, themeService, '-MTtv20-DUBlnoyImVZu',
		);

		this.includedTables.push('enemycategories', 'enemyactionpatterns', 'itemdrops');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.enemyNameField, {
			controlType: 'textbox',
			value: '',
			name: 'enemy-name',
			text: 'Enemy name',
			placeholder: 'Enemy name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.enemyCategoryField, {
			controlType: 'dropdown',
			value: '',
			name: 'enemy-category',
			text: 'Enemy category',
			placeholder: 'Enemy category',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.expRewardField, {
			controlType: 'number',
			value: '',
			name: 'exp',
			text: 'EXP',
			placeholder: 'EXP',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.moneyRewardField, {
			controlType: 'number',
			value: '',
			name: 'money',
			text: 'Money reward',
			placeholder: 'Money reward',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});
	}

	public onActiveSelection(event: number)
	{
		super.onActiveSelection(event);

		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedObject = UtilsService.copyObj(this.table.find(event)) as IEnemy;
			if(this.selectedObject)
			{
				this.enemyNameField.setValue =
					this.languageService.getLanguageFromProperty(this.selectedObject.name, this.selectedLanguage);
				this.enemyCategoryField.setValue = this.selectedObject.category;
				this.expRewardField.setValue = this.selectedObject.exp ?? 0;
				this.moneyRewardField.setValue = this.selectedObject.money ?? 0;

				// second parameter specifying whether to perform 'AND' or 'OR' search
				// (meaning all columns should contain search query or at least one)
				// 'AND' by default, so changing to 'OR' by setting false here
				this.configureStats();
				this.validate();
			}
		} else this.validate();

		this.enemyActionPatterns.getSource.setFilter([
			// fields we want to include in the search
			{
				field: 'enemyId',
				search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
			},
		], false);

		this.itemDrops.getSource.setFilter([
			// fields we want to include in the search
			{
				field: 'enemyId',
				search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
			},
		], false);
	}

	protected override validate()
	{
		super.validate();

		this.enemyNameField.setDisabledState(this.selectedObject === null);
		this.enemyCategoryField.setDisabledState(this.selectedObject === null);
		this.expRewardField.setDisabledState(this.selectedObject === null);
		this.moneyRewardField.setDisabledState(this.selectedObject === null);
	}

	public onSendForm()
	{
		if(this.formComponent.isValid)
		{
			const dbClass = this.table.find(this.selectedObject.id);
			const event = {
				data: dbClass,
				newData: null,
				confirm: {
					resolve: () => {
						this.table.update(dbClass, this.selectedObject).then();
						return true;
					},
					reject: (): boolean => true,
				},
			};

			this.selectedObject.name[this.selectedLanguage] = this.enemyNameField.getValue;
			this.selectedObject.category = this.enemyCategoryField.getValue;
			this.selectedObject.exp = this.expRewardField.getValue;
			this.selectedObject.moneyRewardField = this.moneyRewardField.getValue;

			event.newData = this.selectedObject;
			this.onEditConfirm(event,true);
		}
	}

	public insertStat()
	{
		super.insertStat({
			enemyId: this.selectedObject ? this.selectedObject.id : Number.MAX_SAFE_INTEGER,
		});
	}

	protected loadTable(value: Table)
	{
		super.loadTable(value);

		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'enemycategories')
		{
			this.enemyCategories = <Table<IEnemyCategory>>value;

			const options: Option<number>[] = [];
			this.enemyCategories.forEach((enemyCategory) => {
				options.push(new Option({
					key: this.languageService.getLanguageFromProperty(enemyCategory.name, this.selectedLanguage),
					value: enemyCategory.id,
					selected: false,
				}));
			});
			this.enemyCategoryField.question.options$.next(options);

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.enemyCategories, ['child_added']),
			);
		}

		if(value.metadata.title.toLowerCase() === 'enemyactionpatterns')
		{
			this.enemyActionPatterns = <Table<IEnemyActionPattern>>value;

			this.enemyActionPatterns.getSource.setFilter([
				// fields we want to include in the search
				{
					field: 'enemyId',
					search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
				},
			], false);

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.enemyActionPatterns, ['child_added']),
			);

			// this.itemDropsSettings.actions.add = true;
			const newItemSettings = this.processTableData(
				this.enemyActionPatterns, true, this.actionSettings,
			);
			this.actionSettings = Object.assign({}, newItemSettings);
			this.validateSettings(this.actionSettings, true);

			if(this.itemSmartTableComponent)
				this.itemSmartTableComponent.initGrid();
		}

		if(value.metadata.title.toLowerCase() === 'itemdrops')
		{
			this.itemDrops = <Table<IItemDrop>>value;

			this.itemDrops.getSource.setFilter([
				// fields we want to include in the search
				{
					field: 'enemyId',
					search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
				},
			], false);

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.itemDrops, ['child_added']),
			);

			this.itemDropsSettings.actions.add = true;
			const newItemSettings = this.processTableData(
				this.itemDrops, true, this.itemDropsSettings,
			);
			this.itemDropsSettings = Object.assign({}, newItemSettings);
			this.validateSettings(this.itemDropsSettings, true);

			if(this.itemSmartTableComponent)
				this.itemSmartTableComponent.initGrid();
		}
	}

	protected validateStat(stat: IEnemyParameterCurve): boolean {
		return stat.enemyId !== Number.MAX_SAFE_INTEGER && stat.enemyId === this.selectedObject.id;
	}
}
