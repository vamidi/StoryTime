import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { LanguageService, Project, ProjectsService } from '@app-core/data/state/projects';
import { ICharacter } from '@app-core/data/standard-tables';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { switchMap } from 'rxjs/operators';
import { AngularFireAction } from '@angular/fire/database';
import { UserService } from '@app-core/data/state/users';
import { BaseSourceDataComponent } from '@app-core/components/firebase/base-source-data.component';
import { NbDialogService, NbToastrService } from '@nebular/theme';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import * as _ from 'lodash';

@Component({ template: '' })
export abstract class BaseTabComponent extends BaseSourceDataComponent implements OnInit, OnDestroy
{
	@Input()
	public characters: Table<ICharacter> = null;

	public selectedCharacter: ICharacter = null;

	public get charData(): ICharacter
	{
		return this.characterData;
	}

	public defaultValue: number = Number.MAX_SAFE_INTEGER;

	protected characterData: ICharacter = null;

	protected mainSubscription: Subscription = new Subscription();

	protected project$: BehaviorSubject<Project> = new BehaviorSubject<Project>(null);
	protected projectId: number = Number.MAX_SAFE_INTEGER;

	protected project: Project = null;

	protected constructor(
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected userService: UserService,
		protected projectsService: ProjectsService,

		protected router: Router,
		protected toastrService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected dialogService: NbDialogService,
		protected userPreferencesService: UserPreferencesService,
		protected tableService: TablesService,
		protected firebaseRelationService: FirebaseRelationService,
		protected languageService: LanguageService,
		@Inject(String)protected tableId = '',
	) {
		super(router, toastrService, snackbarService, userService, userPreferencesService, projectsService,
			tableService, firebaseService, firebaseRelationService, languageService, tableId);
	}

	public ngOnInit(): void
	{
		super.ngOnInit();

		/*
		const map: ParamMap = this.route.snapshot.paramMap;
		const tableID = map.get('id');
		const id = map.get('charId');
		this.projectId = Number.parseInt(this.route.parent.snapshot.paramMap.get('id') as string, 0);

		// Important or data will not be cached
		console.trace(tableID, id);
		this.firebaseService.getRef(`tables/${tableID}/data/${id}`).on('value', (snapshot) => {
			if(snapshot.exists())
			{
				this.characterData = snapshot.val();
			}
		});
		*/

		this.mainSubscription.add(this.userService.getUser().pipe(
			switchMap(() =>
				this.projectsService.getProject() ?
					this.projectsService.getProject$() :
					this.firebaseService.getItem(this.projectId, `projects`).snapshotChanges(),
			),
		).subscribe((snapshot: Project | AngularFireAction<any>) =>
		{
			// console.log(snapshot, typeof snapshot, snapshot instanceof Project);
			let project = null;
			if(!snapshot.hasOwnProperty('payload') || snapshot instanceof Project)
			{
				project = snapshot;
			} else if(snapshot.payload.exists())
			{
				project = snapshot.payload.val()
			}

			if (project && !_.isEqual(this.project, project) && project.hasOwnProperty('tables'))
			{
				this.project = { ...project };
				this.project$.next(this.project);
			}

			this.userService.setUserPermissions(this.projectsService);
		}));
	}

	public ngOnDestroy(): void
	{
		// Unsubscribe to all table events
		this.mainSubscription.unsubscribe();
	}

	public onChangelogConfirm(event)
	{

	}

	public onCharacterClicked(event: number)
	{
		this.selectedCharacter = null;
		if(event !== Number.MAX_SAFE_INTEGER)
		{
			this.selectedCharacter = { ...this.characters.find(event) } as ICharacter;
			this.validateCharacter();
		}
		else this.validateCharacter();
	}

	protected validateCharacter() { }

	public addMultiple() { }
}
