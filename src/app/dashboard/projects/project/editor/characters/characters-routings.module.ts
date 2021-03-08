import { NgModule } from '@angular/core';
import {  RouterModule, Routes } from '@angular/router';
import { CharactersComponent } from './characters-overview.component';
import { StoriesComponent } from './stories/stories.component';
import { StoryComponent } from './stories/story/story.component';

// declare var routes: string[] = [
// 	{ key: string, name: string, hidden: boolean}
// ]

const routes: Routes = [
	{
		path: '',
		component: CharactersComponent,
	},
	{
		path: 'stories/:name', component: StoriesComponent, data: {},
	},
	{
		path: 'stories/:name/:story', component: StoryComponent, data: {},
	},
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class CharactersRoutingsModule { }
