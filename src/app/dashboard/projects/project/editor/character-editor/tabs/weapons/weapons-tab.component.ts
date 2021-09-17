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
import { IEquipment } from '@app-core/data/database/interfaces';
import { UtilsService } from '@app-core/utils';

@Component({
	selector: 'ngx-weapons-tab',
	templateUrl: 'weapons-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class WeaponsTabComponent extends BaseTabComponent<IEquipment> implements OnInit
{
	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('weaponNameField', { static: true})
	public weaponNameField: TextFieldComponent = null;

	@ViewChild('weaponDescriptionField', { static: true})
	public weaponDescriptionField: TextFieldComponent = null;

	/** */

	@ViewChild('weaponTypeField', { static: true})
	public weaponTypeField: DropDownFieldComponent = null;

	@ViewChild('weaponCostField', { static: true})
	public weaponCostField: TextFieldComponent = null;

	@ViewChild('animationField', { static: true})
	public animationField: DropDownFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Skill Settings',
		alias: 'skill-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};

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
			userPreferencesService, tableService, firebaseRelationService, languageService, '-MhSKPfKb9XeqqYrW74q');
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

		this.weaponNameField.setDisabledState(this.selectedObject === null);
		this.weaponDescriptionField.setDisabledState(this.selectedObject === null);
		this.weaponTypeField.setDisabledState(this.selectedObject === null);
		this.weaponCostField.setDisabledState(this.selectedObject === null);
		this.animationField.setDisabledState(this.selectedObject === null);
	}

	public onActiveSelection(event: number)
	{
		this.onActiveSelection(event);

		// this.classCurves = [];
		// this.classConfigs = [];
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedObject = UtilsService.copyObj(this.table.find(event)) as IEquipment;
			if(this.selectedObject)
			{
				this.weaponNameField.setValue = this.selectedObject.name[this.selectedLanguage];
				this.weaponDescriptionField.setValue = this.selectedObject.description[this.selectedLanguage];
				this.weaponTypeField.setValue = this.selectedObject.typeId;
				// this.weaponCostField.setValue =
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
		this.formComponent.addInput<string>(this.weaponNameField, {
			controlType: 'textbox',
			value: '',
			name: 'weapon-name',
			text: 'Weapon name',
			placeholder: 'Weapon name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.weaponDescriptionField, {
			controlType: 'textbox',
			value: '',
			name: 'weapon-description',
			text: 'Weapon description',
			placeholder: 'Weapon description',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.weaponTypeField, {
			controlType: 'dropdown',
			value: '',
			name: 'weapon-type',
			text: 'Weapon type',
			placeholder: 'Weapon type',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		this.formComponent.addInput<string>(this.weaponCostField, {
			controlType: 'textbox',
			value: '',
			name: 'weapon-mp-cost',
			text: 'Weapon cost',
			placeholder: 'Weapon Cost',
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
	}
}
