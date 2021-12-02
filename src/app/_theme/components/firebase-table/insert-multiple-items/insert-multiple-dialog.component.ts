import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	OnDestroy,
	OnInit,
	Output,
	ViewChild,
} from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { UtilsService } from '@app-core/utils';
import { FormQuestionBase, Option } from '@app-core/data/forms/form-types';
import { Column, ISettings } from '@app-core/mock/base-settings';
import { BehaviourType } from '@app-core/types';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import { BehaviorSubject } from 'rxjs';
import {
	ButtonFieldComponent,
	CheckboxFieldComponent,
	DynamicFormComponent,
} from '@app-theme/components/form';
import { Relation } from '@app-core/data/base/relation.class';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FilterCallback, FirebaseFilter, firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { BaseFormSettings, FormField } from '@app-core/mock/base-form-settings';
import { Table } from '@app-core/data/state/tables';
import { ProxyObject } from '@app-core/data/base';
import { TablesService } from '@app-core/data/state/tables';
import { DataSourceColumnHandler } from '@app-core/data/data-source-column-handler';
import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { LanguageRenderComponent } from '@app-theme/components';

@Component({
	selector: 'ngx-add-multiple-dialog',
	templateUrl: './insert-multiple-dialog.component.html',
	styleUrls: [
		'insert-multiple-dialog.component.scss',
	],
})
export class InsertMultipleDialogComponent implements
	OnInit, AfterViewInit, IBehaviour, OnDestroy
{
	@Input()
	public title: string = '';

	@Input()
	public tblName: string = '';

	/**
	 * @brief - This is the settings to generate the bulk form
	 */
	@Input()
	public settings: ISettings;

	@Input()
	public data: any = {};

	@Input()
	public behaviourType$: BehaviorSubject<BehaviourType> = new BehaviorSubject(BehaviourType.INSERT);

	@Output()
	public insertEvent: EventEmitter<any> = new EventEmitter<any>();

	@Output()
	public onInsertAccept: Function | null = (): boolean => true;

	@Output()
	public onInsertRejected: Function | null = (): boolean => true;

	@Output()
	public closeEvent: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild(DynamicFormComponent, { static: true })
	private formComponent: DynamicFormComponent = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	@ViewChild('checkboxQuestion', { static: true })
	public checkboxQuestion: CheckboxFieldComponent = null;

	public get Source(): BaseFormSettings { return this.sourceHandler.source }

	protected sourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert',
		alias: 'test',
		requiredText: 'Fill in all fields',
		fields: {},
	});

	protected behaviourType: BehaviourType = BehaviourType.INSERT;
	protected table: Table = new Table();

	constructor(
		protected ref: NbDialogRef<InsertMultipleDialogComponent>,
		protected firebaseService: FirebaseService,
		protected tableService: TablesService,
		protected cd: ChangeDetectorRef)
	{
	}

	public ngOnInit()
	{
		this.behaviourType$.subscribe((behaviourType) =>
		{
			if(!this.submitQuestion)
				return;

			this.updateBehaviourType(behaviourType)
		});

		this.sourceHandler = new DataSourceColumnHandler(this.sourceHandler.source, this.data);
		this.sourceHandler.initialize(this.settings.columns, (key, column, index) =>
			this.configureRelation(key, column, index));

		this.sourceHandler.createFields();

		const insertBtnTitle: string = this.getText(this.behaviourType);
		this.formComponent.addInput<string>(this.submitQuestion, {
			name: insertBtnTitle.toLowerCase() + '-btn',
			text: insertBtnTitle + '-btn',
			value: insertBtnTitle,
			controlType: 'submitbutton',
		});
		this.formComponent.addInput<boolean>(this.checkboxQuestion, {
			name: 'create-another',
			text: 'Create ',
			value: false,
			controlType: 'checkbox',
			groupCss: 'd-inline-block align-text-top',
		});
	}

	public ngAfterViewInit(): void
	{
		// super.ngAfterViewInit();
		this.initForm();
		/*
		for (const [key, value] of Object.entries(this.settings.columns))
		{
			const column: any = value;

			let component: ComponpentRef<any> = null;
			switch (column.type)
			{
				case 'number':
					component = this.dynamicComponentService.addDynamicComponent(TextFieldComponent);
					component.instance.isNumber = true;
					component.instance.value = '0';
					break;
				case 'string':
				case 'html':
					if (column.hasOwnProperty('editor') && column.editor.hasOwnProperty('component')) {
						if (column.editor.component.name === 'BooleanColumnRenderComponent') {
							component = this.dynamicComponentService.addDynamicComponent(DropDownFieldComponent);
							component.instance.question.options = [
								new Option<any>({
									key: 'false',
									value: 'false',
									selected: String(value) === 'false',
								}),
								new Option<any>({key: 'true', value: 'true', selected: String(value) === 'true'}),
							];
							component.instance.defaultValue = 'false';
							component.instance.value = 'false';
						}
					} else {
						component = this.dynamicComponentService.addDynamicComponent(TextFieldComponent);
						component.instance.parent = this.formComponent;
					}
					break;
				case 'custom':
					component = this.configureRelation(key);
					break;
			}

			if (component)
			{
				const instance = component.instance;
				instance.parent = this.formComponent;
				this.configureComponent(key, column, instance);
				this.formComponent.addElement(instance);
				this.inputs.set(key, instance.question);

				// Generate the form
				this.insertFormContainer.add(instance.question);
				component.changeDetectorRef.detectChanges();
			}
		}
		*/
	}

	public ngOnDestroy(): void
	{
		this.behaviourType$.unsubscribe();

		UtilsService.onDebug('cleaning up dialog');
	}

	public initForm()
	{
		// Custom adding a submit button. This is normally not needed.
		// this.insertFormContainer.add(this.formComponent.addElement(this.submitQuestion).question);
		// this.insertFormContainer.add(this.formComponent.addElement(this.checkboxQuestion).question);
		// Generate the form component
		// this.formComponent.generate();
		// Generate the form
		// this.insertFormContainer.toGroup(true);

		switch(this.behaviourType)
		{
			case BehaviourType.INSERT:
				break;
			case BehaviourType.UPDATE:
				this.formComponent.formContainer.toGroup().markAsDirty();
				break;
			case BehaviourType.DELETE:
				break;

		}

		// console.log(this.formComponent, this.insertFormContainer);

		// this.generateForm();
		// Custom adding a submit button. This is normally not needed.
		// this.formComponent.addElement(this.submitQuestion);
		// Generate the form component
		// this.formComponent.generate();
		// Generate the form
		// this.insertFormContainer.toGroup(true);
		this.cd.detectChanges();

		// this.formBuilderService.addSubmitButton();
	}

	public onSendForm()
	{
		// If the form is valid
		if (this.formComponent.isValid)
		{
			// TODO fix that we can save old values before overriding it inside an input field.

			const data = {
				insertType: this.behaviourType,
				newData: {},
				confirm: {
					resolve: this.onInsertAccept,
					reject: this.onInsertRejected,
				},
			};
			const controls: any = this.formComponent.formContainer.toGroup().controls;
			const id = <number>controls['id'].value;

			for (const [key, value] of Object.entries(this.settings.columns))
			{
				if(!controls[key])
					continue;

				const column: any = value;
				const controlValue: any = controls[key].value;

				switch (column.type)
				{
					case 'number':
						data.newData[key] = Number(controlValue);
						break;
					case 'string':
						// override if this column is a boolean type
						data.newData[key] = (controlValue === 'true' || controlValue === 'false')
							? controls[key] === 'true' : controlValue;
						break;
					case 'custom':
						// Relation value or keyValue language data
						if(value.renderComponent === LanguageRenderComponent)
						{
							data.newData[key] = { 'en': controlValue };
							break;
						}
						data.newData[key] = Number(controlValue);
						break;
					default:
						data.newData[key] = controlValue;
						break;
				}
			}

			// insert data in the database
			this.insertEvent.emit(data);

			if (this.checkboxQuestion.question.value)
			{
				this.formComponent.reset();
				const container = this.formComponent.formContainer;
				switch(this.behaviourType)
				{
					case BehaviourType.INSERT:
						container.set('id', Number(id) + 1);
						break;
					case BehaviourType.UPDATE:
					case BehaviourType.DELETE:
						this.behaviourType$.next(BehaviourType.INSERT);
						container.set('id', this.settings.columns.id.defaultValue);
						break;
				}
				container.set('created_at', new Date);
				container.set('updated_at', Math.floor(Date.now() / 1000));
			} else
				this.ref.close();
		}
	}

	public dismiss()
	{
		this.closeEvent.emit();
		this.ref.close();
	}

	protected getText(behaviourType: BehaviourType): string
	{
		switch(behaviourType)
		{
			case BehaviourType.INSERT:
				return 'Insert';
			case BehaviourType.UPDATE:
				return 'Update';
			case BehaviourType.DELETE:
				return 'Delete';
			default:
				return 'Insert';
		}
	}

	protected updateBehaviourType(behaviourType: BehaviourType)
	{
		switch(behaviourType)
		{
			case BehaviourType.INSERT:
				this.submitQuestion.value = this.submitQuestion.question.value = 'Insert';
				break;
			case BehaviourType.UPDATE:
				this.submitQuestion.value = this.submitQuestion.question.value = 'Update';
				break;
			case BehaviourType.DELETE:
				this.submitQuestion.value = this.submitQuestion.question.value = 'Delete';
				break;
		}

		this.behaviourType = behaviourType;
	}

	protected configureRelation(key: string, column: Column, index: number): FormField<any>
	{
		let field: FormField<any>;
		if (key /* && Number(value) !== Number.MAX_SAFE_INTEGER */)
		{
			const relation: Relation = this.firebaseService.getRelation(this.tblName, key);

			if (relation)
			{
				field = this.sourceHandler.configureField<number>(key, column, 'dropdown', Number.MAX_SAFE_INTEGER, index);
				field.options$ = new BehaviorSubject([]);

				this.Source.fields[key] = field;

				// Set the dropdown to relation
				field.relationDropDown = true;

				const table: Table = this.tableService.getTableById(relation.tblColumnRelation.key);

				if(table)
				{
					this.onDataReceived(key, table, relation, field);
				}

				return field;
			}
		}

		field = this.sourceHandler.configureField<number>(key, column, 'number', Number.MAX_SAFE_INTEGER, index);
		return field;
	}

	protected onDataReceived(key: string, snapshots: Table, relation: Relation, field: FormField<any>)
	{
		this.table = snapshots;

		let selected: boolean = false;
		const item: FirebaseFilter<any> = firebaseFilterConfig.columnFilters.find((name) =>
			name.table === this.tblName && name.columns.some((column: string) => column === key),
		);

		let filterFunc: FilterCallback<ProxyObject> = null;

		if(item)
		{
			filterFunc = item.filter;
		}

		this.table.load([
			(d: ProxyObject) => !!+d.deleted === false,
			filterFunc,
		]).then(() => {
			const keyValue = this.data[key] ?? null;
			snapshots.forEach((snapshot) =>
			{
				const options = field.options$.getValue();

				if (!options.some((el) => el.id === snapshot.id ))
				{
					// We need to convert or else we cant compare
					const snapshotKey: number = Number(snapshot.id);

					let option: Option<number>;
					const relData: string | number | KeyLanguageObject = snapshot[relation.tblColumnRelation.value];
					if(typeof relData === 'string')
					{
						option = new Option<number>({
							id: snapshotKey,
							key: snapshotKey + '. ' + UtilsService.truncate(relData as string, 50),
							value: snapshotKey,
							selected: false,
						});
					}
					else if(typeof relData === 'object')
						option =
							this.handleLanguageValue({ prevSnapshotKey: snapshotKey, selected: selected }, relData as KeyLanguageObject);
					else if (!isNaN(Number(relData))) // if this is a number that we got
					{
						option = new Option<number>({
							id: snapshotKey,
							key: snapshotKey + '. ' + UtilsService.truncate(relData.toString(), 50),
							value: snapshotKey,
							selected: false,
						});
					}
					// 	this.handleDeeperRelation({ prevSnapshotKey: snapshotKey, selected: selected }, relation, relData);

					// Sort the options descending.
					options.sort((a, b) => Number(b.value) - Number(a.value));

					if(option.value === keyValue)
					{
						field.value = option.value;
						option.selected = selected = true;
					}

					options.push(option);
				}

				field.options$.next(options);
			});
		});
	}

	protected configureComponent(key: string, column: any, component: any)
	{
		const question: FormQuestionBase<any> = component.question;
		if (column.defaultValue)
		{
			component.readOnly = true;
			component.value = column.defaultValue;
			component.hidden = column.hidden;
			// TODO fix for every key.
			question.value = component.value = key === 'id' && this.data.hasOwnProperty(key) ? this.data[key] : component.value;
			question.readOnly = true;
		}
		else if(this.data.hasOwnProperty(key))
		{
			if(column.type === 'number' || column.type === 'string' || column.type === 'html')
				question.value = component.value = this.data[key];
		}

		// console.log(key, column.title, question);

		component.text = column.title;
		component.placeholder = column.title;
		component.required = true;

		/*
		public value: T;
		public type: T;
		public id: number;
		public key: string;
		public groupCss: string = '';
		public inputCss: string = '';
		public name: string;
		public text: string;
		public placeholder: string = '';
		public errorText: string = '';
		public required: boolean;
		public disabled: boolean = false;
		public readOnly: boolean = false;
		public required_text: string = 'Required';
		public order: number;
		public controlType: NbControlTypes;
		public options: Option<any>[];
		*/
	}

	private handleLanguageValue({ prevSnapshotKey = -1, selected = false }, prevRelData: KeyLanguageObject)
	{
		const languages = Object.keys(prevRelData);
		// Are we dealing with a language object
		if (systemLanguages.has(languages[0] as KeyLanguage))
		{
			const newValue: string = prevRelData['en'];
			return new Option<number>({
				id: prevSnapshotKey,
				key: prevSnapshotKey + '. ' + UtilsService.truncate(newValue, 50),
				value: prevSnapshotKey,
				selected: selected,
			});
		}
	}
}
