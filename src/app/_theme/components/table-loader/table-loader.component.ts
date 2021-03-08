import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { DropDownQuestion } from '@app-core/data/forms/form-types';
import { NbSelectComponent } from '@nebular/theme';

@Component({
	selector: 'ngx-table-loader',
	template: `
		<div class="form-group d-flex">
			<label class="formHeading flex-grow-1" for="{{ listQuestion.key }}--dropdown">{{ listQuestion.text }}</label>
			<nb-select
				#selectComponent
				id="{{ listQuestion.key }}--dropdown"
				fullWidth
				[placeholder]="listQuestion.placeholder"
				[selected]="listQuestion.value"
				[disabled]="listQuestion.disabled"
				[attr.disabled]="listQuestion.disabled ? '' : null"
				[hidden]="listQuestion.hidden"
				(selectedChange)="onSelect($event)">
				<nb-option *ngIf="relationDropDown" [value]="defaultValue">None</nb-option>
				<nb-option *ngFor="let o of listQuestion.options$ | async" [disabled]="o.disabled"
						   [value]="o.value">{{ o.key }}</nb-option>
			</nb-select>
			<nb-icon icon="minus-circle-outline" class="ml-2" (click)="onDelete()"></nb-icon>
		</div>
	`,
})
export class TableLoaderComponent
{
	@Input()
	public id: number = 0;

	@Input()
	public relationDropDown: boolean = true;

	@ViewChild('selectComponent', { static: true })
	public selectComponent: NbSelectComponent = null;

	@Output()
	public select: EventEmitter<{ id, event }> = new EventEmitter<{ id, event }>();

	@Output()
	public delete: EventEmitter<number> = new EventEmitter<number>();

	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	public listQuestion: DropDownQuestion = new DropDownQuestion({ text: 'Dialogue', value: Number.MAX_SAFE_INTEGER });

	public onSelect(event: number)
	{
		this.select.emit({ id: this.id, event });
	}

	public onDelete()
	{
		this.delete.emit(this.id);
	}
}
