import {
	AfterViewInit,
	Component, ElementRef, OnDestroy,
	OnInit, ViewChild, ViewContainerRef, NgZone,
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { NbDialogService, NbSelectComponent, NbToastrService } from '@nebular/theme';
import { Connection, Context, Input, Node, Output } from 'visualne';
import { ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { dialogueOptionSocket } from '@app-core/components/visualne/sockets';
import { DebouncedFunc } from '@app-core/types';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { Project } from '@app-core/data/state/projects';
import { ProjectsService } from '@app-core/data/state/projects';

import { DropDownQuestion, Option, TextboxQuestion } from '@app-core/data/forms/form-types';
import { TablesService } from '@app-core/data/state/tables';
import { Table } from '@app-core/data/state/tables';
import { BaseFirebaseComponent } from '@app-core/components/firebase/base-firebase.component';
import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { UtilsService } from '@app-core/utils';
import { AddComponent } from '@app-core/components/visualne/nodes/add-component';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { TableLoaderComponent } from '@app-theme/components';
import { OptionMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { ICharacter, IDialogue, IDialogueOption, IStory } from '@app-core/data/standard-tables';
import { EventsTypes } from 'visualne/types/events';
import { ProxyObject } from '@app-core/data/base';
import { Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

// VisualNE nodes
import { Component as VisualNEComponent } from 'visualne';
import {
	AdditionalEvents,
	DialogueNodeComponent,
	NumComponent,
	StartNodeComponent,
} from '@app-core/components/visualne';
import { NodeEditorService } from '@app-core/data/state/node-editor/node-editor.service';
import { KeyLanguage, systemLanguages } from '@app-core/data/state/node-editor/languages.model';

import isEqual from 'lodash.isequal';
import debounce from 'lodash.debounce';

const DIALOGUE_NODE_NAME: string = 'Dialogue';
const DIALOGUE_OPTION_NODE_NAME: string = 'Dialogue Option';

@Component({
	selector: 'ngx-editor',
	templateUrl: 'node-editor.component.html',
	styleUrls: ['node-editor.component.scss'],
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
})
export class NodeEditorComponent extends BaseFirebaseComponent implements OnInit, AfterViewInit, OnDestroy
{
	// VisualNE Editor
	@ViewChild('nodeEditor', { static: true })
	public el: ElementRef<HTMLDivElement>;

	@ViewChild('sidePanel', { static: true })
	public sidePanel: ElementRef<HTMLDivElement>;

	@ViewChild('overViewContainer', { read: ViewContainerRef, static: true })
	public vcr!: ViewContainerRef;

	@ViewChild('selectComponent', { static: true })
	public selectComponent: NbSelectComponent = null;

	public get CurrentNode(): Node
	{
		return this.currentNode;
	}

	public get getDialogue(): string
	{
		if(!this.listQuestion) return '';

		const dialogue: IDialogue = this.dialogues.find(+this.listQuestion.value);

		if(dialogue)
		{
			if(!dialogue.text.hasOwnProperty(this.nodeEditorService.Language))
				return 'Localization not found';
			// 	dialogue.text[this.nodeEditorService.Language] = '';

			return dialogue.text[this.nodeEditorService.Language];
		}

		return '';
	}

	public set setDialogue(event: any)
	{
		this.textAreaQuestion.value = event.target.value as string;
	}

	public get languages() { return systemLanguages; }

	public textQuestion: TextboxQuestion = new TextboxQuestion(
		{ text: 'Previous Dialogue Text', value: '', disabled: true, type: 'text'},
	);
	public charTextQuestion: TextboxQuestion = new TextboxQuestion(
		{ text: 'Character', value: '', disabled: true, type: 'text'},
	);
	public textAreaQuestion: TextboxQuestion = new TextboxQuestion(
		{ text: 'Dialogue', value: '', disabled: true, type: 'text'},
	);
	public listQuestion: DropDownQuestion = new DropDownQuestion({ text: 'Dialogue', value: Number.MAX_SAFE_INTEGER });

	public editMode: boolean = false;
	public nonStartNode: boolean = true;
	public relationDropDown: boolean = true;
	public insertDialogueText: string = 'Update';
	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	private components: VisualNEComponent[] = [
		new StartNodeComponent(),
		new DialogueNodeComponent(),
		new NumComponent(),
		new AddComponent(),
	]

	public title: string = '';
	public nodeTitle: string = '';

	protected changed: boolean = false;

	protected project: Project = new Project();
	protected currentState: { project: Project } = { project: new Project() };
	protected prevNode: Node = null;
	protected currentNode: Node = null;
	protected currentOutputCount: number = 0;

	protected outputs: Output[] = [];
	protected selectComponents: TableLoaderComponent[] = [];
	protected subs: [Subscription, Subscription][] = [];

	// Tables
	protected dialogues: Table<IDialogue> = null;
	protected tblDialogueOptions: Table<IDialogueOption> = null;
	protected stories: Table<IStory> = null;
	protected characters: Table<ICharacter> = null;

	// Table options
	protected dialogueList: Option<number>[] = [];
	protected dialogueOptionsList: Option<number>[] = [];

	// export import node editor
	protected participants: string[] = [];

	protected timeoutShow!: DebouncedFunc<(event: any) => void>;

	protected contextSettings: ContextMenuPluginParams = {
		searchBar: true, // true by default
		// searchKeep: title => true,
		// leave item when searching, optional. For example, title => ['Refresh'].includes(title)
		delay: 100,
		rename(component)
		{
			return component.name;
		},
		allocate(component)
		{
			if (component.name === 'Number' || component.name === 'Add')
			{
				return ['Math']
			}
			return [];
		},
		items: {
			'save': () => this.nodeEditorService.saveStory(),
			'Load': () => this.nodeEditorService.loadStory(),
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
		protected nodeEditorService: NodeEditorService,
		protected componentResolver: DynamicComponentService,
		private ngZone: NgZone,
	) {
		super(firebaseService, userService, userPreferencesService);
	}

	public ngOnInit()
	{
		super.ngOnInit();

		this.timeoutShow = debounce(this.showPanel, 250);
		this.mainSubscription.add(this.nodeEditorService.storyLoaded.subscribe((res: IStory) =>
		{
			// load the character
			if(res)
			{
				this.title = res.title;
				this.listQuestion.value = res.childId;
				if (res.parentId !== Number.MAX_SAFE_INTEGER && this.characters.find(res.parentId)) {
					this.charTextQuestion.value = this.characters.find(res.parentId).name;
				}
			}
		}));

		const map: ParamMap = this.activatedRoute.snapshot.paramMap;
		const id = map.get('id');

		this.firebaseService.getRef('projects/' + id).on('value', (snapshots) =>
		{
			this.currentState.project.id = id;
			snapshots.forEach((snapshot) =>
			{
				if(snapshot.exists())
				{
					// const q: any = snapshot.exists ? snapshot.val() : {};
					this.currentState['project'][snapshot.key] = snapshot.val();
				}
			});

			// set this project to the current
			this.project = this.projectsService.setProject(id, this.currentState.project, true);
			this.loadEditor();
		}, () => this.router.navigateByUrl('/dashboard/error'));

		this.editMode = false;

		// first we need to get the project.
		this.mainSubscription.add(this.user$.pipe(
			switchMap(() => this.projectsService.getProject$()),
		).subscribe((project) =>
		{
			if(project && !isEqual(this.project, project) && project.hasOwnProperty('tables'))
				this.project = project;
			this.userService.setUserPermissions(this.projectsService);
		}));
	}

	public ngAfterViewInit()
	{
		// First state is to just load everything.
		this.componentResolver.setRootViewContainerRef(this.vcr);
	}

	public ngOnDestroy(): void
	{
		super.ngOnDestroy();

		// TODO in order to get this right we need a switchRxJs method!
		// this.tables.forEach((table) => table.unsubscribe());
		this.nodeEditorService.destroy();
	}

	public showPanel(node: Node)
	{
		this.currentNode = node;
		this.editMode = false;

		if(( this.prevNode !== null && this.prevNode.id === this.currentNode.id)
		&& !this.sidePanel.nativeElement.classList.contains('open'))
		{
			// clear the container view in case we already have a node selected.
			this.clearViewContainer();
			this.ngZone.run(() => this.loadNodeInPanel(node));
		}

		// if we are clicking on a different node.
		if(( this.prevNode === null || this.prevNode.id !== this.currentNode.id))
		{
			this.prevNode = this.currentNode;

			// clear the container view in case we already have a node selected.
			this.clearViewContainer();
			this.ngZone.run(() => this.loadNodeInPanel(node));
		}
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
		this.nodeEditorService.newStory(async (res?: IStory) =>
			{
				if(res !== undefined)
				{
					if(this.nodeEditorService.SelectedStory)
					{
						this.title = this.nodeEditorService.SelectedStory.title;

						// set the start node output data to the new story
						this.listQuestion.value = this.nodeEditorService.SelectedStory.childId;

						// if we are changing the start node
						this.editMode = false;

						// set changed to true
						this.changed = true;
						// and save it to the local storage
						this.nodeEditorService.saveSnippet();
					}
				}
			},
		);
	}

	public onSelect(event: number)
	{
		this.listQuestion.value = event;
		if(this.currentNode)
		{
			// if we have a dialogueNode
			if(this.currentNode.name === DIALOGUE_NODE_NAME)
			{
				this.currentNode.data['dialogueId'] = +this.listQuestion.value;

				// in the story table we have
				// ID - id of the story
				// Title - title of the story
				// description - description for the story
				// parentId - the story that is connected to the story.
				// childId - dialogue start node

				// if we are changing the start node
				if(!this.nonStartNode)
				{
					// change the childId.
					this.nodeEditorService.SelectedStory.childId = this.currentNode.data.dialogueId as number;

					// set changed to true
					this.changed = true;

					// Save to local storage as well.
					this.nodeEditorService.saveSnippet();
				}
			}

			if(this.currentNode.name === DIALOGUE_OPTION_NODE_NAME)
			{
				this.currentNode.data['optionId'] = +this.listQuestion.value;
			}

			this.nodeEditorService.Editor.trigger('process');
		}
	}

	public onLanguageChange(event: KeyLanguage)
	{
		this.nodeEditorService.Language = event;
		if(this.nodeEditorService.Editor)
		{
			this.loadDifferentLanguage<IDialogue>(this.dialogueList, this.dialogues);
			this.listQuestion.options$.next(this.dialogueList);

			this.loadDifferentLanguage<IDialogueOption>(this.dialogueOptionsList, this.tblDialogueOptions);
			this.selectComponents.forEach((c, idx, arr) => {
				c.listQuestion.options$.next(this.dialogueOptionsList);
				arr[idx] = c;
			});
			const nodes = this.nodeEditorService.Editor.nodes;
			nodes.forEach((n) => { if(n.name === DIALOGUE_NODE_NAME) n.update() });
		}
	}

	public cancelEdit()
	{
		this.editMode = false;
		this.insertDialogueText = 'Update';
	}

	public edit(isNew: boolean = false)
	{
		this.textAreaQuestion.value = this.getDialogue;
		this.editMode = true;
		this.insertDialogueText = isNew ? 'Insert' : 'Update';
		if(isNew)
		{
			this.listQuestion.value = Number.MAX_SAFE_INTEGER;
			this.selectComponent.selectedChange.emit(this.listQuestion.value);
		}
	}

	public addOption(output: Output = null)
	{
		if(this.currentNode)
		{
			const hasOutput = output !== null;

			// create the component
			const componentRef = this.componentResolver.addDynamicComponent(TableLoaderComponent);
			const instance: TableLoaderComponent = componentRef.instance;
			instance.listQuestion.options$.next(this.dialogueOptionsList);

			const optionMap = this.currentNode.data.options as OptionMap;
			instance.listQuestion.value = hasOutput && optionMap.hasOwnProperty(output.key)
				? optionMap[output.key].value : Number.MAX_SAFE_INTEGER;

			instance.selectComponent.selectedChange.emit(
				hasOutput && optionMap.hasOwnProperty(output.key) ? optionMap[output.key].value : Number.MAX_SAFE_INTEGER,
			);

			const idx = this.selectComponents.push(instance);
			instance.listQuestion.text = hasOutput ? output.name : `Option Out ${idx}`;
			instance.id = idx - 1;

			const outputText = hasOutput ? output.name : `Option Out ${idx} - [NULL]`;

			const out = hasOutput ? output :
				new Output(`optionOut-${this.currentOutputCount++}`, outputText, dialogueOptionSocket, false);

			const outputIdx = this.outputs.push(out);

			if(!hasOutput) // only add when we have created a new output
				this.currentNode.addOutput(this.outputs[outputIdx - 1]);

			this.subs.push([
				this.mainSubscription.add(
					componentRef.instance.select.subscribe(({ id, event }) => this.onOptionSelected(id, event)),
				),
				this.mainSubscription.add(
					componentRef.instance.delete.subscribe((id: number) => this.onOptionDeleted(id)),
				),
			]);

			this.currentNode.update();

			// save the snippet again
			if(!hasOutput)
				this.nodeEditorService.saveSnippet();
		}
	}

	public onOptionSelected(idx: number, event: number)
	{
		const output = this.currentNode.outputs.get(this.outputs[idx].key);
		(this.currentNode.data.options as OptionMap)[output.key] = { key: idx, value: event };

		this.currentNode.update();
		this.nodeEditorService.Editor.trigger('process');
	}

	public onOptionDeleted(idx: number)
	{
		// delete the output by key
		this.currentNode.removeOutput(this.outputs[idx]);
		this.outputs.splice(idx, 1);
		this.selectComponents.splice(idx, 1);

		// remove the subscription
		const sub: [Subscription, Subscription] = this.subs[idx];

		this.mainSubscription.remove(sub[0]);
		this.mainSubscription.remove(sub[1]);

		// we need to rearrange the outputs
		this.outputs.forEach((output, index, arr) =>
		{
			this.selectComponents[index].id = index;
			this.selectComponents[index].listQuestion.text = `Option Out ${index + 1}`;
			arr[index].name = `Option Out ${index + 1} - [NULL]`;
		});

		this.vcr.detach(idx);

		this.currentNode.update();
	}

	public updateDialogue()
	{
		// If we have a whole new value we need to add it to the option list
		const listId = this.listQuestion.value as number;
		if(listId === Number.MAX_SAFE_INTEGER)
		{
			// reference to dialogue table
			const tblName = `tables/${this.dialogues.id}`;
			// Create new dialogue obj
			const dialogue: IDialogue = {
				deleted: false,
				created_at: UtilsService.timestamp,
				updated_at: UtilsService.timestamp,
				characterId: this.nodeEditorService.SelectedStory.parentId,
				nextId: Number.MAX_SAFE_INTEGER,
				parentId: +this.nodeEditorService.SelectedStory.id,
				text: {},
			};
			dialogue.text[this.nodeEditorService.Language] = this.textAreaQuestion.value as string;

			this.firebaseService.insertData(tblName + '/data', dialogue, tblName)
				.then((data) =>
					{
						UtilsService.showToast(
							this.toastrService,
							'Dialogue inserted!',
							'Dialogue has been successfully created',
						);

						// grab the latest id and store it in the story and in the dialogue
						if(data && typeof data === 'number')
						{
							dialogue.id = data;

							this.dialogueList.push(new Option<number>({
								key: dialogue.id + '. ' + dialogue.text[this.nodeEditorService.Language],
								value: dialogue.id,
								selected: true,
							}));

							this.listQuestion.value = dialogue.id;

							if(!this.nonStartNode)
								this.nodeEditorService.SelectedStory.childId = dialogue.id;
						}

						setTimeout(() => {
							// set changed to true
							this.changed = true;

							this.selectComponent.selectedChange.emit(this.listQuestion.value);

							// Save to local storage as well.
							this.nodeEditorService.saveSnippet();
						}, 500);

						this.editMode = false;
					},
				);
		}
		else // update the value of the one we choose
		{
			this.listQuestion.key = this.textAreaQuestion.value as string;
			const foundedDialogue: IDialogue = this.dialogues.find(listId);

			const dialogue = {
				id: foundedDialogue.id,
				text: { ...foundedDialogue.text },
			}
			dialogue.text[this.nodeEditorService.Language] = this.listQuestion.key;

			// find the current dialogue
			const payload = { currDialogue: dialogue, nextDialogue: null /*, optionMap: null, */ }
			const context: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
			context.trigger('saveDialogue', payload);

			this.textAreaQuestion.value = '';
		}

		this.editMode = false;
	}

	public clearViewContainer()
	{
		if(this.selectComponents.length === 0) return;

		// delete the options from the view container
		// delete the output by key
		this.selectComponents.forEach((_, idx) =>
		{
			this.outputs.splice(idx, 1);

			// remove the subscription
			const sub: [Subscription, Subscription] = this.subs[idx];
			this.mainSubscription.remove(sub[0]);
			this.mainSubscription.remove(sub[1]);

			// detach it from the view container
			this.vcr.detach(idx);
		});
		// clear out the outputs
		this.outputs = [];
		// clear out the components
		this.selectComponents = [];

		// reset the output counter
		this.currentOutputCount = 0;
	}

	protected async initializeEditor()
	{
		await this.nodeEditorService.run(this.components, 'story@0.2.0', this.contextSettings);

		this.nodeEditorService.Editor.bind('saveDialogue');
		this.nodeEditorService.Editor.bind('saveOption');

		this.nodeEditorService.listen('nodecreate', (node: Node) => {
			if(node.name === DIALOGUE_NODE_NAME && !node.data.hasOwnProperty('dialogueId'))
			{
				node.data = {
					...node.data,
					dialogueId: 7,
				}
			}
		});

		this.nodeEditorService.listen(['nodetranslate', 'nodedeselected'], () => {
			const hide = this.timeoutShow;

			if (hide && hide.cancel)
				hide.cancel();

			this.currentNode = null;
			this.nodeTitle = '';
			this.clearViewContainer();
			this.sidePanel.nativeElement.classList.remove('open');

			return true;
		});

		// if we are done with dragging
		this.nodeEditorService.listen('nodetranslated', ({ node, prev}: { node: Node, prev: [number, number] } ) => {
			if(node.position === prev)
				this.timeoutShow(node);
		});

		this.nodeEditorService.listen('nodeselected', (node: Node) => {
			this.timeoutShow(node);
		});

		this.nodeEditorService.listen('connectioncreated', (connection: Connection) => {

			const outputNode: Output = connection.output;

			let option;
			// we are dialogue with dialogue options
			if(outputNode.key.includes('option'))
			{
				option = this.dialogueOptionsList.find((o) => {
					return o.value === outputNode.node.data.options[outputNode.key].value as number;
				});
			}
			else {
				option = this.dialogueList.find((o) => {
					return o.value === outputNode.node.data.dialogueId as number;
				});
			}

			this.textQuestion.value = option ? option.key : 'None';
		});

		this.nodeEditorService.listen('import', data => {
			this.participants = data.characters || [];
		});

		// Saving nodes we need to add character data as well.
		this.nodeEditorService.listen('export', data => {
			if (this.nodeEditorService.SelectedStory)
			{
				data.characters = [
					// Set the main character that is talking in this array
					this.nodeEditorService.SelectedStory.parentId,
					// TODO Add characters that are joining the conversation
				];
			}
		});

		const ctx: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
		ctx.on('saveDialogue', ({ currDialogue, nextDialogue/*, optionMap */}) =>
		{
			// change the default tblName
			// Get the stories table
			this.tableName = `tables/${this.dialogues.id}`;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableName);

			// change the dialogueId
			// find the current dialogue
			const dialogue: IDialogue = typeof currDialogue === 'number'
				? this.dialogues.find(currDialogue) as IDialogue
				: currDialogue !== null ? this.dialogues.find(currDialogue.id) : null;

			if(dialogue)
			{
				const event: { data: ProxyObject, newData: ProxyObject, confirm?: any } =
				{
					data: dialogue,
					newData: {
						...dialogue,
						// override nextId
						nextId: nextDialogue ? nextDialogue : dialogue.nextId,
					},
				};

				// override with the incoming dialogue
				if(typeof currDialogue !== 'number') event.newData = { ...event.newData, ...currDialogue };

				/*
				if(optionMap !== undefined && optionMap !== null)
				{
					const options = Object.values<KeyValue<number, number>>(optionMap);
					const o: number[] = options.map(v => v.value);
					event.newData['options'] = o.join(',');
				}
				 */

				const oldObj: ProxyObject = event.hasOwnProperty('data') ? { ...event.data } : null;
				const obj: ProxyObject = { ...event.newData };
				if(isEqual(event.data, event.newData))
					return;

				this.updateFirebaseData(event, obj, oldObj);
				this.nodeEditorService.saveSnippet();
			}
		});

		ctx.on('saveOption', ({ fOption, fNextId }) =>
		{
			// change the default tblName
			// Get the stories table
			this.tableName = `tables/${this.tblDialogueOptions.id}`;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableName);

			// change the dialogueId
			// find the dialogue
			const dialogueOption: IDialogueOption = this.tblDialogueOptions.find(fOption) as IDialogueOption;
			if(dialogueOption)
			{
				const event: { data: ProxyObject, newData: ProxyObject, confirm?: any } = {
					data: dialogueOption,
					newData: {
						...dialogueOption,
						// override nextId
						childId: fNextId,
					},
				};

				const oldObj: ProxyObject = event.hasOwnProperty('data') ? { ...event.data } : null;
				const obj: ProxyObject = { ...event.newData };

				if(isEqual(event.data, event.newData))
				{
					return;
				}

				this.updateFirebaseData(event, obj, oldObj);
				this.nodeEditorService.saveSnippet();
			}
		});

		// open popup to load a story
	}

	protected loadEditor()
	{
		// Load the tables
		this.loadTables().then(() =>
		{
			// initialize the editor
			const container = this.el.nativeElement;
			this.nodeEditorService.initialize(container,
				{ characters: this.characters, stories: this.stories, dialogues: this.dialogues })
				.then(() => this.initializeEditor());
		});
	}

	protected loadTables(): Promise<void>
	{
		const tables = Object.keys(this.project.tables);
		const promises: Promise<Table | boolean>[] = [];
		for(let i = 0; i < tables.length; i++)
		{
			const tbl = this.project.tables[tables[i]];
			const t: Table | null = this.tableService.getTableById(tables[i]);

			if(
				tbl.name.toLowerCase() === 'dialogues'
				&& (t === null || !t.loaded)
				||
				tbl.name.toLowerCase() === 'dialogueoptions'
				&& (t === null || !t.loaded)
				||
				tbl.name.toLowerCase() === 'characters'
				&& (t === null || !t.loaded)
				||
				tbl.name.toLowerCase() === 'stories'
				&& (t === null || !t.loaded)
			)
			{
				promises.push(this.tableService.addIfNotExists(tables[i]));
			}
			else this.loadTable(t);

		}

		return new Promise((resolve) => {

			Promise.all(promises).then((values: Table[] | boolean[]) =>
			{
				values.forEach((value: Table | boolean) =>
				{
					if(value instanceof Table)
					{
						this.loadTable(value);
					}
				});
				resolve();
			})
		});
	}

	protected loadTable(value: Table)
	{
		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'dialogues')
		{
			// store the dialogues.
			this.dialogues = <Table<IDialogue>>value;
			value.filteredData.forEach((pObj) => this.dialogueList.push(
				new Option<number>({
					key: pObj.id + '. ' + pObj.text[this.nodeEditorService.Language],
					value: +pObj.id,
					selected: false,
				})),
			);

			// Set the initial list to dialogues, since we are probably going to use that first
			// in the node editor.
			this.listQuestion.options$.next(this.dialogueList);


			// Listen to incoming data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.dialogues.id}/data`, ['child_added'])
				.subscribe((snapshots) =>
					{
						for(let i = 0; i < snapshots.length; i++)
						{
							const snapshot = snapshots[i];
							if(snapshot.type !== 'child_added')
								continue;

							this.dialogues.push(+snapshot.key, snapshot.payload.val()).then(() =>
							{
								this.nodeEditorService.Data = { key: 'dialogues', value: this.dialogues };
							});
						}
					},
				));
		}

		if(value.metadata.title.toLowerCase() === 'dialogueoptions')
		{
			this.tblDialogueOptions = <Table<IDialogueOption>>value;
			value.filteredData.forEach((pObj) => this.dialogueOptionsList.push(
				new Option<number>({
					key: pObj.id + '. ' + pObj.text[this.nodeEditorService.Language],
					value: +pObj.id,
					selected: false,
				})),
			);
		}

		if(value.metadata.title.toLowerCase() === 'characters')
		{
			this.characters = <Table<ICharacter>>value;

			// listen to changed data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.characters.id}/data`, ['child_added'])
				.subscribe((snapshots) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type !== 'child_added')
							continue;

						this.characters.push(+snapshot.key, snapshot.payload.val()).then(() =>
						{
							this.nodeEditorService.Data = { key: 'characters', value: this.characters };
						});

					}
				},
			));
		}

		if(value.metadata.title.toLowerCase() === 'stories')
		{
			this.stories = <Table<IStory>>value;
		}
	}

	protected loadNodeInPanel(node: Node)
	{
		// always open the panel even if we have the same node.
		this.sidePanel.nativeElement.classList.add('open');
		this.nodeTitle = node.name;
		this.listQuestion.value = node.data.dialogueId as number ?? Number.MAX_SAFE_INTEGER;
		this.selectComponent.selectedChange.emit(this.listQuestion.value);

		// let selectionValue = Number.MAX_SAFE_INTEGER;
		if(node.name === DIALOGUE_NODE_NAME)
		{
			this.nonStartNode = true;
			this.listQuestion.text = 'Dialogue';
			this.listQuestion.options$.next(this.dialogueList);

			const input: Input = node.inputs.get('dialogueIn') ? node.inputs.get('dialogueIn') : null;

			let option = null;
			if(input.hasConnection())
			{
				const outputNode: Output = input.connections[0].output;

				// we are dialogue with dialogue options
				if(outputNode.key.includes('option'))
				{
					option = this.dialogueOptionsList.find((o) => {
						return o.value === outputNode.node.data.options[outputNode.key].value as number;
					});
				}
				else {
					option = this.dialogueList.find((o) => {
						return o.value === outputNode.node.data.dialogueId as number;
					});
				}
			}

			// create the options
			if(this.currentNode.outputs.size)
			{
				this.currentNode.outputs.forEach((output) =>
				{
					if(output.key !== 'dialogueOut')
					{
						this.addOption(output);
						this.currentOutputCount++;
					}
				});
			}

			this.textQuestion.value = option ? option.key : 'None';
		}
		else if(node.name === DIALOGUE_OPTION_NODE_NAME)
		{
			this.nonStartNode = true;
			this.listQuestion.text = 'Dialogue Option';
			this.listQuestion.options$.next(this.dialogueOptionsList);
			// selectionValue = node.data.optionId as number ?? Number.MAX_SAFE_INTEGER;
		}
		else {
			this.nonStartNode = false;
		}

		// TODO enable code if use of dialogue option node.
		// setTimeout(() => {
		// 	this.listQuestion.value = selectionValue;
		// 	this.selectComponent.selectedChange.emit(this.listQuestion.value);
		// }, 100);
	}

	protected loadDifferentLanguage<T extends ProxyObject = ProxyObject>(options: Option<number>[], tableRef: Table<T>)
	{
		options.forEach((o, idx, arr) => {
			const option = tableRef.filteredData[idx];
			const text = option.text.hasOwnProperty(this.nodeEditorService.Language)
				? option.text[this.nodeEditorService.Language]
				: 'Localization not found';

			arr[idx] = new Option<number>({
				...o,
				key: option.id + '. ' + text,
			});
		});
	}
}
