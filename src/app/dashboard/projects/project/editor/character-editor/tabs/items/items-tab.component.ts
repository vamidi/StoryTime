import { Component, OnInit, ViewChild } from '@angular/core';
import { BaseTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import {
	NbDialogService,
	NbMenuService,
	NbThemeService,
	NbToastrService,
} from '@nebular/theme';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { TablesService } from '@app-core/data/state/tables';
import {
	CheckboxFieldComponent,
	DropDownFieldComponent,
	DynamicFormComponent,
	TextFieldComponent,
} from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { IItem } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';
import { KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';

@Component({
	selector: 'ngx-items-tab',
	templateUrl: 'items-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class ItemsTabComponent extends BaseTabComponent implements OnInit
{
	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('itemNameField', { static: true})
	public itemNameField: TextFieldComponent = null;

	@ViewChild('itemDescriptionField', { static: true})
	public itemDescriptionField: TextFieldComponent = null;

	/** */

	@ViewChild('itemTypeField', { static: true})
	public itemTypeField: DropDownFieldComponent = null;

	@ViewChild('itemCostField', { static: true})
	public itemCostField: TextFieldComponent = null;

	@ViewChild('itemConsumableField', { static: true})
	public itemConsumableField: CheckboxFieldComponent = null;

	@ViewChild('itemSellableField', { static: true})
	public itemSellableField: CheckboxFieldComponent = null;

	@ViewChild('scopeField', { static: true})
	public scopeField: DropDownFieldComponent = null;

	@ViewChild('occasionField', { static: true})
	public occasionField: DropDownFieldComponent = null;

	/** */
	@ViewChild('speedField', { static: true})
	public speedField: TextFieldComponent = null;

	@ViewChild('successRateField', { static: true})
	public successRateField: TextFieldComponent = null;

	@ViewChild('repeatField', { static: true})
	public repeatField: DropDownFieldComponent = null;

	@ViewChild('magicCostGain', { static: true})
	public magicCostGain: TextFieldComponent = null;

	@ViewChild('hitTypeField', { static: true})
	public hitTypeField: DropDownFieldComponent = null;

	@ViewChild('animationField', { static: true})
	public animationField: DropDownFieldComponent = null;

	/** */
	@ViewChild('dmgTypeField', { static: true})
	public dmgTypeField: DropDownFieldComponent = null;

	@ViewChild('formulaField', { static: true})
	public formulaField: TextFieldComponent = null;

	@ViewChild('varianceField', { static: true})
	public varianceField: TextFieldComponent = null;

	@ViewChild('critField', { static: true})
	public critField: DropDownFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Skill Settings',
		alias: 'skill-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

	public selectedItem: IItem = null;

	constructor(
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
	)
	{
		super(route, firebaseService, userService, projectsService, router, toastrService, snackbarService, dialogService,
			userPreferencesService, tableService, firebaseRelationService, languageService, '-MCRBgLCXWHR-OlRa0Sc');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.mainSubscription.add(this.project$.subscribe((project: Project) =>
		{
			if(project)
			{
				// this.tableService.loadTablesFromProject(project, ['parametercurves', 'skills'], (table) => this.loadTable(table))
				// 	.then();

				// Important or data will not be caught.
				this.getTableData(this.settings);
			}
		}));

		this.initForm();
	}

	public addMultiple()
	{
		super.addMultiple({
			context: {
				title: 'Add a new skill',
				tblName: 'skills',
				settings: this.settings,
			},
		});
	}

	protected override validate()
	{
		super.validate();

		this.itemNameField.setDisabledState(this.selectedItem === null);
		this.itemDescriptionField.setDisabledState(this.selectedItem === null);
		this.itemTypeField.setDisabledState(this.selectedItem === null);
		this.itemCostField.setDisabledState(this.selectedItem === null);
		this.itemConsumableField.setDisabledState(this.selectedItem === null);
		this.itemSellableField.setDisabledState(this.selectedItem === null);
		this.scopeField.setDisabledState(this.selectedItem === null);
		this.occasionField.setDisabledState(this.selectedItem === null);
		this.speedField.setDisabledState(this.selectedItem === null);
		this.successRateField.setDisabledState(this.selectedItem === null);
		this.repeatField.setDisabledState(this.selectedItem === null);
		this.magicCostGain.setDisabledState(this.selectedItem === null);
		this.hitTypeField.setDisabledState(this.selectedItem === null);
		this.animationField.setDisabledState(this.selectedItem === null);
		this.dmgTypeField.setDisabledState(this.selectedItem === null);
		this.formulaField.setDisabledState(this.selectedItem === null);
		this.varianceField.setDisabledState(this.selectedItem === null);
		this.critField.setDisabledState(this.selectedItem === null);
	}


	public onItemSelected(event: any)
	{
		this.selectedItem = null;
		// this.classCurves = [];
		// this.classConfigs = [];
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedItem = UtilsService.copyObj(this.table.find(event)) as IItem;
			if(this.selectedItem)
			{
				// effectPrimaryValue: number,
				// effectTypeId: number,

				this.itemNameField.setValue = this.selectedItem.name['en'];
				this.itemDescriptionField.setValue = this.selectedItem.description['en'];
				this.itemTypeField.setValue = this.selectedItem.typeId;
				this.itemSellableField.setValue = this.selectedItem.sellable;
				this.itemCostField.setValue = this.selectedItem.sellValue;
				// this.skillTechnicalCostField.setValue = this.selectedSkill.expCurve;
				this.scopeField.setValue = this.selectedItem.scope;
				this.occasionField.setValue = this.selectedItem.occasion;
				this.speedField.setValue = this.selectedItem.speed;
				this.successRateField.setValue = this.selectedItem.successRate;
				this.repeatField.setValue = this.selectedItem.repaet;
				// this.magicCostGain.setValue = this.selectedSkill.expCurve;
				// this.hitTypeField.setValue = this.selectedSkill.hitType;
				// this.animationField.setValue = this.selectedSkill.expCurve;
				this.dmgTypeField.setValue = this.selectedItem.dmgType;
				this.formulaField.setValue = this.selectedItem.formula;
				this.varianceField.setValue = this.selectedItem.variance;
				this.critField.setValue = this.selectedItem.critical;

				// second parameter specifying whether to perform 'AND' or 'OR' search
				// (meaning all columns should contain search query or at least one)
				// 'AND' by default, so changing to 'OR' by setting false here
				this.validate();
			}
		} else this.validate();
	}

	public onSendForm()
	{

	}

	protected initForm()
	{
		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.itemNameField, {
			controlType: 'textbox',
			value: '',
			name: 'item-name',
			text: 'Item name',
			placeholder: 'Item name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.itemDescriptionField, {
			controlType: 'textbox',
			value: '',
			name: 'description',
			text: 'Item description',
			placeholder: 'Item description',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.itemTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'item-type',
			text: 'Item Type',
			placeholder: 'Item type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.itemCostField, {
			controlType: 'textbox',
			value: '',
			name: 'item-cost',
			text: 'Item cost',
			placeholder: 'Item cost',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<boolean>(this.itemConsumableField, {
			controlType: 'checkbox',
			value: false,
			name: 'item-consumable',
			text: 'Consumable',
			placeholder: 'Consumable',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<boolean>(this.itemSellableField, {
			controlType: 'checkbox',
			value: false,
			name: 'item-sellable',
			text: 'Sellable',
			placeholder: 'Sellable',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.scopeField, {
			controlType: 'dropdown',
			value: '',
			name: 'scope',
			text: 'Scope',
			placeholder: 'Scope',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.occasionField, {
			controlType: 'dropdown',
			value: '',
			name: 'occasion',
			text: 'Occasion',
			placeholder: 'Occasion',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.speedField, {
			controlType: 'textbox',
			value: '',
			name: 'speed',
			text: 'Speed',
			placeholder: 'Speed',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.successRateField, {
			controlType: 'textbox',
			value: '',
			name: 'success-rate',
			text: 'Success rate',
			placeholder: 'Success rate',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.repeatField, {
			controlType: 'dropdown',
			value: '',
			name: 'repeat',
			text: 'Repeat',
			placeholder: 'Repeat',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.magicCostGain, {
			controlType: 'textbox',
			value: '',
			name: 'magic-gain',
			text: 'Magic cost gain',
			placeholder: 'Magic cost gain',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.hitTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'hit-type',
			text: 'Hit Type',
			placeholder: 'Hit Type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.animationField, {
			controlType: 'dropdown',
			value: '',
			name: 'animation',
			text: 'Animation',
			placeholder: 'Animation',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.dmgTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'damage-type',
			text: 'Damage type',
			placeholder: 'Damage type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		/**
		 * @brief   - This information must come from the class. We load the class parameter curves and then the user can
		 * use the aliases.
		 * A stands for the user and B stand for the opponent.
		 * atk      - user attack - including equipments & buffs
		 * mat      - magical attack - including equipments & buffs.
		 * agi      - agility
		 * mhp      - Max HP
		 * hp       - Health points
		 * tp       - Technical points
		 * def      - Defense
		 * mdf      - M.Defense
		 * luk      - Luck
		 * mmp      - Max MP
		 * mp       - Magic points
		 * level    - current level
		 */
		this.formComponent.addInput<string>(this.formulaField, {
			controlType: 'textbox',
			value: '',
			name: 'formula',
			text: 'Formula',
			placeholder: 'Formula',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.varianceField, {
			controlType: 'textbox',
			value: '',
			name: 'variance',
			text: 'Variance',
			placeholder: 'Variance',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.critField, {
			controlType: 'dropdown',
			value: '',
			name: 'critical',
			text: 'Critical Hits',
			placeholder: 'Critical hits',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});
	}
}
