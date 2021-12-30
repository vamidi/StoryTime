import {
	AfterContentInit,
	AfterViewInit,
	Component,
	ComponentRef,
	EventEmitter,
	Input,
	OnInit,
	Output, Type,
	ViewChild,
	ViewChildren,
	ViewContainerRef,
} from '@angular/core';
import { BaseFormSettings, FormField } from '@app-core/mock/base-form-settings';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { QuestFormContainer } from '@app-core/data/forms/form-model';
import { TextFieldComponent } from '@app-theme/components/form/input/text-field-input.component';
import { DropDownFieldComponent } from '@app-theme/components/form/dropdown/dropdown-input.component';
import { CheckboxFieldComponent } from '@app-theme/components/form/checkbox/checkbox-input.component';
import { ButtonFieldComponent } from '@app-theme/components/form/button/button-input.component';
import { SelectFieldWithBtnComponent } from '@app-theme/components/form/select/select-field-with-btn.component';
import { BaseFormInputComponent } from './form.component';
import { UtilsService } from '@app-core/utils';
import { FormControl } from '@angular/forms';
import { Option } from '@app-core/data/forms/form-types';
import { BehaviorSubject } from 'rxjs';
import { DebugType } from '@app-core/utils/utils.service';
import { BasicTextFieldInputComponent } from '@app-theme/components';

/**
 * @brief - We want to make an form that create dynamic forms on the fly
 * Without the user actually doing a lot of coding. So this component will do the most of the work
 * such as keeping track of the fields
 *
 * @example
 */
@Component({
	selector: 'ngx-dynamic-form',
	template: `
		<form
			[formGroup]="formContainer.toGroup()" (ngSubmit)="formContainer.toGroup().valid && send()"
			#viewFormContainer>
<!--			<pre>{{ container.toGroup().valid }}</pre>-->
<!--			<pre *ngFor="let control of controls">{{ control.status }}</pre>-->
			<ng-content></ng-content>
		</form>`,
	styleUrls: [
		'form.component.scss',
	],
	providers: [DynamicComponentService],
})
export class DynamicFormComponent implements OnInit, AfterViewInit, AfterContentInit
{
	@Input()
	public source: BaseFormSettings = {
		title: '',
		alias: '',
		requiredText: '',
		fields: {},
	};

	// Events
	@Output()
	public onSendForm: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('viewFormContainer', { read: ViewContainerRef, static: true })
	public viewFormContainer!: ViewContainerRef;

	public formContainer: QuestFormContainer = new QuestFormContainer({
		id: this.source?.id,
		title: this.source?.title,
		alias: this.source?.alias,
		requiredText: this.source?.requiredText,
	});

	@Input()
	public hidden: boolean = false;

	@Input()
	public showLabels = false;

	@ViewChildren(BaseFormInputComponent, { /* descendants: true, */ read: BaseFormInputComponent })
	public inputs: any;

	public readonly questions: Map<string, BaseFormInputComponent<any>> = new Map();

	public get Form()
	{
		return this.formContainer.form;
	}

	public get Group()
	{
		return this.formContainer.toGroup();
	}

	public get isValid()
	{
		return this.Group.valid;
	}

	public get dirty()
	{
		return this.Group.dirty;
	}

	/**
	 * @brief - Returning the question of the form
	 * @param key - key value to search in the map.
	 */
	public get(key: string): BaseFormInputComponent<any>
	{
		return this.questions.get(key);
	}

	private order: number = 0;

	private components: ComponentRef<BaseFormInputComponent<any>>[] = [];

	constructor(protected dynamicComponentService: DynamicComponentService) { }

	public ngOnInit()
	{
		this.configureFields();
	}

	public init()
	{
		this.formContainer.clear();
		this.questions.clear();
		this.components.forEach((component) => this.removeComponent(component));
		this.components = [];
		this.configureFields();
	}

	public ngAfterContentInit() { }

	public ngAfterViewInit() { }

	public add<T = any>(
		typeComponent: Type<BaseFormInputComponent<T>>, field: FormField<T> = null,
	): ComponentRef<BaseFormInputComponent<T>>
	{
		const fieldComponent: ComponentRef<BaseFormInputComponent<T>> =
			this.dynamicComponentService.addDynamicComponent(typeComponent);

		this.addInput(fieldComponent.instance, field);

		this.components.push(fieldComponent);
		return fieldComponent;
	}

	public delete(ref: ComponentRef<BaseFormInputComponent<any>>)
	{
		this.removeComponent(ref);
	}

