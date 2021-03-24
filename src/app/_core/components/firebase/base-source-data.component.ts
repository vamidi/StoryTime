import { NbToastrService } from '@nebular/theme';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { AfterViewInit, OnDestroy, OnInit } from '@angular/core';
import { BaseFirebaseTableComponent } from '@app-core/components/firebase/base-firebase-table.component';
import { UserService } from '@app-core/data/state/users';

import { Table } from '@app-core/data/state/tables';
import { ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Router } from '@angular/router';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

export class BaseSourceDataComponent extends BaseFirebaseTableComponent implements OnInit, AfterViewInit, OnDestroy
{
	public Title: string = '';

	/**
	 * @brief -
	 * @param router - Router to navigate
	 * @param toastrService - Toast notifications
	 * @param snackbarService - Snack bar implementation
	 * @param userService - UserService to receive user information
	 * @param userPreferencesService
	 * @param projectService -
	 * @param tableService -
	 * @param firebaseService - Firebase connection information
	 * @param firebaseRelationService - Relation service for table relations
	 * @param tableName - table name what firebase should be looking at
	 */
	constructor(
		protected router: Router,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected tableName: string = '',
	) {
		super(
			router, firebaseService, firebaseRelationService, toastrService, snackbarService, userService,
			userPreferencesService, projectService, tableService, tableName,
		);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		// Get the stories table
		// this.tableName = 'characters';
		// Let firebase search with current table name
		this.firebaseService.setTblName(this.tableName);
	}

	public ngAfterViewInit(): void
	{
	}

	public ngOnDestroy()
	{
		super.ngOnDestroy();

		if(this.mainSubscription)
			this.mainSubscription.unsubscribe();
	}

	protected changeTitle()
	{
		this.Title = this.table.metadata.title;
		this.Title = this.Title.replace(/([A-Z])/g, ' $1').trim();
		this.Title = this.Title.charAt(0).toUpperCase() + this.Title.substr(1);
	}

	protected onDataReceived(tableData: Table)
	{
		super.onDataReceived(tableData);

		this.processTableData(tableData, true);
		this.changeTitle();
	}
}
