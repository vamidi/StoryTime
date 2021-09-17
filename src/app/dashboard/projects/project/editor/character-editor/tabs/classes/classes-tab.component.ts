import { Component, OnInit, ViewChild } from '@angular/core';
import { LineSeriesOption } from 'echarts/types/src/chart/line/LineSeries';
import { BaseParameterTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-stat-tab.component';
import { UtilsService } from '@app-core/utils';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { NbDialogService, NbMenuService, NbThemeService, NbToastrService } from '@nebular/theme';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { UserService } from '@app-core/data/state/users';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { ICharacterClass, IClassParameterCurve, ISkill } from '@app-core/data/database/interfaces';

import { DynamicFormComponent, TextFieldComponent } from '@app-theme/components';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { filter } from 'rxjs/operators';
import { BehaviourType } from '@app-core/types';

@Component({
	selector: 'ngx-classes-tab',
	templateUrl: 'classes-tab.component.html',
	styleUrls: ['./../base/base-tab.component.scss'],
})
export class ClassesTabComponent extends BaseParameterTabComponent<ICharacterClass> implements OnInit
{
	public get getSkillTbl(): Table<ISkill>
	{
		return this.skills;
	}

	public get getSkillSettings(): ISettings
	{
		return this.skillsSettings;
	}

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('classNameField', { static: true})
	public classNameField: TextFieldComponent<string> = null;

	@ViewChild('classExperienceCurveField', { static: true})
	public classExperienceCurveField: TextFieldComponent<string> = null;

	public source: BaseFormSettings = {
		title: 'Class Settings',
		alias: 'class-settings',
		requiredText: 'Fill in all the fields',
		fields: {},
	};


	protected skillsSettings: ISettings = new BaseSettings();
	protected skills: Table<ISkill> = null;

	protected modifiers: { [key: string]: any } = {};

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
			userPreferencesService, tableService, firebaseRelationService, languageService, themeService, '-MhJZ87ovi4ki7Lqdh9o',
		);

		this.includedTables.push('skills');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.mainSubscription.add(this.menuService.onItemClick()
			.pipe(
				filter(({ tag }) => tag === 'open-parameter-menu'),
			).subscribe(({ item: { title, data } }) => this.onCardOptionClicked(title, data)));

		this.formComponent.showLabels = true;

		// Text box question
		this.formComponent.addInput<string>(this.classNameField, {
			controlType: 'textbox',
			value: '',
			name: 'class-name',
			text: 'Class name',
			placeholder: 'Class name',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});

		// Text box question
		this.formComponent.addInput<string>(this.classExperienceCurveField, {
			controlType: 'textbox',
			value: '',
			name: 'class-exp',
			text: 'Class Experience',
			placeholder: 'Experience curve',
			errorText: 'This must be filled in',
			required: true,
			disabled: true,
		});
	}

	public addMultiple()
	{
		super.addMultiple({
			context: {
				title: 'Add a new class',
				tblName: 'classes',
				settings: this.settings,
			},
		});
	}

	public onActiveSelection(event: number)
	{
		super.onActiveSelection(event);

		this.eCharLevelOptions = null;
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedObject = UtilsService.copyObj(this.table.find(event)) as ICharacterClass;
			if(this.selectedObject)
			{
				this.classNameField.setValue = this.selectedObject.className[this.selectedLanguage];
				this.classExperienceCurveField.setValue = this.selectedObject.expCurve;
				// second parameter specifying whether to perform 'AND' or 'OR' search
				// (meaning all columns should contain search query or at least one)
				// 'AND' by default, so changing to 'OR' by setting false here
				this.configureStats();
				this.validate();
			}
		} else this.validate();

		this.skills.getSource.setFilter([
			// fields we want to include in the search
			{
				field: 'classId',
				search: this.selectedObject !== null ? this.selectedObject.id.toString() : 'NaN',
			},
		], false);
	}

	public insertStat()
	{
		super.insertStat({
			classId: this.selectedObject ? this.selectedObject.id : Number.MAX_SAFE_INTEGER,
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

			this.selectedObject.className[this.selectedLanguage] = this.classNameField.getValue;
			this.selectedObject.expCurve = this.classExperienceCurveField.getValue;

			event.newData = this.selectedObject;
			this.onEditConfirm(event,true);
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

	protected override validate()
	{
		super.validate();

		this.classNameField.setDisabledState(this.selectedObject === null);
		this.classExperienceCurveField.setDisabledState(this.selectedObject === null);
	}

	protected loadTable(value: Table)
	{
		super.loadTable(value);

		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'skills')
		{
			// store the dialogues.
			this.skills = <Table<ISkill>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tableService.listenToTableData(this.skills, ['child_added']),
			);

			this.skillsSettings.actions.add = true;
			const newItemSettings = this.processTableData(
				this.skills, true, this.skillsSettings,
			);
			this.skillsSettings = Object.assign({}, newItemSettings);
		}
	}

	protected validateStat(stat: IClassParameterCurve): boolean {
		return stat.classId !== Number.MAX_SAFE_INTEGER && stat.classId === this.selectedObject.id;
	}
}
