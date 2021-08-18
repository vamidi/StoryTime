import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Project, ProjectsService } from '@app-core/data/state/projects';
import { ICharacter } from '@app-core/data/standard-tables';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { switchMap } from 'rxjs/operators';
import { AngularFireAction } from '@angular/fire/database';
import { UserService } from '@app-core/data/state/users';
import * as _ from 'lodash';
import { ProxyObject } from '@app-core/data/base';

@Component({ template: '' })
export abstract class BaseTabComponent implements OnInit, OnDestroy
{
	@Input()
	public characters: ProxyObject[] = [];

	public get charData(): ICharacter
	{
		return this.characterData;
	}

	protected characterData: ICharacter = null;

	protected mainSubscription: Subscription = new Subscription();

	protected project$: BehaviorSubject<Project> = new BehaviorSubject<Project>(null);
	protected projectId: number = Number.MAX_SAFE_INTEGER;

	protected project: Project = null;

	protected readonly includedTables: string[] = [];

	protected constructor(
		protected route: ActivatedRoute,
		protected firebaseService: FirebaseService,
		protected userService: UserService,
		protected projectsService: ProjectsService,
	) { }

	public ngOnInit(): void
	{
		const map: ParamMap = this.route.snapshot.paramMap;
		const tableID = map.get('id');
		const id = map.get('charId');
		this.projectId = Number.parseInt(this.route.parent.snapshot.paramMap.get('id') as string, 0);

		// Important or data will not be cached
		this.firebaseService.getRef(`tables/${tableID}/data/${id}`).on('value', (snapshot) => {
			if(snapshot.exists())
			{
				this.characterData = snapshot.val();
			}
		});

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
}
