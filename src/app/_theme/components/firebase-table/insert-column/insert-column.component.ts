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
import { Option, TextboxQuestion } from '@app-core/data/forms/form-types';
import { BehaviourType } from '@app-core/types';
import {
	ButtonFieldComponent,
	DropDownFieldComponent,
	TextFieldComponent,
	DynamicFormComponent, CheckboxFieldComponent,
} from '@app-theme/components/form';
import { UtilsService } from '@app-core/utils';
import { environment } from '../../../../../environments/environment';
import { IBehaviour } from '@app-core/interfaces/behaviour.interface';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { BehaviorSubject } from 'rxjs';
import { AbstractControl, ValidatorFn } from '@angular/forms';

@Component({
	selector: 'ngx-insert-column-dialog',
	templateUrl: './insert-column.component.html',
	styleUrls: ['./insert-column.component.scss'],
})
export class InsertColumnComponent implements OnInit, AfterViewInit, IBehaviour
{
	public selected: string = '';

	public optionalData: { optionalData, type };

	@Input()
	public behaviourType$: BehaviorSubject<BehaviourType> = new BehaviorSubject(BehaviourType.INSERT);

	@Input()
	public behaviourType: BehaviourType = BehaviourType.INSERT;

	@Input()
	public columnData: Object = [];

	@Output()
	public saveEvent: EventEmitter<any> = new EventEmitter<any>();

	@Output()
	public closeEvent: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('textQuestion', { static: true })
	public textQuestion: TextFieldComponent = null;

	@ViewChild('defTextQuestion', { static: true })
	public defaultTextQuestion: TextFieldComponent = null;

	@ViewChild('listQuestion', { static: true })
	public listQuestion: DropDownFieldComponent = null;

	@ViewChild('defListQuestion', { static: true })
	public defaultListQuestion: DropDownFieldComponent = null;

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
	public formComponent: DynamicFormComponent = null;

	public loadList: boolean = false;
	public relationSelect: boolean = false;

	private exp: boolean = false;
	public experimental: boolean = this.exp && environment.production === false;

	protected data: any[] = [];

	private disabledColumns = [ 'id', 'tstamp', 'deleted'];

	constructor(protected cd: ChangeDetectorRef) { }

	public ngOnInit()
	{
		// super.ngOnInit();

		this.formComponent.showLabels = true;

		const validators: ValidatorFn[] = [];
		if(this.behaviourType !== BehaviourType.DELETE)
		{
			validators.push((control) => this.validateColumn(control));
		}

		this.behaviourType$.subscribe((type: BehaviourType) =>
		{
			// TODO reset the form
			this.behaviourType = type;
			this.changeTitle();
			this.generateForm();
		});

		// Text box question
		this.formComponent.addInput<string>(this.textQuestion, {
			controlType: 'textbox',
			value: '',
			name: 'field',
			text: 'Field',
			errorText: 'This must be filled in',
			required: true,
			validatorOrOpts: validators,
		});

		// Dropdown question
		this.formComponent.addInput<string>(this.listQuestion, {
			value: 'string',
			text: 'Type',
			name: 'type',
			errorText: 'Choose an option',
			required: true,
			controlType: 'dropdown',
			options$: new BehaviorSubject<Option<string>[]>([]),
		});

		// Custom adding a submit button. This is normally not needed.
		this.formComponent.addInput<string>(this.submitQuestion, {
			name: 'send-btn',
			text: 'Send-btn',
			value: 'Send',
			controlType: 'submitbutton',
		});

		this.formComponent.addInput<boolean>(this.checkboxQuestion, {
			value: false,
			name: 'r-one',
			groupCss: 'd-inline-block align-text-top',
			text: 'Create another',
			controlType: 'checkbox',
		});

		// Initialize the insert column form
		// set all variables of the grabbed form.
		this.generateForm();
	}

	public ngAfterViewInit()
	{
		this.cd.detectChanges();
	}

