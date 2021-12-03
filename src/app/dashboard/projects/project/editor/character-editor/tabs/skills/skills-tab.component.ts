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
import { Table, TablesService } from '@app-core/data/state/tables';
import { DropDownFieldComponent, DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import {
	DmgType,
	IAttribute,
	ISkill,
} from '@app-core/data/database/interfaces';
import { UtilsService } from '@app-core/utils';
import { Option } from '@app-core/data/forms/form-types';
import { BehaviorSubject } from 'rxjs';

@Component({
	selector: 'ngx-skills-tab',
	templateUrl: 'skills-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class SkillsTabComponent extends BaseTabComponent<ISkill> implements OnInit
{
	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('skillNameField', { static: true})
	public skillNameField: TextFieldComponent<string> = null;

	@ViewChild('skillDescriptionField', { static: true})
	public skillDescriptionField: TextFieldComponent<string> = null;

	@ViewChild('skillNoteField', { static: true})
	public skillNoteField: TextFieldComponent<string> = null;

	/** */

	@ViewChild('skillTypeField', { static: true})
	public skillTypeField: DropDownFieldComponent<number> = null;

	@ViewChild('skillMagicField', { static: true})
	public skillMagicField: DropDownFieldComponent<number> = null;

	@ViewChild('skillMagicCostField', { static: true})
	public skillMagicCostField: TextFieldComponent<number> = null;

	@ViewChild('scopeField', { static: true})
	public scopeField: DropDownFieldComponent = null;

	@ViewChild('occasionField', { static: true})
	public occasionField: DropDownFieldComponent<number> = null;

	/** */
	@ViewChild('speedField', { static: true})
	public speedField: TextFieldComponent<number> = null;

	@ViewChild('successRateField', { static: true})
	public successRateField: TextFieldComponent<number> = null;

	@ViewChild('repeatField', { static: true})
	public repeatField: TextFieldComponent<number> = null;

	@ViewChild('magicCostGain', { static: true})
	public magicCostGain: TextFieldComponent<number> = null;

	@ViewChild('hitTypeField', { static: true})
	public hitTypeField: DropDownFieldComponent<string> = null;

	@ViewChild('animationField', { static: true})
	public animationField: DropDownFieldComponent<string> = null;

	/** */

	@ViewChild('dmgParameterField', { static: true})
	public dmgParameterField: DropDownFieldComponent<number> = null;

	@ViewChild('dmgTypeField', { static: true})
	public dmgTypeField: DropDownFieldComponent<number> = null;

	@ViewChild('formulaField', { static: true})
	public formulaField: TextFieldComponent<string> = null;

	@ViewChild('varianceField', { static: true})
	public varianceField: TextFieldComponent<number> = null;

	@ViewChild('critField', { static: true})
	public critField: DropDownFieldComponent<boolean> = null;

	public source: BaseFormSettings = {
		title: 'Skill Settings',
		alias: 'skill-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

	protected attributes: Table<IAttribute> = null;

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
				this.tableService.loadTablesFromProject(project, ['attributes'], (table) => this.loadTable(table))
					.then()
					.finally(() => {

					});

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

	protected loadTable(value: Table)
	{
		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'attributes')
		{
			this.attributes = <Table<IAttribute>>value;

			const options: Option<number>[] = [];
			this.attributes.forEach((attribute) => {
				options.push(new Option({
					key: this.languageService.getLanguageFromProperty(attribute.paramName, this.selectedLanguage),
					value: attribute.id,
					selected: false,
				}));
			});
			this.skillMagicField.question.options$.next(options);
			this.dmgParameterField.question.options$.next(options);

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.attributes, ['child_added']),
			);
		}
	}

	protected override validate()
	{
		super.validate();

		this.skillNameField.setDisabledState(this.selectedObject === null);
		this.skillDescriptionField.setDisabledState(this.selectedObject === null);
		this.skillNoteField.setDisabledState(this.selectedObject === null);
		this.skillTypeField.setDisabledState(this.selectedObject === null);
		this.skillMagicField.setDisabledState(this.selectedObject === null);
		this.skillMagicCostField.setDisabledState(this.selectedObject === null);
		this.scopeField.setDisabledState(this.selectedObject === null);
		this.occasionField.setDisabledState(this.selectedObject === null);
		this.speedField.setDisabledState(this.selectedObject === null);
		this.successRateField.setDisabledState(this.selectedObject === null);
		this.repeatField.setDisabledState(this.selectedObject === null);
		this.magicCostGain.setDisabledState(this.selectedObject === null);
		this.hitTypeField.setDisabledState(this.selectedObject === null);
		this.animationField.setDisabledState(this.selectedObject === null);
		this.dmgParameterField.setDisabledState(this.selectedObject === null);
		this.dmgTypeField.setDisabledState(this.selectedObject === null);
		this.formulaField.setDisabledState(this.selectedObject === null);
		this.varianceField.setDisabledState(this.selectedObject === null);
		this.critField.setDisabledState(this.selectedObject === null);
	}


	public onActiveSelection(event: number)
	{
		super.onActiveSelection(event);

		// this.classCurves = [];
		// this.classConfigs = [];
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedObject = UtilsService.copyObj(this.table.find(event)) as ISkill;
			if(this.selectedObject)
			{
				this.skillNameField.setValue =
					this.languageService.getLanguageFromProperty(this.selectedObject.name, this.selectedLanguage);

				this.skillDescriptionField.setValue =
					this.languageService.getLanguageFromProperty(this.selectedObject.description, this.selectedLanguage);

				this.skillNoteField.setValue =
					this.languageService.getLanguageFromProperty(this.selectedObject.note, this.selectedLanguage);

				this.skillTypeField.setValue = this.selectedObject.skillType;
				this.skillMagicField.setValue = this.selectedObject.magicCurve;
				this.skillMagicCostField.setValue = this.selectedObject.magicCost;
				this.scopeField.setValue = this.selectedObject.scope;
				this.occasionField.setValue = this.selectedObject.occasion;
				this.speedField.setValue = this.selectedObject.speed;
				this.successRateField.setValue = this.selectedObject.successRate;
				this.repeatField.setValue = this.selectedObject.repeat;
				this.dmgParameterField.setValue = this.selectedObject.dmgParameter;
				this.dmgTypeField.setValue = this.selectedObject.dmgType;
				this.formulaField.setValue = this.selectedObject.formula;
				this.varianceField.setValue = this.selectedObject.variance;
				this.critField.setValue = this.selectedObject.critical;
				// this.magicCostGain.setValue = this.selectedObject.expCurve;
				// this.hitTypeField.setValue = this.selectedObject.hitType;
				// this.animationField.setValue = this.selectedObject.expCurve;

				// second parameter specifying whether to perform 'AND' or 'OR' search
				// (meaning all columns should contain search query or at least one)
				// 'AND' by default, so changing to 'OR' by setting false here
				this.validate();
			}
		} else this.validate();
	}

	public onSendForm()
	{
		if(this.formComponent.isValid)
		{
			const dbClass = this.table.find(this.selectedObject.id) as ISkill;
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

			this.selectedObject.name[this.selectedLanguage] = this.skillNameField.getValue;
			this.selectedObject.description[this.selectedLanguage] = this.skillDescriptionField.getValue;
			this.selectedObject.magicCurve = this.skillMagicField.getValue;
			this.selectedObject.magicCost = this.skillMagicCostField.getValue;
			// this.selectedObject.scope = this.scopeField.getValue;
			// this.selectedObject.occasion = this.occasionField.getValue;
			this.selectedObject.speed = this.speedField.getValue;
			this.selectedObject.successRate = this.successRateField.getValue;
			this.selectedObject.repeat = this.repeatField.getValue;
			this.selectedObject.dmgParameter = this.dmgParameterField.getValue;
			this.selectedObject.dmgType = this.dmgTypeField.getValue;
			this.selectedObject.formula = this.formulaField.getValue;
			this.selectedObject.variance = this.varianceField.getValue;
			this.selectedObject.critical = this.critField.getValue;

			event.newData = this.selectedObject;
			this.onEditConfirm(event,true);
		}
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
			required: false,
			disabled: true,
		});

		this.formComponent.addInput(this.skillNoteField, {
			controlType: 'textarea',
			value: '',
			name: 'note',
			text: 'Note',
			placeholder: 'Note',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		})

		this.formComponent.addInput<string>(this.skillTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'skill-type',
			text: 'Skill Type',
			placeholder: 'Skill Type',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.skillMagicField, {
			controlType: 'dropdown',
			value: Number.MAX_SAFE_INTEGER,
			name: 'skill-mp-cost',
			text: 'Parameter alias',
			placeholder: 'Select an alias that represents the magic cost',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.skillMagicCostField, {
			controlType: 'number',
			value: '',
			name: 'skill-tp-cost',
			text: 'Skill magic points cost',
			placeholder: 'Skill magic points cost',
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
			required: false,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.occasionField, {
			controlType: 'dropdown',
			value: '',
			name: 'occasion',
			text: 'Occasion',
			placeholder: 'Occasion',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.speedField, {
			controlType: 'number',
			value: 0,
			name: 'speed',
			text: 'Speed',
			placeholder: 'Speed',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.successRateField, {
			controlType: 'number',
			value: 0,
			name: 'success-rate',
			text: 'Success rate',
			placeholder: 'Success rate',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.repeatField, {
			controlType: 'number',
			value: 0,
			name: 'repeat',
			text: 'Repeat',
			placeholder: 'Repeat',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.magicCostGain, {
			controlType: 'number',
			value: 0,
			name: 'magic-gain',
			text: 'Magic cost gain',
			placeholder: 'Magic cost gain',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		// TODO see if we really need this.
		this.formComponent.addInput<string>(this.hitTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'hit-type',
			text: 'Hit Type',
			placeholder: 'Hit Type',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.animationField, {
			controlType: 'dropdown',
			value: '',
			name: 'animation',
			text: 'Animation',
			placeholder: 'Animation',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		});

		this.formComponent.addInput(this.dmgParameterField, {
			controlType: 'dropdown',
			value: 0,
			name: 'damage-parameter',
			text: 'Damage parameter',
			placeholder: 'Damage parameter',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.dmgTypeField, {
			controlType: 'dropdown',
			value: 0,
			name: 'damage-type',
			text: 'Damage type',
			placeholder: 'Damage type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
			options$: new BehaviorSubject<Option<number>[]>([
				new Option({
					key: 'Damage',
					value: DmgType.Damage,
					selected: true,
				}),
				new Option({
					key: 'Recover',
					value: DmgType.Recover,
					selected: false,
				}),
				new Option({
					key: 'Drain',
					value: DmgType.Drain,
					selected: false,
				}),
			]),
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
			required: false,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.varianceField, {
			controlType: 'number',
			value: 0,
			name: 'variance',
			text: 'Variance',
			placeholder: 'Variance',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<boolean>(this.critField, {
			controlType: 'dropdown',
			value: false,
			name: 'critical',
			text: 'Critical Hits',
			placeholder: 'Critical hits',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
			options$: new BehaviorSubject<Option<boolean>[]>([
				new Option({
					key: 'false',
					value: false,
					selected: true,
				}),
				new Option({
					key: 'true',
					value: true,
					selected: false,
				}),
			]),
		});
	}
}
