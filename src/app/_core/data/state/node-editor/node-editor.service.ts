import { Injectable, Type } from '@angular/core';

import { AngularFireStorage } from '@angular/fire/storage';

import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NbDialogRef } from '@nebular/theme/components/dialog/dialog-ref';

import { Component as VisualNEComponent, Context, Engine, NodeEditor, Plugin } from 'visualne';
import { Data } from 'visualne/types/core/data';
import { ContextMenuPlugin, ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { CommentPlugin, CommentPluginParams } from 'visualne-comment-plugin';
import { SelectionPlugin, SelectionParams } from 'visualne-selection-plugin';
import { AngularRenderPlugin } from 'visualne-angular-plugin';
import { ConnectionPlugin } from 'visualne-connection-plugin';

import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { DebouncedFunc } from '@app-core/types';
import { Project, StoryFileUpload } from '@app-core/data/state/projects';
import { ProjectsService } from '@app-core/data/state/projects/projects.service';
import {
	InsertCraftableComponent,
	InsertStoryComponent,
	LoadStoryComponent,
} from '@app-theme/components/firebase-table';
import { ICharacter, ICraftable, IDialogue, IItem, IStory, IStoryData } from '@app-core/data/database/interfaces';
import { UtilsService } from '@app-core/utils';
import { CraftableFileUpload, Table } from '@app-core/data/state/tables';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';
import { FirebaseStorageService, NbLocationFileType } from '@app-core/utils/firebase/firebase-storage.service';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import firebase from 'firebase/app';
import debounce from 'lodash.debounce';
import { IFileMetaData } from '@app-core/data/file-upload.model';
import { AdditionalEvents } from '@app-core/components/visualne';
import { EventsTypes } from 'visualne/types/events';

// TODO combine all node editor stuff inside a class because then it reflects
// back to firebase.

@Injectable()
export class NodeEditorService
{
	public get Editor(): NodeEditor
	{
		return this.nodeEditor;
	}

	public get Components(): VisualNEComponent[]
	{
		return this.components;
	}

	public get SelectedStory(): IStory
	{
		return this.selectedStory;
	}

	public get SelectedCraftItem(): ICraftable
	{
		return this.selectedCraftItem;
	}

	public set Data({ key, value }: { key: string, value: Table })
	{
		this.data[key] = value;
		if(this.insertStoryRef)
		{
			switch(key)
			{
				case 'characters':
					this.insertStoryRef.componentRef.instance.Characters = this.data[key];
					break;
				case 'dialogues':
					if(this.insertStoryRef.componentRef.instance instanceof InsertStoryComponent)
						this.insertStoryRef.componentRef.instance.Dialogues = this.data[key];
					break;
				case 'craftables':
					if(this.insertStoryRef.componentRef.instance instanceof InsertCraftableComponent)
						this.insertStoryRef.componentRef.instance.Craftables = this.data[key] as Table<ICraftable>;
					break;
			}
		}
	}

	public get Language() { return this.selectedLanguage; }

	public set Language(language: KeyLanguage)
	{
		this.selectedLanguage = language;
		this.selectedLanguage$.next(this.selectedLanguage);
	}

	public fileName: string = '';
	public currentFileUpload: StoryFileUpload | CraftableFileUpload = null;
	public container: HTMLDivElement;

	public storyLoaded: BehaviorSubject<IStory> = new BehaviorSubject<IStory>(null);
	public craftItemLoaded: BehaviorSubject<ICraftable> = new BehaviorSubject<ICraftable>(null);

	protected contextSettings: ContextMenuPluginParams = null;

	protected nodeEditor: NodeEditor;
	protected engine: Engine;

	protected components: VisualNEComponent[] = [];

	protected project: Project = null;
	protected selectedStory: IStory = null;
	protected selectedCraftItem: ICraftable = null;

	// data settings
	protected debounceSaveSnippet!: DebouncedFunc<() => void>;

	private localStorageName = 'localStory@0.2.0';

	private data: {
		characters: Table<ICharacter>, stories: Table<IStory>, dialogues: Table<IDialogue>,
		[key: string]: Table,
	} = {
		characters: null,
		stories: null,
		dialogues: null,
		items: null,
		craftables: null,
	};

	private insertStoryRef: NbDialogRef<InsertStoryComponent | InsertCraftableComponent> = null;
	private mainSubscription: Subscription = new Subscription();

	private selectedLanguage$: BehaviorSubject<KeyLanguage> = new BehaviorSubject<KeyLanguage>('en');
	private selectedLanguage: KeyLanguage = 'en';

	/**
	 *
	 * @param dialogService
	 * @param toastrService
	 * @param firebaseStorage
	 * @param firebaseService
	 * @param storageService
	 * @param projectService
	 */
	constructor(
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected firebaseStorage: AngularFireStorage,
		protected firebaseService: FirebaseService,
		protected storageService: FirebaseStorageService,
		protected projectService: ProjectsService,
	) {
		this.debounceSaveSnippet = debounce(this.saveSnip, 200);
	}

	public initialize(
		container: HTMLDivElement,
		data: {
			characters: Table<ICharacter>, stories: Table<IStory>, dialogues: Table<IDialogue>,
			items: Table<IItem>, craftables: Table<ICraftable>,
		},
	): Promise<void>
	{
		this.container = container;
		this.data = { ...data };

		// get the project
		this.project = this.projectService.getProject();

		// clear the node editor TODO ( we probably have to make sure the sure save the editor )
		// this.nodeEditor.clear();
		// this.nodeEditor.destroy();
		return Promise.resolve();
	}

	public async run<T extends VisualNEComponent = VisualNEComponent>(
		components: T[] = [],
		name = 'story@0.2.0',
		settings: ContextMenuPluginParams = {
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
				'Load': () => console.log('load something!'),
			},
			nodeItems:
				{
					'Delete': true, // don't show Delete item
					'Clone': true, // or Clone item
					'Info': false,
				},
		},
	)
	{
		if(this.container) {
			this.contextSettings = settings;
			this.nodeEditor = new NodeEditor(name, this.container);
			this.nodeEditor.use(AngularRenderPlugin); // { component: MyNodeComponent })
			this.nodeEditor.use(ConnectionPlugin,
				{createAndConnect: {keyCode: 'Control'}, pickConnection: {keyCode: 'KeyD'}, curvature: 0.4},
			);
			this.nodeEditor.use<Plugin, ContextMenuPluginParams>(ContextMenuPlugin, this.contextSettings);
			this.nodeEditor.use<Plugin, CommentPluginParams>(CommentPlugin, { margin: 20 });
			this.nodeEditor.use<Plugin, SelectionParams>(SelectionPlugin, { enabled: true });
			this.engine = new Engine(name);

			components.map(c => {
				this.components.push(c);
				this.registerComponent(c)
			});

			this.nodeEditor.bind('save');
			this.nodeEditor.bind('generate');

			this.nodeEditor.on([ 'nodecreated', 'noderemoved', 'connectioncreated', 'connectionremoved'], () =>
			{
				// call the function again. Now with this we make sure it is now saving over and over again.
				this.saveSnippet();
			});

			this.nodeEditor.on(['process', 'nodecreated', 'noderemoved', 'connectioncreated', 'connectionremoved'],
				(async () => {
				await this.engine.abort();
				await this.engine.process(this.nodeEditor.toJSON());
			}) as any);

			this.nodeEditor.view.area.zoom(0.8, 0, 0, 'wheel');
			this.nodeEditor.view.resize();
			this.nodeEditor.trigger('process');

			// if we have found a snippet see if the user want to load that instead of the popup
			// TODO show snippets in the dialog.
			// if (UtilsService.hasItemInLocalStorage(this.localStorageName)
			// && window.confirm('There is a local save, do you want to load it?'))
			// 	this.loadSnippet();
			// else
			// 	this.loadStory();
		}
		else
		{
			throw new Error('Did you forgot to initialize?');
		}
	}

	/**
	 *
	 * @param args
	 */
	public addComponent<T extends VisualNEComponent>(args: T | T[])
	{
		if(!this.engine || !this.container) throw new Error('You need to initialize the editor! Did you forget to call initialize()?');

		if(args instanceof Array)
			args.map(c => this.registerComponent(c));
		else
			this.registerComponent(args);
	}

	public loadStory<T extends StoryFileUpload | CraftableFileUpload>(
		path: string = 'stories', onClose?: (res?: T) => void,
	): void
	{
		// TODO open a modal with the choose which file.
		// TODO load the file in the editor.
		const ref: NbDialogRef<LoadStoryComponent<StoryFileUpload | CraftableFileUpload>> =
			this.dialogService.open(LoadStoryComponent, {
			closeOnEsc: false,
			context: {
				childPath: path,
				project: this.project,
			},
		});

		// ref closes the subscription for us.
		ref.onClose.subscribe( (res: T) =>
		{
			if(res !== undefined)
			{
				this.nodeEditor.clear();
				this.currentFileUpload = res;
				const isStory = this.currentFileUpload instanceof StoryFileUpload;
				let selectedItem = null;
				if(this.currentFileUpload instanceof StoryFileUpload)
				{
					this.selectedStory = this.data.stories.find(+this.currentFileUpload.storyId);

					if(this.selectedStory)
					{
						// we need to create a new field
						// instantiate a new editor
						// TODO make the user able to save the story with the name they want
						this.fileName = UtilsService.titleLowerCase(`story_${this.selectedStory.id}_${this.selectedStory.title['en']}`);
					}
					else
						UtilsService.onError(`Story ${this.currentFileUpload.storyId} can\'t be found`);
				}
				else if(this.currentFileUpload instanceof CraftableFileUpload)
				{
					this.selectedCraftItem = this.data.craftables.find(+this.currentFileUpload.itemId) as ICraftable;

					if(this.selectedCraftItem)
					{
						// we need to create a new field
						// instantiate a new editor
						// TODO make the user able to save the story with the name they want
						selectedItem = this.data.items.find(this.selectedCraftItem.childId);

						this.fileName = UtilsService.titleLowerCase(`craftable_${this.selectedCraftItem.id}_${selectedItem.name['en']}`);
					}
					else
						UtilsService.onError(`Craftable ${this.currentFileUpload.itemId} can\'t be found`);
				}

				if(this.currentFileUpload.hasOwnProperty('data'))
				{
					// parse the response
					const data: Data = JSON.parse(res.data);
					// save it in FireStorage as well for later access
					this.nodeEditor.fromJSON(data).then(() =>
					{
						// save the data to the local storage
						// call the function again. Now with this we make sure it is now saving over and over again.
						this.saveSnippet();

						if(isStory)
						{
							this.storyLoaded.next(this.selectedStory);
						}
						else
							this.craftItemLoaded.next(this.selectedCraftItem);


						setTimeout(() => {
							this.nodeEditor.nodes.forEach(n => this.nodeEditor.view.updateConnections({ node: n }));
						}, 100);

						UtilsService.showToast(
							this.toastrService,
							isStory ? 'Story Loaded' : 'Item loaded',
							`${ isStory ? this.selectedStory.title[this.selectedLanguage] : selectedItem.name[this.selectedLanguage] } loaded!`,
							'success',
							5000,
						);

						this.nodeEditor.trigger('process');

					});
				}

			}

			if(onClose) onClose(res);
		});
	}

	public saveStory()
	{
		if(this.selectedStory === null && this.selectedCraftItem === null)
			return;

		const isStory = this.currentFileUpload instanceof StoryFileUpload;

		// call the function again. Now with this we make sure it is now saving over and over again.
		this.saveSnippet();
		const sub = this.uploadToStorage().subscribe((snapshot) =>
		{
			// When we have uploaded the story.
			if(!this.isActive(snapshot))
			{
				UtilsService.showToast(
					this.toastrService,
					isStory ? 'Story saved!' : 'Item saved!',
					'Node data has been uploaded successfully',
					'success',
					5000,
				);
			}
		});
		this.mainSubscription.add(sub);
	}

	public newStory<T extends InsertStoryComponent | InsertCraftableComponent>(
		content: Type<T>, onClose?: (res?: IStory | ICraftable) => void,
	)
	{
		const ctx: any = {
			characters: this.data.characters,
			stories: this.data.stories,
			items: this.data.items,
			dialogues: this.data.dialogues,
			craftables: this.data.craftables,
			selectedLanguage: this.selectedLanguage,
		};

		this.insertStoryRef = this.dialogService.open(content, {
			closeOnEsc: false,
			context: ctx,
		});

		const sub = this.insertStoryRef.onClose.subscribe((res?: IStory | ICraftable) =>
		{
			if(res !== undefined)
			{
				const startNode$ = this.components[0].createNode();

				if(content === InsertStoryComponent)
				{
					// if we are dealing with a story
					this.selectedStory = this.data.stories.find(res.id);
					if(this.selectedStory)
					{
						this.nodeEditor.clear();

						// we need to create a new field
						// instantiate a new editor
						this.fileName = UtilsService.titleLowerCase(`story_${this.selectedStory.id}_${this.selectedStory.title['en']}`);

						startNode$.then((startNode) =>
						{
							startNode.position = [200, 200];

							startNode.data['dialogueId'] = +this.selectedStory.childId;

							// in the story table we have
							// ID - id of the story
							// Title - title of the story
							// description - description for the story
							// parentId - the story that is connected to the story.
							// childId - dialogue start node

							this.nodeEditor.addNode(startNode);
							this.nodeEditor.trigger('process');

							// save it in FireStorage as well for later access
							this.saveStory();
						});
					}
				}

				if(content === InsertCraftableComponent)
				{
					// if we are dealing with a craftable item.
					this.selectedCraftItem = this.data.craftables.find(res.id) as ICraftable;
					if(this.selectedCraftItem)
					{
						this.nodeEditor.clear();

						// we need to create a new field
						// instantiate a new editor
						const selectedItem = this.data.items.find(this.selectedCraftItem.childId);

						this.fileName = UtilsService.titleLowerCase(`craftable_${this.selectedCraftItem.id}_${selectedItem.name['en']}`);

						startNode$.then((startNode) =>
						{
							startNode.position = [200, 200];

							// if we are dealing with a story
							startNode.data['itemId'] = +this.selectedCraftItem.childId;
							// in the story table we have
							// ID - id of the story
							// Title - title of the story
							// description - description for the story
							// parentId - the story that is connected to the story.
							// childId - dialogue start node

							this.nodeEditor.addNode(startNode);
							this.nodeEditor.trigger('process');

							// save it in FireStorage as well for later access
							this.saveStory();
						});
					}
				}
			}

			if(onClose) onClose(res);

			this.insertStoryRef = null;
			this.mainSubscription.remove(sub);
		});
		this.mainSubscription.add(sub);

		return this.insertStoryRef;
	}

	public saveSnippet()
	{
		// save it to the local storage as well
		const saveSnip = this.debounceSaveSnippet;

		if (saveSnip && saveSnip.cancel)
			saveSnip.cancel();

		this.debounceSaveSnippet();
	}

	private saveSnip()
	{
		if(this.selectedStory)
		{
			const data = this.nodeEditor.toJSON();
			UtilsService.setItemInLocalStorage(this.localStorageName,
				<IStoryData>{storyId: this.selectedStory?.id, itemId: this.selectedCraftItem?.id, data: data },
			);
		}
	}

	/**
	 * @brief - get the local snippet the user was working on.
	 */
	public loadSnippet()
	{
		// load the snippet from the local storage
		const snippet: IStoryData = <IStoryData>UtilsService.getItemFromLocalStorage(
			this.localStorageName, <IStoryData>{ storyId: Number.MAX_SAFE_INTEGER, data: this.nodeEditor.toJSON() }, true,
		);
		console.log(snippet);
		this.nodeEditor.fromJSON(snippet.data).then(() =>
		{
			this.selectedStory = this.data.stories.find(snippet.storyId);
			this.storyLoaded.next(this.selectedStory);

			setTimeout(() => {
				this.nodeEditor.nodes.forEach(n => this.nodeEditor.view.updateConnections({ node: n }));
			}, 100);

			this.nodeEditor.trigger('process');
		});
	}

	public isActive(snapshot: firebase.storage.UploadTaskSnapshot)
	{
		return snapshot.state === 'running'
			&& snapshot.bytesTransferred < snapshot.totalBytes;
	}

	public listen(names: any | any[], handler: (args: any) => void | unknown)
	{
		this.nodeEditor.on(names, handler);
	}

	public destroy()
	{
		this.nodeEditor.destroy();
		this.nodeEditor.events = null;
		// reset the story.
		this.storyLoaded.next(null);

		// maybe we have still an subscription
		if(!this.mainSubscription.closed) this.mainSubscription.unsubscribe();
	}

	protected uploadToStorage(): Observable<any>
	{
		// convert your object into a JSON-string
		const jsonString = JSON.stringify(this.nodeEditor.toJSON());

		// create a Blob from the JSON-string
		const file: File = UtilsService.blobToFile(new Blob([jsonString], { type: 'application/json' }), `${this.fileName}.json`);

		if (file)
		{
			const metadata: IFileMetaData = {
				customMetadata: {
					name: this.fileName, // name of the file without json
					projectID: this.project.id, // project id
				},
			};

			if(this.currentFileUpload === null)
			{
				if(this.selectedStory !== null)
				{
					this.currentFileUpload = new StoryFileUpload(file);
				}

				if(this.selectedCraftItem !== null)
				{
					this.currentFileUpload = new CraftableFileUpload(file);
				}
			}

			if(this.currentFileUpload.hasOwnProperty('data'))
			{
				delete this.currentFileUpload.data;
			}

			this.currentFileUpload.file = file;
			this.currentFileUpload.metadata = metadata.customMetadata;

			if(this.currentFileUpload instanceof StoryFileUpload)
				this.currentFileUpload.storyId = this.selectedStory.id;

			if(this.currentFileUpload instanceof CraftableFileUpload)
				this.currentFileUpload.itemId = this.selectedCraftItem.id;


			this.currentFileUpload.deleted = false;
			this.currentFileUpload.created_at = UtilsService.timestamp;
			this.currentFileUpload.updated_at = UtilsService.timestamp;

			const childPath = this.selectedStory ? 'stories' : 'craftables';
			const type: NbLocationFileType = this.selectedStory ? 'Story' : 'Craftable';

			return this.storageService.pushFileToStorage(childPath, this.currentFileUpload, type, metadata);
			/*.subscribe(
				percentage => {
					this.percentage = Math.round(percentage ? percentage : 0);
				},
				error => {
					UtilsService.onError(error);
				},
			);*/
		}
	}

	protected registerComponent<T extends VisualNEComponent>(c: T)
	{
		this.components.push(c);
		this.nodeEditor.register(c);
		this.engine.register(c);
	}
}
