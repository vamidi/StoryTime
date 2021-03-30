import { NbControlTypes, Option } from '@app-core/data/forms/form-types';
import { AbstractControlOptions, AsyncValidatorFn, ValidatorFn } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

export declare type NbSortingDirection = 'ASC' | 'DESC';

export interface FormField<T> {
	// key: string;
	value: T;
	type?: T;
	id?: number;
	groupCss?: string;
	inputCss?: string;
	name: string;
	text: string;
	placeholder?: string;
	errorText?: string;
	required?: boolean;
	hidden?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	required_text?: string;
	order?: number;
	controlType: NbControlTypes;
	options$?: BehaviorSubject<Option<T>[]>;
	// operatorFunctions?: any[];
	sort?: boolean;
	sortDirection?: NbSortingDirection | Function;

	onSelectEvent?: Function,
	onKeyUpEvent?: Function,
	onClickEvent?: Function,
	onIconClickEvent?: Function,
	onSelectBtnClick?: Function,

	showFirstBtn?: boolean,

	relationDropDown?: boolean; // is this a relation drop down
	validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null;
	asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null;
}


export class BaseFormSettings
{
	id?: number = 0;
	title?: string = '';
	alias: string = '';
	requiredText: string = '';
	// Type & Option field Type
	fields: { [key: string]: FormField<any> } = {

	};
}
