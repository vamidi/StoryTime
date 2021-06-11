import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewContainerRef } from '@angular/core';
import { NbSelectComponent, NbToastrService } from '@nebular/theme';

import { DropDownQuestion, Option, TextboxQuestion } from '@app-core/data/forms/form-types';
import { BasicDropdownFieldInputComponent, BasicTextFieldInputComponent } from '@app-theme/components';
import { numSocket } from '@app-core/components/visualne/sockets';
import { InputOutputMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { UtilsService } from '@app-core/utils';
import { Input as VisualNEInput, Node } from 'visualne';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { defaultUser, User, UserModel, UserService } from '@app-core/data/state/users';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Project } from '@app-core/data/state/projects';
import { Table } from '@app-core/data/state/tables';
import { IEvent, IEventInput } from '@app-core/data/standard-tables';
import { createEvent } from '@app-core/functions/helper.functions';
import { ProxyObject } from '@app-core/data/base';

import { DebugType } from '@app-core/utils/utils.service';
import { NodeEditorService } from '@app-core/data/state/node-editor';
import isEqual from 'lodash.isequal';

enum EditModeType {
	None,
	New,
	Edit,
	Remove,
}

const MIN_INPUTS = 2;

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

	protected readonly excludeInputs: string[] = [
		'execIn',
		'targetIn',
	];

	protected inputs: VisualNEInput[] = [];
	protected inputTextComponents: (BasicTextFieldInputComponent)[] = [];
	protected currentInputCount: number = 0;

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	constructor(
		protected nodeEditorService: NodeEditorService,
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
				this.eventListQuestion.options$.next(this.eventList);
			}

			if(this.currentNode.data.eventId !== Number.MAX_SAFE_INTEGER)
			{
				this.event = UtilsService.copyObj(this.events.find(this.currentNode.data.eventId as number));
				this.eventNameQuestion.value = this.event.name;

				this.eventListQuestion.value = this.event.id;
				setTimeout(() => this.eventSelectComponent.selectedChange.emit(this.event.id), 500);
			}

			// First state is to just load everything.
			this.componentResolver.setRootViewContainerRef(this.vcr);
			this.initEvents();
		}
	}

	public clearViewContainer()
	{
		if(this.inputTextComponents.length === 0) return;

		// delete the options from the view container
		// delete the output by key
		// clear out the events
		this.currentNode.data.events = {} as InputOutputMap<number, InputEvent>;
		// clear out the inputs
		this.inputs.forEach((input) =>
		{
			this.currentNode.removeInput(input);
		});
		// clear out the view.
		this.vcr.clear();
		// clear out the outputs
		this.inputs = [];
		// clear out the components
		this.inputTextComponents = [];
		// reset the output counter
		this.currentInputCount = 0;

		this.nodeEditorService.Editor.trigger('process');
	}

	public addInput(input: VisualNEInput | IEventInput = null): void
	{
		if (this.currentNode)
		{
			const hasInput = input !== null;

			// Create the input field name for the param
			const textFieldComponentRef = this.componentResolver.addDynamicComponent(BasicTextFieldInputComponent);
			const textInstance = textFieldComponentRef.instance as BasicTextFieldInputComponent<string>;
			textInstance.index = this.currentInputCount;
			textInstance.showLabels = true;
			textInstance.question.text = 'Parameter Name';
			this.mainSubscription.add(textInstance.onKeyUpFunc.subscribe(
				(event: string) => {
					const events = this.currentNode.data.events as InputOutputMap<number, IEventInput>;
					events[this.inputs[textInstance.index].key].value.paramName = event;
				},
			));
			this.inputTextComponents.push(textInstance);

			UtilsService.onDebug(this.currentInputCount, DebugType.LOG, textInstance.index);

			let inputText = `Event In ${this.currentInputCount} - [NULL]`;
			if(hasInput)
				inputText = input instanceof VisualNEInput ? input.name : input.paramName;
			const inputMap = this.currentNode.data.events as InputOutputMap<number, IEventInput>;

			// create an input depended on the value we want to pass on.
			const inp =  hasInput && input instanceof VisualNEInput ? input : new VisualNEInput(`inputIn-${this.currentInputCount++}`, inputText, numSocket, false)

			let inputValue = '';

			if(hasInput) {
				inputValue = input instanceof VisualNEInput && inputMap.hasOwnProperty(inp.key)
					? inputMap[inp.key].value.paramName
					: (input as IEventInput).paramName;
			}
			textInstance.question.value = inputValue;

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
			defaultValueTextInstance.writeValue(
				hasInput && inputMap.hasOwnProperty(inp.key) ? inputMap[inp.key].value.defaultValue : 0,
			);
			this.inputTextComponents.push(defaultValueTextInstance);

			defaultValueTextInstance.showLabels = true;
			defaultValueTextInstance.question.text = 'Default value';

			const valueTextFieldComponentRef = this.componentResolver.addDynamicComponent(BasicTextFieldInputComponent);
			const valueTextInstance = valueTextFieldComponentRef.instance as BasicTextFieldInputComponent<number>;
			// TODO add more types
			valueTextInstance.writeValue(
				hasInput && inputMap.hasOwnProperty(inp.key) ? inputMap[inp.key].value.value : 0,
			);
			this.inputTextComponents.push(valueTextInstance);

			valueTextInstance.showLabels = true;
			valueTextInstance.question.text = 'Value';

			this.inputs.push(inp);

			const eventInput: IEventInput = {
				paramName: textInstance.question.value,
				defaultValue: defaultValueTextInstance.question.value,
				value: valueTextInstance.question.value,
			};

			if(!this.currentNode.inputs.has(inp.key))
				this.currentNode.addInput(inp);

			this.onEventSelected(textInstance.index, eventInput);

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

			this.event = UtilsService.copyObj(this.events.find(event));

			if(!this.event.hasOwnProperty('inputs'))
				this.event.inputs = [];

			this.currentNode.data.eventId = event;
			// clear the view
			this.clearViewContainer();
			// add input based on the inputs
			this.event.inputs.forEach((input) => {
				this.addInput(input);
			});
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

	public onEventSelected(idx: number, event: IEventInput)
	{
		const input = this.currentNode.inputs.get(this.inputs[idx].key);
		console.log(input.key);
		(this.currentNode.data.events as InputOutputMap<number, IEventInput>)[input.key] = { key: idx, value: event };

		this.currentNode.update();
		this.nodeEditorService.Editor.trigger('process');
	}

	public onEventDeleted(idx: number) {
		// delete the output by key
		this.currentNode.removeInput(this.inputs[idx]);
		this.inputs.splice(idx, 1);
		this.inputTextComponents.splice(idx, 1);

		// remove the subscription
		// const sub: [Subscription, Subscription] = this.subs[idx];

		// this.mainSubscription.remove(sub[0]);
		// this.mainSubscription.remove(sub[1]);

		// we need to rearrange the inputs
		this.inputTextComponents.forEach((_, index, arr) => {
			this.inputTextComponents[index].index = index;
		});

		this.vcr.detach(idx);

		this.currentNode.update();
	}

	protected initEvents()
	{
		this.currentNode.inputs.forEach((input) => {
			if (!this.excludeInputs.includes(input.key)) {
				this.addInput(input);
			}
		});
	}

	protected updateEvent(): void
	{
		if(this.currentNode.data.eventId !== Number.MAX_SAFE_INTEGER)
		{
			this.syncEvent();

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
			/*
			for(let i = 0; i < this.event.inputs.length; i++)
			{
				const input = this.event.inputs[i];
				input.paramName = this.inputTextComponents[i * 3].question.value as string;
				input.defaultValue = this.inputTextComponents[i * 3 + 1].question.value;
				input.value = this.inputTextComponents[i * 3 + 2].question.value;
			}
			 */
		}
	}

	protected getInputValue(id: number, key: string = 'text'): string
	{
		const value = this.events.find(id);

		if(value) return value[key];

		return '';

	}
}
