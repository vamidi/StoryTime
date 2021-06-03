import {
	AfterViewInit,
	Component,
	EventEmitter,
	Input, OnInit,
	Output,
	ViewChild,
	ViewContainerRef,
} from '@angular/core';
import { NbSelectComponent, NbToastrService } from '@nebular/theme';

import { TextboxQuestion, Option, DropDownQuestion } from '@app-core/data/forms/form-types';
import { BasicTextFieldInputComponent, BasicDropdownFieldInputComponent } from '@app-theme/components';
// import { numSocket } from '@app-core/components/visualne/sockets';
import { InputOutputMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { UtilsService } from '@app-core/utils';
import { Node, Input as ReteInput } from 'visualne';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { defaultUser, User, UserModel, UserService } from '@app-core/data/state/users';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Project } from '@app-core/data/state/projects';
import { Table } from '@app-core/data/state/tables';
import { IEvent, IEventInput } from '@app-core/data/standard-tables';
import { createEvent } from '@app-core/functions/helper.functions';
import { ProxyObject } from '@app-core/data/base';

import isEqual from 'lodash.isequal';

export enum EditModeType {
	None,
	New,
	Edit,
	Remove,
}

@Component({
	selector: 'ngx-event-editor',
	templateUrl: 'event-editor.component.html',
	providers: [DynamicComponentService],
})
export class EventEditorComponent implements OnInit
{
	@Input()
	public currentNode: Node = null;

	@Input()
	public events: Table<IEvent> = null;

	@Input()
	public project: Project = null;

	@Output()
	public onEventUpdated: EventEmitter<IEvent> = new EventEmitter<IEvent>();

	@ViewChild('inputViewContainer', { read: ViewContainerRef, static: true })
	public vcr!: ViewContainerRef;

	@ViewChild('eventSelectComponent', { static: true })
	public eventSelectComponent: NbSelectComponent = null;

	public get EditMode(): EditModeType
	{
		return this.editMode
	}

	public set EditMode(mode: EditModeType)
	{
		// TODO change the view
		if(mode === EditModeType.Edit || mode === EditModeType.Remove)
		{
			this.oldEventId = this.currentNode ? this.currentNode.data.eventId as number: Number.MAX_SAFE_INTEGER;
			this.eventNameQuestion.value = this.event ? this.event.name : '';
		}
		console.log(this.eventNameQuestion);
		this.editMode = mode;
	}

	private editMode: EditModeType = EditModeType.None;

	public readonly defaultOption = Number.MAX_SAFE_INTEGER;

	public set setEventName(event: any) {
		this.eventNameQuestion.value = event.target.value;
	}

	// The name of the event
	public eventNameQuestion: TextboxQuestion<string> = new TextboxQuestion<string>(
		{ text: 'Name', value: '', disabled: false, type: 'text' },
	);

	public eventListQuestion: DropDownQuestion<number> = new DropDownQuestion<number>(
		{ text: 'Event name', value: Number.MAX_SAFE_INTEGER, disabled: false, type: 'number' },
	);

