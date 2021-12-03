import { NgModule } from '@angular/core';
import { OverviewComponent } from './overview.component';
import { OverviewRoutingsModule } from './overview-routings.module';
import { ThemeModule } from '@app-theme/theme.module';
import {
	NbButtonModule,
	NbCardModule,
	NbContextMenuModule,
	NbIconModule,
	NbSelectModule,
	NbSpinnerModule,
} from '@nebular/theme';
import { ReactiveFormsModule } from '@angular/forms';
import { TableOverviewComponent } from './table-overview/table-overview.component';
import { EditorModule } from '../editor.module';
import { Ng2SmartTableModule } from '@vamidicreations/ng2-smart-table';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { TableOverviewEventsComponent } from './table-overview/table-overview-events.component';

@NgModule({
	imports: [
		ThemeModule,
		NbCardModule,
		ReactiveFormsModule,
		NbSelectModule,
		NbButtonModule,
		NbSpinnerModule,
		NbIconModule,

		Ng2SmartTableModule,

		BsDropdownModule.forRoot(),

		OverviewRoutingsModule,
		EditorModule,
		NbContextMenuModule,
	],
	declarations: [
		// OVerview addition
		OverviewComponent,
		TableOverviewComponent,
		TableOverviewEventsComponent,
	],
	/*
	entryComponents: [
		TableOverviewEventsComponent,
		InsertColumnComponent,
	],
	 */
	providers: [],
})
export class OverviewModule {
}