	public onSendForm()
	{
		// If the form is valid
		if(this.formComponent.isValid)
		{
			const val = this.formComponent.formContainer.toGroup().value;
			const hasTextValue = val[this.textQuestion.question.key];
			const hasListValue = val[this.listQuestion.question.key];

			switch(this.behaviourType)
			{
				case BehaviourType.INSERT:
				{
					if(hasTextValue && hasListValue)
					{
						// noinspection JSUnusedGlobalSymbols
						const addedColumns = { columns: { deleted: false } };

						const lowerCamelCase = UtilsService.camelize(hasTextValue);

						if(!this.checkAvailability(lowerCamelCase))
						{
							let titleName = hasTextValue.toString();
							titleName = titleName.replace(/\s/g, '');
							titleName = titleName.replace(/([A-Z])/g, ' $1').trim();
							titleName = titleName.charAt(0).toUpperCase() + titleName.substr(1);

							addedColumns.columns[lowerCamelCase] = {
								title: titleName,
								type: hasListValue,
							};

							// console.log({ event: addedColumns, type: this.behaviourType });
							this.saveEvent.emit({ event: addedColumns, type: this.behaviourType });
							if(val[this.checkboxQuestion.question.key])
								this.formComponent.reset();
							else
								this.closeEvent.emit();

							return;
						}

						// TODO show the user that the columns exists
						// UtilsService.showToast()
					}
					else UtilsService.onError('Insert failed!');
				}
					break;
				case BehaviourType.UPDATE:
				{
					const lowerCamelCase = UtilsService.camelize(hasTextValue);
					if (hasTextValue && hasListValue)
					{
						if (!this.checkAvailability(lowerCamelCase))
						{
							let titleName = hasTextValue.toString();
							titleName = titleName.replace(/\s/g, '');
							titleName = titleName.replace(/([A-Z])/g, ' $1').trim();
							titleName = titleName.charAt(0).toUpperCase() + titleName.substr(1);

							if (confirm('Are you sure you want to update this column'))
							{
								this.saveEvent.emit({
									event: { oldKey: hasListValue, newKey: titleName },
									type: this.behaviourType,
								});

								if (val[this.checkboxQuestion.question.key])
									this.formComponent.reset();
								else
									this.closeEvent.emit();
							}
						} else UtilsService.onError('Update failed!');
					}
				}
					break;
				case BehaviourType.DELETE:
				{
					if(hasListValue)
					{
						if (confirm('Are you sure you want to delete this column'))
						{
							this.saveEvent.emit({
								event: { key: hasListValue },
								type: this.behaviourType,
							});

							if(val[this.checkboxQuestion.question.key])
								this.formComponent.reset();
							else
								this.closeEvent.emit();
						}
					} else UtilsService.onError('Remove failed!');
				}
				break;
			}
		}
	}

	public dismiss()
	{
		this.closeEvent.emit();
	}

	public selectChanged(event: any, { optionalData, type })
	{
		if(type !== BehaviourType.INSERT && optionalData instanceof TextboxQuestion)
		{
			optionalData.value = event;
		}
	}

	public onListSelected(event: any)
	{
		this.selectChanged(event, this.optionalData);
		if(this.optionalData.type !== BehaviourType.INSERT)
		{
			this.formComponent.formContainer.set(this.textQuestion.question.key, event);
			// const formControl = this.formComponent.formContainer.toGroup().get(this.textQuestion.question.key);
			// formControl.markAsDirty();
			// formControl.setValue(event);
		}

		// If we want to update or insert
		if(this.optionalData.type !== BehaviourType.DELETE)
		{
			if(this.listQuestion)
			{
				if (this.listQuestion.question.value === 'boolean')
				{
					this.loadList = true;
					this.relationSelect = false;
				} else if (this.listQuestion.question.value === 'number')
				{
					this.loadList = false;
					if(this.defaultTextQuestion) this.defaultTextQuestion.question.controlType = 'number';
				} else if (this.listQuestion.question.value === 'relation')
				{
					this.loadList = false;
					this.relationSelect = true;
					// TODO Probably add the relation column list as well.
					// console.log(this.defaultListQuestion)
				} else
				{
					this.loadList = false;
					this.relationSelect = false;
					if(this.defaultTextQuestion) this.defaultTextQuestion.question.controlType = 'textbox';
				}
			}
			// const formControl = this.insertFormContainer.toGroup().get(this.defaultListQuestion.question.key);
			// formControl.markAsDirty();
			// formControl.setValue(event);
		}
	}

