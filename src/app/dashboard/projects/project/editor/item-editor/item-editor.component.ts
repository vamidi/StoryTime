import { NodeEditorComponent } from '@app-dashboard/projects/project/editor/node-editor/node-editor.component';
import {Component, ElementRef, NgZone, OnInit, ViewChild, ViewContainerRef} from '@angular/core';
import { Component as VisualNEComponent, Node } from 'visualne';
import { ProxyObject, Relation } from '@app-core/data/base';
import { createCraftable, createItem } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import { ItemMasterNodeComponent, ItemNodeComponent } from '@app-core/components/visualne';
import { ActivatedRoute, Router } from '@angular/router';
import { AngularFireStorage } from '@angular/fire/storage';
import { NbDialogService, NbSelectComponent, NbToastrService } from '@nebular/theme';
import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { NodeEditorService } from '@app-core/data/state/node-editor';
import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';
import { ContextMenuPluginParams } from 'visualne-angular-context-menu-plugin';
import { BaseFormSettings, FormField } from '@app-core/mock/base-form-settings';
import { DropDownQuestion, Option } from '@app-core/data/forms/form-types';
import { ICraftable, IItem } from '@app-core/data/standard-tables';
import { DynamicFormComponent, LanguageColumnRenderComponent, LanguageRenderComponent } from '@app-theme/components';
import { DataSourceColumnHandler } from '@app-core/data/data-source-column-handler';
import { BaseSettings, Column } from '@app-core/mock/base-settings';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { InsertCraftableComponent } from '@app-theme/components/firebase-table';
import { BehaviorSubject } from 'rxjs';

