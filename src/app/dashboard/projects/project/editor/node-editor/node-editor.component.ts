import {
	AfterViewInit,
	ElementRef, OnDestroy,
	OnInit, ViewChild, ViewContainerRef, NgZone, Component,
} from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { NbDialogService, NbSelectComponent, NbToastrService } from '@nebular/theme';
import { Context, Node, Output } from 'visualne';
import { ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { DebouncedFunc } from '@app-core/types';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { Project } from '@app-core/data/state/projects';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';

import { Option } from '@app-core/data/forms/form-types';
import { TablesService } from '@app-core/data/state/tables';
import { Table } from '@app-core/data/state/tables';
import { BaseFirebaseComponent } from '@app-core/components/firebase/base-firebase.component';
import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { BasicTextFieldInputComponent } from '@app-theme/components';
import { ICharacter, IDialogue, IDialogueOption, IEvent, IStory } from '@app-core/data/database/interfaces';
import { EventsTypes } from 'visualne/types/events';
import { ProxyObject } from '@app-core/data/base';
import { switchMap } from 'rxjs/operators';

// VisualNE nodes
import { Component as VisualNEComponent } from 'visualne';
import {
	AdditionalEvents,
} from '@app-core/components/visualne';
import { NodeEditorService } from '@app-core/data/state/node-editor/node-editor.service';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';

import isEqual from 'lodash.isequal';
import debounce from 'lodash.debounce';
import { UtilsService } from '@app-core/utils';

@Component({
	template: '',
	providers: [DynamicComponentService],
})
export abstract class NodeEditorComponent extends BaseFirebaseComponent implements OnInit, AfterViewInit, OnDestroy
{
	// VisualNE Editor
	abstract el: ElementRef<HTMLDivElement>;

	// Side panel
	abstract sidePanel: ElementRef<HTMLDivElement>;

	abstract vcr: ViewContainerRef;

	@ViewChild('selectComponent', { static: true })
	public selectComponent: NbSelectComponent = null;

	public get HasOutputs(): boolean {
		return this.outputs.length > 0;
	}

	public get CurrentNode(): Node
	{
		return this.currentNode;
	}

	public get Project(): Project
	{
		return this.project;
	}

	public get languages() { return this.languageService.ProjectLanguages; }

	public nonStartNode: boolean = true;

	protected abstract components: VisualNEComponent[];

	public title: string = '';
	public nodeTitle: string = '';

	protected project: Project = new Project();
	protected currentState: { project: Project } = { project: new Project() };
	protected prevNode: Node = null;
	protected currentNode: Node = null;
	protected currentOutputCount: number = 0;

	protected outputs: Output[] = [];
	protected optionTextAreaComponents: BasicTextFieldInputComponent[] = [];
	// protected subs: [Subscription, Subscription][] = [];

	// Tables
	protected dialogues: Table<IDialogue> = null;
	protected tblDialogueOptions: Table<IDialogueOption> = null;
	public tblEvents: Table<IEvent> = null;
	protected stories: Table<IStory> = null;
	protected characters: Table<ICharacter> = null;

	protected readonly includedTables: string[] = [
		'dialogues',
		'dialogueoptions',
		'characters',
		'stories',
	];

	// Table options
	// protected dialogueList: Option<number>[] = [];
	// protected dialogueOptionsList: Option<number>[] = [];

	// export import node editor
	protected participants: string[] = [];

	protected timeoutShow!: DebouncedFunc<(event: any) => void>;

	protected abstract contextSettings: ContextMenuPluginParams;

	protected constructor(
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
		protected ngZone: NgZone,
	) {
		super(
			firebaseService, firebaseRelationService, toastrService, dialogService,
			projectsService, tableService, userService, userPreferencesService, languageService,
		);
	}

	public ngOnInit()
	{
		super.ngOnInit();

		//
		this.timeoutShow = debounce(this.showPanel, 250);

		const map: ParamMap = this.activatedRoute.snapshot.paramMap;
		const id = map.get('id');

		console.log(id);
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

	public onLanguageChange(event: KeyLanguage)
	{
		this.nodeEditorService.Language = event;
	}

	public clearViewContainer()
	{
		if(this.optionTextAreaComponents.length === 0) return;

		// delete the options from the view container
		// delete the output by key
		this.optionTextAreaComponents.forEach((_, idx) =>
		{
			const index = idx === 0 ? idx : idx - 1;
			this.outputs.splice(idx, 1);

			// remove the subscription
			// const sub: [Subscription, Subscription] = this.subs[idx];
			// this.mainSubscription.remove(sub[0]);
			// this.mainSubscription.remove(sub[1]);

			// detach it from the view container
			this.vcr.detach(index);
		});
		// clear out the outputs
		this.outputs = [];
		// clear out the components
		this.optionTextAreaComponents = [];

		// reset the output counter
		this.currentOutputCount = 0;
	}

	protected abstract initializeListeners();

	protected initializeCtxData(): any
	{
		return {
			characters: this.characters, stories: this.stories, dialogues: this.dialogues,
		}
	}

	protected async initializeEditor()
	{
		await this.nodeEditorService.run(this.components, 'story@0.2.0', this.contextSettings);

		this.nodeEditorService.Editor.bind('saveDialogue');
		this.nodeEditorService.Editor.bind('saveOption');
		this.nodeEditorService.Editor.bind('saveEvent');

		this.nodeEditorService.listen(['nodetranslate', 'nodedeselected'], () =>
		{
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
		this.nodeEditorService.listen('nodetranslated', ({ node, prev}: { node: Node, prev: [number, number] } ) =>
		{
			if(node.position !== prev)
				this.timeoutShow(node);
		});

		this.nodeEditorService.listen('nodeselected', (node: Node) => {
			this.timeoutShow(node);
		});

		this.nodeEditorService.listen('import', data => {
			this.participants = data.characters || [];
		});

		await this.initializeListeners();

		const ctx: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
		ctx.on('saveDialogue', ({ currDialogue, nextDialogue/*, optionMap */}) =>
		{
			// change the default tblName
			// Get the stories table
			this.tableId = this.dialogues.id;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableId);

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

				if(isEqual(event.data, event.newData))
					return;

				this.updateFirebaseData(event);
				this.nodeEditorService.saveSnippet();
			}
		});

		ctx.on('saveOption', ({ fOption, fNextId }) =>
		{
			// change the default tblName
			// Get the stories table
			this.tableId = this.tblDialogueOptions.id;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableId);

			// change the dialogueId
			// find the dialogue
			const dialogueOption: IDialogueOption = typeof fOption === 'number'
				? this.tblDialogueOptions.find(fOption) as IDialogueOption
				: fOption !== null ? this.tblDialogueOptions.find(fOption.id) : null;

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

				// override with the incoming dialogue
				if(typeof fOption !== 'number') event.newData = { ...event.newData, ...fOption };

				if(isEqual(event.data, event.newData))
					return;

				this.updateFirebaseData(event);
				this.nodeEditorService.saveSnippet();
			}
		});

		ctx.on('saveEvent', ({ fEvent }) =>
		{
			// change the default tblName
			// Get the stories table
			this.tableId = this.tblEvents.id;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableId);

			const customEvent: IEvent = typeof fEvent === 'number'
				? this.tblEvents.find(fEvent) as IEvent
				: fEvent !== null ? this.tblEvents.find(fEvent.id) : null;

			if(customEvent)
			{
				const event: { data: IEvent, newData: IEvent, confirm?: any } = {
					data: customEvent,
					newData: {
						...customEvent,
					},
				};

				// override with the incoming custom event
				if(typeof fEvent !== 'number') event.newData = { ...event.newData, ...fEvent };

				if(isEqual(event.data, event.newData))
					return;

				this.updateFirebaseData(event).then(() => {
					UtilsService.showToast(
						this.toastrService,
						'Event updated!',
						'Event has successfully been updated',
					);
				});
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
			this.nodeEditorService.initialize(container, this.initializeCtxData()).then(() => this.initializeEditor());
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
				this.includedTables.includes(tbl.name.toLowerCase())
				&& (t === null || !t.loaded)
			)
			{
				promises.push(this.tableService.addIfNotExists(tables[i]));
			}
			else this.loadTable(t);
		}

		return new Promise((resolve) =>
		{
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
			// value.filteredData.forEach((pObj) => this.dialogueList.push(
			// 	new Option<number>({
			// 		key: pObj.id + '. ' + pObj.text[this.nodeEditorService.Language],
			// 		value: +pObj.id,
			// 		selected: false,
			// 	})),
			// );

			// Set the initial list to dialogues, since we are probably going to use that first
			// in the node editor.
			// this.listQuestion.options$.next(this.dialogueList);

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
			// this.tblDialogueOptions.filteredData.forEach((pObj) => this.dialogueOptionsList.push(
			// 	new Option<number>({
			// 		key: pObj.id + '. ' + pObj.text[this.nodeEditorService.Language],
			// 		value: +pObj.id,
			// 		selected: false,
			// 	})),
			// );
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
	}

	protected getQuestionValue(id: number, list: Table, key: string = 'text'): string
	{
		const value = list.find(id);

		if(value)
		{
			const defaultText = value[key]['en'];
			if(!value[key].hasOwnProperty(this.nodeEditorService.Language))
				return defaultText ? `{ DEFAULT: ${ defaultText } }` : 'Localization not found';

			return value[key][this.nodeEditorService.Language];
		}

		return '';

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
