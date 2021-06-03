import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Engine, Node as VisualNENode, NodeEditor } from 'visualne';

import { ConnectionPlugin } from 'visualne-connection-plugin';
import { AngularRenderPlugin } from 'visualne-angular-plugin';
import { ContextMenuPlugin } from 'visualne-angular-context-menu-plugin';
import { CommentPlugin } from 'visualne-comment-plugin';
import MinimapPlugin from 'rete-minimap-plugin';
import HistoryPlugin from 'rete-history-plugin';

import { StartNodeComponent } from '@app-core/components/visualne/nodes/story-editor/start-node-component';
import { DialogueNodeComponent } from '@app-core/components/visualne/nodes/story-editor/dialogue-node-component';
import { DialogueOptionNodeComponent } from '@app-core/components/visualne/nodes/story-editor/dialogue-option-node-component';

import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { AddComponent } from '@app-core/components/visualne/nodes/add-component';
import { NumComponent } from '@app-core/components/visualne/nodes/number-component';
import { NbToastrService } from '@nebular/theme';
import { UtilsService } from '@app-core/utils';
import { Subject } from 'rxjs';
import { combineLatest } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { onSimpleTableMap, Table } from '@app-core/data/state/tables';

export enum INSPECTOR_STATE
{
	DIALOGUE, // Insert new column
	DIALOGUE_OPTION, // Update new column
}


interface ContextSettings {
	searchBar: boolean,
	delay: number,
	rename: allocateFunc,
	allocate: allocateFunc,
	items: Object,
	nodeItems: Object,
}

declare type allocateFunc = (component) => { };

declare module 'visualne/types/events'
{
	interface EventsTypes
	{
		save:
		{
			id: number,
			func: Function,
		};
		generate:
		{
			startNode: VisualNENode,
		}
	}
}

const MINIMAL_OFFSET: number = 700;

@Component({
	selector: 'ngx-node-editor',
	styleUrls: ['node-editor.component.scss'],
	template: `
		<div class="wrapper" (keydown)="onKeyUpConfirmed($event)" tabindex="0">
			<div #nodeEditor class="node-editor"></div>
		</div>
	`,
})
export class NodeEditorComponent implements OnInit, AfterViewInit, OnDestroy
{
	// Rete plugin
	@ViewChild('nodeEditor', { static: true })
	public el: any;

	@Input()
	public dialogues: Table;

	@Input()
	public currentState: any = null;

	public getState(): INSPECTOR_STATE {
		return this.inspectorState;
	}

	private readonly NAMES = [
		'Start',
	];

	private dialogueOptions: Table;
	private stories: Table;
	private characters: Table;

	private contextSettings: ContextSettings = {
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
		items: {},
		nodeItems:
		{
			'Delete': true, // Show Delete item
			'Clone': false, // or Clone item
			'Info': false,
		},
	};

	private inspectorState: INSPECTOR_STATE = INSPECTOR_STATE.DIALOGUE;

	private components = [
		new StartNodeComponent(),
		new DialogueNodeComponent(),
		new DialogueOptionNodeComponent(),
		new NumComponent(),
		new AddComponent(),
	];

	private posX: number = 80;
	private posY: number = 200;
	private rowClicked = false;
	private saveClicked = false;
	private storyLoaded = false;

	private nodeEditor: NodeEditor;
	private engine: Engine;

	private tableReference = ['dialogueOptions', 'characters', 'stories'];
	private tablesLoaded: Subject<boolean> = new Subject<boolean>();
	private execSaveFunctions: Map<number, Function> = new Map<number, Function>();

