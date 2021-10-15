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
import { DropDownQuestion, Option } from '@app-core/data/forms/form-types';
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
export class DropDownFieldComponent<T = string | number | boolean> extends BaseFormInputComponent<T>
	implements OnInit, ControlValueAccessor, OnDestroy
{
	@Input()
	public relationDropDown: boolean = false;

	@Input()
	public value: T;

	@Input()
	public options: Option<T>[] = [];

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	@Input()
	public set setValue(value: T)
	{
		this.writeValue(value);
	}
	public get getValue(): T
	{
		return this.value;
	}

	@Output()
	public onSelectFunc: EventEmitter<any> = new EventEmitter<any>();

	@ViewChild('selectComponent', { static: true })
	public selectComponent: NbSelectComponent = null;

	public question: DropDownQuestion<T> = new DropDownQuestion<T>({ value: this.value });

	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	public onOptionsChanged: Function = null;

	public writeValue(value: any): void
	{
		this.question.value = this.value = value;
		this.control.setValue(this.question.value);
		this.control.markAsDirty();
		this.myFormGroup.markAsDirty();
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

	public ngPreInit()
	{
		super.ngPreInit();

		if(this.options.length)
			this.question.options$.next(this.options);
	}

	public ngOnInit()
	{
		super.ngOnInit();

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
			this.setValue = event;

		this.question.onSelectFunc(event);

		if (this.onSelectFunc)
			this.onSelectFunc.emit(event);
	}
}
