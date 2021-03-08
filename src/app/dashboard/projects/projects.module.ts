import { NgModule } from '@angular/core';
import { Ng2SmartTableModule } from '@vamidicreations/ng2-smart-table';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { VisualNEModule } from 'visualne-angular-plugin';

import { ProjectsRoutingModule } from './projects-routing.module';
import { ProjectsComponent } from './projects.component';
import { ProjectComponent } from './project/project.component';
import { RouterModule } from '@angular/router';
import { ThemeModule } from '@app-theme/theme.module';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { AvatarModule } from 'ngx-avatar';
import {
	NbAccordionModule,
	NbButtonModule,
	NbCardModule,
	NbContextMenuModule, NbDialogModule,
	NbIconModule, NbInputModule, NbLayoutModule,
	NbSelectModule,
	NbTreeGridModule,
} from '@nebular/theme';
import { UtilsService } from '@app-core/utils';

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
	NbContextMenuModule,
	Ng2SmartTableModule,
	NbLayoutModule,
	NbAccordionModule,
	NbDialogModule.forChild(),

	CommonModule,
	ReactiveFormsModule,
	RouterModule,

	ProjectsRoutingModule,

	// Third party
	VisualNEModule,
	BsDropdownModule.forRoot(),
	AvatarModule,
];

@NgModule({
	imports: [
		...LIB_MODULES,
	],
	declarations: [
		// Own Components
		ProjectsComponent,
		ProjectComponent,
	],
	providers:[
		UtilsService,
	],
})
export class ProjectsModule
{
}
