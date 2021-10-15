import { Component, OnInit, ViewChild } from '@angular/core';
import { BaseParameterTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-stat-tab.component';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { NbDialogService, NbMenuService, NbThemeService, NbToastrService } from '@nebular/theme';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import {
	ArrayFormComponent,
	DropDownFieldComponent,
	DynamicFormComponent,
	TextFieldComponent,
} from '@app-theme/components';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import {
	ICharacterClass,
	IEquipment,
	IEquipmentType,
	NbParameterCurves,
} from '@app-core/data/database/interfaces';
import { UtilsService } from '@app-core/utils';
import { Option } from '@app-core/data/forms/form-types';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BehaviourType } from '@app-core/types';

@Component({
	selector: 'ngx-weapons-tab',
	templateUrl: 'equipments-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class EquipmentsTabComponent extends BaseParameterTabComponent<IEquipment> implements OnInit
{
	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild(ArrayFormComponent, { static: true})
	public formArrayComponent: ArrayFormComponent = null;

	@ViewChild('equipmentNameField', { static: true})
	public equipmentNameField: TextFieldComponent<string> = null;

	@ViewChild('equipmentDescriptionField', { static: true })
	public equipmentDescriptionField: TextFieldComponent<string> = null;

	@ViewChild('equipmentCategoryField', { static: true})
	public equipmentCategoryField: DropDownFieldComponent<number> = null;

	@ViewChild('equipmentTypeField', { static: true})
	public equipmentTypeField: DropDownFieldComponent<number> = null;

	@ViewChild('equipmentClassField', { static: true})
	public equipmentClassField: DropDownFieldComponent<number> = null;

	@ViewChild('equipmentCostField', { static: true})
	public equipmentCostField: TextFieldComponent<number> = null;

	@ViewChild('equipmentSellableField', { static: true })
	public equipmentSellableField: TextFieldComponent<boolean> = null;

	@ViewChild('animationField', { static: true})
	public animationField: DropDownFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Skill Settings',
		alias: 'skill-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

	protected classes: Table<ICharacterClass> = null;
	protected equipmentTypes: Table<IEquipmentType> = null;

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
		userPreferencesService, tableService, firebaseRelationService, languageService, themeService, '-MhSKPfKb9XeqqYrW74q');

		this.includedTables.push('classes', 'equipmenttypes');
	}

	public ngOnInit()
	{
		super.ngOnInit();

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
		super.loadTable(value);

		if (value === null) return;

		if (value.metadata.title.toLowerCase() === 'classes') {
			this.classes = <Table<ICharacterClass>>value;

			const options: Option<number>[] = [];
			this.classes.forEach((classObj) => {
				options.push(new Option({
					key: this.languageService.getLanguageFromProperty(classObj.className, this.selectedLanguage),
					value: classObj.id,
					selected: false,
				}));
			});
			this.equipmentClassField.question.options$.next(options);

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.classes, ['child_added']),
			);
		}


		if (value.metadata.title.toLowerCase() === 'equipmenttypes') {
			this.equipmentTypes = <Table<IEquipmentType>>value;

			const optionCategories: Option<number>[] = [];
			const optionTypes: Option<number>[] = [];

			this.equipmentTypes.forEach((curve) => {
				const id: number = curve.id;
				optionCategories.push(new Option({
					key: this.languageService.getLanguageFromProperty(curve.category, this.selectedLanguage),
					value: id,
					selected: false,
				}));

				optionTypes.push(new Option({
					key: this.languageService.getLanguageFromProperty(curve.type, this.selectedLanguage),
					value: id,
					selected: false,
				}));
			});

			this.equipmentCategoryField.question.options$.next(optionCategories);
			this.equipmentTypeField.question.options$.next(optionTypes);

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.equipmentTypes, ['child_added']),
			);
		}
	}

	protected override validate()
	{
		super.validate();

		this.equipmentNameField.setDisabledState(this.selectedObject === null);
		this.equipmentDescriptionField.setDisabledState(this.selectedObject === null);
		this.equipmentTypeField.setDisabledState(this.selectedObject === null);
		this.equipmentCategoryField.setDisabledState(this.selectedObject === null);
		this.equipmentClassField.setDisabledState(this.selectedObject === null);
		this.equipmentCostField.setDisabledState(this.selectedObject === null);
		this.equipmentSellableField.setDisabledState(this.selectedObject === null);
		this.animationField.setDisabledState(this.selectedObject === null);
	}

	public onActiveSelection(event: number)
	{
		super.onActiveSelection(event);

		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedObject = UtilsService.copyObj(this.table.find(event)) as IEquipment;
			if(this.selectedObject) {
				this.equipmentNameField.setValue = this.selectedObject.name[this.selectedLanguage];
				this.equipmentDescriptionField.setValue = this.selectedObject.description[this.selectedLanguage];
				this.equipmentTypeField.setValue = this.selectedObject.typeId;
				this.equipmentCategoryField.setValue = this.selectedObject.categoryId;
				this.equipmentClassField.setValue = this.selectedObject.classId;
				this.equipmentCostField.setValue = this.selectedObject.sellValue;
				this.equipmentSellableField.setValue = this.selectedObject.sellable;

				this.formArrayComponent.clear();
				this.parameterCurves.forEach((curve) => {
					if (curve.equipmentId === this.selectedObject.id)
					{
						this.formArrayComponent.formArray.push(new FormGroup({
							'stat-id': new FormControl(curve.id),
							'stat-modifier': new FormControl(curve.id),
							'stat-input': new FormControl(curve.flat),
							'stat-type': new FormControl(curve.statType),
						}));
					}
				});

				this.validate();
			}
		} else this.validate();
	}

	public insertStat()
	{
		super.insertStat({
			equipmentId: this.selectedObject ? this.selectedObject.id : Number.MAX_SAFE_INTEGER,
		});
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

			this.selectedObject.name[this.selectedLanguage] = this.equipmentNameField.getValue;
			this.selectedObject.description[this.selectedLanguage] = this.equipmentDescriptionField.getValue
			this.selectedObject.typeId = this.equipmentTypeField.getValue;
			this.selectedObject.categoryId = this.equipmentCategoryField.getValue;
			this.selectedObject.classId = this.equipmentClassField.getValue;
			this.selectedObject.sellValue = this.equipmentCostField.getValue;
			this.selectedObject.sellable = this.equipmentSellableField.getValue;

			event.newData = this.selectedObject;

			const skills = this.formComponent.formContainer.get('skills') as FormArray;
			for(let i = 0; i < skills.length; i++)
			{
				const value = skills.controls[i].value;

				const selectedCurve: NbParameterCurves = this.parameterCurves.find(value['stat-modifier']);

				if(selectedCurve)
				{
					const oldCurve: NbParameterCurves = this.parameterCurves.find(value['stat-id']);
					const curve: NbParameterCurves = {
						id: value['stat-id'],
						equipmentId: this.selectedObject.id,
						alias: oldCurve ? oldCurve.alias : selectedCurve.alias,
						base: value['stat-input'],
						paramName: oldCurve ? oldCurve.paramName : selectedCurve.paramName,
						paramFormula: oldCurve ? oldCurve.paramFormula : '',
						rate: oldCurve ? oldCurve.rate : 0,
						flat: value['stat-input'],

						classId: Number.MAX_SAFE_INTEGER,
						enemyId: Number.MAX_SAFE_INTEGER,
						enemyCategoryId: Number.MAX_SAFE_INTEGER,

						deleted: false,
						created_at: UtilsService.timestamp,
						updated_at: UtilsService.timestamp,
					};

					const data = {
						insertType: BehaviourType.INSERT,
						newData: curve,
						confirm: null,
					}
					if(curve.id === Number.MAX_SAFE_INTEGER)
					{
						this.onCreateConfirm(data, this.parameterCurves.id);
					}
					else
					{
						/* TODO fix me that I am able to update the stats of the equipment
						this.onEditConfirm({
							data: oldCurve,
							newData: curve,
							confirm: {
								resolve: () => {
									this.table.update(oldCurve, curve).then();
									return true;
								},
								reject: (): boolean => true,
							},
						}, false, this.parameterCurves.id);
						 */
					}

				}
			}
			this.onEditConfirm(event,true);
		}
	}

	protected initForm()
	{
		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.equipmentNameField, {
			controlType: 'textbox',
			value: '',
			name: 'equipment-name',
			text: 'Equipment name',
			placeholder: 'Equipment name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.equipmentDescriptionField, {
			controlType: 'textarea',
			value: '',
			name: 'equipment-description',
			text: 'Equipment description',
			placeholder: 'Equipment description',
			errorText: 'This must be filled in',
			required: false,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.equipmentCategoryField, {
			controlType: 'dropdown',
			value: Number.MAX_SAFE_INTEGER,
			name: 'equipment-category',
			text: 'Equipment category',
			placeholder: 'Equipment category',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.equipmentTypeField, {
			controlType: 'dropdown',
			value: Number.MAX_SAFE_INTEGER,
			name: 'equipment-type',
			text: 'Equipment type',
			placeholder: 'Equipment type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.equipmentClassField, {
			controlType: 'dropdown',
			value: Number.MAX_SAFE_INTEGER,
			name: 'equipment-class',
			text: 'Equipment class',
			placeholder: 'Equipment class',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<number>(this.equipmentCostField, {
			controlType: 'number',
			value: 0,
			name: 'equipment-cost',
			text: 'Equipment cost',
			placeholder: 'Equipment Cost',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<boolean>(this.equipmentSellableField, {
			controlType: 'checkbox',
			value: false,
			name: 'equipment-sellable',
			text: 'Sellable',
			placeholder: 'Sellable',
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
			required: false,
			disabled: true,
		});
	}

	protected validateStat(stat: NbParameterCurves): boolean {
		return stat.equipmentId !== Number.MAX_SAFE_INTEGER && stat.equipmentId === this.selectedObject.id;
	}
}
