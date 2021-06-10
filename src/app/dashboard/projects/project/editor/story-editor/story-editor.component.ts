import { ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';

import { NbDialogService, NbToastrService } from '@nebular/theme';

import { Component as VisualNEComponent, Connection, Context, Input, Node, Output } from 'visualne';
import { EventsTypes } from 'visualne/types/events';

import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { LanguageService, ProjectsService, StoryFileUpload } from '@app-core/data/state/projects';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { NodeEditorService } from '@app-core/data/state/node-editor';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { NodeEditorComponent } from '@app-dashboard/projects/project/editor/node-editor/node-editor.component';
import { Option, TextboxQuestion } from '@app-core/data/forms/form-types';
import {
	AdditionalEvents,
	DialogueNodeComponent,
	NumComponent,
	StartNodeComponent,
} from '@app-core/components/visualne';
import { AddComponent } from '@app-core/components/visualne/nodes/add-component';
import { IDialogue, IDialogueOption, IEvent, IStory } from '@app-core/data/standard-tables';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';
import { InputOutputMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { BasicTextFieldInputComponent } from '@app-theme/components';
import { dialogueOptionSocket } from '@app-core/components/visualne/sockets';
import { ProxyObject } from '@app-core/data/base';
import { createDialogue, createDialogueOption, createEvent } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import { ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { InsertStoryComponent } from '@app-theme/components/firebase-table';
import { EventNodeComponent } from '@app-core/components/visualne/nodes/events/event-node.component';
import { DebugType } from '@app-core/utils/utils.service';
import { EventEditorComponent } from '@app-dashboard/projects/project/editor/story-editor/event-editor.component';

const DIALOGUE_NODE_NAME: string = 'Dialogue';
const DIALOGUE_OPTION_NODE_NAME: string = 'Dialogue Option';
const EVENT_NODE_NAME: string = 'Event';

@Component({
	selector: 'ngx-editor',
	templateUrl: 'story-editor.component.html',
	styleUrls: ['../node-editor/node-editor.component.scss'],
	styles: [
		`h4 {
			display: inline-block;
		}

		nb-card-header button {
			float: right;
		}

		nb-icon {
			cursor: pointer;
		}
		`,
	],
	providers: [DynamicComponentService],
})
export class StoryEditorComponent extends NodeEditorComponent implements OnInit {
	// VisualNE Editor
	@ViewChild('nodeEditor', {static: true})
	public el: ElementRef<HTMLDivElement>;

	@ViewChild('overViewContainer', { read: ViewContainerRef, static: true })
	public vcr!: ViewContainerRef;

	@ViewChild('sidePanel', {static: true})
	public sidePanel: ElementRef<HTMLDivElement>;

	@ViewChild('eventEditorComponent', {static: true})
	public eventEditorComponent: EventEditorComponent;

	public set setDialogue(event: any) {
		this.textAreaQuestion.value = event.target.value as string;
	}

	public textQuestion: TextboxQuestion = new TextboxQuestion(
		{text: 'Previous Dialogue Text', value: '', disabled: true, type: 'text'},
	);
	public charTextQuestion: TextboxQuestion = new TextboxQuestion(
		{text: 'Character', value: '', disabled: true, type: 'text'},
	);
	public textAreaQuestion: TextboxQuestion = new TextboxQuestion(
		{text: 'Dialogue', value: '', disabled: true, type: 'text'},
	);

	protected components: VisualNEComponent[] = [
		new StartNodeComponent(),
		new DialogueNodeComponent(),
		new EventNodeComponent(),
		new NumComponent(),
		new AddComponent(),
	]

	protected readonly excludeOutputs: string[] = [
		'dialogueOut',
		'ExecOut',
	];

	protected contextSettings: ContextMenuPluginParams = {
		searchBar: true, // true by default
		// searchKeep: title => true,
		// leave item when searching, optional. For example, title => ['Refresh'].includes(title)
		delay: 100,
		rename(component) {
			return component.name;
		},
		allocate(component) {
			if (component.name === 'Number' || component.name === 'Add') {
				return ['Math']
			}
			if(component.name === 'Event') {
				return ['Events']
			}
			return [];
		},
		items: {
			'save': () => this.nodeEditorService.saveStory(),
			'Load': () => this.nodeEditorService.loadStory<StoryFileUpload>(),
		},
		nodeItems:
			{
				'Delete': true, // don't show Delete item
				'Clone': true, // or Clone item
				'Info': false,
			},
	};

	constructor(
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected storage: AngularFireStorage,
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectsService: ProjectsService,
		protected tableService: TablesService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected nodeEditorService: NodeEditorService,
		protected languageService: LanguageService,
		protected componentResolver: DynamicComponentService,
		protected cd: ChangeDetectorRef,
		protected ngZone: NgZone,
	) {
		super(router, activatedRoute, storage, dialogService, toastrService, userService,
			userPreferencesService, projectsService, tableService, firebaseService,
			firebaseRelationService,
			nodeEditorService, languageService, componentResolver, ngZone,
		);

		this.includedTables.push('events');
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.mainSubscription.add(this.nodeEditorService.storyLoaded.subscribe((res: IStory) =>
		{
			// load the character
			if (res) {
				this.title = res.title[this.nodeEditorService.Language];
				this.textAreaQuestion.value = this.getQuestionValue(res.childId, this.dialogues);
				if (res.parentId !== Number.MAX_SAFE_INTEGER && this.characters.find(res.parentId)) {
					this.charTextQuestion.value = this.getQuestionValue(res.parentId, this.characters, 'name');
				}
			}
		}));
	}

	public loadStory()
	{
		this.nodeEditorService.loadStory();
	}

	public saveStory(): void
	{
		this.nodeEditorService.saveStory();
	}

	public newStory(): void
	{
		// TODO see also if the user has not save yet.
		if (this.nodeEditorService.Editor.nodes.length > 0 && !confirm('Are you sure you want to create a new story?'))
			return;

		this.nodeEditorService.newStory(InsertStoryComponent, async (res?: IStory) => {
			if (res !== undefined) {
				if (this.nodeEditorService.SelectedStory) {
					this.title = this.nodeEditorService.SelectedStory.title[this.nodeEditorService.Language];

					// set the start node output data to the new story
					this.textAreaQuestion.value = this.getQuestionValue(this.nodeEditorService.SelectedStory.childId, this.dialogues);

					// and save it to the local storage
					this.nodeEditorService.saveSnippet();
				}
			}
		});
	}

	public onSelect(event: number) {
		this.textAreaQuestion.value = event;
		if (this.currentNode) {
			// if we have a dialogueNode
			if (this.currentNode.name === DIALOGUE_NODE_NAME) {
				// TODO see if we need this
				// this.currentNode.data['dialogueId'] = +this.listQuestion.value;

				// in the story table we have
				// ID - id of the story
				// Title - title of the story
				// description - description for the story
				// parentId - the story that is connected to the story.
				// childId - dialogue start node

				// if we are changing the start node
				if (!this.nonStartNode) {
					// change the childId.
					this.nodeEditorService.SelectedStory.childId = this.currentNode.data.dialogueId as number;

					// Save to local storage as well.
					this.nodeEditorService.saveSnippet();
				}
			}

			if (this.currentNode.name === DIALOGUE_OPTION_NODE_NAME) {
				// TODO see if we need this.
				// this.currentNode.data['optionId'] = +this.listQuestion.value;
			}

			this.nodeEditorService.Editor.trigger('process');
		}
	}

	public onLanguageChange(event: KeyLanguage) {
		super.onLanguageChange(event);

		if (this.nodeEditorService.Editor) {
			if (this.currentNode) {
				// change the current dialogue text area
				this.textAreaQuestion.value = this.getQuestionValue(this.currentNode.data.dialogueId as number, this.dialogues);

				// Change the text of all the option in the current dialogue.
				const optionMap = this.currentNode.data.options as InputOutputMap;
				this.outputs.forEach((output, idx) => {
					const hasOutput = output !== null;
					this.optionTextAreaComponents[idx].question.value = this.getQuestionValue(
						hasOutput && optionMap.hasOwnProperty(output.key) ? optionMap[output.key].value : Number.MAX_SAFE_INTEGER,
						this.tblDialogueOptions,
					);
				});

				// update the previous text
				this.updatePrevious(this.currentNode);
			}

			// this.loadDifferentLanguage<IDialogueOption>(this.dialogueOptionsList, this.tblDialogueOptions);
			// this.optionTextAreaComponents.forEach((c, idx, arr) => {
			// 	c.question.options$.next(this.dialogueOptionsList);
			// 	arr[idx] = c;
			// });
			const nodes = this.nodeEditorService.Editor.nodes;
			nodes.forEach((n) => {
				if (n.name === DIALOGUE_NODE_NAME) n.update()
			});
		}
	}

	public addOption(output: Output = null)
	{
		if (this.currentNode)
		{
			const hasOutput = output !== null;

			// create the component
			const componentRef = this.componentResolver.addDynamicComponent(BasicTextFieldInputComponent);
			const instance = componentRef.instance as BasicTextFieldInputComponent<string>;
			instance.question.controlType = 'textarea';
			// instance.question.options$.next(this.dialogueOptionsList);

			const idx = this.optionTextAreaComponents.push(instance);
			instance.question.text = hasOutput ? output.name : `Option Out ${idx}`;
			instance.index = idx - 1;

			UtilsService.onDebug(idx, DebugType.LOG, instance.index);

			const outputText = hasOutput ? output.name : `Option Out ${idx} - [NULL]`;

			const out = hasOutput ? output :
				new Output(`optionOut-${this.currentOutputCount++}`, outputText, dialogueOptionSocket, false);

			const optionMap = this.currentNode.data.options as InputOutputMap;
			instance.question.value = this.getQuestionValue(
				hasOutput && optionMap.hasOwnProperty(out.key) ? optionMap[out.key].value : Number.MAX_SAFE_INTEGER,
				this.tblDialogueOptions,
			);

			const outputIdx = this.outputs.push(out);

			if (!hasOutput) // only add when we have created a new output
			{
				this.currentNode.addOutput(this.outputs[outputIdx - 1]);
				// Add the option also to the table.
				this.tableName = `tables/${this.tblDialogueOptions.id}`;
				// Let firebase search with current table name
				this.firebaseService.setTblName(this.tableName);

				const event: { data: ProxyObject, confirm?: any } = { data: createDialogueOption() };
				this.insertFirebaseData(event)
					.then((data) => {
						UtilsService.showToast(
							this.toastrService,
							'Dialogue option added!',
							'Dialogue option has successfully been created',
						);

						if (data && typeof data === 'number') {
							this.onOptionSelected(instance.index, data);

							instance.question.value = this.getQuestionValue(
								hasOutput && optionMap.hasOwnProperty(out.key) ? optionMap[out.key].value : Number.MAX_SAFE_INTEGER,
								this.tblDialogueOptions,
							);

							UtilsService.onDebug(`new Dialogue: ${this.currentNode}`);
						}
					});
			}
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
			this.currentNode.update();

			// save the snippet again
			if (!hasOutput)
				this.nodeEditorService.saveSnippet();
		}
	}

	public onOptionSelected(idx: number, event: number) {
		const output = this.currentNode.outputs.get(this.outputs[idx].key);
		(this.currentNode.data.options as InputOutputMap)[output.key] = {key: idx, value: event};

		this.currentNode.update();
		this.nodeEditorService.Editor.trigger('process');
	}

	public onOptionDeleted(idx: number) {
		// delete the output by key
		this.currentNode.removeOutput(this.outputs[idx]);
		this.outputs.splice(idx, 1);
		this.optionTextAreaComponents.splice(idx, 1);

		// remove the subscription
		// const sub: [Subscription, Subscription] = this.subs[idx];

		// this.mainSubscription.remove(sub[0]);
		// this.mainSubscription.remove(sub[1]);

		// we need to rearrange the outputs
		this.outputs.forEach((output, index, arr) => {
			this.optionTextAreaComponents[index].index = index;
			this.optionTextAreaComponents[index].question.text = `Option Out ${index + 1}`;
			arr[index].name = `Option Out ${index + 1} - [NULL]`;
		});

		this.vcr.detach(idx);

		this.currentNode.update();
	}

	public updateDialogue() {
		// If we have a whole new value we need to add it to the option list
		if (this.currentNode !== null) {
			const listValue = this.textAreaQuestion.value as string;
			const foundedDialogue: IDialogue = this.dialogues.find(this.currentNode.data.dialogueId as number);

			const dialogue = {
				id: foundedDialogue.id,
				text: {...foundedDialogue.text},
			}
			dialogue.text[this.nodeEditorService.Language] = listValue as string;

			// find the current dialogue
			const payload = {currDialogue: dialogue, nextDialogue: null /*, optionMap: null, */}
			const context: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
			context.trigger('saveDialogue', payload);
		}
	}

	public updateOptions() {
		if (this.outputs.length === 0 || !this.currentNode)
			return;

		const optionMap = this.currentNode.data.options as InputOutputMap;
		this.outputs.forEach((output, idx) => {
			const hasOutput = output !== null;
			const listValue = this.optionTextAreaComponents[idx].question.value as string;

			// find the current option
			const foundedOption: IDialogueOption = this.tblDialogueOptions.find(
				hasOutput && optionMap.hasOwnProperty(output.key) ? optionMap[output.key].value : Number.MAX_SAFE_INTEGER,
			);

			const option = {
				id: foundedOption.id,
				text: {...foundedOption.text},
			}
			option.text[this.nodeEditorService.Language] = listValue as string;

			const payload = {fOption: option, fNextId: null}
			const context: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
			context.trigger('saveOption', payload);
		});


	}

	public updateEvent(event: IEvent = null)
	{
		// If we have a whole new value we need to add it to the option list
		if (this.currentNode !== null)
		{
			const foundedEvent: IEvent = event ?? this.tblEvents.find(this.currentNode.data.eventId as number);
			const payload = { fEvent: foundedEvent };
			const context: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
			context.trigger('saveEvent', payload);
		}
	}

	public clearViewContainer() {
		super.clearViewContainer();
		if(this.eventEditorComponent) this.eventEditorComponent.clearViewContainer();
	}

	protected async initializeListeners() {
		this.nodeEditorService.listen('nodecreate', (node: Node) =>
		{
			if(this.nodeEditorService.SelectedStory === null) {
				UtilsService.onWarn('Story is not loaded.');
				return false;
			}

			if (node.name === DIALOGUE_NODE_NAME && !node.data.hasOwnProperty('dialogueId')) {
				this.tableName = `tables/${this.dialogues.id}`;
				// Let firebase search with current table name
				this.firebaseService.setTblName(this.tableName);

				const event: { data: ProxyObject, confirm?: any } = {data: createDialogue()};
				this.insertFirebaseData(event)
					.then((data) => {
							UtilsService.showToast(
								this.toastrService,
								'Dialogue added!',
								'Dialogue has successfully been created',
							);

							if (data && typeof data === 'number') {
								node.data = {
									...node.data,
									dialogueId: data,
								}
								UtilsService.onDebug(`new Dialogue: ${node}`);
							}
						},
					);
			}

			if(node.name === EVENT_NODE_NAME && !node.data.hasOwnProperty('eventId'))
			{
				node.data.eventId = Number.MAX_SAFE_INTEGER;
			}

			return true;
		});

		this.nodeEditorService.listen('connectioncreated', (connection: Connection) =>
		{
			const outputNode: Output = connection.output;

			let option: Option<number> | string;
			// we are dialogue with dialogue options
			if (outputNode.key.includes('option'))
				option = this.getQuestionValue(
					outputNode.node.data.options[outputNode.key].value as number, this.tblDialogueOptions,
				);
			else
				option = this.getQuestionValue(outputNode.node.data.dialogueId as number, this.dialogues);

			this.textQuestion.value = option;
		});
	}

	protected loadTable(value: Table)
	{
		super.loadTable(value);

		if (value === null) return;

		if (value.metadata.title.toLowerCase() === 'events') {
			this.tblEvents = <Table<IEvent>>value;
			this.nodeEditorService.Data = { key: 'events', value: this.tblEvents };

			// Listen to incoming data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.tblEvents.id}/data`, ['child_added', 'child_changed'])
			.subscribe((snapshots) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type === 'child_added')
						{
							console.log(snapshot.key, snapshot.payload.val());
							this.tblEvents.push(+snapshot.key, snapshot.payload.val()).then(() =>
							{
								this.nodeEditorService.Data = { key: 'events', value: this.tblEvents };
							});
						}

						if(snapshot.type === 'child_changed')
						{
							console.log(snapshot.key, snapshot.payload.val());
							this.tblEvents.update(this.tblEvents.find(+snapshot.key), { id: +snapshot.key, ...snapshot.payload.val() })
								.then(() =>
								{
									this.nodeEditorService.Data = { key: 'events', value: this.tblEvents };
								},
							);

							this.cd.detectChanges();
						}

					}
				},
			));
		}
	}

	protected loadNodeInPanel(node: Node)
	{
		super.loadNodeInPanel(node);

		this.textQuestion.hidden = false;
		this.textAreaQuestion.hidden = false;
		this.charTextQuestion.hidden = false;

		// this.listQuestion.value = node.data.dialogueId as number ?? Number.MAX_SAFE_INTEGER;
		// this.selectComponent.selectedChange.emit(this.listQuestion.value);

		// let selectionValue = Number.MAX_SAFE_INTEGER;
		if (node.name === DIALOGUE_NODE_NAME) {
			this.nonStartNode = true;
			this.textAreaQuestion.text = 'Dialogue';
			this.textAreaQuestion.value = this.getQuestionValue(node.data.dialogueId as number, this.dialogues);

			// create the options
			if (this.currentNode.outputs.size) {
				this.currentNode.outputs.forEach((output) => {
					if (!this.excludeOutputs.includes(output.key)) {
						this.addOption(output);
						this.currentOutputCount++;
					}
				});
			}

			this.updatePrevious(this.currentNode);
		} else if (node.name === DIALOGUE_OPTION_NODE_NAME) {
			this.nonStartNode = true;
			this.textAreaQuestion.text = 'Dialogue Option';
			// this.listQuestion.options$.next(this.dialogueOptionsList);
			// selectionValue = node.data.optionId as number ?? Number.MAX_SAFE_INTEGER;
		} else {
			this.nonStartNode = false;
			this.textAreaQuestion.text = 'Start dialogue';
			this.textAreaQuestion.value = this.getQuestionValue(node.data.dialogueId as number, this.dialogues);
		}

		if(node.name === EVENT_NODE_NAME)
		{
			this.nonStartNode = true;
			this.textQuestion.hidden = true;
			this.textAreaQuestion.hidden = true;
			this.charTextQuestion.hidden = true;
		}

		// TODO enable code if use of dialogue option node.
		// setTimeout(() => {
		// 	this.listQuestion.value = selectionValue;
		// 	this.selectComponent.selectedChange.emit(this.listQuestion.value);
		// }, 100);
	}

	protected updatePrevious(node: Node) {
		const input: Input = node.inputs.get('dialogueIn') ? node.inputs.get('dialogueIn') : null;

		let option: string = '';
		if (input.hasConnection()) {
			const outputNode: Output = input.connections[0].output;

			// we are dialogue with dialogue options
			if (outputNode.key.includes('option')) {
				option = this.getQuestionValue(
					outputNode.node.data.options[outputNode.key].value as number, this.tblDialogueOptions,
				);
			} else {
				option = this.getQuestionValue(outputNode.node.data.dialogueId as number, this.dialogues);
			}
		}

		this.textQuestion.value = option;
	}
}
