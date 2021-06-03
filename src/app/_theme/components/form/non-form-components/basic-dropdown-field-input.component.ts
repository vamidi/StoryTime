import { Component, EventEmitter, Output } from '@angular/core';
import { IFormInputField } from '@app-theme/components/form/form.component';
import { TextboxQuestion } from '@app-core/data/forms/form-types';

@Component({
	selector: 'ngx-basic-text-field',
	template:
		`
			<div class="form-group {{ question.groupCss }}">
				<ngx-label-field
					[question]="question"
					[showLabels]="showLabels && !hidden"
					[enableIcon]="enableIcon" [labelIcon]="labelIcon"
					(onIconClick)="onIconClick()">
				</ngx-label-field>

				<!-- DROPDOWN -->
				<nb-select
					id="{{ question.key }}--dropdown"
					fullWidth
					#selectComponent
					[placeholder]="question.placeholder"
					[selected]="question.value"
					[attr.disabled]="question.disabled ? '' : null"
					[hidden]="question.hidden"
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
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicDropdownFieldInputComponent<T = string | number | boolean> implements IFormInputField<T>
{
	@Output()
	public onSelectFunc: EventEmitter<any>;

	public set hidden(b: boolean) { this.question.hidden = this.isHidden = b }
	public get hidden() { return this.isHidden; }

	public index: number = 0;
	public question: TextboxQuestion<T> = new TextboxQuestion<T>({ type: 'text' });

	public relationDropDown: boolean = false;
	public readonly defaultValue: number = Number.MAX_SAFE_INTEGER;
	public showLabels = false;

	protected isHidden: boolean = false;
	protected value: T = null;

	public writeValue(value: T): void
	{
		this.question.value = this.value = value;
	}

	public onSelect(event: any)
	{
		if(this.onSelectFunc)
			this.onSelectFunc.emit(event);
	}
}