	constructor(
		protected firebaseService: FirebaseService,
		protected toastrService: NbToastrService,
		protected activatedRoute: ActivatedRoute,
	) {
		this.tablesLoaded.next(false);
		const tables = combineLatest([
			this.firebaseService.getTableData$('dialogueOptions').pipe(onSimpleTableMap),
			this.firebaseService.getTableData$('characters').pipe(onSimpleTableMap),
			this.firebaseService.getTableData$('stories').pipe(onSimpleTableMap),
		]);

		tables.subscribe((observer) =>
		{
			for (let i = 0; i < this.tableReference.length; i++)
			{
				switch(i)
				{
					case 0:
					{
						this.dialogueOptions = observer[i];

						StartNodeComponent.dialogues = DialogueNodeComponent.dialogues = this.dialogues;
						StartNodeComponent.dialogueOptions = DialogueNodeComponent.dialogueOptions = this.dialogueOptions;
						StartNodeComponent.currentState = DialogueNodeComponent.currentState = this.currentState;

						const c: any = this.components[2];
						c.dialogueOptions = this.dialogueOptions;
						c.dialogues = this.dialogues;
					}
						break;
					case 1:
					{
						this.characters = observer[i];

						const c: any = this.components[1]; // dialogueNodeComponent
						c.characters = this.characters;
					}
						break;
					case 2:
					{
						this.stories = observer[i];

						const c: any = this.components[0]; // startNodeComponent
						c.stories = this.stories;
					}
						break;
				}
			}

			this.tablesLoaded.next(true);
		});
	}

	public ngOnInit(): void
	{
		this.tablesLoaded.next(false);
	}

	public async ngAfterViewInit()
	{
		const container = this.el.nativeElement;

		if(container)
		{
			const map: ParamMap = this.activatedRoute.snapshot.paramMap;
			const sheetId = map.get('story') + '@0.2.0';
			this.nodeEditor = new NodeEditor( sheetId, container);
			this.nodeEditor.use(ConnectionPlugin,
				{ createAndConnect: { keyCode: 'Control' }, pickConnection: { keyCode: 'KeyD' }, curvature: 0.4 },
			);
			this.nodeEditor.use(AngularRenderPlugin); // { component: MyNodeComponent })
			this.nodeEditor.use(MinimapPlugin);
			this.nodeEditor.use(ContextMenuPlugin, this.contextSettings); // TODO implement context menu for right click event
			this.nodeEditor.use(CommentPlugin, { margin: 20 }); // indent for new frame comments by default 30 (px)
			this.nodeEditor.use(HistoryPlugin, { keyboard: true });
			// this.nodeEditor.use(LifecyclePlugin);
			/*
// or disable features
			editor.use(ConnectionMasteryPlugin, {
				createAndConnect: false,
				pickConnection: false
			});
// or change keys
			editor.use(ConnectionMasteryPlugin, {
				createAndConnect: { keyCode: 'Control' },
				pickConnection: { keyCode: 'KeyD' }
			});
			*/

			this.engine = new Engine(sheetId);

			this.nodeEditor.bind('save');
			this.nodeEditor.bind('generate');

			this.nodeEditor.on('renderconnection', ({ el}) => {
				el.style.zIndex = '1';
			});

			this.nodeEditor.on('nodecreate', node =>
			{
				/// check if there is already a node with that name
				const haveSomeNode = this.nodeEditor.nodes.some((item) =>
				{
					if(item.name === node.name)
					{
						return this.NAMES.some(name => name === node.name);
					}
					return false;
				});

				return !haveSomeNode; // prevent the addition of a new node
			});

			this.nodeEditor.on('nodecreated', async ( node: VisualNENode) =>
			{
				// put the node created in edit mode.

				if(node instanceof DialogueNodeComponent)
				{

				}

				console.log(node.name);
				if(node.name === 'Dialogue Option')
				{
					const optionId = node.data.hasOwnProperty('optionId') ? <number>node.data.optionId : Number.MAX_SAFE_INTEGER;
					const sub = <Subject<boolean>>(node.meta.editMode);
					sub.next(optionId === Number.MAX_SAFE_INTEGER);

					console.log(sub, optionId);
				}

				if(this.nodeEditor.silent) return true;

				const json = this.nodeEditor.toJSON();

				await this.engine.abort();
				await this.engine.process(json);

				// this.nodeEditor.trigger('process');
				return true;
			});

			/*
			this.nodeEditor.on('noderemove',(node: VisualNENode) =>
			{
				// first disconnect connections
				if(node.getConnections().length !== 0)
					node.getConnections().forEach((connection) => this.nodeEditor.removeConnection(connection));

				this.nodeEditor.view.updateConnections({ node });
				this.engine.process(this.nodeEditor.toJSON());

				return true;
			});
			*/

			this.nodeEditor.on(['process', 'connectioncreated', 'connectionremoved'], (async () =>
			{
				if(this.nodeEditor.silent) return;

				await this.engine.abort();
				await this.engine.process(this.nodeEditor.toJSON());
			}) as any);

			this.nodeEditor.on('nodeselected', () => {
				console.log('node selected');
			});

			this.nodeEditor.on(['contextmenu'], (async (context) => {
				console.log(context);
			}) as any);

			this.nodeEditor.on('zoom', ({ source }) => {
				return source !== 'dblclick';
			});

			this.nodeEditor.on('error', (error) => {
				console.log(error);
			});

			this.nodeEditor.on('save', (async ({ id, func}) =>
			{
				if(id > 0 && func)
				{
					this.execSaveFunctions.set(id, func);
				}
			}));

			this.nodeEditor.on('generate', (async ( data: { startNode: VisualNENode }) =>
			{
				if(this.storyLoaded)
				{
					this.storyLoaded = false;
					await this.generateNodes({ data: data.startNode.data }, true, data.startNode)
				}
			}));

			this.components.map(c =>
			{
				this.nodeEditor.register(c);
				this.engine.register(c);
			});

			this.nodeEditor.view.resize();

			// this.nodeEditor.trigger('addcomment', ({ type: 'frame', text, nodes }))
			// this.nodeEditor.trigger('addcomment', ({ type: 'inline', text, position }))

			// this.nodeEditor.trigger('removecomment', { comment })
			// this.nodeEditor.trigger('removecomment', { type })

			this.nodeEditor.trigger('process');
		}
	}

