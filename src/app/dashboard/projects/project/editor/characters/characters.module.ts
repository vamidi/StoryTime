import { NgModule } from '@angular/core';
import { CharactersComponent } from './characters-overview.component';
import { StoriesComponent } from './stories/stories.component';
import { StoryComponent } from './stories/story/story.component';
import { CharactersRoutingsModule } from './characters-routings.module';
import { ThemeModule } from '@app-theme/theme.module';
import { NbButtonModule, NbCardModule, NbIconModule, NbSelectModule, NbSpinnerModule } from '@nebular/theme';
import { NodeEditorComponent } from '@app-theme/components/firebase-table/node-editor';
import { ReactiveFormsModule } from '@angular/forms';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';

@NgModule({
	imports: [
		CharactersRoutingsModule,
		ThemeModule,
		NbCardModule,
		ReactiveFormsModule,
		NbSelectModule,
		NbButtonModule,
		NbSpinnerModule,
		NbIconModule,
		BsDropdownModule.forRoot(),
	],
	declarations: [
		// Story addition
		CharactersComponent,
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
