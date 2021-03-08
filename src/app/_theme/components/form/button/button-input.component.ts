import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	forwardRef,
	Inject,
	Input, NgZone,
	Output, Renderer2,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormInputComponent } from '../form.component';
import { ButtonQuestion } from '@app-core/data/forms/form-types';
import { NB_DOCUMENT } from '@nebular/theme';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
	selector: 'ngx-button-field',
	template:
		`
		<!-- Normal button -->

		<div class="form-group {{ question.groupCss }}" [ngStyle]="{ 'display': 'inline-block' }"
			 [formGroup]="myFormGroup" *ngIf="myFormGroup && question.controlType !== 'stepper'">
			<!-- BUTTON -->
			<button nbButton [ghost]="ghost"
				[attr.disabled]="question.disabled ? '' : null"
			    [status]="question.controlType === 'button' || myFormGroup.valid && myFormGroup.dirty ? 'primary' : 'basic'"
			    (click)="onSend()"
				[type]="'submit'"
				[ngClass]="question.inputCss"
				[disabled]="myFormGroup && myFormGroup.dirty && !myFormGroup.valid || question.controlType === 'button'">{{ question.value }}</button>
		</div>

		<!-- Stepper button -->
		{{ question.disabled }}
		<div class="form-group {{ question.groupCss }}" [ngStyle]="{ 'display': 'inline-block' }"
			 [formGroup]="myFormGroup" *ngIf="myFormGroup && question.controlType === 'stepper'">
			<button nbButton [ghost]="ghost"
				nbStepperNext
				[attr.disabled]="myFormGroup && (!myFormGroup.valid || !myFormGroup.dirty) || question.disabled ? '' : null"
				[status]="myFormGroup && myFormGroup.valid && myFormGroup.dirty || !question.disabled ? 'primary' : 'basic'"
				[disabled]="myFormGroup && !myFormGroup.dirty && !myFormGroup.valid || question.disabled">{{ question.value }}</button>
		</div>
	`,
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => ButtonFieldComponent), multi: true },
		// { provide: NbFormFieldControl, useExisting: ButtonFieldComponent },
	],
})
export class ButtonFieldComponent extends BaseFormInputComponent<string>
{
	@Input()
	public set setValue(value: any)
	{
		this.writeValue(value);
	}

	@Input()
	public ghost: boolean = true;

	@Input()
	public value: string = 'submit';

	public question: ButtonQuestion = new ButtonQuestion({ type: 'submit' });

	@Output()
	public onSubmitFunc: EventEmitter<any> = new EventEmitter<any>();

	public writeValue(value: any)
	{
		this.value = value;
	}

	public constructor(
		@Inject(NB_DOCUMENT) protected document,
		protected hostRef: ElementRef<HTMLElement>,
		protected cd: ChangeDetectorRef,
		protected focusMonitor: FocusMonitor,
		protected renderer: Renderer2,
		protected zone: NgZone,
	)
	{
		super(hostRef, cd, renderer, zone);
	}

	public onSend()
	{
		if(this.onSubmitFunc)
			this.onSubmitFunc.emit();
	}
}
