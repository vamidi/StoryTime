import { UtilsService } from '@app-core/utils';
import {
	AbstractControl,
	AbstractControlOptions,
	AsyncValidatorFn,
	FormGroup,
	ValidatorFn,
} from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';

export declare type NbControlTypes = 'textbox' |
	'number' |
	'autocomplete' |
	'textarea' | 'dropdown' | 'time' | 'date' | 'checkbox' | 'checkbox_multi' | 'button' | 'submitbutton' | 'stepper' | 'btn-dropdown';

export declare type NbControlEvents = 'disableCheck';

/**
 * Created by Valencio Hoffman on 26-03-17.
 */
export abstract class FormQuestionBase<T>
{
	public value: T = null;
	public id: number = -1;
	public key: string = '';
	public groupCss: string = '';
	public inputCss: string = '';
	public name: string = '';
	public text: string = '';
	public placeholder: string = '';
	public errorText: string = '';
	public required: boolean = false;
	public hidden: boolean = false;
	public disabled: boolean = false;
	public readOnly: boolean = false;
	public required_text: string = 'Required';
	public order: number = -1;
	public controlType: NbControlTypes = 'textbox';
	public options$: BehaviorSubject<Option<T>[]> = new BehaviorSubject([]);
	public filteredOptions$: Observable<Option<any>[]>;
	public validatorOrOpts: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null = null;
	public asyncValidator: AsyncValidatorFn | AsyncValidatorFn[] | null = null;

	public onSelectFunc: Function = (event: any, optional: any = null) => UtilsService.onDebug(event);
	public onKeyUpFunc: Function = (event: any) => UtilsService.onDebug(event);
	public onIconClickFunc: Function = () => UtilsService.onDebug('icon clicked');
	public onFirstBtnClick: Function = () => UtilsService.onDebug('first button clicked');

	public set (value, formGroup: FormGroup): AbstractControl
	{
		this.value = value;
		formGroup.controls[this.key].setValue(this.value);
		return formGroup.controls[this.key];
	}

	public get(formGroup: FormGroup)
	{
		return formGroup.controls[this.key];
	}

	protected constructor(data: any)
	{
		this.value = data.value !== null ? data.value : null;
		this.id = data.id || -1;
		this.key = data.key || '';
		this.groupCss = data.groupCss || '';
		this.inputCss = data.inputCss || '';
		this.name = data.name;
		this.text = data.text;
		this.errorText = data.errorText || '';
		this.required = data.required !== null ? data.required : false;
		this.required_text = data.required_text;
		this.order = data.order;
		this.controlType = data.controlType;
		this.options$ = data.options || new BehaviorSubject([]);
		this.disabled = data.disabled !== null ? data.disabled : false;
		this.hidden = data.hidden !== null ? data.hidden : false;
	}

	public trigger(method: NbControlEvents, data: { control: AbstractControl, event: any })
	{
		switch (method)
		{
			case 'disableCheck':
				if(data.event)
					data.control.disable();
				else
					data.control.enable();
				break;
			default: break;
		}
	}

	public getSelected(): T
	{
		let selected: T = null;
		this.options$.getValue().forEach((option: Option<T>) =>
		{
			if(option.selected === true)
			{
				// console.log(option.key);
				selected = option.value;
			}
		});

		return selected;
	}
}

export class Option<T>
{
	id: number = -1;
	key: string;
	value: T;
	selected: boolean;
	disabled: boolean = false;

	constructor(option: { id?: number, key: string, value: T, selected: boolean, disabled?: boolean })
	{
		this.id = option.id ?? -1;
		this.key = option.key || '';
		this.value = option.value ?? null;
		this.selected = option.selected || false;
		this.disabled = option.disabled || false;
	}
}

export class DropDownQuestion extends FormQuestionBase<string | number | boolean>
{
	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'dropdown' });
		super(data);

		// Set value if this is a dropdown
		this.value = this.getSelected();
	}
}

export class RadioQuestion extends FormQuestionBase<string> {
	constructor(data: any)
	{
		super(data);
	}
}

export class CheckboxMultipleQuestion extends FormQuestionBase<string> {

	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'checkbox_multi' });
		super(data);
	}
}

export class TextboxQuestion<T = string | number> extends FormQuestionBase<T>
{

	constructor(data: any)
	{
		data = Object.assign(data, { controlType : data.override ? data.controlType : 'textbox' });
		super(data);
	}
}

export class TextAreaQuestion extends FormQuestionBase<string> {

	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'textarea' });
		super(data);
	}
}

export class ButtonQuestion extends FormQuestionBase<string> {
	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'submitbutton' });
		super(data);
	}
}

export class DateQuestion extends FormQuestionBase<string> {
	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'date' });
		super(data);
	}
}

export class TimeQuestion extends FormQuestionBase<string>
{
	public min_time: string;
	public max_time: string;

	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'time' });
		super(data);

		this.min_time = data.min_time || '';
		this.max_time = data.max_time || '';
	}
}
export class CheckBoxQuestion extends FormQuestionBase<boolean>
{
	constructor(data: any)
	{
		data = Object.assign(data, { controlType : 'checkbox' });
		super(data);
	}
}
