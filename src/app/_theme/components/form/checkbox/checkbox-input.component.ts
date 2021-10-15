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
import { CheckBoxQuestion } from '@app-core/data/forms/form-types';
import { NB_DOCUMENT } from '@nebular/theme';
import { FocusMonitor } from '@angular/cdk/a11y';

@Component({
	selector: 'ngx-checkbox-field',
	template:
		`
		<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup"
		     *ngIf="question.controlType !== 'textarea' && question.controlType !== 'autocomplete'">
				<ngx-label-field [myFormGroup]="myFormGroup" [question]="question" [showLabels]="showLabels && !Hidden"></ngx-label-field>
				<nb-checkbox
				status="success"
				[checked]="question.value"
				[attr.disabled]="question.disabled ? '' : null"
				(checkedChange)="toggle($event)"
				[status]="myFormGroup.valid && myFormGroup.dirty ? 'primary' : 'basic'"
				[ngClass]="question.inputCss">{{ question.text }}</nb-checkbox>
		</div>
	`,
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxFieldComponent), multi: true },
		// { provide: NbFormFieldControl, useExisting: CheckboxFieldComponent },
	],
})
export class CheckboxFieldComponent extends BaseFormInputComponent<boolean>
{
	@Input()
	public value: boolean = false;

	@Input()
	public set setValue(value: boolean)
	{
		this.writeValue(value)
	}
	public writeValue(value: boolean)
	{
		this.question.value = this.value = value;
	}

	@Output()
	public onToggleEvent: EventEmitter<any> = new EventEmitter<any>();

	public question: CheckBoxQuestion  = new CheckBoxQuestion({ value: false });

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

	public toggle(event: any)
	{
		if(this.question !== null)
		{
			this.writeValue(event);

			this.question.onSelectFunc({key: this.question.key, value: event});

			if(this.onToggleEvent)
				this.onToggleEvent.emit({ key: this.question.key, value: event });
		}
	}
}
