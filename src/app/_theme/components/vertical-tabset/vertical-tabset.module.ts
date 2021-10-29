import { NgModule } from '@angular/core';
import { NbBadgeModule, NbIconModule } from '@nebular/theme';
import { CommonModule } from '@angular/common';
import { NbVerticalTabComponent } from '@app-theme/components/vertical-tabset/vertical-tab.component';
import { NbVerticalTabSetComponent } from '@app-theme/components/vertical-tabset/vertical-tabset.component';

const NB_MODULES = [
	NbIconModule,
	NbBadgeModule,
]

const NB_TAB_SET_COMPONENTS = [
	NbVerticalTabSetComponent,
	NbVerticalTabComponent,
];

@NgModule({
	imports: [
		CommonModule,
		...NB_MODULES,
	],
	declarations:[
		...NB_TAB_SET_COMPONENTS,
	],
	exports: [
		...NB_TAB_SET_COMPONENTS,
	],
})
export class NbVerticalTabSetModule
{

}
