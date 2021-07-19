import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BehaviourType } from '@app-core/types';
import {
	ButtonFieldComponent,
	CheckboxFieldComponent,
	DynamicFormComponent,
	TextFieldComponent,
} from '@app-theme/components/form';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import { IProject, Project } from '@app-core/data/state/projects';
import { UserModel } from '@app-core/data/state/users';
import { UtilsService } from '@app-core/utils';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { Column, IColumn, ITable, TableTemplate } from '@app-core/data/state/tables';
import { ProjectsService } from '@app-core/data/state/projects';
import { standardTables, standardTablesDescription } from '@app-core/data/standard-tables';
import { BehaviorSubject } from 'rxjs';
import { CustomProjectValidators } from '@app-core/validators/custom-project.validators';
import { environment } from '../../../../../environments/environment';
import { ProxyObject } from '@app-core/data/base';

@Component({
	selector: ' ngx-insert-project',
	templateUrl: './insert-project.component.html',
})
export class InsertProjectComponent
	implements OnInit, AfterViewInit, IBehaviour
{
	public title: string = 'New Project';

	@Input()
	public user: UserModel = null;

	@Input()
	public project: Project = null;

	@Input()
	public behaviourType$: BehaviorSubject<BehaviourType> = new BehaviorSubject(BehaviourType.INSERT);

	@Output()
	public closeEvent: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('tableField', { static: true })
	public tableField: TextFieldComponent = null;

	@ViewChild('tableDescriptionField', { static: true })
	public tableDescriptionField: TextFieldComponent = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild('checkboxQuestion', { static: true })
	public checkboxQuestion: CheckboxFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Insert',
		alias: 'test',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	constructor(
		protected ref: NbDialogRef<InsertProjectComponent>,
		protected ToastrService: NbToastrService,
		protected firebaseService: FirebaseService,
		protected projectService: ProjectsService,
		protected cd: ChangeDetectorRef)
	{

	}

	public ngOnInit(): void
	{
		this.formComponent.showLabels = true;

		this.formComponent.addInput(this.tableField, {
			required: true,
			name: 'project-name',
			text: 'Project name',
			placeholder: 'Project name',
			value: this.project ? this.project.metadata.title : '',
			controlType: 'textbox',
			errorText: 'Project name is required',
			asyncValidator: [ CustomProjectValidators.validateProject(this.user, this.firebaseService) ],
		});

		this.formComponent.addInput(this.tableDescriptionField, {
			required: true,
			name: 'project-description',
			text: 'Project description',
			placeholder: 'Project description',
			value: this.project ? this.project.metadata.description : '',
			controlType: 'textbox',
		});

		this.formComponent.addInput(this.submitQuestion, {
				name: this.project ? 'update-btn' : 'insert-btn',
				text: this.project ? 'Update Button' : 'Insert Button',
				value: this.project ? 'Update' : 'Insert',
				controlType: 'submitbutton',
			},
		);

		this.formComponent.addInput<boolean>(this.checkboxQuestion, {
			value: false,
			name: '-one',
			groupCss: 'd-inline-block align-text-top',
			text: 'Create ',
			controlType: 'checkbox',
		});
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public dismiss()
	{
		this.ref.close();
	}

	public async onSendForm()
	{
		if(this.formComponent.isValid && this.user)
		{
			const val = this.formComponent.formContainer.value;

			switch(this.behaviourType$.getValue())
			{
				case BehaviourType.INSERT:
				{
					const project: IProject = {
						id: '',
						members: {},
						tables: {},
						metadata: {
							created_at: UtilsService.timestamp,
							updated_at: UtilsService.timestamp,
							title: val[this.tableField.key],
							alias: UtilsService.titleLowerCase(val[this.tableField.key]),
							description: val[this.tableDescriptionField.key],
							private: false,
							deleted: false,
							owner: this.user.uid,
							languages: {
								'en': true,
							},
							version: {
								major: environment.MAJOR,
								minor: environment.MINOR,
								release: environment.RELEASE,
							},
						},
					};

					project.members[this.user.uid] = true;

					// Insert projects into project in to the projects child.
					this.firebaseService.insert(project, 'projects').then((result) =>
					{
						// set the id of the project
						project.id = result.key;

						// Add tables for the project.
						standardTables.forEach((tableData: TableTemplate, strTable: string) =>
						{
							const columnData: { [key:string]: Column } = {};
							// if we updated to version 2020.1.5f2 continue.
							if(UtilsService.versionCompare(environment.appVersion, '2020.1.5f2') >= 0)
							{
								// grab the first element in the list
								const row: ProxyObject = tableData.data[0];
								// get the table properties
								const properties = Object.entries(row);
								for(const [propKey, propValue] of properties)
								{
									const columnDefition: Column = {
										name: UtilsService.title(UtilsService.replaceCharacter(propKey, /_/g, ' ')),
										description: '',
										type: null,
										defaultValue: propValue,
									};

									// get the type of the column
									switch(typeof propValue)
									{
										case 'undefined':
											UtilsService.onWarn(`Propertie ${propValue} is undefined`);
											break;
										case 'object':
										case 'boolean':
										case 'function':
										case 'symbol':
										case 'bigint':
											columnDefition.type = 'custom';
											break;
										case 'number':
											columnDefition.type = 'number';
											break;
										case 'string':
											columnDefition.type = 'string';
											break;
									}

									// See if column key exists
									if(!columnData[propKey])
										columnData[propKey] = columnDefition;
								}
							}

							const table: ITable =
							{
								id: '',
								projectID: project.id,
								data: tableData,
								revisions: {},
								relations: {},
								columns: columnData,
								metadata: {
									title: strTable,
									description: standardTablesDescription.has(strTable) ? standardTablesDescription.get(strTable) : '',
									lastUID: 0,
									owner: this.user.uid,
									created_at: UtilsService.timestamp,
									updated_at: UtilsService.timestamp,
									private: false,
									deleted: false,
									version: {
										major: environment.MAJOR,
										minor: environment.MINOR,
										release: environment.RELEASE,
									},
								},
							};

							this.firebaseService.insert(table, 'tables').then((tblResult) =>
							{
								// set the id of the project
								table.id = tblResult.key;
								project.tables[table.id] = {
									enabled: true,
									name: table.metadata.title,
									description: table.metadata.description,
								};

								// update the project with newly made tables
								// Add the project also to the user meta data
								this.firebaseService.updateItem(project.id, project, true, 'projects').then();
							});
						});

						if(!this.user.hasOwnProperty('projects'))
							this.user = { ...this.user, projects: { } };

						this.user.projects[project.id] = { roles: { admin: true, editor: true, author: true, subscriber: true } };

						// Add the project also to the user meta data
						this.firebaseService.updateItem(this.user.uid, this.user, true, 'users').then(() =>
						{
							UtilsService.showToast(this.ToastrService, 'Project created',
								`Project ${project.metadata.title} created!`);
						});

						// Add the project to the service.
						this.projectService.setProject(project.id, <Project>(project));
					});
				}
					break;
				case BehaviourType.UPDATE:
				case BehaviourType.DELETE:
				{
					// We need a project to change
					if(!this.project)
						break;

					const project: Project = this.project;

					// Update the necessary items
					project.metadata.title = val[this.tableField.key];
					project.metadata.description = val[this.tableDescriptionField.key];

					// Update the timestamp
					project.metadata.updated_at = UtilsService.timestamp;

					// Insert projects into project in to the projects child.
					this.firebaseService.updateItem(project.id, project, true, 'projects').then(() =>
					{
						UtilsService.showToast(this.ToastrService, 'Project updated',
							`Project ${ project.metadata.title } updated!`);
					});
				}
					break;
			}

			this.dismiss();
		}
	}
}
