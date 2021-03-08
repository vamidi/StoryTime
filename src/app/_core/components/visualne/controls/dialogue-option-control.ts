import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnInit,
	Type,
	ViewChild,
} from '@angular/core';
import { Control, NodeEditor } from 'visualne';
import { AngularControl } from 'visualne-angular-plugin';
import { NbSelectComponent, NbToastrService } from '@nebular/theme';
// import * as uuid from 'uuid';

import { Subject } from 'rxjs';
import { FirebaseService } from '../../../utils/firebase.service';
import { UtilsService } from '../../../utils';
import { DebugType } from '../../../utils/utils.service';
import assign from 'lodash.assign';
import pick from 'lodash.pick';
import keys from 'lodash.keys';

@Component({
	template: `
<!--		<input type="number" [value]="value" [readonly]="readonly" (change)="change(+$event.target.value)">-->
		<div class="form-group" *ngIf="!editNode && dialogueOptions.length !== 0">
			<p class="text-alternate text-wrap">{{ getValue(getDialogueOption(optionId)) }}</p>
		</div>
		<div class="form-group" *ngIf="editNode">
			<nb-select fullWidth #selectedDialogueComponent [id]="'dialogue'" [selected]="defaultValue" (selectedChange)="dialogueOptionChange($event, true)">
				<nb-option [id]="'dialogue-option-new'" [value]="defaultOption">[+] None</nb-option>
				<nb-option *ngFor="let item of dialogueOptions;" [id]="'dialogue-option-' + item.id" [value]="item.id">
					<!-- [selected]="item.id == dialogueId ? true : null" -->
					{{ getTruncatedValue(item) }}
				</nb-option>
			</nb-select>
		</div>
		<textarea nbInput fullWidth *ngIf="editNode" (keyup)="textChange($event)" [value]="selectedDialogueOption"></textarea><br/><br/>
		<button nbButton fullWidth status="primary" *ngIf="isNull()" (click)="saveDialogueOption()">Save</button>
	`,
	styleUrls: ['./dialogue-option-control.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogueOptionComponent implements OnInit, AfterViewInit
{

	@Input() optionId!: number;
	@Input() value!: any;
	@Input() change!: Function;
	@Input() save!: Function;

	/**
	 * @brief - Call the parent function --> the component connected
	 */
	@Input() mounted!: Function;

	@Input()
	public dialogueOptions!: any[];

	@Input()
	public editMode: Subject<boolean> = null;

	public editNode: boolean = false;

	@ViewChild('selectedDialogueComponent', { static: false})
	public selectedDialogueComponent: NbSelectComponent = null;

	public defaultValue: number = null;

	public defaultOption: number = Number.MAX_SAFE_INTEGER;

	public selectedDialogueOption: string = '';

	constructor(
		protected firebaseService: FirebaseService,
		protected toastrService: NbToastrService,
		protected cd: ChangeDetectorRef)
	{ }

	public ngOnInit()
	{
		this.mounted();

		this.editMode.subscribe(v =>
		{
			this.editNode = v
		});
	}

	public ngAfterViewInit()
	{
		this.defaultValue = this.optionId;
		if(this.optionId !== Number.MAX_SAFE_INTEGER)
		{
			if(this.selectedDialogueComponent)
				this.selectedDialogueComponent.selectedChange.emit(this.defaultValue);
		}
	}

	public isNull()
	{
		return this.optionId === Number.MAX_SAFE_INTEGER;
	}

	public getDialogueOption(id: number)
	{
		return this.dialogueOptions.find((option) => option.id === id);
	}

	public getValue(item: any)
	{
		return item && item.text ? item.name ? item.name : item.text : '';
	}

	public dialogueOptionChange(event: any, update: boolean = false)
	{
		this.optionId = +event;

		const el = this.dialogueOptions.length !== 0 ?
			this.dialogueOptions.find((option) => option.id === event) : null;

		if(el)
		{
			// Set the value in the parent component as well.
			this.value.optionId = +el.id;
			this.value.parentId = +el.parentId;
			this.value.text = el.text;

			this.selectedDialogueOption = el.text;

			// 	this.value.characterId = +el.characterId;
			if(update && this.value.optionId >= 0)
			{
				// const data = {
					// parentId: this.characterId,
					// tstamp: Math.floor(Date.now() / 1000),
				// };

				// (<HTMLInputElement>(document.getElementById(this.props.id + '-dialogue'))).value = id.toString(10);
				// this.firebaseService.updateItem(id, data, true, 'dialogues').then(() =>
				// {
				// 	update current
					// this.value.characterId = this.characterId;
				// });
			}
		}
		this.change(this.value);
	}

	public textChange(event: any)
	{
		const newText = event.target.value;
		const id = this.value.optionId !== undefined ? this.value.optionId : Number.MAX_SAFE_INTEGER;
		const data = this.dialogueOptions.find((option) => option.id === id);

		if (id !== Number.MAX_SAFE_INTEGER)
		{
			if(data && data.text !== newText)
			{
				data.text = newText;
				data.tstamp = UtilsService.timestamp;

				this.save(this.firebaseService, id, data).then(() =>
				{
					// update current
					this.value.text = this.selectedDialogueOption = newText;

					UtilsService.showToast(
						this.toastrService,
						'Dialogue Option updated!',
						`Dialogue option ${id} updated!`,
					);
				});
			}
		}
		else
		{
			this.value.optionId = this.optionId = Number.MAX_SAFE_INTEGER;
			this.value.childId = Number.MAX_SAFE_INTEGER;
			this.value.text = this.selectedDialogueOption = newText;
			this.selectedDialogueComponent.selected = this.optionId;
		}

		this.change(this.value);
	}

	public getTruncatedValue(item: any)
	{
		const text = item.text ? item.name ? item.name : item.text : '';
		return '[' + item.id + '] ' + UtilsService.truncate(text, 50)
	}

	public saveDialogueOption()
	{
		if((this.selectedDialogueComponent)
			&& this.optionId === Number.MAX_SAFE_INTEGER
			&& this.selectedDialogueComponent.selected === Number.MAX_SAFE_INTEGER
			&& this.selectedDialogueOption !== '')
		{
			// TODO FIX ME
			// this.optionId = this.value.optionId = this.lastUID;
			this.value = {
				deleted: false,
				childId: Number.MAX_SAFE_INTEGER,
				parentId: Number.MAX_SAFE_INTEGER,
				text: this.selectedDialogueOption,
				tstamp: Math.floor(Date.now() / 1000),
			};

			setTimeout(() =>
			{
				this.defaultValue = this.optionId;
				this.selectedDialogueComponent.selectedChange.emit(this.defaultValue);
			},1500);

			/* TODO FIX ME
			this.save(this.firebaseService, this.lastUID, this.value).then(() =>
			{
				UtilsService.showToast(
					this.toastrService,
					'Dialogue Option inserted!',
					`Dialogue option ${ this.value.optionId } updated!`,
				);
			});
			 */
		}
	}
}

export class DialogueOptionControl extends Control implements AngularControl
{
	component: Type<DialogueOptionComponent>;
	props: { [key: string]: unknown };

	constructor(
		public emitter: NodeEditor,
		public key: string,
		public optionId: number,
		public dialogueOptions: any[])
	{
		super(key);

		this.component = DialogueOptionComponent;
		this.props =
		{
			optionId,
			dialogueOptions,
			editMode: null,
			change: v => this.onChange(v),
			save: (f: FirebaseService, i: number, data: any) => this.onSave(f, i, data),
			value: {},
			mounted: () => {
				this.props.editMode = <Subject<boolean>>this.getNode().meta.editMode;
				this.setValue((this.getData(key) as any) || {});
			},
		};
	}

	public onSave(firebaseService: FirebaseService, id: number, data: any)
	{
		// Only save data we need in the database
		data = assign({}, pick(data, keys(firebaseService.getProxyObject('dialogueOptions'))));
		data.tstamp = Math.floor(Date.now() / 1000);
		UtilsService.onDebug(id, DebugType.TRACE, data);
		return firebaseService.updateItem(id, data,true, 'dialogueOptions');
	}

	onChange(val: any)
	{
		const output = this.getNode().outputs.get('optionOut');
		if(output)
		{
			output.name = 'Out ID [' + val.optionId + ']';
		}

		this.setValue(val);
		this.emitter.trigger('process');
	}

	setValue(val: any)
	{
		this.props.value = val;
		this.putData(this.key, this.props.value);
	}
}