	protected tableName: string = 'events';
	protected oldEventId: number = Number.MAX_SAFE_INTEGER;
	protected user$: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null);
	protected user: UserModel = defaultUser;
	protected event: IEvent = createEvent();
	protected eventList: Option<number>[] = [];

	protected readonly excludeOutputs: string[] = [
		'ExecOut',
	];

	protected inputs: ReteInput[] = [];
	protected inputTextComponents: (BasicTextFieldInputComponent)[] = [];
	protected currentInputCount: number = 0;

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	constructor(
		protected toastrService: NbToastrService,
		protected userService: UserService,
		protected firebaseService: FirebaseService,
		protected componentResolver: DynamicComponentService,
	) { }

	public ngOnInit()
	{
		this.mainSubscription.add(this.userService.getUser().subscribe((user: User) =>
		{
			// Only push changed users.
			if(!isEqual(this.user, user))
			{
				this.user = user;
				this.user$.next(this.user);
			}
		}));

		if(this.currentNode)
		{
			this.event = UtilsService.copyObj(this.events.find(this.currentNode.data.eventId as number));
			this.eventNameQuestion.value = this.event.name;
			if(!this.eventList.length)
			{
				this.events.filteredData.forEach((event) => {
					this.eventList.push(new Option({
						id: event.id,
						key: event.id + '. ' + UtilsService.truncate(event.name, 50),
						value: event.id,
						selected: false,
					}));
				});

				this.eventListQuestion.value = this.event.id;
				this.eventListQuestion.options$.next(this.eventList);
				setTimeout(() => this.eventSelectComponent.selectedChange.emit(this.event.id), 500);
			}

			// First state is to just load everything.
			this.componentResolver.setRootViewContainerRef(this.vcr);

			this.event.inputs.forEach((input) => {
				this.addInput({ ...input });
				this.currentInputCount++;
			});
		}
	}

	public addInput(input: IEventInput = null): void
	{
		if (this.currentNode)
		{
			const hasInput = input !== null;

			// Create the input field name for the param
			const textFieldComponentRef = this.componentResolver.addDynamicComponent(BasicTextFieldInputComponent);
			const textInstance = textFieldComponentRef.instance as BasicTextFieldInputComponent<string>;
			const idx = this.inputTextComponents.push(textInstance);

			textInstance.showLabels = true;
			textInstance.question.text = 'Parameter Name';
			textInstance.index = idx - 1;
			this.mainSubscription.add(textInstance.onKeyUpFunc.subscribe(
				(event: string) => {
					this.event.inputs[textInstance.index].paramName = event
				},
			));

			console.log(idx, textInstance.index);

			const inputText = hasInput ? input.paramName : `Input In ${idx} - [NULL]`;

			// create an input depended on the value we want to pass on.
			// const inp = hasInput ? input :
			// 	new ReteInput(`inputIn-${this.currentInputCount++}`, inputText, numSocket, false);

			const inputMap = this.currentNode.data.inputs as InputOutputMap;
			textInstance.question.value = inputText;

			// const outputIdx = this.inputs.push(inp);

			/* TODO capture the changes in the options.
			this.subs.push([
				this.mainSubscription.add(
					componentRef.instance.select.subscribe(({ id, event }) => this.onOptionSelected(id, event)),
				),
				this.mainSubscription.add(
					componentRef.instance.delete.subscribe((id: number) => this.onOptionDeleted(id)),
				),
			]);
			*/

			// Then a select dropdown field for the type of the param
			const dropdownFieldComponentRef = this.componentResolver.addDynamicComponent(BasicDropdownFieldInputComponent);
			const dropdownInstance = dropdownFieldComponentRef.instance;

			// TODO add more types
			dropdownInstance.writeValue(0);
			dropdownInstance.question.options$.next([
				new Option({
					key: 'Number',
					value: 0,
					selected: true,
				}),
			]);

			dropdownInstance.showLabels = true;
			dropdownInstance.question.text = 'Type';

			const defaultValueTextFieldComponentRef = this.componentResolver.addDynamicComponent(BasicTextFieldInputComponent);
			const defaultValueTextInstance = defaultValueTextFieldComponentRef.instance as BasicTextFieldInputComponent<number>;
			// TODO add more types
			defaultValueTextInstance.writeValue(0);
			this.inputTextComponents.push(defaultValueTextInstance);

			defaultValueTextInstance.showLabels = true;
			defaultValueTextInstance.question.text = 'Default value';

			const valueTextFieldComponentRef = this.componentResolver.addDynamicComponent(BasicTextFieldInputComponent);
			const valueTextInstance = valueTextFieldComponentRef.instance as BasicTextFieldInputComponent<number>;
			// TODO add more types
			valueTextInstance.writeValue(0);
			this.inputTextComponents.push(valueTextInstance);

			valueTextInstance.showLabels = true;
			valueTextInstance.question.text = 'Value';

			if (!hasInput) // only add when we have created a new input
			{
				// this.currentNode.addInput(this.inputs[outputIdx - 1]);

				const eventInput: IEventInput = {
					paramName: textInstance.question.value,
					defaultValue: defaultValueTextInstance.question.value,
					value: valueTextInstance.question.value,
				};

				if(!this.event.hasOwnProperty('inputs'))
					this.event.inputs = [];

				this.event.inputs.push(eventInput);
				this.updateEvent();
			}

			// And finally a multi-field that can store all values the player wants.

			this.currentNode.update();

			// save the snippet again
			// if (!hasInput) this.nodeEditorService.saveSnippet();
		}
	}

	public pickEvent(event: number)
	{
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			if(this.currentNode.data.eventId === event)
				return;

			this.event =  UtilsService.copyObj(this.events.find(event));

			this.currentNode.data.eventId = event;
			this.currentNode.update();
		}
	}

	public editEvent(): void
	{
		switch (this.editMode)
		{
			case EditModeType.New:
				this.insertEvent();
				break;
			case EditModeType.None:
			case EditModeType.Edit:
				this.updateEvent();
				break;
			case EditModeType.Remove:
				break;

		}
	}

	public cancelEvent(): void
	{
		console.log(this.oldEventId);
		this.currentNode.data.eventId = this.oldEventId;
		this.oldEventId = Number.MAX_SAFE_INTEGER;
		console.log(this.currentNode.data.eventId);
		// set the event back.
		this.event = UtilsService.copyObj(this.events.find(this.currentNode.data.eventId as number));
		this.editMode = EditModeType.None;

		this.syncEvent();
	}

	protected updateEvent(): void
	{
		if(this.currentNode.data.eventId !== Number.MAX_SAFE_INTEGER)
		{
			this.syncEvent();

			UtilsService.showToast(
				this.toastrService,
				'Event updated!',
				'Event has successfully been updated',
			);

			this.editMode = EditModeType.None;
			this.onEventUpdated.emit(this.event);
		}
	}

	protected insertEvent()
	{
		this.oldEventId = this.currentNode.data.eventId as number;
		this.currentNode.data.eventId = Number.MAX_SAFE_INTEGER

		this.event.name = this.eventNameQuestion.value;

		this.tableName = `tables/${this.events.id}`;
		// Let firebase search with current table name
		this.firebaseService.setTblName(this.tableName);

		const event: { data: IEvent, confirm?: any } = { data: this.event };
		const obj: ProxyObject = { ...event.data };
		this.firebaseService.insertData(`${this.tableName}/data`, obj, this.tableName)
		.then((data) =>
			{
				UtilsService.showToast(
					this.toastrService,
					'Event added!',
					'Event has successfully been created',
				);

				if (data && typeof data === 'number')
				{
					this.currentNode.data = {
						...this.currentNode.data,
						eventId: data,
					}

					UtilsService.onDebug(`new Event: ${this.currentNode}`);
					this.event.id = data;

					this.syncEvent();

					this.editMode = EditModeType.None;
				}
			},
		);
	}

	protected syncEvent()
	{
		// update the name
		this.event.name = this.eventNameQuestion.value;
		// update the input
		if(this.inputTextComponents.length)
		{
			for(let i = 0; i < this.event.inputs.length; i++)
			{
				const input = this.event.inputs[i];
				input.paramName = this.inputTextComponents[i * 3].question.value as string;
				input.defaultValue = this.inputTextComponents[i * 3 + 1].question.value;
				input.value = this.inputTextComponents[i * 3 + 2].question.value;
			}
		}

	}

	protected getInputValue(id: number, key: string = 'text'): string
	{
		const value = this.events.find(id);

		if(value) return value[key];

		return '';

	}
}
