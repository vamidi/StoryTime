import {
	ChangeDetectorRef,
	Component, ElementRef,
	Input, NgZone,
	OnInit, Renderer2,
} from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { BaseFormInputComponent } from '@app-theme/components/form/form.component';
import { FormQuestionBase, Option } from '@app-core/data/forms/form-types';
import { NbParameterCurves, StatType } from '@app-core/data/database/interfaces';
import { Table } from '@app-core/data/state/tables';
import { LanguageService } from '@app-core/data/state/projects';

@Component({
	selector: 'ngx-array-form',
	templateUrl: 'array-form.component.html',
})
export class ArrayFormComponent<T= string | number | boolean> extends BaseFormInputComponent<T> implements OnInit
{
	public statTypes: Option<StatType>[] = [
		new Option({ key: 'Flat', value: StatType.Flat, selected: true }),
		new Option({ key: 'Percentage', value: StatType.PercentAdd, selected: false }),
		new Option({ key: 'Percentage multiplier', value: StatType.PercentMulti, selected: false }),
	];

	@Input()
	public parameterCurves: Table<NbParameterCurves> = null;

	public get stats(): Option<number>[] {
		const stats: Option<number>[] = [];
		if (this.parameterCurves)
			this.parameterCurves.forEach((curve) => {
				stats.push(new Option(
					{ key: LanguageService.GetLanguageFromProperty(curve.paramName, 'en'), value: 0, selected: true },
					),
				);
			});

		return stats;
	}

	/**
	 * Accepts selected item or array of selected items.
	 *
	 */
	@Input()
	public set setValue(value: T)
	{
		this.writeValue(value);
	}

	public value: T;
	public question: FormQuestionBase<T> = null;

	public get formArray(): FormArray {
		return this.myFormGroup.get('skills') as FormArray;
	}

	public get formGroup(): FormGroup {
		return this.myFormGroup.get('skills') as FormGroup;
	}

	public constructor(
		protected hostRef: ElementRef<HTMLElement>,
		protected cd: ChangeDetectorRef,
		protected renderer: Renderer2,
		protected zone: NgZone,
	)
	{
		super(hostRef, cd, renderer, zone);
	}

	public ngOnInit()
	{
		if(this.parent)
			this.myFormGroup = this.parent.formContainer.form;

		this.myFormGroup.addControl('skills', new FormArray([]));
	}

	add() {
		this.formArray.push(new FormGroup({
			'stat-id': new FormControl(Number.MAX_SAFE_INTEGER),
			'stat-modifier': new FormControl('Alias'),
			'stat-input': new FormControl(10),
			'stat-type': new FormControl(100),
		}));
	}

	clear() {
		this.formArray.clear();
	}

	public remove(index: number) {
		this.formArray.removeAt(index);
	}

	writeValue(value: T) {
	}
}