	public ngOnDestroy(): void
	{
		// TODO in order to get this right we need a switchRxJs method!
		// this.tables.forEach((table) => table.unsubscribe());
		this.nodeEditor.destroy();
	}

	public save()
	{
		if(this.nodeEditor && !this.saveClicked)
		{
			this.saveClicked = true;
			setTimeout(() => this.saveClicked = false, 500);

			let executed: boolean = false;
			this.execSaveFunctions.forEach((value: Function /*, key: number */) =>
			{
				// execute function
				if(value)
				{
					value();
					executed = true;
				}
			});

			if(executed)
				UtilsService.showToast(
					this.toastrService,
					'Story saved!',
					'Data has all been successfully executed',
				);
		}
	}

	public onKeyUpConfirmed(event: any)
	{
		// Detect platform
		if(navigator.platform.match('Mac'))
			this.handleMacKeyEvents(event);
		else
			this.handleWindowsKeyEvents(event);
	}

	public async addDialogue(
		id: number, [ posX = Number.MAX_SAFE_INTEGER, posY = Number.MAX_SAFE_INTEGER ] = [],
		{ prevNode = null, optionNode = null } = {})
	{
		const node = await this.components[1].createNode({ dialogueId: id });

		this.posX = posX !== Number.MAX_SAFE_INTEGER ? posX : this.posX;
		this.posY = posY !== Number.MAX_SAFE_INTEGER ? posY : this.posY;

		node.position = [this.posX, this.posY];

		this.posX += MINIMAL_OFFSET;

		this.nodeEditor.addNode(node);

		if(prevNode)
		{
			if (prevNode.outputs.get('dialogueOut') && node.inputs.get('dialogueIn'))
			{
				this.nodeEditor.connect(prevNode.outputs.get('dialogueOut'), node.inputs.get('dialogueIn'));
				prevNode.update();
			}
		}

		if(optionNode)
		{
			if(node.inputs.get('dialogueIn') && optionNode.outputs.get('optionOut'))
				this.nodeEditor.connect(optionNode.outputs.get('optionOut'), node.inputs.get('dialogueIn'));
		}

		return node;
	}

