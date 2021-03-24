import { AfterViewInit, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SnapshotAction } from '@angular/fire/database';
import { DefaultEditor, ViewCell } from '@vamidicreations/ng2-smart-table';
import { Column } from '@vamidicreations/ng2-smart-table/lib/lib/data-set/column';
import { BehaviorSubject, Observable, of, Subscription } from 'rxjs';

import { Relation } from '@app-core/data/base/relation.class';
import { StringPair } from '@app-core/data/base/string-pair.class';
import { BaseResponse, ProxyObject } from '@app-core/data/base/base.class';

import { DropDownQuestion, Option } from '@app-core/data/forms/form-types';
import { FirebaseService, RelationPair } from '@app-core/utils/firebase.service';
import { UtilsService } from '@app-core/utils';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { NbSelectComponent } from '@nebular/theme';
import { FilterCallback, FirebaseFilter, firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { ITable, Table, TablesService } from '@app-core/data/state/tables';
import { Project, ProjectsService } from '@app-core/data/state/projects';

@Component({
	template: `
		<span> {{ convertedValue | async }}</span>
	`,
})
export class TextRenderComponent implements ViewCell, OnInit, AfterViewInit, OnDestroy
{
	@Input()
	public rowData: any;

	@Input()
	public value: string | number;

	public relation: Relation = null;

	public convertedValue: BehaviorSubject<string> = new BehaviorSubject<string>('');

	private subscription: Subscription;

	private deeperRelation: any;

	constructor(
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		private cd: ChangeDetectorRef,
	) {}

	public ngOnInit(): void
	{
		// Set to default value first
		this.convertedValue.next(String(this.value));

		this.resolveValue();
	}

	public ngAfterViewInit(): void
	{
		this.cd.detectChanges();
	}

	public ngOnDestroy(): void
	{
		if(this.subscription)
			this.subscription.unsubscribe();
	}

	private resolveValue()
	{
		if((this.value !== undefined || true) && Number(this.value) !== Number.MAX_SAFE_INTEGER)
		{
			if (this.relation)
			{
				this.relation.id = String(this.value);
				this.relation.init();

				if (this.relation.relationReceiver$ !== null)
				{
					this.subscription = this.relation.relationReceiver$.subscribe((snapshot: Table | SnapshotAction<BaseResponse>) =>
					{
						if(snapshot instanceof Table)
						{
							const relationData: Table = snapshot;

							if (relationData && relationData.data[this.relation.id].hasOwnProperty(this.relation.tblColumnRelation.value))
							{
								const relData = relationData.data[this.relation.id][this.relation.tblColumnRelation.value];

								if(relData !== '')
									this.convertedValue.next(relData);

								if (!isNaN(Number(relData))) // if this is a number that we got
									this.handleDeeperRelation(relData);
							} else console.log(`Column name: ${this.relation.tblColumnRelation.key}, ${this.relation.tblColumnRelation.value} could not be found!`);

						}
						else if (snapshot.payload.exists())
						{
							const relationData: any = snapshot.payload.val();

							if (relationData && relationData.hasOwnProperty(this.relation.tblColumnRelation.value))
							{
								const relData = relationData[this.relation.tblColumnRelation.value];

								if(relData !== '')
									this.convertedValue.next(relData);

								if (!isNaN(Number(relData))) // if this is a number that we got
									this.handleDeeperRelation(relData);
							} else console.log(`Column name: ${this.relation.tblColumnRelation.key}, ${this.relation.tblColumnRelation.value} could not be found!`);
						}
					}, e => UtilsService.onError(e));
				}
			}
		}
	}

	private handleDeeperRelation(prevRelData: any)
	{
		const table$ = this.tableService.addIfNotExists(this.relation.tblColumnRelation.key);
		table$.then((res) => {

			const table = res instanceof Table ? res : this.tableService.getTableById(this.relation.tblColumnRelation.key);
			if(table)
			{
				const entry: RelationPair = this.relation.getRelationData(table.title);
				if (entry)
				{
					const pair: StringPair = entry.get(this.relation.tblColumnRelation.value);
					if (pair)
					{
						const project: Project | null = this.projectService.getProjectById(table.projectID);
						const tables = Object.keys(project.tables);

						let key = '';
						for(let i = 0; i < tables.length; i++)
						{
							if(project.tables[tables[i]].name === pair.key)
							{
								key = tables[i];
								break;
							}
						}

						if(key ==='')
						{
							UtilsService.onError('Key not found!');
							return; // we did not find the key
						}

						console.log()
						// Only one down
						this.deeperRelation = this.relation.getItem(prevRelData, key);
						const snapshots: any = this.deeperRelation.snapshotChanges(['child_changed']);

						snapshots.subscribe((snapshot: SnapshotAction<BaseResponse>) => {
							if (snapshot.payload.exists) {
								const relationData: any = snapshot.payload.val();

								if (relationData.hasOwnProperty(pair.value)) {
									const relData = relationData[pair.value];
									this.convertedValue.next(relData);
									if (!isNaN(Number(relData))) // if this is a number that we got
										this.handleDeeperRelation(relData); // go into even more deeper connection
								} else console.error('Column name could not be found!');
							}
						});
					}
				}
			}
		});
	}
}

@Component({
	template: `
		<nb-select #selectComponent id="{{ question.key }}--dropdown"
		           fullWidth
		           [(selected)]="defaultValue"
		           [placeholder]="question.placeholder"
				   (selectedChange)="onChange($event)">
			<nb-option [value]="defaultOption" *ngIf="containsNone()">None</nb-option>
			<nb-option *ngFor="let o of question.options$ | async" [value]="o.value">{{ o.key }}</nb-option>
		</nb-select>

		<!-- <input *ngIf="!isProduction()" #autoInput
			   nbInput
			   fullWidth
			   type="text"
			   (input)="onInputChange($event)"
			   [placeholder]="question.placeholder"
			   [value]="defaultValue"
			   [nbAutocomplete]="auto"/>

		<nb-autocomplete #auto *ngIf="!isProduction()" (selectedChange)="onSelectionChange($event)">
			<nb-option [value]="defaultOption">None</nb-option>
			<nb-option *ngFor="let o of filteredOptions$ | async" [value]="o.key">
				{{ o.value }}
			</nb-option>
		</nb-autocomplete> -->
	`,
})
export class TextColumnComponent extends DefaultEditor implements OnInit, AfterViewInit, OnDestroy
{
	@ViewChild('autoInput', { static: true }) input;
	filteredOptions$: Observable<Option<string | number | boolean>[]>;

	public question: DropDownQuestion = new DropDownQuestion({
		value: Number.MAX_SAFE_INTEGER,
		text: 'Name',
		name: 'relation-text',
		placeholder: 'Select relation',
		required: true,
		options: new BehaviorSubject<number[]>([]),
	});


	public defaultValue: number = null;

	public defaultOption: number = Number.MAX_SAFE_INTEGER;

	@ViewChild('selectComponent', { static: true })
	public selectComponent: NbSelectComponent = null;

	protected currentTbl: string;
	protected relationTable: string;

	protected table: Table = new Table();
	protected tableID: string = '';
	protected projectID: string = '';

	private subscription: Subscription = new Subscription();

	private deeperRelation: any;

	constructor(
		private cd: ChangeDetectorRef,
		protected firebaseService: FirebaseService,
		protected tablesService: TablesService,
		/* private firebaseRelationService: FirebaseRelationService */)
	{
		super();
	}

	// TODO this data should be automatic for relation ship columns
	public ngOnInit(): void
	{
		const editor = <any>(this.cell.getColumn().editor);
		this.currentTbl = editor.data.tblName;
		this.relationTable = editor.data.relationTable;
		this.tableID = editor.data.tableID;
		this.projectID = editor.data.projectID;

		this.defaultValue = this.cell.getValue();

		const column: Column = this.cell.getColumn();
		if(column.id /* && Number(value) !== Number.MAX_SAFE_INTEGER */)
		{
			const relation: Relation = this.firebaseService.getRelation(this.currentTbl, column.id);
			if (relation && this.question.options$.getValue().length === 0)
			{
				// if the current table is referencing to the same table then just load it.
				if(this.currentTbl === this.relationTable)
				{
					this.table = this.tablesService.getTableById(this.tableID);
					this.getRelationValue();
				}
				else // search for the relation table
				{
					let table: Table = this.tablesService.getTableByName(this.relationTable);

					// if we have the table init this one
					if(table)
					{
						this.table = table;
						this.tableID = table.id;
						this.getRelationValue();
					}
					else // let grab it from the server.
					{
						relation.relationRef.on('value', (result) =>
						{
							if(result.exists())
							{
								table = new Table({ ...<ITable>result.val(), id: result.key });
								this.tableID = table.id;
								this.onDataReceived(table);
								this.tablesService.setTable(this.tableID, this.table);
							}
						}, e => console.log(e));
					}
				}
			}
		}
	}

	public ngAfterViewInit()
	{
		this.selectComponent.selectedChange.emit(this.defaultValue);
	}

	public ngOnDestroy()
	{
		if(this.subscription)
			this.subscription.unsubscribe();

		// unsubscribe to the other tables.
		const column: Column = this.cell.getColumn();
		const relation: Relation = this.firebaseService.getRelation(this.currentTbl, column.id);
		if(relation.relationRef)
			relation.relationRef.off('value');
	}

	public onChange(event: any)
	{
		const type = this.cell.getColumn().type;
		if(type === 'custom')
		{
			this.cell.setValue(+event);
		} else if( type === 'string')
		{
			this.cell.setValue(String(event));
		} else if (type === 'number')
		{
			this.cell.setValue(+event);
		} else
		{
			this.cell.setValue(event);
		}
	}

	public isProduction()
	{
		return environment.production;
	}

	/**
	 * See if the question option list already contains the option 'None'
	 * If that is the case don't show our default option.
	 * @return boolean
	 */
	public containsNone()
	{
		return this.question ?
			this.question.options$.getValue().find((q) => q.key.toLowerCase() === 'none') !== null: false;
	}

	public onInputChange(event: any)
	{
		UtilsService.onDebug(event);
		if(!this.isProduction()) // experimental!
			this.filteredOptions$ = this.getFilteredOptions(this.input.nativeElement.value);
	}

	public getDefaultValue()
	{
		const cellType = this.cell.getColumn().type;
		if(cellType === 'custom')
		{
			return Number.MAX_SAFE_INTEGER;
		} else if( cellType === 'string')
		{
			return String(Number.MAX_SAFE_INTEGER);
		} else if (cellType === 'number')
		{
			return Number.MAX_SAFE_INTEGER;
		} else
		{
			return Number.MAX_SAFE_INTEGER
		}
	}

	public getFilteredOptions(value: string): Observable<Option<string | number | boolean>[]>
	{
		return of(value).pipe(
			map((filterString) => this.filter(filterString)),
		);
	}

	public onSelectionChange($event)
	{
		if(!this.isProduction()) // experimental!
		{
			this.filteredOptions$ = this.getFilteredOptions($event);
			const el = this.question.options$.getValue().find((option) => option.key === $event);
			if (el)
			{
				this.onChange(el.key);
				this.input.nativeElement.value = el.value;
			}
		}
	}

	private filter(value: string): Option<string | number | boolean>[]
	{
		const filterValue = value.toLowerCase();
		return this.question.options$.getValue().filter(optionValue => optionValue.key.toLowerCase().includes(filterValue));
	}

	private handleDeeperRelation({ prevSnapshotKey = -1, selected = false } , relation: Relation, prevRelData: any)
	{
		if(!relation)
			return;

		const entry: RelationPair = (relation.getRelationData(relation.tblColumnRelation.key));
		if(entry)
		{
			const pair: StringPair = entry.get(relation.tblColumnRelation.value);

			if(pair)
			{
				// Only one down
				this.deeperRelation = relation.getItem(prevRelData, pair.key);
				const snapshots: any = this.deeperRelation.snapshotChanges(['child_changed']);

				snapshots.subscribe((snapshot: SnapshotAction<BaseResponse>) =>
				{
					if (snapshot.payload.exists)
					{
						const relationData: any = snapshot.payload.val();

						if (relationData.hasOwnProperty(pair.value))
						{
							// TODO make a deeper relation work with this recursively.
							// const entry: RelationPair = this.firebaseRelationService.getData().get(pair.key); // table
							// const rel = new Relation(this.firebaseService, this.firebaseRelationService, pair);

							// Only one down
							// this.deeperRelation = relation.getItem(prevRelData, pair.key);
							// const snapshots: any = this.deeperRelation.snapshotChanges(['child_changed']);

							const relData = relationData[pair.value];
							// observer.next( relData );
							// if(!isNaN(Number(relData))) // if this is a number that we got
							// {
							// const rel: Relation = this.firebaseService.getRelation(column.id);
							// this.handleDeeperRelation({}, rel, relData); // go into even more deeper connection
							// }else
							this.question.options$.getValue().push(
								new Option<number>({
									key: prevSnapshotKey + '. ' + UtilsService.truncate(relData, 50),
									value: prevSnapshotKey,
									selected: selected,
								}),
							);
						} else console.error('Column name could not be found!');

						// TODO this should be a column setting
						// Sort the options descending.
						this.question.options$.getValue()
							.sort((a: Option<number>, b: Option<number>) => Number(b.value) - Number(a.value));
					}
				});
			}
		}
	}

	/**
	 * @brief - use this method to include filter options
	 *
	 */
	protected onDataReceived(table: Table)
	{
		this.table = table;

		const item: FirebaseFilter<ProxyObject> = firebaseFilterConfig.columnFilters.find((name) =>
			name.table === this.currentTbl && name.columns.some((c: any) => c === this.cell.getColumn().id),
		);

		let filterFunc: FilterCallback<ProxyObject> = null;
		if(item)
		{
			// TODO FIXME
			filterFunc = item.filter;
		}

		this.table.load([
			(d: ProxyObject) => !!+d.deleted === false,
			filterFunc,
		]).then(() => {
			this.getRelationValue();

			//
			if (!this.cd['destroyed'])
				this.cd.detectChanges();
		});
	}

	protected getRelationValue()
	{
		const column: Column = this.cell.getColumn();

		// we don't need to check the relation anymore.
		const relation: Relation = this.firebaseService.getRelation(this.currentTbl, column.id);

		let selected = false;

		// TODO FIXME - size
		const size = this.table.length;
		if(size !== 0)
		{
			this.table.forEach((s) =>
			{
				const snapshot: ProxyObject = s;
				// We need to convert or else we cant compare
				const snapshotKey: number = Number(snapshot.id);
				const relationData: any = snapshot;

				// the data can also be the boolean to see if the table is 'deleted'
				// if(relationData.deleted === true)
				// 	return;

				const relData = relationData[relation.tblColumnRelation.value];
				if(relData !== null || true)
				{
					// observer.next( relData );
					if (relData !== '' && !isNaN(Number(relData))) // if this is a number that we got
						this.handleDeeperRelation({ prevSnapshotKey: snapshotKey, selected: selected }, relation, relData);
					else
						this.question.options$.getValue().push(
							new Option<number>({
								value: snapshotKey,
								key: snapshotKey + '. ' + UtilsService.truncate(relData, 50),
								selected: selected,
							}),
						);
				}
				// TODO this should be a column setting
				// Sort the options descending.
				this.question.options$.getValue().sort((a: Option<number>, b: Option<number>) => Number(b.value) - Number(a.value));

				if (snapshotKey === this.cell.getValue())
				{
					this.defaultValue = snapshotKey;
					this.question.value = snapshotKey;
					this.cell.setValue(snapshotKey);
					selected = true;
				}
			});
		}

		if(!selected)
		{
			this.defaultValue = Number.MAX_SAFE_INTEGER;
			this.question.value = Number.MAX_SAFE_INTEGER;
			this.cell.setValue(Number.MAX_SAFE_INTEGER);
			this.selectComponent.selected = this.defaultValue;
		}

		const noneSelected: Option<number> =
			<Option<number>>this.question.options$.getValue().find((q: Option<number>) => q.key.toLowerCase() === 'none');

		if(this.containsNone() && noneSelected)
		{
			this.defaultValue = noneSelected.value;
			this.question.value = noneSelected.value;
			this.cell.setValue(this.defaultValue);
		}

		// if(!this.isProduction()) // experimental!
		// this.filteredOptions$ = of(this.question.options);
	}
}
