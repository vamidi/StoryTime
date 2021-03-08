import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormQuestionBase } from '@app-core/data/forms/form-types';

/**
 * @brief - LABEL COMPONENT
 */
@Component({
	selector: 'ngx-label-field',
	template:
		`
		<label class="formHeading w-100 d-flex" for="{{ question.key }}--{{ question.controlType }}"
			   *ngIf="question && showLabels">
			<span class="flex-grow-1">{{ question.text }}<span *ngIf="question.required">*</span></span>
			<nb-icon *ngIf="enableIcon" [icon]="labelIcon" (click)="onIconClick.emit()" class="click"></nb-icon>
		</label>

		<nb-alert
			*ngIf="myFormGroup &&
			myFormGroup.controls[question.key].pending" status="info">
			<span *ngIf="myFormGroup.controls[question.key].pending">Searching for project name</span>
		</nb-alert>

		<nb-alert
			*ngIf="myFormGroup &&
			!myFormGroup.controls[question.key]?.valid &&
			myFormGroup.controls[question.key]?.touched &&
			myFormGroup.controls[question.key]?.dirty &&
			myFormGroup.controls[question.key].errors"
			[status]="!myFormGroup && myFormGroup.controls[question.key]?.valid && myFormGroup.controls[question.key]?.dirty ? 'success': 'warning'">
			<!-- TODO Custom validator text -->
			<span *ngIf="myFormGroup.controls[question.key].errors?.required">{{ question.errorText }}</span>
			<span *ngIf="myFormGroup.controls[question.key].errors?.exists">Column name already exists</span>
			<span *ngIf="projectCheck">Project already exists</span>
		</nb-alert>
		<!-- <pre>{{ myFormGroup.controls[question.key].errors | json }}</pre> -->
	`,
})
export class LabelFieldComponent
{
	@Input()
	public myFormGroup: FormGroup = null;

	@Input()
	public question: FormQuestionBase<any> = null;

	@Input()
	public showLabels: boolean = false;

	@Input()
	public enableIcon: boolean = false;

	@Input()
	public labelIcon: string = '';

	public get projectCheck()
	{
		const hasProp = this.myFormGroup && this.myFormGroup.controls[this.question.key].errors.hasOwnProperty('projectAvailable')

		return hasProp && !this.myFormGroup.controls[this.question.key].errors?.projectAvailable;
	}

	@Output()
	public onIconClick: EventEmitter<void> = new EventEmitter<void>();
}