	public async addDialogueOption(parentNode: VisualNENode, option: any, [posX, posY]): Promise<VisualNENode>
	{
		const node = await this.components[2].createNode({ optionId: option.id });

		node.position = [posX, posY];

		this.nodeEditor.addNode(node);

		// connect the existing node
		if(parentNode.outputs.get('dialogueOut') && node.inputs.get('DialogueIn'))
			this.nodeEditor.connect(parentNode.outputs.get('dialogueOut'), node.inputs.get('DialogueIn'));

		return node;
	}

	public async generate(event: any)
	{
		this.tablesLoaded.subscribe(async (value: boolean) =>
		{
			this.generateNodes(event, value);
		});
	}

	protected async generateNodes(event: any, value: boolean, startOverrideNode: VisualNENode = null)
	{
		if(this.storyLoaded)
			return;

		if(value && this.nodeEditor && !this.rowClicked && event.hasOwnProperty('data'))
		{
			this.rowClicked = true;
			setTimeout(() => this.rowClicked = false, 500);

			/**
			 * @brief - If we don't have the start node clear the field
			 */
			if(!startOverrideNode)
				this.nodeEditor.clear();
			// Set the positions
			this.posX = 80; this.posY = 200;

			// Make the start node
			const startNode: any = startOverrideNode ? startOverrideNode : await this.components[0].createNode(event.data);
			startNode.position = [this.posX, this.posY];

			this.posX += MINIMAL_OFFSET * 1.5;

			this.nodeEditor.addNode(startNode);

			// if we start with dialogue options

			/**
			 * @brief - While we have a next node make it.
			 */
			const prevNode: any = startNode;
			const currentId = event.data.id;
			const nextId: number = event.data.nextId;
			const layer = 0;

			if(nextId !== Number.MAX_SAFE_INTEGER)
			{
				await this.generateFromDialogue(startNode, layer);
			}
			else
			{
				await this.generateFromDialogueOptions(startNode, currentId, [this.posX, this.posY * 0.5], layer);
			}
			// this.nodeEditor.view.resize();
			this.nodeEditor.trigger('process');

			// story is now loaded
			this.storyLoaded = true;
		}
	}

	protected async generateSequence(nextId: number, prevNode: VisualNENode, layer: number)
	{
		while (nextId !== Number.MAX_SAFE_INTEGER)
		{
			// find the next node
			const el = this.dialogues.find(nextId);
			if (el)
			{
				const newNode = await this.addDialogue(Number(el.id));

				const xOffset = this.posX + MINIMAL_OFFSET * 0.5;
				let yOffset = this.posY;
				let nextDialogueNode = null;
				for(const option of this.dialogueOptions)
				{
					if(el.id !== Number.MAX_SAFE_INTEGER && option.parentId === el.id)
					{
						let foundedNode: VisualNENode | null = null;
						for(let i: number = 0; i < this.nodeEditor.nodes.length; i++)
						{
							const node = this.nodeEditor.nodes[i];
							if(!node.data.hasOwnProperty('optionId'))
								continue;

							if(node.data.optionId === option.id)
							{
								foundedNode = node;
								break;
							}
						}

						// const dialogueOptionIdText = option.id.toString(10);
						// node.addInput(new ReteInput(
						// 	'optionIn' + option.id, 'In ID [' + dialogueOptionIdText + ']', dialogueOptionSocket));
						nextDialogueNode = await this.addDialogueOption(newNode, option, [xOffset, yOffset]);

						// if(nextDialogueNode && nextDialogueNode.data.hasOwnProperty('DialogueControlOut'))
							// await this.generateDialogues(nextDialogueNode.data.DialogueControlOut.nextId, nextDialogueNode, ++layer);

						yOffset += MINIMAL_OFFSET * 0.8;
					}
				}

				// if (prevNode.outputs.get('dialogueOut') && newNode.inputs.get('dialogueIn'))
				// {
				// 	this.nodeEditor.connect(prevNode.outputs.get('dialogueOut'), newNode.inputs.get('dialogueIn'));
				// 	prevNode.update();
				// }
				// TODO if the prevNode is a choice we'd probably have to do something different
				prevNode = newNode;
				nextId = el.nextId;
			} else
			{
				nextId = Number.MAX_SAFE_INTEGER;
			}
		}

		/*
		while (nextId !== Number.MAX_SAFE_INTEGER)
		{
			// find the next node
			const el = this.dialogues.find((dialogue) => dialogue.id === nextId);
			if (el)
			{
				const newNode = await this.addDialogue(el.id);

				if (prevNode.outputs.get('dialogueOut') && newNode.inputs.get('dialogueIn'))
					this.nodeEditor.connect(prevNode.outputs.get('dialogueOut'), newNode.inputs.get('dialogueIn'));

				// TODO if the prevNode is a choice we'd probably have to do something different
				prevNode = newNode;
				nextId = el.nextId;
			} else
			{
				nextId = Number.MAX_SAFE_INTEGER;
			}
		}
		*/
	}