	protected changeTitle()
	{
		switch (this.behaviourType)
		{
			case BehaviourType.INSERT:
				this.source.title = 'Insert';
				this.formComponent.formContainer.set(this.submitQuestion.question.key,'Insert column');
				break;
			case BehaviourType.UPDATE:
				this.source.title = 'Update';
				this.formComponent.formContainer.set(this.submitQuestion.question.key,'Update column');
				break;
			case BehaviourType.DELETE:
				this.source.title = 'Delete';
				this.formComponent.formContainer.set(this.submitQuestion.question.key,'Delete column');
				break;
			default:
				break;
		}
	}

	protected checkAvailability(event: string): boolean
	{
		if(event !== '')
		{
			let columnName = event;
			columnName = columnName.replace(/\s/g, '');
			// LowerCamelCase
			columnName = UtilsService.camelize(columnName);
			if(this.columnData.hasOwnProperty(columnName))
				return true;
		}

		return false;
	}

	protected validateColumn(control: AbstractControl): {[key: string]: any} | null
	{
		if (control.value)
			return this.checkAvailability(control.value) ? { 'exists' : true } : null;

		return null;
	}

	protected generateForm()
	{
		switch(this.behaviourType)
		{
			case BehaviourType.INSERT:
			{
				// this.formComponent.formContainer.title = 'Insert';

				// this.textQuestion.disabled = false;
				// this.textQuestion.readOnly = false;

				this.listQuestion.question.options$.next([
					new Option<string>({ key: 'Text', value: 'string', selected: true }),
					new Option<string>({ key: 'Number', value: 'number', selected: false }),
					new Option<string>({ key: 'Bool (0 or 1, Yes or No)', value: 'boolean', selected: false }),
					// new Option<string>({ key: 'relation', value: 'Relation', selected: false}),
				]);

				this.formComponent.formContainer.set(this.textQuestion.question.key,'');
				this.formComponent.formContainer.set(this.listQuestion.question.key,'');

				this.textQuestion.value = '';
				this.listQuestion.value = '';
				// this.listQuestion.text = 'Type';

				this.formComponent.reset();
			}
				break;
			case BehaviourType.UPDATE:
			case BehaviourType.DELETE:
			{
				this.textQuestion.question.readOnly = this.behaviourType === BehaviourType.DELETE;
				// this.textQuestion.question.title = this.behaviourType === BehaviourType.UPDATE ? 'Update' : 'Delete';

				if(this.columnData)
				{
					const options: Option<string>[] = [];

					for (const [key, value] of Object.entries(this.columnData))
					{
						options.push(new Option<string>({
							key: value.title,
							value: key,
							disabled: this.disabledColumns.includes(key),
							selected: false,
						}));
					}

					this.formComponent.formContainer.set(
						this.textQuestion.question.key,this.behaviourType === BehaviourType.UPDATE ? '' : 'Delete',
					);
					this.formComponent.formContainer.set(this.listQuestion.question.key,'');

					this.textQuestion.value = '';
					this.listQuestion.value = '';

					this.listQuestion.question.options$.next(options);

					// this.listQuestion.text = 'Columns';
					this.formComponent.reset();
				}
			}
			break;
		}

		this.optionalData = { optionalData: this.textQuestion.question, type: this.behaviourType };
	}
}
