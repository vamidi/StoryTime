import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';

import {
	InsertEquipmentComponent,
	InsertMultipleDialogComponent,
	InsertTraitComponent,
} from '@app-theme/components/firebase-table';

import { ProjectsService } from '@app-core/data/state/projects';
import { UserService } from '@app-core/data/state/users';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BaseTabComponent } from '@app-dashboard/projects/project/editor/character-editor/tabs/Base/base-tab.component';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { NbDialogService } from '@nebular/theme';
import { ICharacter, ICharacterClass, IItem, IItemType } from '@app-core/data/standard-tables';
import { BehaviourType } from '@app-core/types';
import { BehaviorSubject } from 'rxjs';
import { Relation, StringPair } from '@app-core/data/base';
import { UtilsService } from '@app-core/utils';
import { TextColumnComponent, TextRenderComponent } from '@app-theme/components';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';

@Component({
	selector: 'ngx-character-tab',
	templateUrl: 'character-tab.component.html',
})
export class CharacterTabComponent extends BaseTabComponent implements OnInit
{
	public get GetClasses(): Table<ICharacterClass>
	{
		return this.characterClasses;
	}

	@Input()
	public characterSettings: BaseSettings = null;

	@Output()
	public onCreateConfirm: EventEmitter<any> = new EventEmitter<any>();
	@Output()
	public onEditConfirm: EventEmitter<any> = new EventEmitter<any>();
	@Output()
	public onDeleteConfirm: EventEmitter<any> = new EventEmitter<any>();

	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	public settings: ISettings = {
		mode: 'external',
		selectMode: '', // 'multi';
		noDataMessage: 'No items found', // default: -> 'No data found'
		actions: {
			add: true,
			edit: true,
			delete: true,
			position: 'right',
		},
		add: {
			addButtonContent: '<i class="nb-plus"></i>',
			createButtonContent: '<i class="nb-checkmark"></i>',
			cancelButtonContent: '<i class="nb-close"></i>',
			confirmCreate: true,
			width: '50px',
		},
		edit: {
			editButtonContent: '<i class="nb-edit"></i>',
			saveButtonContent: '<i class="nb-checkmark"></i>',
			cancelButtonContent: '<i class="nb-close"></i>',
			confirmSave: true,
			width: '50px',
		},
		delete: {
			deleteButtonContent: '<i class="nb-trash"></i>',
			confirmDelete: true,
			width: '50px',
		},
		columns: {
			type: {
				title: 'Type',
			},
			equipment: {
				title: 'Equipment',
			},
		},
	};

	public source: LocalDataSource = new LocalDataSource();

	public traitSettings: ISettings = {
		mode: 'external',
		selectMode: '', // 'multi';
		noDataMessage: 'No items found', // default: -> 'No data found'
		actions: {
			add: true,
			edit: true,
			delete: true,
			position: 'right',
		},
		add: {
			addButtonContent: '<i class="nb-plus"></i>',
			createButtonContent: '<i class="nb-checkmark"></i>',
			cancelButtonContent: '<i class="nb-close"></i>',
			confirmCreate: true,
			width: '50px',
		},
		edit: {
			editButtonContent: '<i class="nb-edit"></i>',
			saveButtonContent: '<i class="nb-checkmark"></i>',
			cancelButtonContent: '<i class="nb-close"></i>',
			confirmSave: true,
			width: '50px',
		},
		delete: {
			deleteButtonContent: '<i class="nb-trash"></i>',
			confirmDelete: true,
			width: '50px',
		},
		columns: {
			type: {
				title: 'Type',
			},
			content: {
				title: 'Content',
			},
		},
	};

	public traitSource: LocalDataSource = new LocalDataSource();

	public selectedCharacter: ICharacter = null;

	protected items: Table<IItem> = null;
	protected itemTypes: Table<IItemType> = null;

	private characterClasses: Table<ICharacterClass> = null;

	private behaviourType: BehaviourType = BehaviourType.INSERT
	private behaviourSubject: BehaviorSubject<BehaviourType> = new BehaviorSubject<BehaviourType>(this.behaviourType);

	/**
	 * @brief -
	*/
	constructor(
		public tablesService: TablesService,

		protected router: Router,
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected userService: UserService,

		protected projectsService: ProjectsService,

		private dialogService: NbDialogService,
	)
	{
		super(route, firebaseService, userService, projectsService);
	}

	public ngOnInit()
	{
		super.ngOnInit();
		this.includedTables.push('classes', 'items', 'itemtypes');
		this.project$.subscribe((project) => {
			if(project)
				this.tablesService.loadTablesFromProject(project, this.includedTables, (table) => this.loadTable(table))
					.then();
		})
	}

