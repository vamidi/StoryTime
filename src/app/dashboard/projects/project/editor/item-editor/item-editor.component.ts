import { NodeEditorComponent } from '@app-dashboard/projects/project/editor/node-editor/node-editor.component';
import { Component, ElementRef, NgZone, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { Component as VisualNEComponent, Context, Node } from 'visualne';
import { ProxyObject, Relation } from '@app-core/data/base';
import { createCraftable, createCraftCondition, createItem } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import { AdditionalEvents, ItemMasterNodeComponent, ItemNodeComponent } from '@app-core/components/visualne';
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
import { ICraftable, ICraftCondition, IItem } from '@app-core/data/database/interfaces';
import { DynamicFormComponent } from '@app-theme/components';
import { DataSourceColumnHandler } from '@app-core/data/data-source-column-handler';
import { BaseSettings, Column, ISettings } from '@app-core/mock/base-settings';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { KeyLanguage, KeyLanguageObject, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { InsertCraftableComponent, InsertItemsDialogComponent } from '@app-theme/components/firebase-table';
import { BehaviorSubject } from 'rxjs';
import { EventsTypes } from 'visualne/types/events';
import isEqual from 'lodash.isequal';
import firebase from 'firebase';
import { BaseFormInputComponent } from '@app-theme/components/form/form.component';

const ITEM_NODE_NAME: string = 'ItemNode';
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
	providers: [DynamicComponentService],
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

	@ViewChild('craftConditionFormComponent', { static: true })
	public craftConditionFormComponent: DynamicFormComponent = null;

	@ViewChild('itemSelectComponent', { static: true })
	public itemSelectComponent: NbSelectComponent = null;

	public get ItemSource(): BaseFormSettings { return this.itemSourceHandler.source; }
	public get CraftSource(): BaseFormSettings { return this.craftSourceHandler.source; }
	public get CraftConditionSource(): BaseFormSettings { return this.craftConditionSourceHandler.source; }

	public itemSourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert item',
		alias: 'itemInsert',
		requiredText: 'Fill in all fields',
		fields: {},
	}, createItem());

	public craftSourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert craftable',
		alias: 'craftableInsert',
		requiredText: 'Fill in all fields',
		fields: {},
	}, createCraftable());

	public craftConditionSourceHandler: DataSourceColumnHandler = new DataSourceColumnHandler({
		title: 'Insert craftable Condition',
		alias: 'craftableConditionInsert',
		requiredText: 'Fill in all fields',
		fields: {},
	}, createCraftCondition());

	public itemListQuestion: DropDownQuestion = new DropDownQuestion(
		{ text: 'Item name', value: Number.MAX_SAFE_INTEGER, disabled: true, type: 'number' },
	);

	public itemSettings: ISettings = new BaseSettings();
	public craftSettings: ISettings = new BaseSettings();
	public craftConditionSettings: ISettings = new BaseSettings();

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
			if(component.name === ITEM_MASTER_NODE_NAME)
				return 'Item Master';

			if(component.name === ITEM_NODE_NAME)
				return 'Item';

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
	public tblCraftConditions: Table<ICraftCondition> = null;

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

		this.includedTables.push('items', 'shopcraftables', 'shopcraftconditions');
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
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.questionToValue(this.itemFormComponent.questions, this.items.find(event) ?? createItem());
			this.questionToValue(
				this.craftConditionFormComponent.questions,
				this.tblCraftConditions.search(
					(c) => c.parentId === this.nodeEditorService.SelectedCraftItem.id && c.childId === event)
				?? createCraftCondition(),
			);

			if(this.currentNode && this.currentNode.name === ITEM_NODE_NAME)
			{
				if(this.currentNode.data.itemId === event)
					return;

				this.currentNode.data.itemId = event;
				this.currentNode.update();
			}

			this.nodeEditorService.Editor.trigger('process');
		}

	}

	public insertItem()
	{
		const ref = this.dialogService.open(InsertItemsDialogComponent, {
			context: {
				title: 'Add item',
				tblName: this.items.metadata.title,
				settings: this.itemSettings,
			},
		});
		ref.componentRef.instance.insertEvent.subscribe((event: any) =>
			this.onCreateConfirm(event, `tables/${this.items.id}`));
	}

	public updateItem()
	{
		if(this.currentNode !== null && this.currentNode.name === ITEM_NODE_NAME
			&& this.currentNode.data.itemId !== Number.MAX_SAFE_INTEGER)
		{
			// If we have a whole new value we need to add it to the option list
			const foundedItem: IItem = UtilsService.copyObj(
				this.items.find(this.currentNode.data.itemId as number),
			);
			const item = this.valueToQuestion(foundedItem ?? null, this.itemFormComponent.questions) ?? null;

			let condition = null;
			if(this.currentNode.name === ITEM_NODE_NAME)
			{
				const foundedCondition: ICraftCondition = UtilsService.copyObj(
					this.tblCraftConditions.search(
						(c) =>
							c.parentId === this.nodeEditorService.SelectedCraftItem.id
							&& c.childId === this.currentNode.data.itemId as number),
				) ?? null;

				if(foundedCondition)
					condition = this.valueToQuestion(foundedCondition ?? null, this.craftConditionFormComponent.questions) ?? null;
				else
					UtilsService.showToast(
						this.toastrService,
						'Error saving condition',
						'Can\'t this node is not connected to a parent.',
						'danger',
						5000,
					);
			}

			// find the current dialogue
			const payload: {fItem: number | IItem, fCondition: number | ICraftCondition } =
				{ fItem: item, fCondition: condition };
			const context: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
			console.log(payload);
			context.trigger('saveItem', payload);
		}
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
				field.hidden = true;
				field.disabled = true;
			}
			this.craftFormComponent.init();

			// listen to changed data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.craftables.id}/data`, ['child_added'])
			.subscribe(({ snapshots }) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type !== 'child_added')
							continue;

						console.log(+snapshot.key, snapshot.payload.val());
						this.craftables.push(+snapshot.key, snapshot.payload.val()).then(() =>
						{
							this.nodeEditorService.Data = { key: 'craftables', value: this.craftables };
						});
					}
				},
			));
		}

		if(value.metadata.title.toLowerCase() === 'shopcraftconditions')
		{
			this.tblCraftConditions = <Table<ICraftCondition>>value;
			this.nodeEditorService.Data = { key: 'shopCraftConditions', value: this.tblCraftConditions };

			const newSettings = this.processTableData(this.tblCraftConditions, true, this.craftConditionSettings);
			newSettings.columns.id.hidden = true;
			newSettings.columns.childId.editable = false;
			newSettings.columns.parentId.editable = false;
			this.craftConditionSettings = Object.assign({}, newSettings);

			this.craftConditionSourceHandler.initialize(this.craftConditionSettings.columns,
				(key: string, column: Column, index: number) =>
					this.configureRelation(this.craftConditionSourceHandler, this.tblCraftConditions, key, column, index));
			this.craftConditionSourceHandler.createFields();
			for( const field of Object.values(this.craftSourceHandler.source.fields))
			{
				field.hidden = true;
				field.disabled = true;
			}
			this.craftConditionFormComponent.init();

			// listen to changed data
			this.mainSubscription.add(this.firebaseService.getTableData$(
				`tables/${this.tblCraftConditions.id}/data`, ['child_added'])
			.subscribe(({ snapshots }) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type !== 'child_added')
							continue;

						this.tblCraftConditions.push(+snapshot.key, snapshot.payload.val()).then(() =>
						{
							this.nodeEditorService.Data = { key: 'shopCraftConditions', value: this.tblCraftConditions };
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
			.subscribe(({ snapshots }) =>
				{
					for(let i = 0; i < snapshots.length; i++)
					{
						const snapshot = snapshots[i];
						if(snapshot.type !== 'child_added')
							continue;

						this.items.push(+snapshot.key, snapshot.payload.val()).then((item) =>
						{
							this.itemList.push(new Option({
								id: item.id,
								key: item.id + '. ' + UtilsService.truncate(item.name['en'] as string, 50),
								value: item.id,
								selected: false,
							}));

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

	protected async initializeEditor(): Promise<void>
	{
		await super.initializeEditor();

		this.nodeEditorService.Editor.bind('saveCraftableLinks');
		this.nodeEditorService.Editor.bind('saveItem');

		const ctx: Context<AdditionalEvents & EventsTypes> = this.nodeEditorService.Editor;
		ctx.on('saveCraftableLinks', ({ fItems }) =>
		{
			if(!fItems.length) // if we have no items return
				return;

			const duplicates: number[] | IItem[] = typeof fItems[0] === 'number' ?
				UtilsService.findDuplicates(fItems as number[]) as number[] :
				UtilsService.findDuplicates(fItems as IItem[]) as IItem[];

			// if we have found duplicates then warn but we are going to ignore it.
			let arr: number[] | IItem[] = fItems;
			if(duplicates.length)
			{
				UtilsService.showToast(
					this.toastrService,
					'Duplicates found!',
					'There were duplicates found in the final creation.',
					'warning',
					5000,
				);

				arr = typeof fItems[0] === 'number' ?
					UtilsService.excludeDuplicates(fItems as number[]) as number[] :
					UtilsService.excludeDuplicates(fItems as IItem[]) as IItem[];
			}

			// change the default tblName
			this.tableId = `tables/${this.tblCraftConditions.id}`;

			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableId);

			// loop through the items.
			const promises: Promise<void | string | number | firebase.database.Reference>[] = [];
			for(let i = 0; i < arr.length; i++)
			{
				const fItem = arr[i];

				// if we have a number and it is the infinity number don't continue at all.
				// or if the item is null
				if(typeof fItem === 'number' && fItem === Number.MAX_SAFE_INTEGER || fItem === null)
					continue;

				// Check if the item is a number or item.
				const item: IItem = typeof fItem === 'number' ? this.items.find(fItem) : fItem;

				// if we cant find the item don't continue
				if(item === null)
					continue;

				// see if the item is already associated with this craftable item.
				// if we found an item that is associated
				// and see if the item is the same as well.
				const craftCondition = this.tblCraftConditions.search((c) =>
					c.parentId === this.nodeEditorService.SelectedCraftItem.id && item.id === c.childId,
					null, true) ?? null;

				// if the item we are looking for is not assocciated with this craftable item
				// then lets combine it.
				let event: { data: ICraftCondition, newData: ICraftCondition, confirm?: any };
				if(craftCondition === null)
				{
					event = {
						data: {
							...createCraftCondition(),
							childId: item.id,
							parentId: this.nodeEditorService.SelectedCraftItem.id,
						},
						newData: null,
					};
				}
				else
				{
					event = {
						data: craftCondition,
						newData: {
							...craftCondition,
							childId: item.id,
						},
					};

					// if this was an item that exists already undelete it and reuse it.
					if(craftCondition.deleted)
						event.newData.deleted = false;
				}

				if(isEqual(event.data, event.newData))
					continue;

				let promise: Promise<void | string | number | firebase.database.Reference>;
				if(craftCondition)
				{
					promise = this.updateFirebaseData(event);

					promise.then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Item condition updated!',
							'Item has successfully been updated',
							'primary',
							5000,
						);
					});

					promises.push(promise);
				}
				else
				{
					promise = this.insertFirebaseData(event);

					promise.then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Item condition inserted!',
							'Item has successfully been inserted',
							'success',
							5000,
						);
					});

					promises.push(promise);
				}
			}

			// we need to remove the ones that aren't associated anymore
			const compare = (d: number | IItem, o: number | IItem) => {
				if(typeof d === 'number')
					return d === o;

				return d.id === (o as IItem).id;
			}
			this.tblCraftConditions.forEach((c) =>
			{
				const foundItemInCurrent = arr.findIndex((d) => compare(d, c.childId)) !== -1;
				// if the parent id of the item is the same
				// and the item is not found in the list that is currently connected to the craftable item.
				if(c.parentId === this.nodeEditorService.SelectedCraftItem.id && !foundItemInCurrent)
				{
					// remove the item.
					const event = {
						data: c,
						newData: {
							...c,
							deleted: true,
						},
					};

					const promise = this.updateFirebaseData(event);

					promise.then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Item condition deleted!',
							'Item has successfully been deleted',
							'danger',
							5000,
						);
					});

					promises.push(promise);
				}
			});

			Promise.all(promises);

			this.nodeEditorService.saveSnippet();
		});

		ctx.on('saveItem', ({ fItem, fCondition }) =>
		{
			// change the default tblName
			// Get the stories table
			this.tableId = `tables/${this.items.id}`;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableId);
			// stack up the promises
			const promises = [];

			// change the itemId
			// find the current item
			const item: IItem = typeof fItem === 'number'
				? this.items.find(fItem) as IItem
				: fItem !== null ? this.items.find(fItem.id) : null;

			if(item)
			{
				const event: { data: IItem, newData: IItem, confirm?: any } =
					{
						data: item,
						newData: {
							...item,
						},
					};

				// override with the incoming dialogue
				if(typeof fItem !== 'number') event.newData = { ...event.newData, ...fItem };

				if(!isEqual(event.data, event.newData))
				{
					const promise = this.updateFirebaseData(event);
					promise.then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Item updated!',
							'Item has successfully been updated',
							'success',
							5000,
						);
					});
					promises.push(promise);
				}
			}

			// change the default tblName
			// Get the stories table
			this.tableId = `tables/${this.tblCraftConditions.id}`;
			// Let firebase search with current table name
			this.firebaseService.setTblName(this.tableId);

			// change the conditionId
			// find the current condition
			const condition: ICraftCondition = typeof fCondition === 'number'
				? this.tblCraftConditions.find(fCondition) as ICraftCondition
				: fCondition !== null ? this.tblCraftConditions.find(fCondition.id) : null;

			if(condition)
			{
				const event: { data: ICraftCondition, newData: ICraftCondition, confirm?: any } =
					{
						data: condition,
						newData: {
							...condition,
						},
					};

				// override with the incoming dialogue
				if(typeof fCondition !== 'number') event.newData = { ...event.newData, ...fCondition };

				if(!isEqual(event.data, event.newData))
				{
					const promise = this.updateFirebaseData(event);
					promise.then(() => {
						UtilsService.showToast(
							this.toastrService,
							'Condition updated!',
							'Condition has successfully been updated',
							'success',
							5000,
						);
					});
					promises.push(promise);
				}

			}

			Promise.all(promises).then(() => this.nodeEditorService.saveSnippet());
		});
	}

	protected loadNodeInPanel(node: Node)
	{
		super.loadNodeInPanel(node);

		const extraChecks = (idx: string) => idx === 'deleted' || idx === 'created_at' || idx === 'updated_at';
		this.craftFormComponent.questions.forEach((_, idx, arr) =>
		{
			// hide the question if we are not in the right node.
			let hide = node.name !== ITEM_MASTER_NODE_NAME;
			// hide the question if we should because of the settings
			hide = hide ? hide : this.craftSettings.columns[idx].hidden || extraChecks(idx) && !this.isAdmin;
			arr.get(idx).Hidden = hide;
		});

		const enableQuestions = (questions: Map<string, BaseFormInputComponent<any>>, settings: ISettings) =>
		{
			questions.forEach((_, idx) =>
			{
				// hide the question if we are not in the right node.
				let hide = node.name !== ITEM_NODE_NAME;
				// hide the question if we should because of the settings
				hide = hide ? hide : settings.columns[idx].hidden || extraChecks(idx) && !this.isAdmin;
				_.Hidden = hide;
			});
		};

		// let selectionValue = Number.MAX_SAFE_INTEGER;
		enableQuestions(this.itemFormComponent.questions, this.itemSettings);
		enableQuestions(this.craftConditionFormComponent.questions , this.craftConditionSettings);

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

		if(node.name === ITEM_NODE_NAME)
			this.pickItem(this.itemListQuestion.value as number);
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


				if(this.craftables && this.craftables.id === relation.tblColumnRelation.key)
				{
					const options: Option<number>[] = [];
					// TODO this is a race condition we need to change it.
					this.craftables.filteredData.forEach((craftable) =>
					{
						const item = this.items.find(craftable.childId);
						options.push(new Option({
							id: craftable.id,
							key: craftable.id + '. ' + UtilsService.truncate(item.name['en'] as string, 50),
							value: craftable.id,
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

	private valueToQuestion<T = ProxyObject>(
		item: T, questions: Map<string, BaseFormInputComponent<any>>,
	): T
	{
		if(item === null)
			return item;

		questions.forEach((q, idx, arr) =>
		{
			const questionValue = arr.get(idx).question.value;

			let value = item[q.key];

			if (typeof value === 'object') {
				const keyValue = value as KeyLanguageObject;
				if (keyValue !== null && value.hasOwnProperty(this.nodeEditorService.Language)) {
					value[this.nodeEditorService.Language] = questionValue;
				}
			}
			else value = questionValue;

			item[q.key] = value;
		});

		return item;
	}

	private questionToValue(questions: Map<string, BaseFormInputComponent<any>>, item: ProxyObject)
	{
		if(item === null)
			return;

		questions.forEach((q, idx, arr) =>
		{
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
