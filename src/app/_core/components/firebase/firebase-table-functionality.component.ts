import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NbDialogRef } from '@nebular/theme/components/dialog/dialog-ref';
import { Ng2SmartTableComponent } from '@vamidicreations/ng2-smart-table';
import { SmartTableData } from '@app-core/data/smart-table';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { StringPair } from '@app-core/data/base/string-pair.class';

import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { UtilsService } from '@app-core/utils';
import { BaseSettings, ISettings } from '@app-core/mock/base-settings';
import { BaseFirebaseTableComponent } from '@app-core/components/firebase/base-firebase-table.component';
import { BehaviourType } from '@app-core/types';
import {
	InsertColumnComponent,
	ChangeTableSettingsComponent,
	RevisionDialogComponent,
	InsertItemsDialogComponent,
	InsertMultipleDialogComponent,
	InsertRelationDialogComponent,
} from '@app-theme/components/firebase-table';

import { firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { UserService } from '@app-core/data/state/users';
import { Table } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { ProxyObject } from '@app-core/data/base';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
	template: '',
})
export abstract class FirebaseTableFunctionalityComponent extends BaseFirebaseTableComponent
	implements OnInit, OnDestroy
{
	public abstract insertColumnComponent: InsertColumnComponent;

	public abstract changeTableSettings: ChangeTableSettingsComponent;

	public abstract smartTableComponent: Ng2SmartTableComponent = null;

	public AddTitle: string = '';
	public DeletedTittle: string = '';
	public AddButtonTitle: string = '';
	public isDeleted: boolean = false;

	public behaviourType: BehaviourType = BehaviourType.INSERT;

	public behaviourSubject: BehaviorSubject<BehaviourType> = new BehaviorSubject(this.behaviourType);

	protected currentPaging: any = { page: 1, perPage: 15 };

	protected filteredData: any[] = [];

	protected onAddSubscriptions: Subscription = new Subscription();

	// we need to keep a ref to the ChangeTableDialog
	protected changeTableSettingsDialog: NbDialogRef<ChangeTableSettingsComponent> = null;

	protected constructor(
		protected route: ActivatedRoute,
		public firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected service: SmartTableData,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected languageService: LanguageService,
		protected router: Router,
		protected dialogService: NbDialogService,
		@Inject(String)protected tableId = '',
	) {
		super(route, router, firebaseService, firebaseRelationService,
			toastrService, snackbarService, userService,
			userPreferencesService, projectService, tableService,
			languageService, tableId,
		);
		this.onAddSubscriptions.add(this.firebaseService.onTableAddEvent.subscribe(() => this.onAddTable()));
	}

	public isTable()
	{
		// if the table name is empty false --> true
		return this.tableId !== 'game-db';
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		let tableID = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
		this.tableId = tableID;
		this.firebaseService.setTblName(this.tableId);

		this.mainSubscription.add(this.router.events.subscribe((event) =>
		{
			if (event instanceof NavigationEnd)
			{
				// reset the column data in the settings variable
				this.settings = new BaseSettings();

				tableID = this.router.url.substr(this.router.url.lastIndexOf('/') + 1);
				this.tableId = tableID;
				this.firebaseService.setTblName(this.tableId);

				this.getTableData(this.settings);
			}
		}));

		this.getTableData(this.settings);
	}

	public ngOnDestroy()
	{
		super.ngOnDestroy();
		// Unsubscribe to events
		this.onAddSubscriptions.unsubscribe();
		// this.firebaseRelationService.onRelationInserted.unsubscribe();

		// remove the table filters
		let index = firebaseFilterConfig.tableFilters.findIndex((t) => t.table === this.tableId);
		while(index !== -1)
		{
			UtilsService.removeElFromArray(firebaseFilterConfig.tableFilters, index);
			index = firebaseFilterConfig.tableFilters.findIndex((t) => t.table === this.tableId);
		}

		// remove the column filters
		index = firebaseFilterConfig.columnFilters.findIndex((t) => t.table === this.tableId);
		while(index !== -1)
		{
			UtilsService.removeElFromArray(firebaseFilterConfig.columnFilters, index);
			index = firebaseFilterConfig.columnFilters.findIndex((t) => t.table === this.tableId);
		}
	}

	public onRowSelect(event: any)
	{
		console.log(event);
		// this.smartTableComponent.onExpandRow(event);
	}

	public onCreateConfirm(event: any)
	{
		super.onCreateConfirm(event);
		// stay on the same page
		this.currentPaging.page = this.table.getSource.getPaging().page;
	}

	public onEditConfirm(event: { data: ProxyObject, newData: ProxyObject, confirm?: any }, undo: boolean = false)
	{
		super.onEditConfirm(event, undo);
		// stay on the same page
		this.currentPaging.page = this.table.getSource.getPaging().page;
	}

	public onDeleteConfirm(event, callback = null)
	{
		const c: Function = () => this.table.getSource.refresh();
		super.onDeleteConfirm(event, callback ?? c);
	}

	public onChangelogConfirm(event: any)
	{
		switch(event.action)
		{
			case 'changelog':
				this.dialogService.open(RevisionDialogComponent, {
					context: {
						tableName: this.tableId,
						id: event.data.id,
					},
				});
				break;
			default:break;
		}
	}

	/*
	public onMultipleRowSelected(event: any)
	{
		// const selectedRows = event.selected;
		// console.log(event, selectedRows);
	}
	 */

	public onDeletePressed()
	{
		if (confirm('Do you really want to delete this table?')) {
			this.firebaseService.update(this.tableId, {deleted: true}).then(
				() => UtilsService.showToast(
					this.toastrService,
					'Table deleted!',
					this.tableId + ' has been deleted successfully',
				),
			);
		}
	}

	public insert(event: any) {
		switch (event) {
			case 0:
				this.behaviourType = BehaviourType.INSERT;
				break;
			case 1:
				this.behaviourType = BehaviourType.UPDATE;
				break;
			case 2:
				this.behaviourType = BehaviourType.DELETE;
				break;
			default:
				this.behaviourType = BehaviourType.INSERT;
				break;
		}

		this.behaviourSubject.next(this.behaviourType);

		const ref = this.dialogService.open(InsertColumnComponent,
		{
			context: {
				behaviourType$: this.behaviourSubject,
				behaviourType: this.behaviourType,
				columnData: this.columnData,
			},
		});

		ref.componentRef.instance.saveEvent.subscribe(($event: any) => this.saveForm($event));
		ref.componentRef.instance.closeEvent.subscribe(() => this.closeForm(ref));
		ref.componentRef.onDestroy(() => {
			ref.componentRef.instance.saveEvent.unsubscribe();
			ref.componentRef.instance.closeEvent.unsubscribe();
		});
	}

	public toggleColumn(event: { key: string, value: boolean })
	{
		super.toggleColumn(event);

		this.settings.columns[event.key].hidden = event.value;
		if (this.smartTableComponent)
			this.smartTableComponent.initGrid();
	}

	public openBulkDialogue()
	{
		let ref;
		if(this.table.title === 'items')
		{
			ref = this.dialogService.open(InsertItemsDialogComponent, {
				context: {
					title: 'Add item to ' + this.AddTitle,
					tblName: this.table.metadata.title,
					settings: this.settings,
				},
			});
		}
		else
			ref = this.dialogService.open(InsertMultipleDialogComponent, {
				context: {
					title: 'Add item to ' + this.AddTitle,
					tblName: this.table.metadata.title,
					settings: this.settings,
				},
			});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm(event));
		ref.onClose.subscribe(() => ref.componentRef.instance.insertEvent.unsubscribe()).unsubscribe();
	}

	public openRelationDialogue()
	{
		const ref: NbDialogRef<InsertRelationDialogComponent> = this.dialogService.open(InsertRelationDialogComponent, {
			context: {
				title: 'Add relation to ' + this.AddTitle,
				settings: this.settings,
				table: this.table,
			},
		});

		ref.componentRef.instance.onRelationInserted.subscribe((event: any) => this.onRelationCreated(event));
		ref.componentRef.instance.onRelationDeleted.subscribe((event: any) => this.onRelationDeleted(event));
		ref.componentRef.onDestroy(() => {
			ref.componentRef.instance.onRelationInserted.unsubscribe();
			ref.componentRef.instance.onRelationDeleted.unsubscribe();
		});
	}

	public openTableSettings()
	{
		// [settings]="settings" (closeEvent)="enableSettings = false" (onToggleEvent)="toggleColumn($event)">

		this.changeTableSettingsDialog = this.dialogService.open(ChangeTableSettingsComponent, {
			context: {
				settings: this.settings,
				table: this.table,
			},
		});

		this.changeTableSettingsDialog.componentRef
			.instance.onToggleEvent.subscribe(($event: any) => this.toggleColumn($event));

		this.changeTableSettingsDialog.componentRef
			.instance.onRelationInserted.subscribe((event: any) => this.onRelationCreated(event));

		this.changeTableSettingsDialog.componentRef
			.instance.onRelationDeleted.subscribe((event: any) => this.onRelationDeleted(event));

		this.changeTableSettingsDialog.componentRef.onDestroy(() => {
			this.changeTableSettingsDialog.componentRef.instance.onRelationInserted.unsubscribe();
			this.changeTableSettingsDialog.componentRef.instance.onRelationDeleted.unsubscribe()
			this.changeTableSettingsDialog.componentRef.instance.onToggleEvent.unsubscribe();
			this.changeTableSettingsDialog = null;
		});
	}

	public closeForm<T>(ref: NbDialogRef<T>)
	{
		ref.close();
	}

	public onAddTable()
	{
		// TODO Add new table with the new method
		// this.data.push(new TableTemplate());
		console.log(this.projectService);
	}

	protected onRelationCreated(event: any)
	{
		if(event.hasOwnProperty('newData'))
		{
			// noinspection JSUnusedGlobalSymbols
			const newSettings: ISettings = { ...this.settings };

			// We only need this information once
			const key: string = event.newData?.key;
			if (newSettings.columns.hasOwnProperty(key))
			{
				// if we found the relation
				const pair: StringPair = event.newData.pair;
				this.processRelation(this.table, pair, key, newSettings);
			}
			this.settings = Object.assign({}, newSettings);
		}
	}

	protected onRelationDeleted(event: any)
	{
		if(event.hasOwnProperty('newData'))
		{
			// noinspection JSUnusedGlobalSymbols
			const newSettings: ISettings = { ...this.settings };

			// We only need this information once
			const key: string = event.newData?.key;
			if (newSettings.columns.hasOwnProperty(key))
			{
				newSettings.columns[key].type = 'text';
				delete newSettings.columns[key]['renderComponent'];
				delete newSettings.columns[key]['onComponentInitFunction'];
				delete newSettings.columns[key]['tooltip'];
				delete newSettings.columns[key]['editor'];
			}

			this.settings = Object.assign({}, newSettings);
		}
	}

	/**
	 * @override
	 * @brief - change the title of the table
	 */
	protected changeTitle()
	{
		this.AddTitle = this.table.metadata.title;
		this.AddTitle = this.AddTitle.replace(/([A-Z])/g, ' $1').trim();
		this.AddTitle = this.AddTitle.charAt(0).toUpperCase() + this.AddTitle.substr(1);

		this.AddButtonTitle = 'Add ' + this.AddTitle.substring(0, this.AddTitle.length - 1);

		const charPos1 = this.AddButtonTitle.length - 1;
		const charPos2 = this.AddButtonTitle.length - 2;
		if (this.AddButtonTitle.charAt(charPos1).toLowerCase() === 'e'
			&& this.AddButtonTitle.charAt(charPos2).toLowerCase() === 'i') {
			this.AddButtonTitle = this.AddTitle.substring(0, this.AddTitle.length - 3);
			this.AddButtonTitle += 'y';
		}

		// TODO Removes tables from the breadcrumb url.
		// this.breadcrumbService.hideRoute(`/dashboard/projects/${this.table.projectID}/tables`);
		// this.breadcrumbService.addFriendlyNameForRouteRegex(
		// 	`dashboard/projects/${this.table.projectID}/tables/[a-zA-Z]`, this.AddTitle
		// );
	}

	protected onDataReceived(tableData: Table)
	{
		// Must be called
		super.onDataReceived(tableData);

		if(this.changeTableSettingsDialog)
			this.changeTableSettingsDialog.componentRef.instance.table = this.table;

		if (tableData.metadata.deleted)
		{
			this.DeletedTittle = (tableData.metadata.deleted) ? 'This table is deleted' : '';
			this.isDeleted = tableData.metadata.deleted;
		}

		this.changeTitle();
	}

	protected onTableDataLoaded()
	{
		super.onTableDataLoaded();

		this.table.getSource.setPaging(this.currentPaging.page, this.currentPaging.perPage);

		if (this.smartTableComponent) {
			this.smartTableComponent.initGrid();
		}
	}
}
