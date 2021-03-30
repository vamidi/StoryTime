import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnInit,
	Output, ViewChild,
} from '@angular/core';
import { NbDialogRef, NbToastrService } from '@nebular/theme';
import { UtilsService } from '@app-core/utils';
import { Option } from '@app-core/data/forms/form-types';
import { BaseSettings } from '@app-core/mock/base-settings';
import { BehaviourType } from '@app-core/types';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import { BehaviorSubject, Subject } from 'rxjs';
import {
	ButtonFieldComponent,
	CheckboxFieldComponent,
	DropDownFieldComponent,
	TextFieldComponent,
	DynamicFormComponent,
} from '@app-theme/components/form';
import { FirebaseService, RelationPair } from '@app-core/utils/firebase.service';
import { StringPair } from '@app-core/data/base';
import { Util } from 'leaflet';
import trim = Util.trim;
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { Table } from '@app-core/data/state/tables';
import { ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';

@Component({
	selector: 'ngx-add-relation-dialog',
	templateUrl: './insert-relation-dialog.component.html',
	styleUrls: [
		'insert-relation-dialog.component.scss',
	],
})
export class InsertRelationDialogComponent implements
	OnInit, AfterViewInit, IBehaviour
{
	@Input()
	public title: string = '';

	/**
	 * @brief - This is the settings to generate the bulk form
	 */
	@Input()
	public settings: BaseSettings;

	@Input()
	public behaviourType$: Subject<BehaviourType>;

	@Input()
	public table: Table = null;

	@Output()
	public closeEvent: EventEmitter<any> = new EventEmitter<any>();

	public onRelationInserted: EventEmitter<any> = new EventEmitter<any>();

	public onRelationDeleted: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('tableField', { static: true })
	public tableField: TextFieldComponent = null;

	@ViewChild('columnDropDownField', { static: true })
	public columnDropDownField: DropDownFieldComponent = null;

	@ViewChild('relationDropDownField', { static: true })
	public relationDropDownField: DropDownFieldComponent = null;

	@ViewChild('relationColumnDropDownField', { static: true })
	public relationColumnDropDownField: DropDownFieldComponent = null;

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

	public onInsertAccept: Function|null = (_?: string): boolean => true;

	public onInsertRejected: Function|null = (_?: string): boolean => true;

	constructor(
		protected ref: NbDialogRef<InsertRelationDialogComponent>,
		protected toastrService: NbToastrService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected projectService: ProjectsService,
		protected tablesService: TablesService,
		protected cd: ChangeDetectorRef)
	{

	}

	public ngOnInit()
	{
		// super.ngOnInit();
		// Initialize the insert column form
		if(this.formComponent)
			this.formComponent.showLabels = true;

		// set all variables of the grabbed form.
		// first set the table name
		if (this.tableField)
		{
			this.formComponent.addInput<string>(this.tableField, {
				name: 'table',
				value: this.table.metadata.title,
				placeholder: 'Table Name',
				errorText: 'Fill in a table name',
				text: 'Table',
				required: true,
				readOnly: true,
				controlType: 'textbox',
			})
		}

		// Columns of the table
		if (this.columnDropDownField)
		{
			const options: Option<string>[] = [];
			for (const key of Object.keys(this.settings.columns))
			{
				const columnType = this.settings.columns[key].type;
				const isString = columnType === 'string' || columnType === 'html';
				options.push(
					new Option<string>({ key: UtilsService.title(key), value: key,
						selected: false,
						// User is not able to select string to make a relation
						disabled: isString,
					}),
				);
			}

			this.formComponent.addInput<string>(this.columnDropDownField,{
				value: String(Number.MAX_SAFE_INTEGER),
				name: 'columns',
				text: 'Columns',
				placeholder: 'Columns',
				required: true,
				controlType: 'dropdown',
				relationDropDown: true,
				options$: new BehaviorSubject<Option<string>[]>(options),
			});

			// component.instance.defaultValue = 'false';
			// component.instance.value = 'false';
		}

		if (this.relationDropDownField)
		{
			// [title]="'Relation table'" [text]="'Relation table'" [placeholder]="'Relation table'" [required]="true"
			this.formComponent.addInput<string>(this.relationDropDownField,{
				value: String(Number.MAX_SAFE_INTEGER),
				name: 'Relation Table',
				text: 'Relation Table',
				placeholder: 'Relation Table',
				required: true,
				controlType: 'dropdown',
				relationDropDown: true,
				options$: new BehaviorSubject<Option<string>[]>([]),
			});

			const options: Option<string>[] = [];
			const project = this.projectService.getProjectById(this.table.projectID);
			if(project)
			{
				Object.keys(project.tables).forEach((tableID) =>
				{
					const table = this.tablesService.getTableById(tableID);
					if(table)
					{
						options.push(
							new Option<string>({ key: UtilsService.title(table.metadata.title),
								value: table.metadata.title,
								selected: false,
							}),
						);
					}
					else {
						options.push(
							new Option<string>({ key: UtilsService.title(project.tables[tableID].name),
								value: project.tables[tableID].name,
								selected: false,
							}),
						);
					}
				});
			}

			this.relationDropDownField.question.options$.next(options);
		}

		if(this.relationColumnDropDownField)
		{
			// [title]="'Relation table Column'"
			// [text]="'Relation table Column'" [placeholder]="'Relation table Column'" [required]="true" [disabled]="true"

			this.formComponent.addInput<string>(this.relationColumnDropDownField,{
				value: '',
				name: 'relation-table-column',
				text: 'Relation table Column',
				placeholder: 'Relation table Column',
				required: true,
				controlType: 'dropdown',
				relationDropDown: true,
				disabled: true,
				options$: new BehaviorSubject<Option<string>[]>([]),
			});
		}
		// let component: ComponentRef<any>;
		// component = this.dynamicComponentService.addDynamicComponent(TextFieldComponent);
		// if (component) {
		// 	const instance = component.instance;
		// 	this.configureComponent(data, instance);
		// 	this.formComponent.addElement(instance);
		// 	this.inputs.set('relation', instance.question);
		// }

		this.initForm();
	}

	public ngAfterViewInit(): void
	{
		// super.ngAfterViewInit();
		this.cd.detectChanges();
	}

	public initForm()
	{
		// Custom adding a submit button. This is normally not needed.
		this.formComponent.addInput<string>(this.submitQuestion, {
			name: 'send-btn',
			text: 'Send-btn',
			value: 'Send',
			controlType: 'submitbutton',
		});

		this.formComponent.addInput<boolean>(this.checkboxQuestion, {
			value: false,
			name: '-one',
			groupCss: 'd-inline-block align-text-top',
			text: 'Create another',
			controlType: 'checkbox',
		});

		// this.generateForm();
		// Custom adding a submit button. This is normally not needed.
		// this.formComponent.addElement(this.submitQuestion);
		// Generate the form component
		// this.formComponent.generate();
		// Generate the form
		// this.insertFormContainer.toGroup(true);
	}

	public onSendForm()
	{
		// If the form is valid
		if(this.formComponent.isValid)
		{
			const val = this.formComponent.formContainer.toGroup().value;

			if (val[this.tableField.question.key] // Table value
				&& val[this.columnDropDownField.question.key] // Column of the current table
				&& val[this.relationDropDownField.question.key] // Table of the other table
				&& val[this.relationColumnDropDownField.question.key] // Column of the other table
			)
			{
				// if we don't have the columns yet. (because of new table
				if(!this.table.relations.hasOwnProperty('columns'))
				{
					this.table.relations = {
						columns: {},
					}
				}

				this.table.relations.columns[val[this.columnDropDownField.question.key]] = {
					key: val[this.relationDropDownField.question.key],
					column: val[this.relationColumnDropDownField.question.key],
				};

				const data = {
					newData: {
						// table: UtilsService.camelize(val[this.tableField.question.key]),
						key: val[this.columnDropDownField.question.key],
						pair: new StringPair(
							val[this.relationDropDownField.question.key],
							val[this.relationColumnDropDownField.question.key],
						),
					},
					confirm: {
						resolve: this.onInsertAccept,
						reject: this.onInsertRejected,
					},
				};

				// Add the relation the database
				this.firebaseRelationService.addData(this.table.title, data.newData.key, data.newData.pair);

				// push the relation to the server
				this.tablesService.update(this.table.id).then(() => {
					UtilsService.showToast(
						this.toastrService,
						'Relation inserted!',
						'Relation has been successfully added',
					)
				});

				this.onRelationInserted.emit(data);

				if (this.checkboxQuestion.question.value)
				{
					this.formComponent.reset();
					return;
				} else
					this.ref.close();
			}

			this.ref.close();
		}
	}

	public onTableSelected(event: string)
	{
		const table = this.tablesService.getTableByName(event);

		if(table && table.length !== 0)
			this.loadColumns(table);
		// if we don't have the table we have to get it online
		else
		{
			const project = this.projectService.getProjectById(this.table.projectID);
			if(project)
			{
				const key = Object.keys(project.tables).find((tableID) => project.tables[tableID].name === event);
				if(key)
					this.tablesService.addIfNotExists(key)
						.then((value) => { if(value instanceof Table) this.loadColumns(value) } );
			}
		}
	}

	public dismiss()
	{
		this.closeEvent.emit();
		this.ref.close();
	}

	protected loadColumns(table: Table)
	{
		const columns = {};
		const options = [];
		table.forEach((snapshot) =>
		{
			for (const k of Object.keys(snapshot))
			{
				const key: string = trim(k);

				// We only need this information once
				if (!columns.hasOwnProperty(key.toString()))
				{
					const titleName = UtilsService.title(key.toString());

					columns[key] = { title: titleName };

					options.push(
						new Option<string>({ key: titleName, value: key, selected: false }),
					);
				}
			}
		});

		const entry: RelationPair = this.firebaseRelationService.getData().get(this.table.metadata.title);

		// if we found an entry link it
		if (entry)
		{
			this.columnDropDownField.question.options$.getValue().forEach((option: Option<string>) =>
			{
				// if we found the relation
				const pair: StringPair = entry.get(option.value);
				if (pair && pair.key === table.metadata.title)
				{
					for(let i = 0; i < options.length; ++i)
					{
						// if the option already contains a relation --> mark it
						if(options[i].value === option.value)
						{
							let titleName = options[i].key.toString() + ' --- Exists Already';
							titleName = titleName.replace(/([A-Z])/g, ' $1').trim();
							titleName = titleName.charAt(0).toUpperCase() + titleName.substr(1);

							options[i].key = titleName;
							options[i].disabled = true;
							options[i].value = titleName;
						}
					}
				}
			});
		}

		this.relationColumnDropDownField.question.options$.next(options);

		// this.relationColumnDropDownField.question.disabled = false;
		this.relationColumnDropDownField.setDisabledState(false);
	}
}
