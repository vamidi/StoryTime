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
import { DropDownFieldComponent, DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { ICharacterClass, ISkill } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';

@Component({
	selector: 'ngx-skills-tab',
	templateUrl: 'skills-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class SkillsTabComponent extends BaseTabComponent implements OnInit
{
	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('skillNameField', { static: true})
	public skillNameField: TextFieldComponent = null;

	@ViewChild('skillDescriptionField', { static: true})
	public skillDescriptionField: TextFieldComponent = null;

	/** */

	@ViewChild('skillTypeField', { static: true})
	public skillTypeField: DropDownFieldComponent = null;

	@ViewChild('skillMagicCostField', { static: true})
	public skillMagicCostField: TextFieldComponent = null;

	@ViewChild('skillTechnicalCostField', { static: true})
	public skillTechnicalCostField: TextFieldComponent = null;

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

	public selectedSkill: ISkill = null;

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
				userPreferencesService, tableService, firebaseRelationService, languageService, '-MhYQ7zqYvJ1lD6I-aSI');
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

		this.skillNameField.setDisabledState(this.selectedSkill === null);
		this.skillDescriptionField.setDisabledState(this.selectedSkill === null);
		this.skillTypeField.setDisabledState(this.selectedSkill === null);
		this.skillMagicCostField.setDisabledState(this.selectedSkill === null);
		this.skillTechnicalCostField.setDisabledState(this.selectedSkill === null);
		this.scopeField.setDisabledState(this.selectedSkill === null);
		this.occasionField.setDisabledState(this.selectedSkill === null);
		this.speedField.setDisabledState(this.selectedSkill === null);
		this.successRateField.setDisabledState(this.selectedSkill === null);
		this.repeatField.setDisabledState(this.selectedSkill === null);
		this.magicCostGain.setDisabledState(this.selectedSkill === null);
		this.hitTypeField.setDisabledState(this.selectedSkill === null);
		this.animationField.setDisabledState(this.selectedSkill === null);
		this.dmgTypeField.setDisabledState(this.selectedSkill === null);
		this.formulaField.setDisabledState(this.selectedSkill === null);
		this.varianceField.setDisabledState(this.selectedSkill === null);
		this.critField.setDisabledState(this.selectedSkill === null);
	}


	public onSkillSelected(event: any)
	{
		this.selectedSkill = null;
		// this.classCurves = [];
		// this.classConfigs = [];
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedSkill = UtilsService.copyObj(this.table.find(event)) as ISkill;
			if(this.selectedSkill)
			{
				this.skillNameField.setValue = this.selectedSkill.skillName['en'];
				this.skillDescriptionField.setValue = this.selectedSkill.description['en'];
				this.skillTypeField.setValue = this.selectedSkill.skillType;
				// this.skillMagicCostField.setValue = this.selectedSkill.expCurve;
				// this.skillTechnicalCostField.setValue = this.selectedSkill.expCurve;
				this.scopeField.setValue = this.selectedSkill.scope;
				this.occasionField.setValue = this.selectedSkill.occasion;
				this.speedField.setValue = this.selectedSkill.speed;
				this.successRateField.setValue = this.selectedSkill.successRate;
				this.repeatField.setValue = this.selectedSkill.repaet;
				// this.magicCostGain.setValue = this.selectedSkill.expCurve;
				// this.hitTypeField.setValue = this.selectedSkill.hitType;
				// this.animationField.setValue = this.selectedSkill.expCurve;
				this.dmgTypeField.setValue = this.selectedSkill.dmgType;
				this.formulaField.setValue = this.selectedSkill.formula;
				this.varianceField.setValue = this.selectedSkill.variance;
				this.critField.setValue = this.selectedSkill.critical;

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
		this.formComponent.addInput<string>(this.skillNameField, {
			controlType: 'textbox',
			value: '',
			name: 'skill-name',
			text: 'Skill name',
			placeholder: 'Skill name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.skillDescriptionField, {
			controlType: 'textbox',
			value: '',
			name: 'description',
			text: 'Skill description',
			placeholder: 'Skill description',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.skillTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'skill-type',
			text: 'Skill Type',
			placeholder: 'Skill Type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.skillMagicCostField, {
			controlType: 'textbox',
			value: '',
			name: 'skill-mp-cost',
			text: 'Skill Magic cost',
			placeholder: 'Skill Magic Cost',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.skillTechnicalCostField, {
			controlType: 'textbox',
			value: '',
			name: 'skill-tp-cost',
			text: 'Skill technical points cost',
			placeholder: 'Skill technical points cost',
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
