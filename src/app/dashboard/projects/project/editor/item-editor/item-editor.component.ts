import { NodeEditorComponent } from '@app-dashboard/projects/project/editor/node-editor/node-editor.component';
import {Component, ElementRef, NgZone, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import { Component as VisualNEComponent, Node } from 'visualne';
import { ProxyObject } from '@app-core/data/base';
import { createItem } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import { ItemMasterNodeComponent, ItemNodeComponent } from '@app-core/components/visualne';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { NodeEditorService } from '@app-core/data/state/node-editor';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { BaseFormSettings } from '@app-core/mock/base-form-settings';
import { DropDownQuestion, Option } from '@app-core/data/forms/form-types';
import { ICraftable, IItem } from '@app-core/data/standard-tables';
import { ButtonFieldComponent, DynamicFormComponent } from '@app-theme/components';
import { DataSourceColumnHandler } from '@app-core/data/data-source-column-handler';
import { BaseSettings } from '@app-core/mock/base-settings';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { InsertCraftableComponent } from '@app-theme/components/firebase-table';

const ITEM_NODE_NAME: string = 'Item';
// const DIALOGUE_OPTION_NODE_NAME: string = 'Dialogue Option';

@Component({
	selector: 'ngx-item-editor',
	templateUrl: 'item-editor.component.html',
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
})
export class ItemEditorComponent extends NodeEditorComponent implements OnInit
{
	// VisualNE Editor
	@ViewChild('nodeEditor', { static: true })
	public el: ElementRef<HTMLDivElement>;

	@ViewChild('overViewContainer', { read: ViewContainerRef, static: true })
	public vcr!: ViewContainerRef;

	@ViewChild('sidePanel', { static: true })
	public sidePanel: ElementRef<HTMLDivElement>;

	@ViewChild(DynamicFormComponent, { static: true })
	public formComponent: DynamicFormComponent = null;

	@ViewChild('submitQuestion', { static: true })
	public submitQuestion: ButtonFieldComponent = null;

	public get Source(): BaseFormSettings { return this.sourceHandler.source; }

	public sourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert Item',
		alias: 'itemInsert',
		requiredText: 'Fill in all fields',
		fields: {},
	}, createItem());

	public itemListQuestion: DropDownQuestion = new DropDownQuestion(
		{ text: 'Item name', value: Number.MAX_SAFE_INTEGER, disabled: true, type: 'number' },
	);

	public settings: BaseSettings = new BaseSettings();

	public defaultOption: number = Number.MAX_SAFE_INTEGER;

	protected components: VisualNEComponent[] = [
		new ItemMasterNodeComponent(),
		new ItemNodeComponent(),
	];

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
			'Load': () => this.nodeEditorService.loadStory('craftables'),
		},
		nodeItems:
			{
				'Delete': true, // don't show Delete item
				'Clone': true, // or Clone item
				'Info': false,
			},
	};

	protected items: Table<IItem> = null;
	protected craftables: Table<ICraftable> = null;

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
		protected ngZone: NgZone,
	) {
		super(router, activatedRoute, storage, dialogService, toastrService, userService,
			userPreferencesService, projectsService, tableService, firebaseService,
			firebaseRelationService,
			nodeEditorService, languageService, componentResolver, ngZone,
		);

		this.includedTables.push('items', 'shopcraftables');
	}

	public ngOnInit() {
		super.ngOnInit();

		this.formComponent.addInput<string>(this.submitQuestion, {
			name: 'update-btn',
			text: 'UpdateBtn',
			value: 'Update',
			controlType: 'submitbutton',
		});
	}

	public loadCraftable()
	{
		this.nodeEditorService.loadStory('craftables');
	}

	public saveCraftable()
	{
		this.nodeEditorService.saveStory();
	}

	public newCraftable()
	{
		// TODO see also if the user has not save yet.
		if (this.nodeEditorService.Editor.nodes.length > 0 && !confirm('Are you sure you want to create a new story?'))
			return;

		this.nodeEditorService.newStory(InsertCraftableComponent, async (res?: ICraftable) =>
		{
			if(res !== undefined)
			{
				if(this.nodeEditorService.SelectedCraftItem)
				{
					const selectedItem = this.items.find(this.nodeEditorService.SelectedCraftItem.childId);

					this.title = selectedItem.name[this.nodeEditorService.Language];

					// set the start node output data to the new story
					// this.textAreaQuestion.value =

					// and save it to the local storage
					this.nodeEditorService.saveSnippet();
				}
			}
		});
	}

	public pickItem(event: any)
	{
		console.log(event);
	}

	public insertItem()
	{

	}

	public updateItem()
	{

	}

	protected loadTable(value: Table)
	{
		super.loadTable(value);

		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'shopcraftables')
		{
			this.craftables = <Table<ICraftable>>value;
			this.nodeEditorService.Data = { key: 'craftables', value: this.craftables };

			// listen to changed data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.craftables.id}/data`, ['child_added'])
			.subscribe((snapshots) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type !== 'child_added')
							continue;

						this.craftables.push(+snapshot.key, snapshot.payload.val()).then(() =>
						{
							this.nodeEditorService.Data = { key: 'craftables', value: this.craftables };
						});

					}
				},
			));
		}

		if(value.metadata.title.toLowerCase() === 'items')
		{
			this.items = <Table<IItem>>value;

			const newSettings = this.processTableData(this.items, true, this.settings);
			this.settings = Object.assign({}, newSettings);

			this.sourceHandler.initialize(this.settings.columns);
			this.sourceHandler.createFields();
			this.formComponent.init();


			// listen to changed data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.items.id}/data`, ['child_added'])
			.subscribe((snapshots) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type !== 'child_added')
							continue;

						this.items.push(+snapshot.key, snapshot.payload.val()).then(() =>
						{
							this.nodeEditorService.Data = { key: 'items', value: this.items };
						});

					}
				},
			));

			this.nodeEditorService.Data = { key: 'items', value: this.items };
		}
	}

	protected async initializeListeners(): Promise<any>
	{
		this.nodeEditorService.listen('nodecreate', (node: Node) =>
		{
			if(this.nodeEditorService.SelectedCraftItem === null)
				UtilsService.onError('Crafted item is not loaded.');

			if(this.nodeEditorService.SelectedCraftItem !== null && node.name === ITEM_NODE_NAME && !node.data.hasOwnProperty('itemId'))
			{
				this.tableName = `tables/${this.items.id}`;
				// Let firebase search with current table name
				this.firebaseService.setTblName(this.tableName);

				const event: { data: ProxyObject, confirm?: any } = { data: createItem() };
				this.insertFirebaseData(event)
					.then((data) =>
					{
						UtilsService.showToast(
							this.toastrService,
							'Item added!',
							'Dialogue has successfully been created',
						);

						if(data && typeof data === 'number')
						{
							node.data = {
								...node.data,
								itemId: data,
							}
							UtilsService.onDebug(`new Dialogue: ${node}`);
						}
					},
				);
			}
		});
	}

	protected initializeCtxData(): any
	{
		const data = super.initializeCtxData();
		data.items = this.items;
		data.craftables = this.craftables;

		const options: Option<number>[] = [];
		this.items.filteredData.forEach((item) => {
			options.push(new Option({
				id: item.id,
				key: item.id + '. ' + UtilsService.truncate(item.name['en'] as string, 50),
				value: item.id,
				selected: false,
			}));
		});

		this.itemListQuestion.options$.next(options);
		console.log(this.itemListQuestion);

		return data;
	}

	private handleLanguageValue({ prevSnapshotKey = -1, selected = false }, prevRelData: KeyLanguageObject)
	{
		const languages = Object.keys(prevRelData);
		// Are we dealing with a language object
		if (systemLanguages.has(languages[0] as KeyLanguage))
		{
			const newValue: string = prevRelData['en'];
			return new Option<number>({
				id: prevSnapshotKey,
				key: prevSnapshotKey + '. ' + UtilsService.truncate(newValue, 50),
				value: prevSnapshotKey,
				selected: selected,
			});
		}
	}
}
