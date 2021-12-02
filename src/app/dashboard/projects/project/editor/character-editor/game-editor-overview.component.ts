import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';

import { NbToastrService } from '@nebular/theme';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { UserService } from '@app-core/data/state/users';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { Table, TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { ICharacter } from '@app-core/data/database/interfaces';

@Component({
	selector: 'ngx-characters-overview',
	templateUrl: 'game-editor-overview.component.html',
	styleUrls: [
		'../../../../../_theme/components/base-table-layout/base-overview.component.scss',
	],
	styles:[
		`
		::ng-deep nb-tab {
            padding: 0 2rem !important;
        }
		`,
	],
})
export class GameEditorOverviewComponent extends BaseSourceDataComponent implements OnInit
{
	public override get getTable(): Table<ICharacter>
	{
		return this.table as Table<ICharacter>;
	}

	constructor(
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected projectService: ProjectsService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		protected activatedRoute: ActivatedRoute,
		protected router: Router,
	) {
		// TODO change this and grab the table which is link to the character table.
		super(activatedRoute, router, toastrService, snackbarService, userService, userPreferencesService, projectService,
			tableService, firebaseService, firebaseRelationService, languageService);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		// TODO grab the characters from the project.
		// TODO 1. grab the project
		// TODO 2. grab the tables
		// TODO 3. search the name and then look up the table
		// TODO 4. from the table grab all the characters
		// TODO 5. On table click go to the editor.

		// Important or data will not be caught.
		this.getTableData(this.settings);
	}

	protected override onProjectLoaded(project: Project)
	{
		this.tableId = project.metadata.relatedTables.characters;
		this.setTblName = this.tableId;
	}
}
