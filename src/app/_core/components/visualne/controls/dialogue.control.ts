import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	Input,
	OnInit,
	Type,
} from '@angular/core';
import { Control, NodeEditor } from 'visualne';
import { AngularControl } from 'visualne-angular-plugin';
import { FirebaseService } from '../../../utils/firebase.service';
import { NbToastrService } from '@nebular/theme';

class AngularComponentControl
{
	parent: Control;
}

@Component({
	template: `<input type="number" [value]="value" [readonly]="readonly" (change)="change(+$event.target.value)">`,
	styleUrls: ['./dialogue-control.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogueControlComponent extends AngularComponentControl implements OnInit
{
	@Input() value!: number;
	@Input() readonly!: boolean;
	@Input() change!: Function;

	/**
	 * @brief - Call the parent function --> the component connected
	 */
	@Input() mounted!: Function;

	constructor(
		protected firebaseService: FirebaseService,
		protected toastrService: NbToastrService,
		protected cd: ChangeDetectorRef)
	{ super(); }

	public ngOnInit()
	{
		this.mounted();

		console.log(this.parent);
	}
}

export class DialogueControl extends Control implements AngularControl
{
	component = DialogueControlComponent;
	props: { [key: string]: unknown };

	constructor(public emitter: NodeEditor, public key: string, readonly = false)
	{
		super(key);

		this.props = {
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
		this.putData(this.key, this.props.value)
	}
}
