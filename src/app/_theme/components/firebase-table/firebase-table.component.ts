import { AfterViewInit, Component, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { SmartTableData } from '@app-core/data/smart-table';
import { QuestsSmartTableService } from '@app-core/mock/quests-smart-table.service';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { Router } from '@angular/router';
import { InsertColumnComponent } from './insert-column/insert-column.component';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';

import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NodeEditorComponent } from './node-editor';

import { ChangeTableSettingsComponent } from './change-table-settings/change-table-settings.component';
import { FirebaseTableFunctionalityComponent } from '@app-core/components/firebase/firebase-table-functionality.component';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

/**
 * Firebase table component
 * This component handles the tables generation for each url
 */
@Component({
	selector: 'ngx-firebase-table',
	templateUrl: './firebase-table.component.html',
	styleUrls: ['./../base-table-layout/base-table-layout.component.scss'],
	providers: [
		{ provide: SmartTableData, useClass: QuestsSmartTableService},
	],
})
export class FirebaseTableComponent extends FirebaseTableFunctionalityComponent
	implements OnInit, AfterViewInit, OnDestroy
{
	@ViewChild('insertColumnComponent', {static: true })
	public insertColumnComponent: InsertColumnComponent = null;

	@ViewChild('changeTableSettings', { static: true })
	public changeTableSettings: ChangeTableSettingsComponent = null;

	// Node editor
	@ViewChildren('nodeEditor')
	public nodeEditor: QueryList<NodeEditorComponent> = null;

	@ViewChild('smartTableComponent', { static: false })
	public smartTableComponent: any = null;

	constructor(
		public firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected service: SmartTableData,
		protected userService: UserService,
		protected userPreferenceService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected toastrService: NbToastrService,
		protected languageService: LanguageService,
		protected router: Router,
		protected dialogService: NbDialogService,
		protected snackbarService: NbSnackbarService,
	) {
		super(
			firebaseService, firebaseRelationService, service, userService, userPreferenceService,
			projectService, tableService, toastrService, snackbarService, languageService, router, dialogService,
		);
	}

	public isTable()
	{
		// if the table name is empty false --> true
		return this.tableName !== 'game-db';
	}

	public ngOnInit()
	{
		super.ngOnInit();
	}

	/**
	 * After the view has been initialized.
	 */
	public ngAfterViewInit(): void {}
}