	protected async generateFromDialogue(startNode: VisualNENode, layer: number = 0)
	{
		let prevNode: any = startNode;
		// const currentId = prevNode.data.id;
		let nextId: number = prevNode.data.DialogueControlOut.nextId;

		while (nextId !== Number.MAX_SAFE_INTEGER)
		{
			// find the next node
			const el = this.dialogues.find(nextId);
			if (el)
			{
				const newNode = await this.addDialogue(Number(el.id), [], { prevNode: prevNode });
				if((<any>(newNode.data?.DialogueControlOut)).nextId === Number.MAX_SAFE_INTEGER)
				{
					const nextData = <any>(newNode.data.DialogueControlOut);
					// const nextData = <any>(newNode.data?.DialogueControlOut);
					await this.generateFromDialogueOptions(newNode, nextData.dialogueId,
						[newNode.position[0] + MINIMAL_OFFSET, newNode.position[1]]);
				}

				// TODO if the prevNode is a choice we'd probably have to do something different
				prevNode = newNode;
				nextId = el.nextId;
			}
			else
			{
				nextId = Number.MAX_SAFE_INTEGER;
			}
		}
	}

	/**
	 * @brief
	 *
	 * @param startNode
	 * @param searchId
	 * @param posX
	 * @param posY
	 * @param layer
	 */
	protected async generateFromDialogueOptions(startNode: VisualNENode, searchId: number, [posX, posY], layer: number = 0)
	{
		const xOffset = posX;
		let yOffset = posY;

		// if we don't have a next Id we might have an option
		if (searchId !== Number.MAX_SAFE_INTEGER)
		{
			//  search for every option that belongs to the currentId
			for (const option of Object.values(this.dialogueOptions))
			{
				if (option.parentId === searchId)
				{
					const newOptionDialogue = await this.addDialogueOption(startNode, option, [xOffset, yOffset]);

					// If we have a childId which is the dialogue
					if(option.childId !== Number.MAX_SAFE_INTEGER)
					{
						const dialogueNode = await this.addDialogue(option.childId,
							[xOffset + MINIMAL_OFFSET, yOffset], { optionNode: newOptionDialogue });
						await this.generateFromDialogue(dialogueNode);
					}

					yOffset += MINIMAL_OFFSET * 0.8;
				}
			}
		}
	}

	protected processSnapshot(arr: any[], snapshot: any)
	{
		// Get the reward payload
		// const r: any = snapshot.payload.exists ? snapshot.payload.val() : { };

		// if (this.storyId !== r.parentId)
		// 	return;
		const elID = snapshot.id;
		if(!arr.some((arrElement) => arrElement.id === elID))
		{
			arr.push(snapshot);
		}
	}

	protected handleMacKeyEvents(event: any) {
		// MetaKey documentation
		// https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/metaKey
		const charCode = String.fromCharCode(event.which).toLowerCase();
		if (event.metaKey && charCode === 's') {
			// Action on Cmd + S
			event.preventDefault();
		}
	}

	protected handleWindowsKeyEvents(event) {
		const charCode = String.fromCharCode(event.which).toLowerCase();
		if (event.ctrlKey && charCode === 's')
		{
			// Action on Ctrl + S
			event.preventDefault();
			UtilsService.onDebug('save button pressed!');
		}
	}
}
