import { NgModule } from '@angular/core';
import {  RouterModule, Routes } from '@angular/router';
import { FirebaseRoutingService } from '@app-core/utils/firebase-routing.service';
import { EditorComponent } from './editor.component';
import { FirebaseTableComponent } from '@app-theme/components/firebase-table/firebase-table.component';
import { NodeEditorComponent } from '@app-dashboard/projects/project/editor/node-editor/node-editor.component';

// declare var routes: string[] = [
// 	{ key: string, name: string, hidden: boolean}
// ]

const routes: Routes = [
	{
		path: '',
		component: EditorComponent,
		children: [
			{
				path: '',
				component: NodeEditorComponent,

			},
			// {
			// 	path: ':id/editor/:story',
			// 	component: EditorComponent,
			// },
			{
				path: 'characters',
				loadChildren: () => import('./characters/characters.module')
					.then(m => m.CharactersModule),
			},
			{
				path: 'quests',
				loadChildren: () => import('./overview/overview.module')
					.then(m => m.OverviewModule),
			},
			{
				path: 'dialogues',
				loadChildren: () => import('./overview/overview.module')
					.then(m => m.OverviewModule),
			},
			{ path: '**', component: FirebaseTableComponent },
		],
		/*
			{
				path: 'dialogues',
				component: DialoguesComponent,
			},
			{
				path: 'quests',
				component: QuestsComponent,
			},
			{
				path: 'items',
				component: ItemsComponent,
			},
		 */
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
	providers: [FirebaseRoutingService],
})
export class EditorRoutingModule
{
}
