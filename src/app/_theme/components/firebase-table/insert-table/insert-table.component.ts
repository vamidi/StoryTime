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
import { UtilsService } from '@app-core/utils';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import {
	DynamicFormComponent,
	ButtonFieldComponent,
	CheckboxFieldComponent,
	TextFieldComponent,
	DropDownFieldComponent,
} from '@app-theme/components/form';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { BehaviorSubject } from 'rxjs';
import { Option } from '@app-core/data/forms/form-types';
import { ITable, Table } from '@app-core/data/state/tables';
import { Project } from '@app-core/data/state/projects';
import { BehaviourType } from '@app-core/types';
import { UserData, UserModel } from '@app-core/data/state/users';
import { UserService } from '@app-core/data/state/users';
import { environment } from '../../../../../environments/environment';

@Component({
	selector: 'ngx-insert-table-dialog',
	templateUrl: './insert-table.component.html',
	// templateUrl: 'dialogue-dialog.component.html',
	styleUrls: ['insert-table.component.scss'],
})
export class InsertTableComponent implements
	OnInit, AfterViewInit, IBehaviour
{
	@Input()
	public title: string = '';

	@Input()
	public tableItems: string[] = [];

	@Input()
	public project: Project = null;

	@Input()
	public user: UserModel = null;

	@Input()
	public table: Table = null;

	@Input()
	public behaviourType$: BehaviorSubject<BehaviourType> = new BehaviorSubject(BehaviourType.INSERT);

	@Output()
	public closeEvent: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	@ViewChild('tableNameField', { static: true })
	public tableNameField: TextFieldComponent = null;

	@ViewChild('tableAccessField', { static: true })
	public tableAccessField: DropDownFieldComponent = null;

	@ViewChild('tableDescriptionField', { static: true })
	public tableDescriptionField: TextFieldComponent = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild('checkboxQuestion', { static: true })
	public checkboxQuestion: CheckboxFieldComponent = null;

	public source: BaseFormSettings = {
		title: 'Insert New Table',
		alias: 'insert-new-table',
		requiredText: 'Fill in all fields',
		fields: {},
	};

	constructor(
		protected ref: NbDialogRef<InsertTableComponent>,
		protected toastrService: NbToastrService,
		protected firebaseService: FirebaseService,
		protected userService: UserService,
		protected cd: ChangeDetectorRef)
	{
	}

	public ngOnInit()
	{
		this.formComponent.showLabels = true;

		this.formComponent.addInput(this.tableNameField, {
			value: this.table ? this.table.metadata.title : '',
			text: 'Table name',
			name: 'table-name',
			placeholder: 'Enter a table name',
			errorText: 'This field is required',
			required: true,
			controlType: 'textbox',
			// onKeyUp: (event: any) => this.onTableKeyUp(event);
		});

		this.formComponent.addInput(this.tableAccessField, {
			value: false,
			text: 'Public (Private table)',
			name: 'public',
			errorText: 'Choose an option',
			required: false,
			controlType: 'dropdown',
			options$: new BehaviorSubject<Option<boolean>[]>([
				new Option<boolean>( { key: 'false', value: false, selected: true }),
				new Option<boolean>( { key: 'true', value: true, selected: false }),
			]),
		});

		this.formComponent.addInput(this.tableDescriptionField, {
			value: this.table ? this.table.metadata.description : '',
			text: 'Table description',
			name: 'table-description',
			placeholder: 'Enter a table description',
			errorText: 'This field is required',
			required: true,
			controlType: 'textbox',
			// onKeyUp: (event: any) => this.onTableKeyUp(event);
		});

		// Custom adding a submit button. This is normally not needed.
		this.formComponent.addInput<string>(this.submitQuestion, {
			name: 'insert-btn',
			text: 'Insert Button',
			value: 'Insert',
			controlType: 'submitbutton',
		});

		this.formComponent.addInput<boolean>(this.checkboxQuestion, {
			value: false,
			name: 'r-one',
			groupCss: 'd-inline-block align-text-top',
			text: 'Create another',
			controlType: 'checkbox',
		});
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public onTableKeyUp(event: any)
	{
		const eventValue = event.target.value;

		let foundAble: string = null;
		const tableInput = this.tableNameField.question;
		if(this.tableItems.find(( tblKey: string) =>
			// TODO fix uppercase letters and camel casing words
		{ const b = tblKey === eventValue; foundAble = b ? tblKey : null; return b; }))
		{
			const myForm = this.formComponent.formContainer.toGroup();
			if(myForm.controls[tableInput.key].valid)
			{
				// if the table is hidden show different text
				if(foundAble)
					tableInput.errorText = 'Deleted table still exists in the database';
				else
					tableInput.errorText = 'Table already exists';

				myForm.controls[tableInput.key].markAsTouched();
				myForm.controls[tableInput.key].setErrors({'incorrect': true});
			}
		} else {
			tableInput.errorText = 'This field is required';
		}
	}

	public onSendForm()
	{
		const myForm = this.formComponent.formContainer.toGroup();
		// If the form is valid
		if(this.formComponent.isValid)
		{
			const val = myForm.value;

			switch(this.behaviourType$.getValue()) {
				case BehaviourType.INSERT:
				{
					// insert data in the database
					if (this.project && val[this.tableNameField.question.key] && val[this.tableNameField.question.key] !== '') {
						const table: ITable = {
							id: '',
							projectID: this.project.id,
							revisions: {},
							relations: {},
							data: {
								0: {
									deleted: false,
									created_at: UtilsService.timestamp,
									updated_at: UtilsService.timestamp,
								},
							},
							metadata: {
								title: UtilsService.camelize(val[this.tableNameField.question.key]),
								description: val[this.tableDescriptionField.question.key],
								created_at: UtilsService.timestamp,
								updated_at: UtilsService.timestamp,
								owner: this.user.uid,
								lastUID: 0,
								private: val[this.tableAccessField.question.key],
								deleted: false,
								version: {
									major: environment.MAJOR,
									minor: environment.MINOR,
									release: environment.RELEASE,
								},
							},
						};

						// TODO change this the new method
						// Insert projects into project in to the projects child.
						this.firebaseService.insert(table, 'tables').then((result) => {
							// set the new table id
							table.id = result.key;

							this.project.tables[table.id] =
								{ enabled: true, name: table.metadata.title, description: table.metadata.description };

							const id =
								this.userService.isAdmin || this.userService.isSuper ? this.project.id : `${ this.project.id }/tables`;

							const data = this.userService.isAdmin || this.userService.isSuper ? this.project : this.project.tables;

							// We only have rights to change the tables child in the project if we are not admin or super admin
							this.firebaseService.updateItem(id, data, true, 'projects').then();

							UtilsService.showToast(this.toastrService, 'Table created',
								`Table ${table.metadata.title} created!`);

							this.firebaseService.onTableAddEvent.emit();
						}).catch((e) => console.log(e));
					}
				}
					break;
				case BehaviourType.UPDATE:
				case BehaviourType.DELETE:
				{
						// We need a project to change
					if(!this.table)
						break;

					if (val[this.tableNameField.question.key] && val[this.tableNameField.question.key] !== '')
					{
						const table: Table = this.table;

						// Update the necessary items
						table.metadata.title = val[this.tableNameField.key];
						table.metadata.private = val[this.tableAccessField.key];

						// Update the timestamp
						table.metadata.updated_at = UtilsService.timestamp;

						// Insert projects into project in to the projects child.
						this.firebaseService.updateItem(table.id, table, true, 'tables').then(() => {
							UtilsService.showToast(this.toastrService, 'Table updated',
								`Table ${ table.metadata.title } updated!`);
						});
					}
				}
					break;
			}

			if (this.checkboxQuestion.question.value)
			{
				this.formComponent.reset();
				// form.controls[this.tableNameField.question.key].setValue(String(''));
			} else
				this.ref.close();
		}
	}

	public dismiss()
	{
		this.closeEvent.emit();
		this.ref.close();
	}

	public save()
	{
		UtilsService.onDebug('Save has been clicked!');
	}
}
