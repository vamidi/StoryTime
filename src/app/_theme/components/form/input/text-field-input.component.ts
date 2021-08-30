import {
	AfterViewInit,
	ChangeDetectorRef,
	Component, ElementRef, EventEmitter,
	forwardRef, Inject, Input, NgZone,
	OnInit, Output, Renderer2, ViewChild,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { BaseFormInputComponent } from '../form.component';
import { TextboxQuestion } from '@app-core/data/forms/form-types';
import { NB_DOCUMENT } from '@nebular/theme';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
	selector: 'ngx-text-field',
	template: `
		<!-- <div class="col-sm-6"> -->
			<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup"
				 *ngIf="question.controlType !== 'textarea' && question.controlType !== 'autocomplete'">
				<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !Hidden"></ngx-label-field>

				<!-- TEXT BOX -->

				<!-- [type]="question.hidden ? 'hidden' : question.controlType" -->
				<input #inputElement
					   id="{{ question.key }}--textbox"
					   [formControlName]="question.key"
					   (blur)="trySetTouched($event)"
					   [hidden]="Hidden"
					   [type]="question.controlType"
					   [value]="question.value"
					   [placeholder]="question.text"
					   [name]="question.name"
					   [readOnly]="question.readOnly"
					   [attr.disabled]="question.disabled ? '' : null"
					   [required]="question.required"
					   [ngClass]="[myFormGroup.controls[question.key]?.valid ? 'status-success ' : 'status-danger ' + question.inputCss]"
					   (keyup)="onKeyUpFunc($event)"
					   nbInput
					   fullWidth
					   autofocus
				/>

				<!-- TODO maybe add dynamic content if needed -->
				<div [class.hidden]="!showButtons || Hidden">
					<button nbButton status="primary" class="mt-2 mr-2" (click)="onCancelClick.emit()">Cancel</button>
					<button nbButton status="success" class="mt-2" (click)="onPrimaryClick.emit()">{{ successText }}</button>
				</div>
			</div>

			<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup" *ngIf="question.controlType === 'textarea'">
				<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !Hidden"></ngx-label-field>

				<!-- TEXT BOX -->
				<textarea #inputElement id="{{ question.key }}--area"
						  [formControlName]="question.key"
						  (blur)="trySetTouched($event)"
						  [class.hidden]="question.hidden"
						  [value]="question.value"
						  [placeholder]="question.text"
						  [name]="question.name"
						  [readOnly]="question.readOnly"
						  [attr.disabled]="question.disabled ? '' : null"
						  [required]="question.required"
						  [ngClass]="[myFormGroup.controls[question.key]?.valid ? 'status-success ' : 'status-danger ' + question.inputCss]"
						  (keyup)="onKeyUpFunc($event)"
						  nbInput
						  fullWidth
						  autofocus>
				</textarea>

				<!-- TODO maybe add dynamic content if needed -->
				<div [class.hidden]="!showButtons || Hidden">
					<button nbButton status="primary" class="mt-2 mr-2" (click)="onCancelClick.emit()">Cancel</button>
					<button nbButton status="success" class="mt-2" (click)="onPrimaryClick.emit()">{{ successText }}</button>
				</div>
			</div>

			<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup" *ngIf="question.controlType === 'autocomplete'">
				<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !Hidden"></ngx-label-field>
				<input *ngIf="question.controlType === 'autocomplete'"
					   [formControl]="control"
					   nbInput
					   fullWidth
					   type="text"
					   placeholder="Enter value"
					   [nbAutocomplete]="auto"/>

				<nb-autocomplete #auto [handleDisplayFn]="viewHandler" (selectedChange)="onSelected($event)">

					<nb-option *ngFor="let option of question.filteredOptions$ | async" [value]="option.value">
						{{ option.key }}
					</nb-option>

				</nb-autocomplete>

				<ng-content></ng-content>

			</div>
		<!-- </div> -->
	`,
	styleUrls: [
		'./../form.component.scss',
	],
	providers: [
		{ provide: BaseFormInputComponent, useExisting: forwardRef(() => TextFieldComponent), multi: true },
	],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent<T = string | number> extends BaseFormInputComponent<T>
	implements OnInit, AfterViewInit, ControlValueAccessor
{
	@ViewChild('inputElement', { read: ElementRef, static: true })
	public inputElement: ElementRef<HTMLInputElement>;

	@Input()
	public successText: string = '';

	@Input()
	public cancelText: string = '';

	@Input()
	public value: T | null = null;

	@Input()
	public showButtons: boolean = false;

	@Output()
	public onPrimaryClick: EventEmitter<void> = new EventEmitter<void>();

	@Output()
	public onCancelClick: EventEmitter<void> = new EventEmitter<void>();

	public viewHandler: Function = this.viewHandle;

	/**
	 * Sets touched if focus moved outside of button and overlay,
	 * ignoring the case when focus moved to options overlay.
	 */
	public trySetTouched(event: any)
	{
		if (!this.Hidden)
		{
			this.onTouched(this.validate(event));
		}
	}

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	@Input()
	public set setValue(value: T)
	{
		this.writeValue(value);
	}

	public writeValue(value: T): void
	{
		this.question.value = this.value = value;

		if(this.parent.formContainer.get(this.question.key))
		{
			const control = this.parent.formContainer.get(this.question.key);
			control.setValue(this.value);
			control.markAsDirty({ onlySelf: true });
			control.markAsTouched({ onlySelf: true });
		}
	}

	/** ControlValueAccessor **/

	public registerOnChange(fn: any): void
	{
		// this.onChange = fn;
	}

	public registerOnTouched(fn: any): void
	{
		// this.onTouched = fn;
	}

	public question: TextboxQuestion<T> = new TextboxQuestion<T>({ type: 'text', hidden: false });

	// Events
	@Output()
	public onKeyUp: EventEmitter<any> = new EventEmitter<any>();

	@Output()
	public onSelect: EventEmitter<any> = new EventEmitter<any>();

	constructor(@Inject(NB_DOCUMENT) protected document,
	            protected hostRef: ElementRef<HTMLElement>,
				protected cd: ChangeDetectorRef,
				protected focusMonitor: FocusMonitor,
				protected renderer: Renderer2,
				protected zone: NgZone)
	{
		super(hostRef, cd, renderer, zone);
	}

	public ngOnInit()
	{
		super.ngOnInit();

		// nbTooltip="This section defines the stats that the class will have in the game" nbTooltipPlacement="top" nbTooltipStatus="basic"

		this.onTouched = (value: T ) =>
		{
			this.writeValue(value);
		};
	}

	public ngAfterViewInit(): void
	{
		super.ngAfterViewInit();

		setTimeout(() =>
		{
			if (this.checkForm() && this.myFormGroup && this.value !== null)
			{
				// const control = this.parent.formContainer.get(this.question.key);
				// control.setValue(this.value);
				// control.markAsDirty({ onlySelf: true });
				// control.markAsTouched({ onlySelf: true });
			}
		}, 1000);
	}

	// Events
	public onKeyUpFunc(event: any)
	{
		const newValue: T = this.validate(event) as T;
		if(this.checkForm() && this.myFormGroup)
		{
			this.writeValue(newValue);

			// this.question.value = event.target.value;
			// this.myFormGroup.controls[this.question.key].setValue(this.question.value);
			// this.myFormGroup.controls[this.question.key].markAsDirty();
		}

		this.question.onKeyUpFunc(newValue);

		if(this.onKeyUp)
			this.onKeyUp.emit(event);
	}

	public onSelected(event: any)
	{
		this.question.onSelectFunc(event);

		if(this.onSelect)
			this.onSelect.emit(event);
	}

	public viewHandle(value: string)
	{
		return value;
	}

	protected validate(event): any
	{
		const isNumber = this.question.controlType === 'number';
		if(event.target.value === '')
			return event.target.value;

		return isNumber ? event.target.valueAsNumber : event.target.value;
	}
}
