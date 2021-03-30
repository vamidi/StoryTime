import {
	ChangeDetectorRef,
	Component, ElementRef,
	EventEmitter,
	forwardRef, Inject,
	Input, NgZone,
	Output, Renderer2,
} from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';

import { NB_DOCUMENT } from '@nebular/theme';

import { BaseFormInputComponent } from '@app-theme/components/form/form.component';
import { DropDownFieldComponent } from '@app-theme/components/form/dropdown/dropdown-input.component';

@Component({
	selector: 'ngx-select-btn',
	template: `
		<div class="form-group d-flex">
			<ngx-label-field
				[labelClass]="'flex-grow-1'"
				[myFormGroup]="myFormGroup"
				[question]="question"
				[showLabels]="showLabels && !hidden"
				[enableIcon]="enableIcon" [labelIcon]="labelIcon"
				(onIconClick)="onIconClick()">
			</ngx-label-field>
			<nb-select
				#selectComponent
				id="{{ question.key }}--dropdown"
				fullWidth
				[placeholder]="question.placeholder"
				[selected]="question.value"
				[disabled]="question.disabled"
				[attr.disabled]="question.disabled ? '' : null"
				[hidden]="question.hidden"
				(selectedChange)="onSelect($event)">
				<nb-option *ngIf="relationDropDown" [value]="defaultValue">None</nb-option>
				<nb-option *ngFor="let o of question.options$ | async" [disabled]="o.disabled"
						   [value]="o.value">{{ o.key }}</nb-option>
			</nb-select>
			<nb-icon *ngIf="enableFirstBtn" icon="minus-circle-outline" class="ml-2" (click)="onDelete()"></nb-icon>
		</div>
	`,
	providers: [
		{ provide: BaseFormInputComponent, useExisting: forwardRef(() => SelectFieldWithBtnComponent), multi: true },
	],
})
export class SelectFieldWithBtnComponent extends DropDownFieldComponent
{
	@Input()
	public id: number = null;

	@Output()
	public select: EventEmitter<{ id, event }> = new EventEmitter<{ id, event }>();

	@Output()
	public delete: EventEmitter<number> = new EventEmitter<number>();

	public constructor(
		@Inject(NB_DOCUMENT) protected document,
		protected elementRef: ElementRef<HTMLElement>,
		protected cd: ChangeDetectorRef,
		protected focusMonitor: FocusMonitor,
		protected renderer: Renderer2,
		protected zone: NgZone,
	) {
		super(document, elementRef, cd, focusMonitor, renderer, zone);

		this.question.text = 'Dialogue';
	}

	public onSelect(event: any)
	{
		super.onSelect(event);
		this.select.emit({ id: this.id, event });
	}

	public onDelete()
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
		this.delete.emit(this.id);
	}
}
