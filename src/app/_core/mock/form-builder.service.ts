import { Injectable } from '@angular/core';
import { Factory } from '@app-core/data/base/factory-generics';
import {
	ButtonQuestion,
	CheckboxMultipleQuestion, DateQuestion,
	DropDownQuestion,
	FormQuestionBase,
	Option, RadioQuestion,
	TextAreaQuestion,
	TextboxQuestion, TimeQuestion,
} from '@app-core/data/forms/form-types';
import { FormGroup } from '@angular/forms';
import { FormContainer } from '@app-core/data/forms/form-model';

/**
 * @brief - This a context used in the firebase service.
 * @deprecated - use component out of pages\forms\form.
 */
export class FormContext
{
	title: string = '';
	id_form: number = 0;
	alias: string = '';
	questions: any[] = [];
	submit_url: string = '';
	required_text: string = '';

	constructor({ id_form, alias, questins, submit_url, required_text }: any)
	{
		this.id_form = id_form || 0;
		this.alias = alias || '';
		this.questions = questins || [];
		this.submit_url = submit_url || '';
		this.required_text = required_text;
	}
}

/**
 * @brief - This service could help you set up forms to put data
 * in the database or adjust or deleted.
 * This however became to focus only on one form in a session,
 * so you could never have two forms in one session.
 * @NOTICE - Look up pages\forms\form for new components
 * @version 1.0.0
 * @deprecated
 */
@Injectable()
export class FormBuilderService
{
	public myForm: FormGroup;
	public formModel: FormContainer;

	protected factory: Factory = new Factory();
	protected order: number = 0;
	protected status: number = 0;
	protected loading: boolean = false;
	protected adding: boolean  = false;
	protected nodes: any[] = [];

	constructor()
	{
		this.formModel = new FormContainer({ title: '' });
	}

	public initialize(title: string, formContext: FormContext)
	{
		// set all variables of the grabbed form.
		this.formModel.title = title;
		this.formModel.id_form = formContext.id_form;
		this.formModel.alias = formContext.alias;
		this.formModel.submit_url = formContext.submit_url;
		this.formModel.required_text = formContext.required_text;
		this.formModel.questions.sort((a, b) => a.order - b.order);
		this.myForm = this.formModel.toGroup();
	}

	public afterViewInit()
	{
		// setTimeout(() =>
		// {
		// 	this.formModel.questions.forEach((question: FormQuestionBase<any>) => {
		// 		question.selected = question.getSelected();
		// 	});
		// }, 100);
	}

	public reset()
	{
		if(this.formModel)
		{
			this.order = 0;
			this.nodes = [];
			this.formModel.questions = this.nodes;
		}
	}

	public addToForm(question: FormQuestionBase<any>)
	{
		// Increase order size
		this.increment();
		// first set the same order
		this.formModel.questions = this.nodes;
		// push the new question
		this.formModel.questions.push(question);
		this.myForm = this.formModel.toGroup();
		// set the new field in the
		this.nodes = this.formModel.questions;
		// update the tree
		// this.tree.treeModel.update();
		this.adding = false;
	}

	// ELEMENTS
	public addTextField(
		{ value, text, name, required, override, errorText, controlType }: any,
		onKeyUpCallback: Function = null): TextboxQuestion
	{
		if (!this.adding)
		{
			this.adding = true;

			const question = this.factory.create(TextboxQuestion,{
				id: this.order + 1,
				order: this.order,
				name: name,
				key: 'nieuw_veld' + this.order,
				value: value,
				text: text,
				required: required,
				override: override,
				errorText: errorText,
				controlType: controlType,
				type: 'text',
			});

			if(onKeyUpCallback)
				question.onKeyUpFunc = onKeyUpCallback;

			this.addToForm(question);

			return question;
		}

		return null;
	}

	public addTextArea()
	{
		if (!this.adding)
		{
			this.adding = true;
			const question = this.factory.create(TextAreaQuestion, {
				id:  this.order + 1,
				order: this.order,
				key: 'nieuw_gebied' + this.order,
				text: '',
				value: '',
				required: false,
			});
			this.addToForm(question);
		}
	}

	public addOption(options: Option<any>[])
	{
		options.push(new Option<string>({ key: '', value: 'Geen selectie', selected: false }));
		// this.tree.treeModel.update();
	}

	public addSelectionList(
		{ value, text, name, required, options }: any,
		onSelectCallback: Function = null ): DropDownQuestion
	{
		if (!this.adding)
		{
			this.adding = true;
			const ddQuestion = this.factory.create(DropDownQuestion,{
				value: value,
				key: 'nieuw_selectie' + this.order,
				name: name,
				text: text,
				required: required,
				options: options,
				id: this.order + 1,
				order: this.order,
			});

			if(onSelectCallback)
				ddQuestion.onSelectFunc = onSelectCallback;

			this.addToForm(ddQuestion);

			return ddQuestion;
		}

		return null;
	}

	public static makeSelectionList(
		value: string, text: string, name: string, required: boolean,
		placeholder: string,
		options: Option<any>[], order: number, disabled = false): DropDownQuestion
	{
		const factory = new Factory();
		return factory.create(DropDownQuestion,{
			value: value,
			key: 'nieuw_selectie' + order,
			name: name,
			text: text,
			required: required,
			placeholder: placeholder,
			options: options,
			id: order + 1,
			order: order,
			disabled: disabled,
		});
	}

	public addSelection()
	{
		if (!this.adding)
		{
			this.adding = true;

			const ddQuestion = this.factory.create(RadioQuestion, {
				key: 'nieuw_selectie' + this.order,
				text: '',
				type: 'radio',
				required: false,
				options: [
					new Option({ key: '', value: 'Geen selectie', selected: true }),
				],
				id: this.order + 1,
				order: this.order,
			});
			this.addToForm(ddQuestion);
		}
	}

	public addSelectionMultiple()
	{
		if (!this.adding)
		{
			this.adding = true;
			const ddQuestion = this.factory.create(CheckboxMultipleQuestion, {
				key: 'nieuw_selectie' + this.order,
				type: 'checkbox',
				text: '',
				required: false,
				options: [
					new Option({ key: '', value: 'Geen selectie', selected: true }),
				],
				id: this.order + 1,
				order: this.order,
			});
			this.addToForm(ddQuestion);
		}
	}

	public addDateField()
	{
		if (!this.adding)
		{
			this.adding = true;
			const ddQuestion = this.factory.create(DateQuestion, {
				key: 'nieuw_date' + this.order,
				type: 'date',
				text: 'Date',
				required: false,
				id: this.order + 1,
				order: this.order,
			});
			this.addToForm(ddQuestion);
		}
	}

	public addTimeField()
	{
		if (!this.adding)
		{
			this.adding = true;
			const ddQuestion = this.factory.create(TimeQuestion, {
				key: 'nieuw_time' + this.order,
				type: 'time',
				text: 'Time',
				required: false,
				min_time: '17:00',
				id: this.order + 1,
				order: this.order,
			});
			this.addToForm(ddQuestion);
		}
	}

	public addSubmitButton(): ButtonQuestion
	{
		if (!this.adding)
		{
			this.adding = true;
			const question = this.factory.create(ButtonQuestion,
				{
					id: this.order + 1,
					order: this.order,
					key: 'nieuw_knopveld' + this.order,
					text: '',
					value: 'Send',
					required: false,
					type: 'submit',
				});
			this.addToForm(question);

			return question;
		}

		return null;
	}

	protected increment(): void
	{
		this.order += 1;
	}

	// Dont use the function without checking the order
	// unless you know what you do
	protected decrement(): void
	{
		this.order -= 1;
	}
}
