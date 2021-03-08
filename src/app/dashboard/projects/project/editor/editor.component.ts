import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Project } from '@app-core/data/project';
import { ProjectService } from '@app-core/data/projects.service';
import { FirebaseService } from '@app-core/utils/firebase.service';

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
		protected projectsService: ProjectService,
		protected firebaseService: FirebaseService,
	) { }

	public ngOnInit() {
		const that = this;
		const map: ParamMap = this.activatedRoute.snapshot.paramMap;
		const id = map.get('id');

		console.log(map);

		// We need the project already to exists

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
