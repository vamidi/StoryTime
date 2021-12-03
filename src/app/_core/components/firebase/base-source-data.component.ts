import { NbToastrService } from '@nebular/theme';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { AfterViewInit, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { BaseFirebaseTableComponent } from '@app-core/components/firebase/base-firebase-table.component';
import { UserData, UserService } from '@app-core/data/state/users';

import { Table } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

/**
 * This class BaseSourceDataComponent is
 * for instances that only want to calculate the source data
 * for columns without the view of a table.
 */
@Component({
	template: '',
})
export abstract class BaseSourceDataComponent
	extends BaseFirebaseTableComponent implements OnInit, AfterViewInit, OnDestroy
{
	public Title: string = '';

	/**
	 * @brief -
	 * @param route - Activated route of navigation
	 * @param router - Router to navigate
	 * @param toastrService - Toast notifications
	 * @param snackbarService - Snack bar implementation
	 * @param userService - UserService to receive user information
	 * @param userPreferencesService
	 * @param projectService -
	 * @param tableService -
	 * @param firebaseService - Firebase connection information
	 * @param firebaseRelationService - Relation service for table relations
	 * @param languageService -
	 * @param tableId - table name what firebase should be looking at
	 */
	protected constructor(
		protected route: ActivatedRoute,
		protected router: Router,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		@Inject(String)protected tableId = '',
	) {
		super(route, router,
			firebaseService, firebaseRelationService, toastrService, snackbarService, userService,
			userPreferencesService, projectService, tableService, languageService, tableId,
		);
	}

	public ngAfterViewInit(): void {}

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

		this.processTableData(tableData, true, this.settings);
		this.changeTitle();
	}
}
