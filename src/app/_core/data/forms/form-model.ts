/**
 * Created by Valencio Hoffman on 26-03-17.
 */

import {
	AbstractControl,
	AbstractControlOptions, AsyncValidatorFn,
	FormControl,
	FormGroup,
	ValidatorFn,
	Validators,
} from '@angular/forms';
import { FormQuestionBase } from './form-types'

// TODO create instance types in a function
/**
 * 	createInstance<A extends FormQuestionBase<any>>(c: new () => A): A
 * 	{
 * 	    return new c();
 * 	}
 */

export interface Question<T>
{
	id: number;
	key: string;
	value: T;
	disabled: boolean;
	required: boolean;
	order: number;
	validatorOrOpts?: ValidatorFn | ValidatorFn[] | AbstractControlOptions | null;
	asyncValidator?: AsyncValidatorFn | AsyncValidatorFn[] | null;
}

export class QuestFormContainer
{
	public questions: Question<any>[] = [];

	public id_form: number = 0;
	public required_text: string = 'required';
	public title: string = '';
	public alias: string = '';
	public status: number = 0;
	public submit_url: string = '';
	public tstamp: number = 0;

	private formGroup: FormGroup = new FormGroup({});

	public get form()
	{
		return this.formGroup;
	}

	public get(key: string): AbstractControl | null
	{
		if(this.formGroup && this.formGroup.controls[key])
			return this.formGroup.controls[key];

		return null;
	}

	public set(key: string, value: any, updateQuestion = true)
	{
		this.toGroup().controls[key]?.setValue(value);
		// Also update the question
		if(updateQuestion && this.getQuestion(key))
			this.getQuestion(key).value = value;
	}

	public getQuestion(key: string)
	{
		return this.questions.find((q) => q.key === key );
	}

	public get value()
	{
		return this.toGroup().value;
	}

	public markDirty(): void
	{
		this.toGroup().markAsDirty();
	}

	public isValid(): boolean
	{
		return this.toGroup().valid;
	}

	public clear()
	{
		this.questions.forEach((q) => this.formGroup.removeControl(q.key));
	}

	public constructor(
		{
			id = 0,
			requiredText = '',
			title = '',
			alias = '',
			status = 0,
			url = '',
		} = {})
	{
		this.id_form = id || 0;
		this.required_text = requiredText || '';
		this.title = title || '';
		this.alias = alias || '';
		this.status = status || 0;
		this.submit_url = url || '';
	}

	public add<T>(formQuestionBase: Question<T>)
	{
		QuestFormContainer.create(this.formGroup.controls, formQuestionBase);
		this.questions.push(formQuestionBase);
	}

	public addIfNotExist<T>(formQuestionBase: Question<T>): FormControl
	{
		const q = this.questions.find((question) => question.id === formQuestionBase.id);
		if(!q)
		{
			const control = QuestFormContainer.create(this.formGroup.controls, formQuestionBase);
			this.questions.push(formQuestionBase);
			return control;
		}

		return <FormControl>this.formGroup.controls[q.key];
	}

	public toGroup(force: boolean = false): FormGroup
	{
		// if the group is empty generate one.
		if(!this.formGroup) this.formGroup = this.generate();

		if(force && this.formGroup)
		{
			this.formGroup = this.generate();
		}

		return this.formGroup;
	}

	public sort(compareFn?: (a: Question<any>, b: Question<any>) => number)
	{
		if(compareFn)
			this.questions.sort(compareFn);
		else
			this.questions.sort((a, b) => a.order - b.order);
	}

	private generate()
	{
		const group: any = [];
		this.questions.forEach((question) =>
		{
			QuestFormContainer.create(group, question);
			// group[question.key].value = question.value;
		});
		return new FormGroup(group);
	}

	private static create<T>(group: any, question: Question<T>): FormControl
	{
		const validators = Object.values(question.validatorOrOpts ?? {});
		const asyncValidators = Object.values(question.asyncValidator?? {});

		if (question.required)
		{
			validators.push(Validators.required);

			group[question.key] = new FormControl(
				{ value: question.value,  disabled: question.disabled },
				validators, asyncValidators,
			);

		} else
		{
			group[question.key] = new FormControl(
				{ value: question.value, disabled: question.disabled },
				validators, asyncValidators,
			);
		}

		return group[question.key];
	}
}

export class FormContainer
{
	public questions: FormQuestionBase<any>[] = [];

	public id_form: number = 0;
	public required_text: string = 'required';
	public title: string = '';
	public alias: string = '';
	public status: number = 0;
	public submit_url: string = '';
	public tstamp: number = 0;
	private _tstamp_updated: number = 0;

	private formGroup: FormGroup = new FormGroup({});

	constructor(
	{
		id = 0,
		requiredText = '',
		title = '',
		alias = '',
		status = 0,
		url = '',
	} = {})
	{
		this.id_form = id || 0;
		this.required_text = requiredText || '';
		this.title = title || '';
		this.alias = alias || '';
		this.status = status || 0;
		this.submit_url = url || '';
	}

	public get(key: string)
	{
		return this.formGroup.controls[key];
	}

	public add(formQuestionBase: FormQuestionBase<any>)
	{
		FormContainer.create(this.formGroup.controls, formQuestionBase);
		this.questions.push(formQuestionBase);
	}

	public addIfNotExist(formQuestionBase: FormQuestionBase<any>)
	{
		if(!this.questions.find((question) => question.id === formQuestionBase.id))
		{
			FormContainer.create(this.formGroup.controls, formQuestionBase);
			this.questions.push(formQuestionBase);
		}
	}

	public markDirty(): void
	{
		this.toGroup().markAsDirty();
	}

	public isValid(): boolean
	{
		return this.toGroup().valid;
	}

	public toGroup(force: boolean = false): FormGroup
	{
		// if the group is empty generate one.
		if(!this.formGroup) this.formGroup = this.generate();

		if(force && this.formGroup)
		{
			this.formGroup = this.generate();
		}

		return this.formGroup;
	}

	public sort(compareFn?: (a: FormQuestionBase<any>, b: FormQuestionBase<any>) => number)
	{
		if(compareFn)
			this.questions.sort(compareFn);
		else
			this.questions.sort((a, b) => a.order - b.order);
	}

	public getTitle()
	{
		// console.log(this);
		return this.title;
	}

	private generate()
	{
		const group: any = [];
		this.questions.forEach((question) =>
		{
			FormContainer.create(group, question);
		});
		return new FormGroup(group);
	}

	private static create(group: any, question: FormQuestionBase<any>)
	{
		if (question.required)
		{
			group[question.key] = new FormControl({ value: '',  disabled: question.disabled }, [Validators.required]);
		} else
		{
			group[question.key] = new FormControl({ value: '',  disabled: question.disabled })
		}
		group[question.key].value = question.value;
	}
}
