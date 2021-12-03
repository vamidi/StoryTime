import {
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter, forwardRef,
	Inject,
	Input, NgZone,
	Output,
	Renderer2,
} from '@angular/core';
import { BaseFormInputComponent, IFormInputField } from '@app-theme/components/form/form.component';
import { TextboxQuestion } from '@app-core/data/forms/form-types';
import { NB_DOCUMENT } from '@nebular/theme';
import { FocusMonitor } from '@angular/cdk/a11y';


@Component({
	selector: 'ngx-basic-text-field',
	template:
		`
		<div class="form-group {{ question.groupCss }}"
			 *ngIf="question.controlType !== 'textarea' && question.controlType !== 'autocomplete'">

			<ngx-label-field class="d-inline-block" [question]="question" [showLabels]="showLabels && !hidden"></ngx-label-field>
			<nb-icon *ngIf="enableFirstBtn" icon="minus-circle-outline" class="ml-2" (click)="delete()"></nb-icon>

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
	providers: [
		{ provide: BaseFormInputComponent, useExisting: forwardRef(() => BasicTextFieldInputComponent), multi: true },
	],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicTextFieldInputComponent<T = string | number> extends BaseFormInputComponent<T>
{
	@Input()
	public value: T = null;

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	@Input()
	public set setValue(value: T)
	{
		this.writeValue(value);
	}

	@Output()
	public onKeyUpFunc: EventEmitter<KeyboardEvent> = new EventEmitter<KeyboardEvent>();

	@Output()
	public onDelete: EventEmitter<number> = new EventEmitter<number>();

	public set hidden(b: boolean) { this.question.hidden = this.isHidden = b }
	public get hidden() { return this.isHidden; }

	public index: number = -1;
	public question: TextboxQuestion<T> = new TextboxQuestion<T>({ type: 'text' });

	public showLabels = false;

	protected isHidden: boolean = false;

	public constructor(
		@Inject(NB_DOCUMENT) protected document,
		protected elementRef: ElementRef<HTMLElement>,
		protected cd: ChangeDetectorRef,
		protected focusMonitor: FocusMonitor,
		protected renderer: Renderer2,
		protected zone: NgZone,
	) {
		super(elementRef, cd, renderer, zone);
	}

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

	public delete()
	{
		this.question.onFirstBtnClick({ event: {
				target: {
					id: this.question.id,
					key: this.question.key,
					controlType: this.question.controlType,
					name: this.question.name,
					value: this.question.value,
				},
			},
		});
		this.onDelete.emit();
	}
}
