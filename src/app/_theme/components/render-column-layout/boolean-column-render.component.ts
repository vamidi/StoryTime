import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	OnInit,
} from '@angular/core';

import { DefaultEditor } from '@vamidicreations/ng2-smart-table';
import { DropDownQuestion, Option } from '@app-core/data/forms/form-types';
import { BehaviorSubject } from 'rxjs';

@Component({
	template: `
		<div *ngIf="cell.getColumn().isEditable">
            <nb-select id="{{ question.key }}--dropdown"
                       fullWidth
                       [(selected)]="defaultValue"
                       [placeholder]="question.placeholder" (selectedChange)="onChange($event)">
	            <nb-option *ngFor="let o of question.options$ | async" [value]="o.value">{{ o.key }}</nb-option>
            </nb-select>
		</div>
        <div *ngIf="!cell.getColumn().isEditable">
            <nb-select id="{{ question.key }}--dropdown" fullWidth
                       [(selected)]="question.value"
                       placeholder="{{ question.value }}" disabled>
            </nb-select>
        </div>
	`,
})
export class BooleanColumnRenderComponent extends DefaultEditor implements OnInit, AfterViewInit
{
	public question: DropDownQuestion = new DropDownQuestion({
		text: 'Name',
		name: 'Test text',
		placeholder: 'Select relation',
		required: true,
		options: new BehaviorSubject<any[]>([]),
	});

	public defaultValue: boolean = false;

	constructor(private cd: ChangeDetectorRef)
	{
		super();
	}

	// TODO this data should be automatic for relation ship columns
	ngOnInit(): void
	{
		const value: boolean = this.cell.getValue();
		this.question.value = this.defaultValue = value;
		this.question.options$.next([
			new Option<boolean>( { key: 'false', value: false, selected: value === false }),
			new Option<boolean>( { key: 'true', value: true, selected: value === true }),
		]);
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public onChange(event: any)
	{
		const type = this.cell.getColumn().type;
		if(type === 'custom')
		{
			this.cell.newValue = event === 'true';
		} else if( type === 'string')
		{
			this.cell.newValue = event === 'true';
		} else if (type === 'number')
		{
			this.cell.newValue = event === 'true';
		} else
		{
			this.cell.newValue = event === 'true';
		}
	}
}
