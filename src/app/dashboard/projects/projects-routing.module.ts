import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { ProjectComponent } from './project/project.component';
import { ProjectsComponent } from './projects.component';
import { FirebaseTableComponent } from '@app-theme/components/firebase-table/firebase-table.component';

const routes: Routes = [
	{
		path: '',
		component: ProjectsComponent,
	},
	{
		path: ':id',
		component: ProjectComponent,
	},
	{
		path: ':id/editor',
		loadChildren: () => import('./project/editor/editor.module')
			.then(m => m.EditorModule),
	},
	{
		path: ':id/tables/:table',
		component: FirebaseTableComponent,
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class ProjectsRoutingModule { }