	public addInput<T = any>(el: BaseFormInputComponent<any>, field: FormField<T> = null): FormControl
	{
		if(field && !this.source.fields.hasOwnProperty(el.question.key))
			this.source.fields[el.question.key] = field;

		// assert when text box is not equal text field component
		const msg = `field: ${field.name}, element: ${field.controlType} does not match the type: ${el.constructor.name}`;
		UtilsService.onAssert(
			// text field component can be either be a text box, textarea, number
			(
				field.controlType === 'textarea' ||
				field.controlType === 'number' ||
				field.controlType === 'textbox'
			) && el instanceof TextFieldComponent ||

			field.controlType === 'dropdown' && el instanceof DropDownFieldComponent ||

			// checkbox can either be a checkbox or multiple selection field
			(
				field.controlType === 'checkbox' ||
				field.controlType === 'checkbox_multi'
			)
			&& el instanceof CheckboxFieldComponent ||

			// button can either be a button or multiple button field
			// 'button' | 'submitbutton' | 'stepper' | 'btn-dropdown';
			(
				field.controlType === 'button' ||
				field.controlType === 'submitbutton' ||
				field.controlType === 'btn-dropdown'
			)
			&& el instanceof ButtonFieldComponent ||

			// button can either be a button or multiple button field
			// 'btn-dropdown';
			(
				field.controlType === 'btn-dropdown'
			)
			&& el instanceof SelectFieldWithBtnComponent,

			msg,
		);

		// UtilsService.onAssert(field.controlType === 'button' && el instanceof ButtonFieldComponent, msg);
		// UtilsService.onAssert(field.controlType === 'submitbutton' && el instanceof ButtonFieldComponent, msg);
		// UtilsService.onAssert(field.controlType === 'stepper' && el instanceof ButtonFieldComponent, msg);

		return this.configureFormComponent<T>(el, field);
	}

	public send()
	{
		if(this.onSendForm)
			this.onSendForm.emit();
	}

	/**
	 * @brief reset the form container
	 */
	public reset()
	{
		const form = this.formContainer.toGroup();
		// reset the form
		form.reset();

		for(const [key, control] of Object.entries(form.controls))
		{
			const question = this.formContainer.getQuestion(key);
			const field = this.source.fields[key] ?? null;
			if (!question && !control)
				continue;

			if(field)
			{
				switch (typeof question.value)
				{
					case 'undefined':
						UtilsService.onError('undefined field value');
						break;
					case 'object':
						UtilsService.onError('object field value');
						break;
					case 'boolean':
						question.value = false;
						break;
					case 'number':
					case 'bigint':
						question.value = field.relationDropDown ? Number.MAX_SAFE_INTEGER : 0;
						break;
					case 'string':
						question.value = '';
						break;
					case 'function':
						UtilsService.onError('field is specified as function');
						break;
					case 'symbol':
						UtilsService.onError('symbol field error');
						break;
					default:
						question.value = '';
						break;
				}
			}
			control.setValue(question.value);
		}
	}

	/**
	 * @brief - Normally you won't have to call this, but if you
	 * call another component on top of the component where you are using this
	 * and it creates a new dynamicform it will override the service, because
	 * it is a descendent of the parent.
	 */
	public retach()
	{
		this.dynamicComponentService.setRootViewContainerRef(this.viewFormContainer);
	}

	protected configureFields()
	{
		// First state is to just load everything.
		this.dynamicComponentService.setRootViewContainerRef(this.viewFormContainer);

		for (const [key, field] of Object.entries<FormField<any>>(this.source.fields))
		{
			if(!field) UtilsService.onError(`Make sure ${key} is initialized`);

			let component: ComponentRef<BaseFormInputComponent<any>> = null;
			switch(field.controlType)
			{
				case 'textbox':
				case 'number':
				case 'autocomplete':
					component = this.dynamicComponentService.addDynamicComponent(TextFieldComponent);
					break;
				case 'textarea':
					component = this.dynamicComponentService.addDynamicComponent(TextFieldComponent);
					break;
				case 'dropdown':
					component = this.dynamicComponentService.addDynamicComponent(DropDownFieldComponent);
					break;
				case 'btn-dropdown':
					component = this.dynamicComponentService.addDynamicComponent(SelectFieldWithBtnComponent);
					break;
				case 'time':
					break;
				case 'date':
					break;
				case 'checkbox':
					component = this.dynamicComponentService.addDynamicComponent(CheckboxFieldComponent);
					break;
				case 'checkbox_multi':
					break;
				case 'submitbutton':
				case 'stepper':
					component = this.dynamicComponentService.addDynamicComponent(ButtonFieldComponent);
					break;
			}

			if(component)
			{
				component.instance.question.key = key;
				this.configureFormComponent<any>(component.instance, field);

				// component.instance.onComponentInit.subscribe((input) =>
				// {
				// component.changeDetectorRef.detectChanges();
				// });
				this.components.push(component);
			}
		}

		// initialize the form
		this.formContainer.toGroup(true);

		// sort the container
		this.formContainer.sort();

		// reorder the view list
		this.components.forEach((q) => this.dynamicComponentService.move(q.instance.question.order, q));
	}

