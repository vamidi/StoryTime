import {
	ChangeDetectorRef,
	Component,
	Input,
	OnChanges,
	OnInit,
	SimpleChanges,
	Type,
} from '@angular/core';
import { Control } from 'visualne';
import { AngularControl } from 'visualne-angular-plugin';

@Component({
	template: `<input type="number" [value]="value" [readonly]="readonly" (change)="change(+$event.target.value)">`,
	styles: [`
        input {
			/*border-radius: 30px;*/
			background-color: transparent;
			padding: 2px 6px;
			border: 1px solid #fff;
			color: white;
			font-size: 14px;
			width: 60px;
			box-sizing: border-box;
			border-radius: 0;
		}
	`],
})
export class NumberComponent implements OnInit, OnChanges
{
	@Input() value!: number;
	@Input() readonly!: boolean;
	@Input() change!: Function;
	@Input() mounted!: Function;

	constructor(public cdr: ChangeDetectorRef) { }

	ngOnInit()
	{
		this.mounted();
	}

	ngOnChanges(changes: SimpleChanges)
	{
		console.log(changes);
	}
}

export class NumControl extends Control implements AngularControl
{
	component: Type<NumberComponent>;
	props: { [key: string]: unknown };

	child: NumberComponent;

	constructor(public emitter, public key, readonly = false)
	{
		super(key);

		this.component = NumberComponent;
		this.props = {
			parent: this,
			readonly,
			change: v => this.onChange(v),
			value: 0,
			mounted: () => this.setValue(+(this.getData(key) as any) || 0),
		};
	}

	onChange(val: number)
	{
		this.setValue(val);
		this.emitter.trigger('process');
	}

	setValue(val: number)
	{
		this.props.value = +val;

		if(this.child)
			this.child.value = +val;

		this.putData(this.key, this.props.value)
	}

	onComponentAttached(comp: NumberComponent)
	{
		this.child = comp;
	}
}
