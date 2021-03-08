import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SmartTableData } from '@app-core/data/smart-table';
import { QuestsSmartTableService } from '@app-core/mock/quests-smart-table.service';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { Router } from '@angular/router';
import { FirebaseTableFunctionalityComponent } from '@app-core/components/firebase/firebase-table-functionality.component';

import { InsertColumnComponent } from '@app-theme/components/firebase-table/insert-column/insert-column.component';
import { ChangeTableSettingsComponent } from '@app-theme/components/firebase-table/change-table-settings/change-table-settings.component';
import { firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';
import { UserService } from '@app-core/data/users.service';
import { Table } from '@app-core/data/table';
import { ProjectService } from '@app-core/data/projects.service';
import { TablesService } from '@app-core/data/tables.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

@Component({
	selector: 'ngx-table-overview-events-overview',
	templateUrl: './firebase-table-overview-child.component.html',
	styleUrls: ['../../../../../../_theme/components/base-table-layout/base-table-layout.component.scss'],
	providers: [
		{ provide: SmartTableData, useClass: QuestsSmartTableService},
	],
})
export class TableOverviewEventsComponent extends FirebaseTableFunctionalityComponent implements OnInit
{
	@ViewChild('insertColumnComponent', {static: false})
	public insertColumnComponent: InsertColumnComponent = null;

	@ViewChild('changeTableSettings', {static: false})
	public changeTableSettings: ChangeTableSettingsComponent = null;

	@ViewChild('smartTableComponent', { static: false })
	public smartTableComponent: any = null;

	@Input()
	public ids: number[] = [ Number.MAX_SAFE_INTEGER ];

	@Input()
	public tblName = 'taskEvents';

	public title: string = '';

	public events: any[] = [];

	public constructor(
		public firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected service: SmartTableData,
		protected userService: UserService,
		protected userPreferenceService: UserPreferencesService,
		protected projectService: ProjectService,
		protected tableService: TablesService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected router: Router,
		protected dialogService: NbDialogService,
	)
	{
		super(firebaseService, firebaseRelationService,
			service, userService, userPreferenceService, projectService, tableService,
			toastrService, snackbarService, router, dialogService,
		);
	}

	public ngOnInit(): void
	{
		this.changeTitle();

		this.tableName = this.tblName;

		//
		firebaseFilterConfig.tableFilters.push({
			table: 'taskEvents', columns: ['taskId'], filter: (item: any) =>
				this.ids.includes(item.taskId),
		});

		firebaseFilterConfig.columnFilters.push({
			table: 'taskEvents', columns: ['taskId'], filter: (item: any) => {
				return this.ids.includes(item.id);
			},
		});

		firebaseFilterConfig.tableFilters.push({
			table: 'dialogueEvents', columns: ['dialogueId'], filter: (item: any) =>
				this.ids.includes(item.dialogueId),
		});

		firebaseFilterConfig.columnFilters.push({
			table: 'dialogueEvents', columns: ['dialogueId'], filter: (item: any) =>
				this.ids.includes(item.id),
		});

		firebaseFilterConfig.tableFilters.push({
			table: 'dialogueOptions', columns: ['parentId'], filter: (item: any) =>
				this.ids.includes(item.parentId),
		});

		firebaseFilterConfig.columnFilters.push({
			table: 'dialogueOptions', columns: ['parentId'], filter: (item: any) =>
				this.ids.includes(item.id),
		});

		this.getTableData(this.settings);
	}

	public isTable()
	{
		// if the table name is empty false --> true
		return this.tableName !== 'game-db';
	}

	/**
	 * @override
	 * Change the title of the table
	 */
	protected changeTitle()
	{
		super.changeTitle();

		this.AddTitle = UtilsService.titleCaseFirst(this.tblName);
	}

	protected async onDataReceived(tableData: Table): Promise<void>
	{
		return super.onDataReceived(tableData);
	}
}
