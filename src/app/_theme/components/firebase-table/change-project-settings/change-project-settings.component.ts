import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input, OnDestroy,
	OnInit,
	Output,
	ViewChild, ViewContainerRef,
} from '@angular/core';
import {
	ButtonFieldComponent,
	DynamicFormComponent, SelectFieldWithBtnComponent,
} from '@app-theme/components/form';
import { NbDialogRef, NbDialogService, NbToastrService } from '@nebular/theme';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';
import { InsertTeamMemberComponent } from '@app-theme/components/firebase-table/insert-team-member/insert-team-member.component';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { Revision } from '@app-core/data/state/tables';
import { TablesService } from '@app-core/data/state/tables';

import { IUserTicket, Roles, UserModel, UserService } from '@app-core/data/state/users';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Option } from '@app-core/data/forms/form-types';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { MigrationsService, UtilsService } from '@app-core/utils';
import { CustomProjectValidators } from '@app-core/validators/custom-project.validators';
import { ButtonColumnRenderComponent } from '@app-theme/components';
import { IPipelineSchedule } from '@app-core/interfaces/pipelines.interface';
import { migrations } from '@app-core/data/state/projects/Migrations/project.migrations';

import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import intersection from 'lodash.intersection';

@Component({
	selector: 'ngx-change-project-settings-dialog',
	templateUrl: 'change-project-settings.component.html',
	styleUrls:['change-project-settings.component.scss'],
	// styleUrls: ['./change-table-settings.component.scss'],
})
export class ChangeProjectSettingsComponent implements
	OnInit, AfterViewInit, OnDestroy {
	@ViewChild('submitQuestion', {static: true})
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild(DynamicFormComponent, {static: true})
	private formComponent: DynamicFormComponent = null;

	@ViewChild('viewFormContainer', { read: ViewContainerRef, static: true })
	public viewFormContainer!: ViewContainerRef;

	@Input()
	public project: Project = null;

	@Input()
	public user: UserModel = null;

	@Input()
	public settings: BaseSettings = new BaseSettings();

	@Output()
	public onToggleEvent: EventEmitter<{ key: string, value: boolean }> =
		new EventEmitter<{ key: string, value: boolean }>();

	@Output()
	public onInsertAccept: Function | null = (): boolean => true;

	@Output()
	public onInsertRejected: Function | null = (): boolean => true;

	public get isAdmin() {
		return this.userService.isAdmin;
	}

	public source: BaseFormSettings = {
		title: 'Project Settings',
		alias: 'project-settings',
		requiredText: 'Fill all fields',
		fields: {},
	};

	public invites: IUserTicket[] = [];

	public get revisions(): Map<string, Revision> {
		return new Map<string, Revision>();
	}

	public migrationSource: LocalDataSource = new LocalDataSource();
	public migrationSettings: ISettings = {
		mode: 'inline',
		selectMode: '',
		noDataMessage: 'No migrations',
		actions: {
			add: false,
			edit: false,
			delete: false,
			position: 'right',
			// custom: {name: string, title: string}[],
		},
		columns: {
			id: {
				title: 'ID',
				type: 'number',
				editable: false,
				addable: false,
				width: '50px',
				filter:false,
				hidden: false,
				defaultValue: Number.MAX_SAFE_INTEGER,
			},
			title: {
				title: 'Title',
				type: 'text',
				editable: false,
				addable: false,
				filter:false,
				hidden: false,
				defaultValue: '',
			},
			description: {
				title: 'Description',
				type: 'text',
				editable: false,
				addable: false,
				filter:false,
				hidden: false,
				defaultValue: '',
			},
			migrate: {
				title: 'Migrate',
				type: 'custom',
				editable: false,
				addable: false,
				width: '50px',
				filter:false,
				hidden: false,
				renderComponent: ButtonColumnRenderComponent,
				onComponentInitFunction: (instance: ButtonColumnRenderComponent) => {
					instance.emitter.subscribe(() => {
							const migration = this.migrationService.getMigration(instance.rowData.title);
							this.migrationService.run(migration.name)
								.then((dirty) => this.resolve(migration, dirty))
						},
					);
				},
			},
		},
	};

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected columns: Map<string, any> = new Map<string, any>();

	protected cachedLanguages: Option<KeyLanguage>[] = [];

	private langCounter: number = 0;

	constructor(
		protected ref: NbDialogRef<ChangeProjectSettingsComponent>,
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected projectsService: ProjectsService,
		protected tablesService: TablesService,
		protected userService: UserService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		protected dynamicComponentService: DynamicComponentService,
		protected migrationService: MigrationsService,
		protected cd: ChangeDetectorRef,
	) {
	}

	public ngOnInit(): void
	{
		const tableSelections: Option<string>[] = Object.entries(this.project.tables).map(([key, value]) =>
		{
			return new Option<string>(
				{ key: UtilsService.titleCase(value.name), value: key, selected: false, disabled: !value.enabled },
			);
		});

		// max level field
		UtilsService.onDebug(this.project);
		this.source.fields = {
			projectName: {
				controlType: 'textbox',
				value: this.project?.metadata.title ?? '',
				name: 'project-name',
				text: 'Project name',
				placeholder: 'Project name',
				errorText: 'Project name is required',
				required: true,
				// asyncValidator: [ CustomProjectValidators.validateProject(this.user, this.firebaseService) ],
			},
			projectDescription: {
				controlType: 'textarea',
				value: this.project?.metadata.description ?? '',
				name: 'project-description',
				text: 'Project description',
				placeholder: 'Project description',
				required: false,
			},
			characterTable: {
				controlType: 'dropdown',
				value: this.project?.metadata?.relatedTables?.characters ?? '',
				name: 'project-character-table',
				text: 'Project character table',
				placeholder: 'Project character table',
				required: false,
				options$: new BehaviorSubject<Option<any>[]>(tableSelections),
			},
			itemTable: {
				controlType: 'dropdown',
				value: this.project?.metadata?.relatedTables?.items ?? '',
				name: 'project-item-table',
				text: 'Project item table',
				placeholder: 'Project item table',
				required: false,
				options$: new BehaviorSubject<Option<any>[]>(tableSelections),
			},
			equipmentTable: {
				controlType: 'dropdown',
				value: this.project?.metadata?.relatedTables?.equipments ?? '',
				name: 'project-equipment-table',
				text: 'Project equipment Table',
				placeholder: 'Project equipment Table',
				required: false,
				options$: new BehaviorSubject<Option<any>[]>(tableSelections),
			},
			classTable: {
				controlType: 'dropdown',
				value: this.project?.metadata?.relatedTables?.classes ?? '',
				name: 'project-class-table',
				text: 'Project class table',
				placeholder: 'Project class table',
				required: false,
				options$: new BehaviorSubject<Option<any>[]>(tableSelections),
			},
			enemyTable: {
				controlType: 'dropdown',
				value: this.project?.metadata?.relatedTables?.enemies ?? '',
				name: 'project-enemy-table',
				text: 'Project enemy Table',
				placeholder: 'Project enemy table',
				required: false,
				options$: new BehaviorSubject<Option<any>[]>(tableSelections),
			},
			skillTable: {
				controlType: 'dropdown',
				value: this.project?.metadata?.relatedTables?.skills ?? '',
				name: 'project-skill-tables',
				text: 'Project skill Tables',
				placeholder: 'Project skill table',
				required: false,
				options$: new BehaviorSubject<Option<any>[]>(tableSelections),
			},
			maxLevel: {
				controlType: 'number',
				value: this.project && this.project.gameStats ? this.project.gameStats.maxLevel : 200,
				name: 'max-level',
				text: 'Max level',
				placeholder: 'Set character and enemy max level',
				required: false,
			},
		}

		const columns = Object.entries(this.settings.columns);

		// only include hidden values that we can see
		this.columns = new Map(columns.filter((item: [string, any]) => {
			if (this.userService.isAdmin)
				return true;

			return (
				// if this is the deleted or tstamp column hide it.
				(item[0] === 'deleted' || item[0] === 'created_at' || item[0] === 'updated_at') && this.userService.isAdmin
				// if we are not admin and it is not the deleted or timestamp column show it.
				|| this.userService.isAdmin === false
			)
		}));

		for (const [key, value] of this.columns) {
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

		this.formComponent.addInput(this.submitQuestion, {
				name: this.project ? 'update-btn' : 'insert-btn',
				text: this.project ? 'Update Button' : 'Insert Button',
				value: this.project ? 'Update' : 'Insert',
				controlType: 'submitbutton',
			},
		);

		this.mainSubscription.add(this.userService.getUser().subscribe((user) => {
				this.user = user;
				this.firebaseService.getRef('projectRequests').orderByChild('uid')
					.equalTo(user.uid).on('value', result => {
					if (result.exists()) {
						const data: { [key: string]: IUserTicket } = result.val();
						for (const key of Object.keys(data)) {
							if (this.invites.find((i) => isEqual(i, data[key])))
								continue;

							this.invites.push(data[key]);
						}
					}
				});
			}),
		);

		// load languages
		this.languageService.SystemLanguages.forEach((value, key) => this.cachedLanguages.push(
			new Option<KeyLanguage>({
				key: value,
				value: key,
				selected: false,
			})),
		);

		if(!this.project.metadata.hasOwnProperty('languages'))
		{
			this.project.metadata.languages = {};
		} else {
			const languages: string[] = Object.keys(this.project.metadata.languages);
			languages.forEach((lang) =>
			{
				// Whether the languages is enabled.
				if (this.project.metadata.languages[lang])
				{
					this.source.fields[`language_list_${this.langCounter}`] = {
						value: lang,
						text: `Language ${this.langCounter + 1}`,
						name: `language_list_${this.langCounter}`,
						errorText: 'Choose a language',
						required: true,
						controlType: 'btn-dropdown',
						showFirstBtn: false,
						options$: new BehaviorSubject<Option<KeyLanguage>[]>(this.cachedLanguages),
						onSelectEvent: (event: KeyLanguage) => this.onLanguageSelected(event),
						// onIconClickEvent: () => this.addCharacter(),
					}
					this.langCounter++;
				}
			});
		}

		const tables = Object.keys(this.project.tables);
		const args = { relationData: {} };
		tables.forEach((tableId) => {
			args[tableId] = this.firebaseService.getItem(0, `tables/${tableId}/data/`);

			const version: string = UtilsService.convertToVersion(this.project.metadata.version);
			const name = UtilsService.versionCompare(version, '2020.1.6.1', { lexicographical: true }) >= 0 ?
				this.project.tables[tableId].metadata.name : this.project.tables[tableId].name;

			args.relationData = this.firebaseRelationService.getData().get(name);
		})

		migrations.forEach((migration, idx) => {
			this.migrationService.addMigration({
				...migration, item: this.project,
				args: args,
			});
			this.migrationSource.add({
				id: idx,
				title: migration.name,
				description: '',
				migrate: `Migrate ${migration.name}`,
			}).then();
		});
	}

	public ngAfterViewInit(): void {
		this.dynamicComponentService.setRootViewContainerRef(this.viewFormContainer);
		this.cd.detectChanges();
	}

	public ngOnDestroy(): void {
		this.mainSubscription.unsubscribe();
		this.firebaseService.getRef('projectRequests').off();
	}

	public hasRole(allowedRoles: string[], roles: Roles) {
		if (!roles)
			return false;

		const userRoles = Object.keys(roles);
		return !isEmpty(intersection(allowedRoles, userRoles));
	}

	public OnToggle(event: any) {
		this.onToggleEvent.emit({key: event.key, value: event.value});
	}

	public inviteMember() {
		this.dialogService.open(InsertTeamMemberComponent, {
			context: {
				project: this.project,
				user: this.user,
			},
		});
	}

	public addNewLanguage()
	{
		const component = this.dynamicComponentService.addDynamicComponent(SelectFieldWithBtnComponent);
		this.formComponent.addInput(component.instance,
		{
			value: '',
			text: `Language ${this.langCounter + 1}`,
			name: `language_list_${this.langCounter}`,
			errorText: 'Choose a language',
			required: true,
			controlType: 'btn-dropdown',
			options$: new BehaviorSubject<Option<KeyLanguage>[]>(this.cachedLanguages),
			onSelectEvent: (event: KeyLanguage) => this.onLanguageSelected(event),
			onSelectBtnClick: (event: any) => this.onDeleteLanguage(event),
		});
		this.langCounter++;
	}

	public onLanguageSelected(event: KeyLanguage)
	{
		if(!this.project.metadata.languages.hasOwnProperty(event))
			this.project.metadata.languages[event] = true;

		this.projectsService.setProject(this.project.id, this.project);

		// TODO add queue for small changes in the project.
		this.saveLanguages();
	}

	public saveLanguages()
	{
		this.firebaseService.getRef(`projects/${this.project.id}/metadata/languages`)
			.update(this.project.metadata.languages).then(() =>
			{
				UtilsService.showToast(
					this.toastrService,
					'Languages updated',
					'successfully updated the project',
					'success',
					4000,
				);
			},
		);
	}

	public onDeleteLanguage(event: any)
	{
		if(this.project.metadata.languages.hasOwnProperty(event))
			this.project.metadata.languages[event] = false;

		this.projectsService.setProject(this.project.id, this.project);

		this.saveLanguages();
	}

	public save(i: number)
	{
		const invite = this.invites[i];
		if(invite && invite.pending)
		{
			this.firebaseService.updateInvite(invite);
			return;
		}

		this.firebaseService.updateRoles(invite);
	}

	public onEditConfirm(event: any)
	{
	}

	public onDeleteConfirm(event: any)
	{
	}

	/**
	 * TODO add validation when a table is selected
	 * that is contains certain columns.
	 */
	public onSendForm()
	{
		// If the form is valid
		if(this.formComponent.isValid)
		{
			const val = this.formComponent.formContainer.toGroup().value;

			this.project.metadata.title = val.projectName;
			this.project.metadata.description = val.projectDescription;

			this.project.metadata.relatedTables = {
				...this.project.metadata.relatedTables,
				characters: val.characterTable,
				classes: val.classTable,
				enemies: val.enemyTable,
				equipments: val.equipmentTable,
				items: val.itemTable,
				skills: val.skillTable,
			};

			this.project.gameStats.maxLevel = val.maxLevel;

			// Save the project
			this.projectsService.update(this.project.id).then(() => {
				UtilsService.showToast(
					this.toastrService,
					'Project updated!',
					'Project has been successfully updated',
					'success',
					5000,
				);
			});
		}
	}

	public dismiss()
	{
		this.ref.close();
	}

	private resolve(migration: IPipelineSchedule, dirty: boolean)
	{
		if(migration == null || typeof migration === 'undefined') {
			UtilsService.showToast(
				this.toastrService,
				'Migration failed',
				`Migration is not defined!`,
				'warning',
			);
			return;
		}
		if(dirty)
		{
			const project: Project = migration.item as Project;
			this.projectsService.update(project.id).then(() => {
				UtilsService.showToast(
					this.toastrService,
					'Migration completed',
					`Migration finished!`,
					'success',
				);
			});
			return;
		}

		UtilsService.showToast(
			this.toastrService,
			'Migration completed',
			`Migration made no changes!`,
			'success',
		);
	}
}
