import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	Input,
	OnInit,
	Type,
} from '@angular/core';
import { Control } from 'visualne';
import { AngularControl } from 'visualne-angular-plugin';
import { FirebaseService } from '../../../utils/firebase.service';
import { UtilsService } from '../../../utils';
import { NbToastrService } from '@nebular/theme';
// import * as uuid from 'uuid';

import { DebugType } from '../../../utils/utils.service';
import { ProxyObject } from '../../../data/base';
import keys from 'lodash.keys';
import pick from 'lodash.pick';
import assign from 'lodash.assign';

@Component({
	template: `
		<div class="form-group" *ngIf="dialogues.length !== 0">
			<p class="text-alternate text-wrap">{{ getValue(getDialogue(dialogueId)) }}</p>
		</div>
	`,
	styleUrls: ['./dialogue-control.scss'],
	// changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogueComponent implements OnInit, AfterViewInit
{
	@Input() parent!: any;
	@Input() value!: any;
	@Input() change!: Function;
	@Input() save!: Function;

	/**
	 * @brief - Call the parent function --> the component connected
	 */
	@Input() mounted!: Function;

	@Input()
	public id!: number;

	public dialogueId: number = null;

	public dialogues: any[] = [];

	constructor(
		protected firebaseService: FirebaseService,
		protected toastrService: NbToastrService,
		protected cd: ChangeDetectorRef)
	{ }

	public ngOnInit()
	{
		this.mounted();
	}

	public ngAfterViewInit(): void
	{
		this.dialogueId = this.id;
	}

	public isNull()
	{
		return this.dialogueId === Number.MAX_SAFE_INTEGER;
	}
}

export class DialogueControl extends Control implements AngularControl
{
	component: Type<DialogueComponent>;
	props: {
		parent: DialogueControl,
		id: number,
		change: Function,
		save: Function,
		value: any,
		mounted: Function,
	};

	private child: DialogueComponent;

	constructor(
		public key: string,
		public id: number)
	{
		super(key);

		this.component = DialogueComponent;
		const value: { dialogueId: number, text, characterId, storyId, nextId } = {
			dialogueId: id,
			text: '',
			characterId: Number.MAX_SAFE_INTEGER,
			storyId: Number.MAX_SAFE_INTEGER,
			nextId: Number.MAX_SAFE_INTEGER,
		};
		this.props =
		{
			parent: this,
			id,
			change: v => this.onChange(v),
			save: (f: FirebaseService, i: number, data: any) => this.onSave(f, i, data),
			value: value,
			mounted: () => this.setValue((this.getData(key) as any) || value),
		};
	}

	public onSave(firebaseService: FirebaseService, id: number, data: any)
	{
		// Only save data we need in the database
		data = assign({}, pick(data, keys(firebaseService.getProxyObject('dialogues'))));
		data.tstamp = UtilsService.timestamp;
		UtilsService.onDebug(id, DebugType.TRACE, data);
		return firebaseService.updateItem(id, data, true,'dialogues');
	}

	onChange(val: any)
	{
		this.setValue(val);
		// this.emitter.trigger('process');
	}

	setValue(val: ProxyObject)
	{
		console.log(val);
		this.props.value = val;
		this.putData(this.key, this.props.value);
	}

	public onComponentAttached(comp: DialogueComponent)
	{
		this.child = comp;
	}

	public update()
	{
		this.child.value = this.props.value;
	}
}

/*
export class DialogueControl extends Control implements AngularControl
{
	component: Type<DialogueComponent>;
	props: { [key: string]: unknown };

	protected firebaseService: FirebaseService;

	private lastUID = 0;

	constructor(public emitter, public key, readonly = false)
	{
		super(key);

		this.component = DialogueComponent;
		this.props = {
			readonly,
			change: v => this.onChange(v),
			value: 0,
			mounted: () => this.setValue(+(this.getData(key) as any) || 0),
		};
	}

	constructor(
		public emitter: any,
		public key: any,
		public dialogueId: number,
		private readonly storyId = -1,
		private service: FirebaseService,
	)
	{
		super(key);

		this.firebaseService = service;
		this.mainTableRef = service.getList<TRowData>('dialogues');
		this.charTableRef = service.getList<TRowData>('characters');

		this.component = DialogueComponent;
		this.props = {
			id:  uuid.v4(),
			items: [],
			characters: [],
			characterId: 0,
			dialogueId: dialogueId,
			dialogueChange: v => this.onDialogueChange(v),
			textChange: v => this.onTextChange(v),
			charChange: v => this.onCharChange(v),
			mounted: () => this.setValue((this.getData(key) as any) || 0),
		};

		this.mainTableRef.snapshotChanges(['child_changed', 'child_removed'])
			.subscribe(list =>
			{
				list.forEach((snapshot: SnapshotAction<BaseResponse>) =>
				{
					// Get the reward payload
					const r: any = snapshot.payload.exists ? snapshot.payload.val() : { };
					switch(snapshot.type)
					{
						// if a value is inserted
						case 'value':
							this.onSnapshotValue(snapshot, r);
							break;
						// if a value has been changed
						case 'child_changed': // TODO change the one that has changed
							this.onSnapshotChanged(snapshot, r);
							break;
					}
				});
			})
		;

		this.charTableRef.snapshotChanges(['child_added', 'child_changed', 'child_removed'])
			.subscribe(list=>{
				list.forEach((snapshot: SnapshotAction<BaseResponse>) =>
				{
					// Get the reward payload
					const r: any = snapshot.payload.exists ? snapshot.payload.val() : { };
					switch(snapshot.type)
					{
						// if a value is inserted
						case 'value':
							if(snapshot.key !== 'deleted' && !(<any[]>(this.props.characters)).some((char) => char.id === +snapshot.key))
							{
								(<any[]>(this.props.characters)).push({id: +snapshot.key, name: r.name});
							}
							break;
						// if a value has been changed
						case 'child_changed': // TODO change the one that has changed
							if (snapshot.key !== 'deleted' && (<any[]>(this.props.characters)).some((char) => char.id === +snapshot.key))
							{
								// find the quest that has reference to it.
								const found: any[] = (<any[]>(this.props.characters)).filter(char => char.id === +snapshot.key);

								found.forEach(function(e)
								{
									e.name = r.name;
									e.deleted = r.deleted;
									e.tstamp = r.tstamp;
								});
							}
							break;
					}
				});
			})
		;

		service.getRef('dialogues').limitToLast(2).on('child_added', (snapshot) =>
		{
			if(snapshot && snapshot.ref) // also increment
			{
				// see if the key is a number
				const key: number = +snapshot.ref.key;
				this.lastUID = isNaN(key) ? this.lastUID : key + 1;
			}
		});
	}

	private onSnapshotValue(snapshot: SnapshotAction<BaseResponse>, r: any)
	{
		if (r.parentId !== Number.MAX_SAFE_INTEGER && r.parentId !== this.storyId)
			return;

		if (snapshot.key === 'deleted')
			return;

		// see if our element exists
		if(!(<any[]>(this.props.items)).some((item) => item.id === +snapshot.key))
		{
			(<any[]>(this.props.items)).push(new Dialogue({
				id: +snapshot.key || 0,
				characterId: r.characterId,
				text: r.text || '',
				tstamp: r.tstamp || '',
				deleted: r.deleted || false,
			}));

			if (+snapshot.key === this.props.dialogueId)
			{
				this.onDialogueChange(Number(this.props.dialogueId.toString(10)));
			}
		}
	}

	private onSnapshotChanged(snapshot: SnapshotAction<BaseResponse>, r: any)
	{
		if (r.parentId !== Number.MAX_SAFE_INTEGER && r.parentId !== this.storyId)
			return;

		if (snapshot.key === 'deleted')
			return;

		// if the key already exits change the existing one
		if ((<any[]>(this.props.items)).some((item) => item.id === +snapshot.key))
		{
			// find the quest that has reference to it.
			const found: Dialogue[] = (<any[]>(this.props.items)).filter(item => item.id === +snapshot.key);

			found.forEach(function(e)
			{
				e.text = r.text;
				e.deleted = r.deleted;
				e.characterId = r.characterId;
				e.next = r.next;
				e.tstamp = r.tstamp;
			});

			if (+snapshot.key === this.props.dialogueId)
			{
				this.onDialogueChange(+this.props.dialogueId.toString(10));
			}
		}
	}

	public getID(): number
	{
		return parseInt(<string>(this.props.dialogueId), 0);
	}

	public onDialogueChange(val: number)
	{
		const id = val || -1;

		if (id < 0)
		{
			this.props.dialogueId = -1;
			return true;
		}

		this.props.dialogueId = id;

		const l = (<any[]>(this.props.items)).find(item => item.id === id);

		if (l === undefined)
			return false;

		// (<HTMLInputElement>(document.getElementById(this.props.id + '-text'))).value = l.text;
		this.props.characterId = l.characterId.toString(10);

		this.setValue(val);
		this.emitter.trigger('process');
	}

	onTextChange(val: string)
	{

	}

	onCharChange(val: string)
	{
		console.log(this.props);
		const id = parseInt(<string>(this.props.dialogueId));

		if (id < 0)
			return;

		this.props.characterId = (<HTMLInputElement>(document.getElementById(this.props.id + '-char'))).value;

		const updates = {};
		updates['characterId'] = parseInt(<string>(this.props.characterId));
		updates['tstamp'] = Math.floor(Date.now() / 1000);

		this.firebaseService.getItem(id, 'dialogues').update(updates);
	}
}

*/
