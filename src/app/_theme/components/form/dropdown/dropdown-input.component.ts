import {
	ChangeDetectorRef,
	Component, ElementRef,
	EventEmitter,
	forwardRef,
	Inject,
	Input, NgZone, OnDestroy,
	OnInit,
	Output, Renderer2,
	ViewChild,
} from '@angular/core';
import { BaseFormInputComponent } from '../form.component';
import { DropDownQuestion } from '@app-core/data/forms/form-types';
import { NB_DOCUMENT, NbSelectComponent } from '@nebular/theme';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ControlValueAccessor } from '@angular/forms';

@Component({
	selector: 'ngx-dropdown-field',
	template:
		`
		<div class="form-group {{ question.groupCss }}" [formGroup]="myFormGroup">
			<ngx-label-field
				[myFormGroup]="myFormGroup"
				[question]="question"
				[showLabels]="showLabels && !Hidden"
				[enableIcon]="enableIcon" [labelIcon]="labelIcon"
				(onIconClick)="onIconClick()">
			</ngx-label-field>

			<!-- DROPDOWN -->
			<nb-select
				id="{{ question.key }}--dropdown"
				fullWidth
				#selectComponent
				[placeholder]="question.placeholder"
				[hidden]="Hidden"
				[selected]="question.value"
				[attr.disabled]="question.disabled ? '' : null"
				[formControlName]="question.key"
				[required]="question.required"
				(selectedChange)="onSelect($event)">
				<nb-option *ngIf="relationDropDown" [value]="defaultValue">None</nb-option>
				<nb-option *ngFor="let o of question.options$ | async" [disabled]="o.disabled"
				           [value]="o.value">{{ o.key }}</nb-option>
			</nb-select>
		</div>
	`,
	styleUrls: [
		'./../form.component.scss',
	],
	providers: [
		{ provide: BaseFormInputComponent, useExisting: forwardRef(() => DropDownFieldComponent), multi: true },
		// { provide: NbFormFieldControl, useExisting: TextFieldComponent },
	],
})
export class DropDownFieldComponent extends BaseFormInputComponent<string | number | boolean>
	implements OnInit, ControlValueAccessor, OnDestroy
{
	@Input()
	public relationDropDown: boolean = false;

	@Input()
	public value: string | number | boolean = '';

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	@Input()
	public set setValue(value: string | number | boolean)
	{
		this.writeValue(value);
	}

	@Output()
	public onSelectFunc: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('selectComponent', { static: true })
	public selectComponent: NbSelectComponent = null;

	public question: DropDownQuestion = new DropDownQuestion({ value: Number.MAX_SAFE_INTEGER });

	public defaultValue: string | number | boolean = Number.MAX_SAFE_INTEGER;

	public onOptionsChanged: Function = null;

	public writeValue(value: any): void
	{
		this.question.value = this.value = value;
	}
	public registerOnChange(fn: (_: any) => {}): void
	{
		// this.onChange = fn;
	}
	public registerOnTouched(fn: () => {}): void
	{
		// this.onTouched = fn;
	}

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

	public ngOnInit()
	{
		super.ngOnInit();

		this.disabled$.subscribe((disabled: boolean) =>
		{
			this.question.disabled = disabled;
			this.question.trigger('disableCheck',
				{ control: this.myFormGroup.controls[this.question.key], event: this.question.disabled });
		});

		if(this.onOptionsChanged)
			this.question.options$.subscribe((options) => this.onOptionsChanged(options));

		if(this.relationDropDown)
		{
			this.myFormGroup.controls[this.question.key].setErrors({required: true});
		}
	}

	public ngOnDestroy()
	{
		this.disabled$.unsubscribe();
	}

	public onSelect(event: any)
	{
		if (this.parent && this.myFormGroup)
		{
			this.question.value = event;
			this.control.setValue(this.question.value);
			this.control.markAsDirty();
			this.myFormGroup.markAsDirty();
		}

		this.question.onSelectFunc(event);

		if (this.onSelectFunc)
			this.onSelectFunc.emit(event);
	}
}
