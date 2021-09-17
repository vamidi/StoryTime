import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
	InsertMultipleDialogComponent,
} from '@app-theme/components/firebase-table/insert-multiple-items/insert-multiple-dialog.component';
import { NbDialogService, NbMenuService, NbToastrService } from '@nebular/theme';
import { FirebaseRelationService, TableRelation } from '@app-core/utils/firebase/firebase-relation.service';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { BaseSettings } from '@app-core/mock/base-settings';

import { filter } from 'rxjs/operators';
import { NbMenuItem } from '@nebular/theme/components/menu/menu.service';
import { BehaviourType } from '@app-core/types';
import { InsertColumnComponent } from '@app-theme/components/firebase-table/insert-column/insert-column.component';
import { BehaviorSubject } from 'rxjs';
import { FirebaseTableComponent } from '@app-theme/components/firebase-table/firebase-table.component';
import { UserService } from '@app-core/data/state/users';
import { Table } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

/**
 * Overview Component
 *
 */
@Component({
	selector: 'ngx-characters-overview',
	templateUrl: 'overview.component.html',
	styleUrls: ['../../../../../_theme/components/base-table-layout/base-overview.component.scss'],
})
export class OverviewComponent extends BaseSourceDataComponent implements OnInit
{
	public get Table() { return this.table; }

	public cardOptions: Map<number, NbMenuItem[]> = new Map<number, NbMenuItem[]>();

	@ViewChildren('firebaseTableComponent')
	public firebaseTableComponent: QueryList<FirebaseTableComponent>;

	public routerTblUrl = '';

	protected tableRelData: TableRelation = null;

	constructor(
		public firebaseService: FirebaseService,
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected nbMenuService: NbMenuService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		protected activatedRoute: ActivatedRoute,
		protected router: Router,
	) {
		super(
			router, toastrService, snackbarService, userService, userPreferencesService,
			projectService, tableService, firebaseService, firebaseRelationService, languageService);
	}

	public ngOnInit(): void
	{
		this.gridMode = true;

		this.routerTblUrl = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
		// this.customTbl = this.tableName === 'dialogues' ? 'stories' : 'quests';

		this.tableRelData = this.firebaseRelationService.getTableRelationData().get(this.routerTblUrl);

		this.setTblName = this.tableRelData.tableName;

		super.ngOnInit();

		this.mainSubscription.add(this.router.events.subscribe((event) =>
		{
			if (event instanceof NavigationEnd)
			{
				// TODO reset the data of the table
				// this.data = [];

				// reset the column data in the settings variable
				this.settings = new BaseSettings();

				this.routerTblUrl = event.url.substr(event.url.lastIndexOf('/') + 1);

				this.tableRelData = this.firebaseRelationService.getTableRelationData().get(this.routerTblUrl);

				this.setTblName = this.tableId;

				this.changeTitle();

				this.getTableData(this.settings);
			}
		}));

		this.mainSubscription.add(this.nbMenuService.onItemClick()
			.pipe(
				filter(({ tag }) => tag === 'open-option-menu'),
			)
			.subscribe(({ item: { title, data } }) => this.onCardOptionClicked({ title, data })));

		this.changeTitle();

		// Important or data will not be fetched
		this.getTableData(this.settings);
	}

	public onListItemClicked(event:any, obj: any)
	{
		// console.log(event.target, event.target.parentElement, event.currentTarget, event.target === event.currentTarget);
		// to prevent propagation
		if(
			// if the first level is equal to the card
			event.target.parentElement && event.target.parentElement === event.currentTarget ||
			// or the second level
			event.target.parentElement && event.target.parentElement.parentElement &&
			event.target.parentElement.parentElement === event.currentTarget
		)
		{
			const currentState = { table: this.routerTblUrl };

			this.tableRelData.associatedTable.value.forEach(value => {
				currentState[value] = obj[value];
			});

			this.router.navigate(['./', obj.title.toLowerCase()],
				{ state: currentState, relativeTo: this.activatedRoute })
				.then();
		}
	}

	public getCardOption(id: number): NbMenuItem[]
	{
		return this.cardOptions.get(id);
	}

	public onCardOptionClicked(item: any)
	{
		switch(item.title.toLowerCase())
		{
			case 'edit':
				const ref = this.dialogService.open(InsertMultipleDialogComponent, {
					context: {
						title: 'Add item to ' + this.Title,
						tblName: this.table.metadata.title,
						// TODO FIXME
						// data: this.tableData.find(d => d.id === item.data.id),
						behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.UPDATE),
						settings: this.settings,
					},
				});

				// Otherwise scope will make this undefined in the method
				ref.componentRef.instance.insertEvent.subscribe((event: any) =>
				{
					switch(event.insertType)
					{
						case BehaviourType.INSERT:
							this.onCreateConfirm(event);
							break;
						case BehaviourType.UPDATE:
						default:
							this.onEditConfirm(event, true);
							break;
						case BehaviourType.DELETE:
							break;
					}
				});
				break;
			case 'delete':
				// TODO FIXME
				// const data = this.tableData.find(d => d.id === item.data.id);
				if (window.confirm('Are you sure you want to delete?'))
				{
					// this.onDeleteConfirm(data)
				}
				break;
		}
	}

	public addMultiple()
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent, {
			context: {
				title: 'Add item to ' + this.Title,
				behaviourType$: new BehaviorSubject<BehaviourType>(BehaviourType.INSERT),
				tblName: this.table.metadata.title,
				settings: this.settings,
			},
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm(event));
	}

	public openColumnSettings(type: number)
	{
		// *ngIf="change" [behaviourType$]="behaviourSubject" [behaviourType]="behaviourType"
		// 	[columnData]="columnData" (saveEvent)="saveForm($event)" (closeEvent)="closeForm()"
		// 	#insertColumnComponent

		let behaviourType;

		switch (type) {
			case 0:
				behaviourType = BehaviourType.INSERT;
				break;
			case 1:
				behaviourType = BehaviourType.UPDATE;
				break;
			case 2:
				behaviourType = BehaviourType.DELETE;
				break;
			default:
				behaviourType = BehaviourType.INSERT;
				break;
		}


		const ref = this.dialogService.open(InsertColumnComponent, {
			context: {
				behaviourType$: new BehaviorSubject<BehaviourType>(behaviourType),
				columnData: this.settings.columns,
			},
			dialogClass: 'modal-lg',
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.closeEvent.subscribe(() => ref.close());

		const that = this;
		ref.componentRef.instance.saveEvent.subscribe((event: any) =>  { that.saveForm(event); ref.close() });
	}

	protected changeTitle()
	{
		this.Title = this.tableRelData.tableName;
		this.Title = this.Title.replace(/([A-Z])/g, ' $1').trim();
		this.Title = this.Title.charAt(0).toUpperCase() + this.Title.substr(1);
	}

/*
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
*/
	protected onDataReceived(snapshots: Table)
	{
		super.onDataReceived(snapshots);
		// if(snapshots.data.length !== 0)
		// {
			// this.processTableData(snapshots, true);

			// TODO FIXME
			// this.tableData = snapshots.data;

			// this.tableData = this.tableData.filter((snapshot) => !snapshot.deleted);

			// this.tableData.forEach((d) => {
			// 	const id = d.id;
			// 	const menu: NbMenuItem[] = [{ title: 'Edit', data: { id: id } }, { title: 'Delete', data: { id: id } }];
			// 	this.cardOptions.set(id, menu);
			// });
		// }
	}
}