	protected loadTable(value: Table)
	{
		if(value === null) return;

		if(value.metadata.title.toLowerCase() === 'classes')
		{
			// store the dialogues.
			this.characterClasses = <Table<ICharacterClass>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tablesService.listenToTableData(this.characterClasses, ['child_added']),
			);
		}

		if(value.metadata.title.toLowerCase() === 'items')
		{
			// store the dialogues.
			this.items = <Table<IItem>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tablesService.listenToTableData(this.items, ['child_added']),
			);

			const pair: StringPair = new StringPair(this.items.id, 'name', true);
			this.settings = Object.assign({}, this.process(this.items, pair, 'equipment', this.settings));
		}

		if(value.metadata.title.toLowerCase() === 'itemtypes')
		{
			// store the dialogues.
			this.itemTypes = <Table<IItemType>>value;

			// Listen to incoming data
			this.mainSubscription.add(
				this.tablesService.listenToTableData(this.itemTypes, ['child_added']),
			);

			const pair: StringPair = new StringPair(this.itemTypes.id, 'name', true);
			this.settings = Object.assign({}, this.process(this.itemTypes, pair, 'type', this.settings));
		}
	}

	getName(prop: any)
	{
		return prop['en'];
	}

	public addMultiple()
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent, {
			context: {
				title: 'Add a new character',
				tblName: 'characters',
				settings: this.characterSettings,
			},
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm.emit(event));
	}

	public createEquipment(event: { source: LocalDataSource})
	{
		const ref = this.dialogService.open(InsertEquipmentComponent,
			{
				context: {
					behaviourType$: this.behaviourSubject,
					behaviourType: this.behaviourType,
					project: this.project,
					items: this.items,
					itemTypes: this.itemTypes,
				},
			});

		const instance = ref.componentRef.instance;
		instance.saveEvent.subscribe(($event: any) => this.onCreateEquipmentConfirm($event));
		instance.closeEvent.subscribe(() => ref.close());
		ref.componentRef.onDestroy(() => {
			instance.saveEvent.unsubscribe();
			instance.closeEvent.unsubscribe();
		});
	}

	/**
	 * @brief
	 * @param event - Object, consist of:
	 * newData: Object - data entered in a new row
	 * source: DataSource - table data source
	 * confirm: Deferred - Deferred object with resolve(newData: Object) and reject() methods.
	 */
	public onCreateEquipmentConfirm(event: { newData: any })
	{
		this.source.add({ type: event.newData.typeId, equipment: event.newData.equipment })
			.then(() => this.source.refresh());
	}

	public createTrait(event: { source: LocalDataSource})
	{
		const ref = this.dialogService.open(InsertTraitComponent,
			{
				context: {
					behaviourType$: this.behaviourSubject,
					behaviourType: this.behaviourType,
					project: this.project,
					items: this.items,
					itemTypes: this.itemTypes,
				},
			});

		const instance = ref.componentRef.instance;
		instance.saveEvent.subscribe(($event: any) => {});
		instance.closeEvent.subscribe(() => ref.close());
		ref.componentRef.onDestroy(() => {
			instance.saveEvent.unsubscribe();
			instance.closeEvent.unsubscribe();
		});
	}

	public onCreate(event: { source: LocalDataSource })
	{

	}

	public onChangelogConfirm(event)
	{

	}

	public onColumnOrderChange(event)
	{

	}


	public onCharacterClicked(event: number)
	{
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedCharacter = this.characters[event] as ICharacter;
		}
	}

	public onEditConfirmed(event: any)
	{
		event.stopPropagation();
		console.log('editing');
	}

	public onDeletedConfirmed(event: any)
	{
		event.stopPropagation();
		console.log('deleting');
	}

	protected process(table: Table, pair: StringPair, key: string, settings: ISettings = null)
	{
		const newSettings: ISettings = { ...settings };
		if (pair)
		{
			if(pair.key === '')
				UtilsService.onError(`Relation not found! Trying to find table "${pair.key}" for column "${pair.value}"`);

			const rel = new Relation(
				table.id, this.firebaseService, this.firebaseRelationService, this.tablesService, pair,
			);
			this.firebaseService.pushRelation(table.title, key, rel);

			newSettings.columns[key]['type'] = 'custom';
			newSettings.columns[key]['renderComponent'] = TextRenderComponent;
			newSettings.columns[key]['onComponentInitFunction'] = (instance: TextRenderComponent) => {
				// firebase, tableName, value => id
				instance.relation = rel;
			};

			newSettings.columns[key]['tooltip'] = { enabled: true, text: 'Relation to ' + pair.key };

			newSettings.columns[key]['editor'] =
			{
				type: 'custom',
				component: TextColumnComponent,
				data: {
					tblName: table.title, relationTable: pair.key, projectID: table.projectID, tableID: table.id,
				},
				config: { /* data: { relation: rel }, */ },
			}
		}

		return newSettings;
	}
}
