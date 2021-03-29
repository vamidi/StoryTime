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
	template:
		`
		<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup"
			 *ngIf="question.controlType !== 'textarea' && question.controlType !== 'autocomplete'">
			<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !hidden"></ngx-label-field>

			<!-- TEXT BOX -->

			<input #inputElement
				   id="{{ question.key }}--textbox"
				   [formControlName]="question.key"
				   (blur)="trySetTouched($event)"
				   [type]="question.hidden ? 'hidden' : question.controlType"
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
			/>

			<!-- TODO maybe add dynamic content if needed -->
			<div [class.hidden]="!showButtons || hidden">
				<button nbButton status="primary" class="mt-2 mr-2" (click)="onCancelClick.emit()">Cancel</button>
				<button nbButton status="success" class="mt-2" (click)="onPrimaryClick.emit()">{{ successText }}</button>
			</div>
		</div>

		<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup" *ngIf="question.controlType === 'textarea'">
			<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !hidden"></ngx-label-field>

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
					  fullWidth>
			</textarea>

			<!-- TODO maybe add dynamic content if needed -->
			<div [class.hidden]="!showButtons || hidden">
				<button nbButton status="primary" class="mt-2 mr-2" (click)="onCancelClick.emit()">Cancel</button>
				<button nbButton status="success" class="mt-2" (click)="onPrimaryClick.emit()">{{ successText }}</button>
			</div>
		</div>

		<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup" *ngIf="question.controlType === 'autocomplete'">
			<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !hidden"></ngx-label-field>
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
	`,
	styleUrls: [
		'./../form.component.scss',
	],
	providers: [
		{ provide: BaseFormInputComponent, useExisting: forwardRef(() => TextFieldComponent), multi: true },
	],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent extends BaseFormInputComponent<string | number>
	implements OnInit, AfterViewInit, ControlValueAccessor
{
	@ViewChild('inputElement', { read: ElementRef, static: true })
	public inputElement: ElementRef<HTMLInputElement>;

	@Input()
	public successText: string = '';

	@Input()
	public cancelText: string = '';

	@Input()
	public value: string | number | null = null;

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
		if (!this.hidden)
		{
			this.onTouched(event.target.value);
		}
	}

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	@Input()
	public set setValue(value: string | number)
	{
		this.writeValue(value);
	}
	public get getValue()
	{
		return this.value;
	}

	public writeValue(value: string | number): void
	{
		if(this.question.controlType  === 'number')
		{
			this.question.value = this.value = String(value) !== '' ? Number(value) : '';
		}
		else
		{
			this.question.value = this.value = String(value) ?? '';
		}

		if(this.parent.formContainer.get(this.question.key))
			this.parent.formContainer.get(this.question.key).setValue(this.question.value);
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

	public setDisabledState(isDisabled: boolean): void
	{
		this.disabled = isDisabled;
		this.cd.markForCheck();
	}

	public question: TextboxQuestion = new TextboxQuestion({ type: 'text' });

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
		this.onTouched = (value: string | number ) =>
		{
			this.writeValue(value);
		};
	}

	public ngAfterViewInit(): void
	{
		super.ngAfterViewInit();

		setTimeout(() =>
		{
			if (this.checkForm() && this.myFormGroup && this.value !== null && this.value !== '')
			{
				this.myFormGroup.controls[this.question.key].setValue(this.value);
				this.myFormGroup.controls[this.question.key].markAsDirty({ onlySelf: true });
				this.myFormGroup.controls[this.question.key].markAsTouched({ onlySelf: true });
			}
		}, 1000);
	}

	// Events
	public onKeyUpFunc(event: any)
	{
		if(this.checkForm() && this.myFormGroup)
		{
			this.writeValue(event.target.value);
			// this.question.value = event.target.value;
			// this.myFormGroup.controls[this.question.key].setValue(this.question.value);
			// this.myFormGroup.controls[this.question.key].markAsDirty();
		}

		this.question.onKeyUpFunc(event.target.value);

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
}
