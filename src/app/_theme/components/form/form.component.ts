import {
	AfterViewInit, ChangeDetectorRef,
	Component,
	ContentChildren, ElementRef,
	EventEmitter, Input, NgZone, OnChanges,
	OnInit, Output,
	QueryList, Renderer2, SimpleChanges,
} from '@angular/core';
import { FormContainer } from '@app-core/data/forms/form-model';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { FormQuestionBase } from '@app-core/data/forms/form-types';
import { DynamicFormComponent } from '@app-theme/components/form/dynamic-form.component';
import { FormControl, FormGroup } from '@angular/forms';
import { UtilsService } from '@app-core/utils';

export interface IFormInputField<T>
{
	// Question of the input component
	question: FormQuestionBase<T>;
}

/**
 * @description
 *
 * @example
 */
@Component({
	template: '',
})
export abstract class BaseFormInputComponent<T> implements OnInit, AfterViewInit, OnChanges, IFormInputField<T>
{
	public abstract value: T = null;

	@Input()
	public parent: DynamicFormComponent = null;

	@Input()
	public myFormGroup: FormGroup = null;

	@Input()
	public groupCss: string = '';

	@Input()
	public inputCss: string = '';

	@Input()
	public enableIcon: boolean = false;

	@Input()
	public enableFirstBtn: boolean = true;

	@Input()
	public labelIcon: string = '';

	@Input()
	public onComponentInit: EventEmitter<BaseFormInputComponent<any>> = new EventEmitter<BaseFormInputComponent<any>>();

	@Output()
	public onIconClickFunc: EventEmitter<void> = new EventEmitter<void>();

	public get key()
	{
		return this.question.key;
	}

	public get control(): FormControl
	{
		return <FormControl>this.myFormGroup.controls[this.question.key];
	}

	/* tslint:disable:max-line-length */
	public set assignPipe(obs: Observable<any>)
	{
		this.question.filteredOptions$ = obs;
	}

	public setDisabledState(isDisabled: boolean): void
	{
		this.disabled = isDisabled;
		this.disabled$.next(this.disabled);
		this.cd.markForCheck();
	}

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	public abstract set setValue(value: T);
	public abstract writeValue(value: T);

	/*
  	 * @docs-private
 	 *
 	*/
	public focused$ = new BehaviorSubject<boolean>(false);

	/*
	 * @docs-private
	 **/
	protected disabled: boolean = false;
	public disabled$ = new BehaviorSubject<boolean>(this.disabled);

	protected isHidden: boolean = false;
	public set hidden(b: boolean) { this.question.hidden = this.isHidden = b }
	public get hidden() { return this.isHidden; }
	public showLabels = false;

	protected destroy$ = new Subject<void>();

	/**
	 * Function passed through control value accessor to propagate changes.
	 * */
	protected onChange: Function = () => {};
	protected onTouched: Function = () => {};

	// Question of the input component
	public abstract question: FormQuestionBase<T>;

	protected constructor(
		protected hostRef: ElementRef<HTMLElement>,
		protected cd: ChangeDetectorRef,
		protected renderer: Renderer2,
		protected zone: NgZone)
	{
	}

	public ngOnInit()
	{
		if(this.parent)
			this.myFormGroup = this.parent.formContainer.form;

		this.question.groupCss = this.groupCss;
		this.question.inputCss = this.inputCss;

		if(!this.myFormGroup)
			UtilsService.onError('Did you assign all the field to the form container?', this.question.key);

	}

	ngOnChanges({ disabled, hidden, status, size}: SimpleChanges)
	{
		if (disabled)
		{
			this.disabled$.next(disabled.currentValue);
			this.question.disabled = disabled.currentValue;
			this.question.trigger('disableCheck',
				{ control: this.myFormGroup.controls[this.question.key], event: this.question.disabled });
		}
		/*
		if (status) {
			this.status$.next(status.currentValue);
		}
		if (size) {
			this.size$.next(size.currentValue);
		}
		 */
	}

	public ngAfterViewInit()
	{
		if(!this.myFormGroup)
			UtilsService.onError(`There is no form group, did you forget to add it? ${this.key}`, this);

		// Notify that we are initialized
		this.onComponentInit.emit(this);

		// TODO: #2254
		this.zone.runOutsideAngular(() => setTimeout(() => {
			this.renderer.addClass(this.hostRef.nativeElement, 'nb-transition');
		}));
	}

	public checkForm(): boolean
	{
		return (this.parent !== null);
	}

	public onIconClick()
	{
		this.question.onIconClickFunc();

		if (this.onIconClickFunc)
			this.onIconClickFunc.emit();
	}
}

/**
 * @title FormComponent
 * @brief - Form component for creating forms
 * @deprecated - This class is deprecated
 */
@Component({
	selector: 'ngx-form',
	template: `
		<form [formGroup]="container.toGroup()" (ngSubmit)="container.toGroup().valid && send()">
<!--			<pre>{{ container.toGroup().valid }}</pre>-->
			<pre *ngFor="let control of controls">{{ control.status }}</pre>
			<ng-content></ng-content>
		</form>`,
	styleUrls: [
		'form.component.scss',
	],
})
export class FormComponent
{
	public controls: any[] = [];

	// Events
	@Output()
	public onSendForm: EventEmitter<any> = new EventEmitter<any>();

	@Input()
	public title: string = '';

	@Input()
	public id_form: number = 0;

	@Input()
	public alias: string = '';

	@Input()
	public submitUrl: string = '';

	@Input()
	public requiredText: string = '';

	@Input()
	public showLabels: boolean = false;

	@Input()
	public container: FormContainer = null;

	@ContentChildren(BaseFormInputComponent)
	private formElements: QueryList<BaseFormInputComponent<any>>;

	private order: number = 0;

	public addElement(formComponent: BaseFormInputComponent<any>): BaseFormInputComponent<any>
	{
		// Reset the elements
		// this.formElements.reset([...this.formElements.toArray(), formComponent]);
		// this.generate();

		this.configureFormComponent(formComponent);
		return formComponent;
	}

	public generate()
	{
		if(this.formElements.length !== 0)
		{
			this.formElements.forEach((el, index, array) =>
			{
				this.configureFormComponent(array[index]);

				const control = this.container.toGroup().controls[el.question.key];
				if(control)
				{
					this.controls.push(control);
				}
			});
		}
	}

	public send()
	{
		if(this.onSendForm)
			this.onSendForm.emit();
	}

	protected configureFormComponent(el: BaseFormInputComponent<any>)
	{
		/*
		if (el.parent === null)
			el.parent = this;

		if(el.key === '')
		{
			el.question.id = this.order + 1;

			switch (el.question.controlType)
			{
				case 'textbox':
					el.key = el.question.key = 'nieuw_veld' + this.order++;
					break;
				case 'textarea':
					el.key = el.question.key = 'nieuw_gebied' + this.order++;
					break;
				case 'dropdown':
					el.key = el.question.key = 'nieuw_selectie' + this.order++;
					break;
				case 'time':
					el.key = el.question.key = 'nieuw_time' + this.order++;
					break;
				case 'date':
					el.key = el.question.key = 'nieuw_date' + this.order++;
					break;
				case 'checkbox':
					el.key = el.question.key = 'nieuw_checkbox' + this.order++;
					break;
				case 'checkbox_multi':
					break;
				case 'submitbutton':
					el.key = el.question.key = 'nieuw_knopveld' + this.order++;
					break;

			}
		}
		else
		{
			el.question.id = ++this.order;
		}

		el.showLabels = this.showLabels;

		 */
		this.container.addIfNotExist(el.question);
	}
}