const ITEM_NODE_NAME: string = 'Item';
const ITEM_MASTER_NODE_NAME: string = 'ItemMaster';
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

	@ViewChild('itemFormComponent', { static: true })
	public itemFormComponent: DynamicFormComponent = null;

	@ViewChild('craftFormComponent', { static: true })
	public craftFormComponent: DynamicFormComponent = null;

	@ViewChild('itemSelectComponent', { static: true })
	public itemSelectComponent: NbSelectComponent = null;

	public get ItemSource(): BaseFormSettings { return this.itemSourceHandler.source; }
	public get CraftSource(): BaseFormSettings { return this.craftSourceHandler.source; }

	public itemSourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert Item',
		alias: 'itemInsert',
		requiredText: 'Fill in all fields',
		fields: {},
	}, createItem());

	public craftSourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert Craftable',
		alias: 'craftableInsert',
		requiredText: 'Fill in all fields',
		fields: {},
	}, createCraftable());

	public itemListQuestion: DropDownQuestion = new DropDownQuestion(
		{ text: 'Item name', value: Number.MAX_SAFE_INTEGER, disabled: true, type: 'number' },
	);

	public itemSettings: BaseSettings = new BaseSettings();
	public craftSettings: BaseSettings = new BaseSettings();

	public defaultOption: number = Number.MAX_SAFE_INTEGER;

	protected newItem: boolean = false;

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
			'New Item': () => this.insertItem(),
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

	protected itemList: Option<number>[] = [];

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

	public pickItem(event: number)
	{
		if(this.currentNode && this.currentNode.name === ITEM_NODE_NAME)
		{
			if(this.currentNode.data.itemId === event)
				return;

				this.currentNode.data.itemId = event;
			this.currentNode.update();

		}

		if(event !== Number.MAX_SAFE_INTEGER)
		{
			const item = this.items.find(event);
			this.itemFormComponent.questions.forEach((q, idx, arr) => {
				let value = item[q.key];
				if (typeof value === 'object') {
					const keyValue = value as KeyLanguageObject;
					if (keyValue !== null) {
						value = value[this.nodeEditorService.Language];
					}
				}

				arr.get(idx).setValue = value;
			});
		}

		this.nodeEditorService.Editor.trigger('process');
	}

	public insertItem()
	{
		this.components[1].createNode({ itemId: Number.MAX_SAFE_INTEGER }).then();
		this.newItem = true;
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

			const newSettings = this.processTableData(this.craftables, true, this.craftSettings);
			this.craftSettings = Object.assign({}, newSettings);

			this.craftSourceHandler.initialize(this.craftSettings.columns,
				(key: string, column: Column, index: number) =>
					this.configureRelation(this.craftSourceHandler, this.craftables, key, column, index));
			this.craftSourceHandler.createFields();
			for( const field of Object.values(this.craftSourceHandler.source.fields))
			{
				field.disabled = true;
			}
			this.craftFormComponent.init();

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

			const newSettings = this.processTableData(this.items, true, this.itemSettings);
			this.itemSettings = Object.assign({}, newSettings);

			this.itemSourceHandler.initialize(this.itemSettings.columns,
				(key: string, column: Column, index: number) =>
					this.configureRelation(this.itemSourceHandler, this.items, key, column, index));
			this.itemSourceHandler.createFields();
			this.itemFormComponent.init();

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
			if(this.nodeEditorService.SelectedCraftItem === null) {
				UtilsService.onWarn('Crafted item is not loaded.');
				return false;
			}

			if(node.name === ITEM_NODE_NAME && !node.data.hasOwnProperty('itemId'))
			{
				node.data.itemId = Number.MAX_SAFE_INTEGER;

				if(this.newItem)
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
			}

			return true;
		});
	}

	protected initializeCtxData(): any
	{
		const data = super.initializeCtxData();
		data.items = this.items;
		data.craftables = this.craftables;

		this.items.filteredData.forEach((item) => {
			this.itemList.push(new Option({
				id: item.id,
				key: item.id + '. ' + UtilsService.truncate(item.name['en'] as string, 50),
				value: item.id,
				selected: false,
			}));
		});

		this.itemListQuestion.options$.next(this.itemList);

		return data;
	}

	protected loadNodeInPanel(node: Node)
	{
		super.loadNodeInPanel(node);

		this.craftFormComponent.questions.forEach((_, idx, arr) =>
		{
			arr.get(idx).hidden = node.name !== ITEM_MASTER_NODE_NAME;
		});

		// let selectionValue = Number.MAX_SAFE_INTEGER;
		this.itemFormComponent.questions.forEach((_, idx, arr) => {
			arr.get(idx).hidden = node.name !== ITEM_NODE_NAME;
		});

		if(node.name === ITEM_NODE_NAME)
		{
			this.itemListQuestion.value = node.data.itemId as number;
			this.itemListQuestion.disabled = false;
		}

		if(node.name === ITEM_MASTER_NODE_NAME)
		{
			this.itemListQuestion.value = this.nodeEditorService.SelectedCraftItem.childId;
			this.itemListQuestion.disabled = true;
			if(this.currentNode.name === ITEM_MASTER_NODE_NAME)
			{
				this.craftFormComponent.questions.forEach((q, idx, arr) =>
				{
					arr.get(idx).setValue = this.nodeEditorService.SelectedCraftItem[q.key];
				});
			}
		}

		this.itemSelectComponent.selected = this.itemListQuestion.value;
		this.itemSelectComponent.selectedChange.emit(this.itemListQuestion.value);
	}

	protected configureRelation(
		handler: DataSourceColumnHandler, table: Table, key: string, column: Column, index: number,
	): FormField<any>
	{
		let field: FormField<any>;
		if (key /* && Number(value) !== Number.MAX_SAFE_INTEGER */)
		{
			const relation: Relation = this.firebaseService.getRelation(table.metadata.title, key);

			if (relation)
			{
				field = handler.configureField<number>(key, column, 'dropdown', Number.MAX_SAFE_INTEGER, index);
				field.options$ = new BehaviorSubject([]);

				handler.source.fields[key] = field;

				// Set the dropdown to relation
				field.relationDropDown = true;

				const table$: Table = this.tableService.getTableById(relation.tblColumnRelation.key);

				if(relation.tblColumnRelation.key === this.items.id)
				{
					const options: Option<number>[] = [];
					// TODO this is a race condition we need to change it.
					this.items.filteredData.forEach((item) => {
						options.push(new Option({
							id: item.id,
							key: item.id + '. ' + UtilsService.truncate(item.name['en'] as string, 50),
							value: item.id,
							selected: false,
						}));
					});

					field.options$.next(options)
				}

				if(table$)
				{
					this.onDataReceived(key, table$, relation, field);
				}

				return field;
			}
		}

		field = handler.configureField<number>(key, column, 'number', Number.MAX_SAFE_INTEGER, index);
		return field;
	}

	protected onDataReceived(key: string, snapshots: Table, relation: Relation, field: FormField<any>) { }

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