	protected configureFormComponent<T>(el: BaseFormInputComponent<any>, field: FormField<T>): FormControl
	{
		if(el.parent === null)
			el.parent = this;

		if(field)
		{
			// console.log(key, control);
			// this.question.key = this.key;
			// this.question.type = this.type;
			el.question.controlType = field.controlType;
			el.question.value = field.value;
			el.question.text = field.text;
			el.question.errorText = field.errorText ?? '';
			el.question.name = field.name;
			el.question.hidden = field.hidden;
			// el.question.hidden
			el.Hidden = field.hidden;
			el.question.disabled = field.disabled;
			el.disabled$.next(field.disabled);
			el.question.readOnly = field.readOnly;
			el.question.inputCss = field.inputCss;
			el.question.groupCss = el.groupCss = field.groupCss;
			el.question.placeholder = field.placeholder;
			el.question.required = field.required;
			el.question.options$ = field.options$ ?? new BehaviorSubject<Option<T>[]>([]);
			el.question.validatorOrOpts = field?.validatorOrOpts;
			el.question.asyncValidator = field?.asyncValidator;

			if(field.value !== null || <unknown>field.value !== 'undefined') // Only assign value if exist
				el.question.value = field.value;

			if(field.onSelectEvent)
				el.question.onSelectFunc = field.onSelectEvent;

			if(field.onIconClickEvent)
				el.question.onIconClickFunc = field.onIconClickEvent;

			if(field.onSelectBtnClick)
				el.question.onFirstBtnClick = field.onSelectBtnClick;

			if(field.onKeyUpEvent)
				el.question.onKeyUpFunc = field.onKeyUpEvent;

			if(field.onClickEvent && el instanceof ButtonFieldComponent)
			{
				const elButton = <ButtonFieldComponent>(el);
				elButton.onSubmitFunc.subscribe(() => {
					field.onClickEvent()
				});
			}
		}

		el.enableFirstBtn = field?.showFirstBtn;
		if(!field.hasOwnProperty('enableIcon') && field.hasOwnProperty('labelIcon'))
			UtilsService.onDebug('Icon is set but not active', DebugType.WARN);

		el.enableIcon = field?.enableLabelIcon;
		el.labelIcon = field?.labelIcon;
		el.question.order = field.hasOwnProperty('index') ? field.index  : this.order++;
		if(el.question.key === '')
		{
			switch (el.question.controlType)
			{
				case 'textbox':
				case 'autocomplete':
				case 'number':
					el.question.key = 'nieuw_veld' + el.question.order;
					break;
				case 'textarea':
					el.question.key = 'nieuw_gebied' + el.question.order;
					break;
				case 'dropdown':
					el.question.key = 'nieuw_selectie' + el.question.order;
					break;
				case 'time':
					el.question.key = 'nieuw_time' + el.question.order;
					break;
				case 'date':
					el.question.key = 'nieuw_date' + el.question.order;
					break;
				case 'checkbox':
					el.question.key = 'nieuw_checkbox' + el.question.order;
					break;
				case 'checkbox_multi':
					break;
				case 'submitbutton':
					el.question.key = 'nieuw_knopveld' + el.question.order;
					break;
			}
		}

		el.question.id = ++this.order;
		el.showLabels = this.showLabels;
		el.value = el.question.value;
		// el.setValue = el.question.value;

		if(el instanceof DropDownFieldComponent)
		{
			const elDropdown = <DropDownFieldComponent>(el);
			elDropdown.relationDropDown = field ? field?.relationDropDown : false;
			if(field?.sort)
			{
				if (field.hasOwnProperty('sortDirection') && (typeof field.sortDirection !== 'string'))
					elDropdown.onOptionsChanged = field.sortDirection;
				else
				{
					switch(field.sortDirection)
					{
						case 'ASC':
						default:
							elDropdown.onOptionsChanged = (options: any[]) => options.sort((a, b) => Number(a.value) - Number(b.value));
							break;
						case 'DESC':
							elDropdown.onOptionsChanged = (options: any[]) => options.sort((a, b) => Number(b.value) - Number(a.value));
							break;
					}
				}
			}
		}

		if(el instanceof ButtonFieldComponent)
		{
			const elButton = <ButtonFieldComponent>(el);
			elButton.ghost = field.ghost ?? true;
		}

		this.questions.set(el.question.key, el);
		return this.formContainer.addIfNotExist(el.question);
	}

	protected removeComponent(ref: ComponentRef<any>)
	{
		try
		{
			const index = this.components.indexOf(ref);
			if (index > -1)
			{
				// remove the question from the list
				this.questions.delete(ref.instance.question.key)
				// remove the component created from the list.
				this.components.splice(index, 1);
				// destroy the ref
				ref.destroy();
				// remove the ref from the service.
				this.dynamicComponentService.delete(ref);
			}
		}
		catch(e)
		{
			UtilsService.onError(e);
		}
	}
}
