import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { SmartTableData } from '@app-core/data/smart-table';
import { QuestsSmartTableService } from '@app-core/mock/quests-smart-table.service';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { LocalDataSource } from '@vamidicreations/ng2-smart-table';

import { UtilsService } from '@app-core/utils';
import { InsertMultipleDialogComponent } from '@app-theme/components/firebase-table/insert-multiple-items/insert-multiple-dialog.component';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { UserService } from '@app-core/data/state/users';
import { Table } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

@Component({
	selector: 'ngx-quests',
	templateUrl: './stories.component.html',
	styleUrls: ['../../../../../../_theme/components/base-table-layout/base-table-layout.component.scss'],
	providers: [
		{provide: SmartTableData, useClass: QuestsSmartTableService},
	],
})
export class StoriesComponent extends BaseSourceDataComponent implements OnInit, OnDestroy
{
	public source: LocalDataSource = new LocalDataSource();

	public change: boolean = false;

	public data: any[] = [];

	protected currentState: any = {};

	constructor(
		protected dialogService: NbDialogService,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		private location: Location,
	) {
		super(
			router, toastrService, dialogService, snackbarService, userService, userPreferencesService,
			projectService, tableService, firebaseService, firebaseRelationService, languageService, 'stories',
		);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		this.currentState = this.location.getState();

		if(!this.currentState.hasOwnProperty('characterId'))
		{
			const that = this;
			const map: ParamMap = this.activatedRoute.snapshot.paramMap;

			const characterName = UtilsService.titleCase(map.get('name'));
			this.firebaseService.getRef('characters').orderByChild('name').equalTo(characterName).on('value', (snapshots) =>
			{
				snapshots.forEach(function(snapshot)
				{
					if(snapshot.exists())
					{
						// const q: any = snapshot.exists ? snapshot.val() : {};

						that.currentState = {
							...that.currentState,
							characterId: +snapshot.key,
						};
					}

					// retrieve the data after finding the story
					that.getTableData(that.settings);
				});
			});

			// 	this.router.navigate(['../../../'], { relativeTo: this.activatedRoute }).then();
		} else
		{
			this.getTableData(this.settings);
		}
	}

	public onStoryClicked(event, storyObj: any)
	{
		// to prevent propagation
		if(
			// if the first level is equal to the card
			event.target.parentElement && event.target.parentElement === event.currentTarget ||
			// or the second level
			event.target.parentElement && event.target.parentElement.parentElement &&
			event.target.parentElement.parentElement === event.currentTarget
		) {

			this.router.navigate(['./', UtilsService.replaceCharacter(storyObj.title, /\s+/g, '-').toLowerCase()],
				{
					state: {
						storyId: storyObj.id,
						childId: storyObj.childId,
						title: storyObj.title,
						characterId: storyObj.parentId,
					},
					relativeTo: this.activatedRoute,
				})
				.then();
		}
	}

	public addMultiple()
	{
		const ref = this.dialogService.open(InsertMultipleDialogComponent, {
			context: {
				title: 'Add item to ' + this.Title,
				settings: this.settings,
			},
		});

		// Otherwise scope will make this undefined in the method
		ref.componentRef.instance.insertEvent.subscribe((event: any) => this.onCreateConfirm(event));
	}

	protected onDataReceived(snapshots: Table)
	{
		// first retrieve and make table columns
		super.onDataReceived(snapshots);

		// if(snapshots.data.length)
		// {
			// this.tableData = snapshots.data.filter((snapshot) =>
			// {
			// 	return snapshot.parentId === this.currentState.characterId && !snapshot.deleted
			// });
		// }
	}
}
