import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
	InsertMultipleDialogComponent,
} from '@app-theme/components/firebase-table/insert-multiple-items/insert-multiple-dialog.component';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { UserData, UserService } from '@app-core/data/state/users';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

@Component({
	selector: 'ngx-characters-overview',
	templateUrl: 'characters-overview.component.html',
	styleUrls: [
		'../../../../../_theme/components/base-table-layout/base-overview.component.scss',
	],
})
export class CharactersComponent extends BaseSourceDataComponent implements OnInit
{
	constructor(
		protected dialogService: NbDialogService,
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
		super(router, toastrService, snackbarService, userService, userPreferencesService, projectService,
			tableService, firebaseService, firebaseRelationService, languageService, 'characters');
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

	public onCharacterClicked(event:any, characterObj: any)
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
			this.router.navigate(['stories/', characterObj.name.toLowerCase()],
				{state: {characterId: characterObj.id}, relativeTo: this.activatedRoute})
				.then();
		}
	}

	public addMultiple()
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent, {
			context: {
				title: 'Add item to ' + this.Title,
				tblName: 'characters',
				settings: this.settings,
			},
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm(event));
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
}
