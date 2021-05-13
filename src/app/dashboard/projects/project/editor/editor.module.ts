import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
	NbAccordionModule,
	NbButtonModule,
	NbCardModule,
	NbDialogModule,
	NbIconModule,
	NbInputModule, NbLayoutModule, NbSelectComponent, NbSelectModule,
	NbTreeGridModule,
} from '@nebular/theme';
import { Ng2SmartTableModule } from '@vamidicreations/ng2-smart-table';
import { ThemeModule } from '@app-theme/theme.module';

import { EditorRoutingModule } from './editor.routing.module';

import { DynamicComponentService } from '@app-core/utils/dynamic-component.service';

import { CharactersModule } from './characters/characters.module';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { EditorComponent } from '@app-dashboard/projects/project/editor/editor.component';
import { StoryEditorComponent } from '@app-dashboard/projects/project/editor/story-editor/story-editor.component';
import { ItemEditorComponent } from '@app-dashboard/projects/project/editor/item-editor/item-editor.component';

/**
 * @brief Modules from libraries
 */
const LIB_MODULES = [
	ThemeModule,
	NbCardModule,
	NbButtonModule,
	NbSelectModule,
	NbTreeGridModule,
	NbInputModule,
	NbIconModule,
	Ng2SmartTableModule,
	NbLayoutModule,
	NbAccordionModule,
	NbDialogModule.forChild(),

	CommonModule,
	ReactiveFormsModule,
	FormsModule,
];

@NgModule({
	imports: [
		...LIB_MODULES,

		// Own modules
		EditorRoutingModule,
		CharactersModule,
	],
	declarations:[
		EditorComponent,
		StoryEditorComponent,
		ItemEditorComponent,
	],
	providers: [
		DynamicComponentService,
		FirebaseService,
	],
	entryComponents:[
		NbSelectComponent,
	],
})
export class EditorModule { }
