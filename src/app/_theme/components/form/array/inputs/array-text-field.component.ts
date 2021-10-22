import { Component, forwardRef, Input, OnInit } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ArrayBaseFieldComponent } from './base-field.component';

@Component({
	selector: 'ngx-array-text-field',
	template: `
		{{ index }}
		<input
			[formControlName]="index"
			nbInput
			fullWidth/>
	`,
	providers: [
		{ provide: ArrayBaseFieldComponent, useExisting: forwardRef(() => ArrayTextFieldComponent), multi: true },
	],
})
export class ArrayTextFieldComponent<T = string | number> extends ArrayBaseFieldComponent<T>
	implements OnInit, ControlValueAccessor
{
	@Input()
	public index = 0;

	constructor() {
		super();
	}

	ngOnInit() {
	}

	writeValue(obj: T): void { }

	registerOnChange(fn: any): void { }

	registerOnTouched(fn: any): void { }

	setDisabledState(isDisabled: boolean): void { }
}
