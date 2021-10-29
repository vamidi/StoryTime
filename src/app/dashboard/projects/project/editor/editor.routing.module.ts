import { NgModule } from '@angular/core';
import {  RouterModule, Routes } from '@angular/router';
import { FirebaseRoutingService } from '@app-core/utils/firebase/firebase-routing.service';
import { EditorComponent } from './editor.component';
import { FirebaseTableComponent } from '@app-theme/components/firebase-table/firebase-table.component';
import { StoryEditorComponent } from '@app-dashboard/projects/project/editor/story-editor/story-editor.component';
import { ItemEditorComponent } from '@app-dashboard/projects/project/editor/item-editor/item-editor.component';

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
				component: StoryEditorComponent,

			},
			{
				path: 'item-editor',
				component: ItemEditorComponent,
			},
			{
				path: 'game-editor',
				loadChildren: () => import('./character-editor/game-editor.module')
					.then(m => m.GameEditorModule),
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
