import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
	NbAccordionModule,
	NbButtonModule,
	NbCardModule, NbContextMenuModule,
	NbIconModule, NbInputModule,
	NbSelectModule,
	NbSpinnerModule,
	NbTabsetModule, NbTooltipModule,
} from '@nebular/theme';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { Ng2SmartTableModule } from '@vamidicreations/ng2-smart-table';
import { ThemeModule } from '@app-theme/theme.module';
import { StoriesComponent } from './stories/stories.component';
import { StoryComponent } from './stories/story/story.component';
import { GameEditorOverviewComponent } from './game-editor-overview.component';
import {
	CharactersTabComponent,
	ClassesTabComponent, SkillsTabComponent,
	ItemsTabComponent, WeaponsTabComponent, EnemiesTabComponent,
} from '@app-dashboard/projects/project/editor/character-editor/tabs';
import { GameEditorRoutingModule } from './game-editor-routing.module';
import { NodeEditorComponent } from '@app-theme/components/firebase-table/node-editor';
import { EchartsModule } from '@app-core/components/echarts/echarts.module';
import { NbVerticalTabSetModule } from '@app-theme/components/vertical-tabset/vertical-tabset.module';

const ROUTES = [
	GameEditorRoutingModule,
]

const NB_MODULES = [
	NbCardModule,
	ReactiveFormsModule,
	NbSelectModule,
	NbButtonModule,
	NbSpinnerModule,
	NbIconModule,
	NbInputModule,
	NbAccordionModule,
	NbContextMenuModule,
	NbTabsetModule,
	NbTooltipModule,
	NbVerticalTabSetModule,

	Ng2SmartTableModule,
];

const TabComponents = [
	CharactersTabComponent,
	ClassesTabComponent,
	SkillsTabComponent,
	ItemsTabComponent,
	WeaponsTabComponent,
	EnemiesTabComponent,
];

@NgModule({
	imports: [
		...ROUTES,
		ThemeModule,
		...NB_MODULES,
		BsDropdownModule.forRoot(),

		EchartsModule,
	],
	declarations: [
		// Story addition
		GameEditorOverviewComponent,
		...TabComponents,
		StoriesComponent,
		StoryComponent,

		// Node editor stuff
		NodeEditorComponent,
	],
	providers: [],
	exports: [
		StoriesComponent,
	],
})
export class GameEditorModule {
}
