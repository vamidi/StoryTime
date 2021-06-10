import { Component, EventEmitter, Output } from '@angular/core';
import { IFormInputField } from '@app-theme/components/form/form.component';
import { TextboxQuestion } from '@app-core/data/forms/form-types';


@Component({
	selector: 'ngx-basic-text-field',
	template:
		`
		<div class="form-group {{ question.groupCss }}"
			 *ngIf="question.controlType !== 'textarea' && question.controlType !== 'autocomplete'">
			<ngx-label-field [question]="question" [showLabels]="showLabels && !hidden"></ngx-label-field>

			<!-- TEXT BOX -->

			<input #inputElement
				   id="{{ question.key }}--textbox"
				   (blur)="trySetTouched($event)"
				   [type]="question.hidden ? 'hidden' : question.controlType"
				   [value]="question.value"
				   [placeholder]="question.text"
				   [name]="question.name"
				   [readOnly]="question.readOnly"
				   [attr.disabled]="question.disabled ? '' : null"
				   [required]="question.required"
				   [ngClass]="[question.inputCss]"
				   (keyup)="onKeyUp($event)"
				   nbInput
				   fullWidth
			/>
		</div>

		<div class="form-group {{ question.groupCss }}" *ngIf="question.controlType === 'textarea'">
			<ngx-label-field [question]="question" [showLabels]="showLabels && !hidden"></ngx-label-field>

			<!-- TEXT BOX -->
			<textarea #inputElement id="{{ question.key }}--area"
					  (blur)="trySetTouched($event)"
					  [class.hidden]="question.hidden"
					  [value]="question.value"
					  [placeholder]="question.text"
					  [name]="question.name"
					  [readOnly]="question.readOnly"
					  [attr.disabled]="question.disabled ? '' : null"
					  [required]="question.required"
					  [ngClass]="[question.inputCss]"
					  (keyup)="onKeyUp($event)"
					  nbInput
					  fullWidth
					  ngxTextareaAutoresize>
			</textarea>
		</div>
	`,
	styleUrls: [
		'./../form.component.scss',
	],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTextFieldInputComponent<T = string | number> implements IFormInputField<T>
{
	@Output()
	public onKeyUpFunc: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

	public set hidden(b: boolean) { this.question.hidden = this.isHidden = b }
	public get hidden() { return this.isHidden; }

	public index: number = -1;
	public question: TextboxQuestion<T> = new TextboxQuestion<T>({ type: 'text' });

	public showLabels = false;

	protected isHidden: boolean = false;
	protected value: T = null;

	public trySetTouched(event: any)
	{
		if (!this.hidden)
		{
			this.writeValue(event.target.value);
		}
	}

	public writeValue(value: T): void
	{
		this.question.value = this.value = value;
	}

	public onKeyUp(event: any)
	{
		if(this.onKeyUpFunc)
			this.onKeyUpFunc.emit(event.target.value);
	}
}
