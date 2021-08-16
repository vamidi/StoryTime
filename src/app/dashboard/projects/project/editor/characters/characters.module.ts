import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NbButtonModule, NbCardModule, NbIconModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { ThemeModule } from '@app-theme/theme.module';
import { StoriesComponent } from './stories/stories.component';
import { StoryComponent } from './stories/story/story.component';
import { CharactersComponent } from './characters-overview.component';
import { CharacterComponent } from '@app-dashboard/projects/project/editor/characters/character/character.component';
import { CharactersRoutingModule } from './characters-routing.module';
import { NodeEditorComponent } from '@app-theme/components/firebase-table/node-editor';
import { EchartsModule } from '@app-core/components/echarts/echarts.module';

@NgModule({
	imports: [
		CharactersRoutingModule,

		ThemeModule,
		NbCardModule,
		ReactiveFormsModule,
		NbSelectModule,
		NbButtonModule,
		NbSpinnerModule,
		NbIconModule,
		BsDropdownModule.forRoot(),

		EchartsModule,
	],
	declarations: [
		// Story addition
		CharactersComponent,
		CharacterComponent,
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
export class CharactersModule {
}
