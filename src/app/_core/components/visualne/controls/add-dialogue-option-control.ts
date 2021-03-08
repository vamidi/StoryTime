import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnInit,
	Type,
} from '@angular/core';
import { Control, NodeEditor, Input as ReteInput } from 'visualne';
import { AngularControl } from 'visualne-angular-plugin';
import { FirebaseService } from '../../../utils/firebase.service';
import { dialogueOptionSocket } from '@app-core/components/visualne/sockets';
import { UtilsService } from '../../../utils';
// import * as uuid from 'uuid';

@Component({
	template: `
<!--		<input type="number" [value]="value" [readonly]="readonly" (change)="change(+$event.target.value)">-->
		<button nbButton fullWidth status="primary" (click)="AddNewSocket()">+</button>
	`,
	styles: [`
		button {
			max-width: 90%;
		}
	`],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddDialogueComponent implements OnInit, AfterViewInit
{
	@Input() value!: any;
	@Input() change!: Function;
	@Input() addSocket: Function;

	/**
	 * @brief - Call the parent function --> the component connected
	 */
	@Input() mounted!: Function;

	@Input()
	public id!: number;

	public dialogueId: number = null;
	public characterId: number = null;

	@Input()
	public dialogues!: any[];

	@Input()
	public characters!: any[];

	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	public selectedDialogue: string = '';

	constructor(
		protected firebaseService: FirebaseService,
		protected cd: ChangeDetectorRef)
	{ }

	ngOnInit()
	{
		this.mounted();
	}

	ngAfterViewInit(): void
	{
	}

	public AddNewSocket()
	{
		this.addSocket();
	}
}

export class AddDialogueOptionControl extends Control implements AngularControl
{
	component: Type<AddDialogueComponent>;
	props: { [key: string]: unknown };

	constructor(
		public emitter: NodeEditor,
		public key: string,
		public id: number,
		public dialogues: any[],
		public characters: any[])
	{
		super(key);

		this.component = AddDialogueComponent;
		this.props =
			{
				id,
				dialogues,
				characters,
				addSocket: () => this.addNewSocket(),
				change: v => this.onChange(v),
				value: {},
				mounted: () => this.setValue((this.getData(key) as any) || {}),
			};

		this.props.value = {
			dialogueId: id,
			text: '',
			characterId: Number.MAX_SAFE_INTEGER,
			storyId: Number.MAX_SAFE_INTEGER,
			nextId: Number.MAX_SAFE_INTEGER,
		};
	}

	public onSave(firebaseService: FirebaseService, id: number, data: any)
	{
		data = {
			...data,
			tstamp: UtilsService.timestamp,
		};
		// console.log(id, data);
		firebaseService.updateItem(id, data, true, 'dialogues').then(() => { });
	}

	onChange(val: any)
	{
		this.setValue(val);
		this.emitter.trigger('process');
	}

	setValue(val: any)
	{
		this.props.value = val;
		this.putData(this.key, this.props.value);
	}

	public addNewSocket()
	{

		// when you add a new one it gets -1, so you can add new options
		console.log(this.getNode().inputs.get('OptionIn_-1'));

		this.getNode().addInput(new ReteInput(
			'OptionIn_-1', 'In ID [ undefined ]', dialogueOptionSocket));
	}
}
