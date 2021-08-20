import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Project } from '@app-core/data/state/projects';
import { ProjectsService } from '@app-core/data/state/projects';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BreadcrumbsService } from '@app-core/utils';

@Component({
	selector: 'ngx-editor',
	template: `
		<router-outlet></router-outlet>
	`,
})
export class EditorComponent implements OnInit
{
	protected project: Project = new Project();
	protected currentState: { project: Project } = { project: new Project() };

	constructor(
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
		protected projectsService: ProjectsService,
		protected firebaseService: FirebaseService,
	) { }

	public ngOnInit()
	{
		const that = this;
		const map: ParamMap = this.activatedRoute.snapshot.paramMap;
		const id = map.get('id');

		// We need the project already to exists

		console.log(id);
		this.firebaseService.getRef('projects/' + id).on('value', (snapshots) =>
		{
			that.currentState.project.id = id;
			snapshots.forEach(function(snapshot)
			{
				if(snapshot.exists())
				{
					// const q: any = snapshot.exists ? snapshot.val() : {};
					that.currentState['project'][snapshot.key] = snapshot.val();
				}
			});

			// set this project to the current
			this.project = this.projectsService.setProject(id, that.currentState.project, true);
			// TODO load the tables of this project
			// this.getTables();
		}, () => this.router.navigateByUrl('/dashboard/error'));
	}
}
