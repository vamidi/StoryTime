import { Injectable, Type } from '@angular/core';

import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/storage';

import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NbDialogRef } from '@nebular/theme/components/dialog/dialog-ref';

import { Component as VisualNEComponent, Engine, NodeEditor, Plugin } from 'visualne';
import { Data } from 'visualne/types/core/data';
import { ContextMenuPlugin, ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { CommentPlugin, CommentPluginParams } from 'visualne-comment-plugin';
import { SelectionPlugin, SelectionParams } from 'visualne-selection-plugin';
import { AngularRenderPlugin } from 'visualne-angular-plugin';
import { ConnectionPlugin } from 'visualne-connection-plugin';

import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { DebouncedFunc } from '@app-core/types';
import { Project } from '@app-core/data/state/projects';
import { ProjectsService } from '@app-core/data/state/projects/projects.service';
import {
	InsertCraftableComponent,
	InsertStoryComponent,
	LoadStoryComponent,
} from '@app-theme/components/firebase-table';
import { ICharacter, ICraftable, IDialogue, IItem, IStory, IStoryData } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';
import { Table } from '@app-core/data/state/tables';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import firebase from 'firebase/app';
import UploadTaskSnapshot = firebase.storage.UploadTaskSnapshot;

import debounce from 'lodash.debounce';
import isEqual from 'lodash.isequal';

// Path to the storage bucket
// TODO add version control
const BASE_STORAGE_PATH: string = `node-editor/projects`;

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
		if(this.data.hasOwnProperty(key))
		{
			this.data[key] = value;
			console.log(key, this.data[key]);
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
							this.insertStoryRef.componentRef.instance.Craftables = this.data[key];
						break;
				}
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

	// Firebase settings
	protected firebaseUploadTask: AngularFireUploadTask;

	private localStorageName = 'localStory@0.2.0';

	private data: {
		characters: Table<ICharacter>, stories: Table<IStory>, dialogues: Table<IDialogue>,
		items?: Table<IItem>,
		craftables?: Table<ICraftable>,
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
	 * @param projectService
	 */
	constructor(
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected firebaseStorage: AngularFireStorage,
		protected firebaseService: FirebaseService,
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

			// TODO see if we need this.
			// this.nodeEditor.on('import', data => {
			// 	this.languages = data.languages as string[] || [];
			// 	this.defaultLanguage = data.defaultLanguage as string || '';
			// });

			// Saving nodes we need to add character data as well.
			// this.nodeEditor.on('export', data => {
			// 	data.languages = this.languages;
			// 	data.defaultLanguage = this.defaultLanguage;
			// });

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

	public loadStory(
		path: string = 'stories', onClose?: (res?: { storyId?: string, itemId?: string, data: string }) => void,
	): void
	{
		// TODO open a modal with the choose which file.
		// TODO load the file in the editor.
		const ref: NbDialogRef<LoadStoryComponent> = this.dialogService.open(LoadStoryComponent, {
			closeOnEsc: false,
			context: {
				childPath: path,
			},
		});
		ref.componentRef.instance.Project = this.project;

		const closeFunc = ref.onClose.subscribe( (res: {
			storyId?: string,
			itemId?: string,
			data: string,
		}) =>
		{
			if(res !== undefined)
			{
				const isStory = res.hasOwnProperty('storyId');
				if(isStory)
				{
					this.selectedStory = this.data.stories.find(+res.storyId);

					if(this.selectedStory)
					{
						// we need to create a new field
						// instantiate a new editor
						// TODO make the user able to save the story with the name they want
						this.fileName = UtilsService.titleLowerCase(`story_${this.selectedStory.id}_${this.selectedStory.title['en']}`);
					}
					else
						UtilsService.onError(`Story ${res.storyId} can\'t be found`);
				}
				else if(res.hasOwnProperty('itemId'))
				{
					this.selectedCraftItem = this.data.craftables.find(+res.itemId);

					if(this.selectedCraftItem)
					{
						// we need to create a new field
						// instantiate a new editor
						// TODO make the user able to save the story with the name they want
						const selectedItem = this.data.items.find(this.selectedCraftItem.childId);

						this.fileName = UtilsService.titleLowerCase(`craftable_${this.selectedCraftItem.id}_${selectedItem.name['en']}`);
					}
					else
						UtilsService.onError(`Craftable ${res.itemId} can\'t be found`);
				}

				if(res.hasOwnProperty('data'))
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
							'Story Loaded',
							`${ this.selectedStory.title[this.selectedLanguage] } loaded!`,
						);

						this.nodeEditor.trigger('process');

					});
				}

			}

			if(onClose) onClose(res);
			this.mainSubscription.remove(closeFunc);
		});

		this.mainSubscription.add(closeFunc);
	}

	public saveStory()
	{
		// call the function again. Now with this we make sure it is now saving over and over again.
		this.saveSnippet();
		const sub = this.uploadToStorage().subscribe((snapshot) =>
		{
			// When we have uploaded the story.
			if(!this.isActive(snapshot))
			{
				const isStory = this.selectedStory ?? false;
				const childPath = isStory ? 'stories' : 'craftables';

				const path: string = `${BASE_STORAGE_PATH}/${this.project.id}/${childPath}/${this.fileName}.json`;

				const newData = isStory ? this.selectedStory : this.selectedCraftItem;
				const payload: { data: IStory | ICraftable, newData: IStory | ICraftable, confirm?: any } = {
					data: isStory ? this.selectedStory : this.selectedCraftItem,
					newData: {
						...newData,
						craftFile: path,
					},
				};

				const event: { data: IStory | ICraftable, newData: IStory | ICraftable, confirm?: any } = payload;

				const oldObj: IStory | ICraftable = event.hasOwnProperty('data') ? { ...event.data } : null;
				const obj: IStory | ICraftable = { ...event.newData };

				if(isEqual(event.data, event.newData))
					return;

				const tableName = isStory ? `tables/${this.data.stories.id}` : `tables/${this.data.craftables.id}`;
				return this.firebaseService.updateData(
					event.newData.id, tableName + '/revisions', obj, oldObj, tableName + '/data');
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
					this.selectedCraftItem = this.data.craftables.find(res.id);
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

	public isActive(snapshot: UploadTaskSnapshot)
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

		console.log(jsonString);

		// create a Blob from the JSON-string
		const blob = new Blob([jsonString], { type: 'application/json' });

		console.log(blob);

		const childPath = this.selectedStory ? 'stories' : 'craftables';

		const path: string = `
			${BASE_STORAGE_PATH}/${this.project.id}/${childPath}/${this.fileName}.json
		`;

		console.log(path, this.selectedStory === null, this.selectedCraftItem === null);
		const customMetadata: { name: string, projectID: string, storyID?: string, itemID?: string } = {
			name: this.fileName, // name of the file without json
			projectID: this.project.id, // project id
		};

		if(this.selectedStory !== null)
			customMetadata.storyID = `${ this.selectedStory.id }`; // story id

		if(this.selectedCraftItem !== null)
			customMetadata.itemID = `${ this.selectedCraftItem.id }`; // item id

		this.firebaseUploadTask = this.firebaseStorage.upload(path, blob, {
			customMetadata: customMetadata,
		});
		console.log(customMetadata);

		this.firebaseUploadTask.percentageChanges();
		return this.firebaseUploadTask.snapshotChanges().pipe(
			finalize(() =>
			{
				UtilsService.showToast(
					this.toastrService,
					'Story saved!',
					'Node data has been uploaded successfully',
				);
			}),
		);
	}

	protected registerComponent<T extends VisualNEComponent>(c: T)
	{
		this.components.push(c);
		this.nodeEditor.register(c);
		this.engine.register(c);
	}
}
