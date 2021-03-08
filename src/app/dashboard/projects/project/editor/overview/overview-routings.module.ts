import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OverviewComponent } from './overview.component';
import { TableOverviewComponent } from './table-overview/table-overview.component';

// declare var routes: string[] = [
// 	{ key: string, name: string, hidden: boolean}
// ]

const routes: Routes = [
	{
		path: '',
		component: OverviewComponent,
	},
	{
		path: ':name', component: TableOverviewComponent, data: {},
	},
	// {
	// 	path: 'stories/:name/:story', component: StoryComponent, data: {},
	// },
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class OverviewRoutingsModule { }
