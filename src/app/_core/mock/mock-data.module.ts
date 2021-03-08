import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

import { QuestsSmartTableService } from './quests-smart-table.service';
import { DialogueOptionsSmartTableService, DialoguesSmartTableService } from './dialogues-smart-table.service';

const SERVICES = [
	// SmartTableService,
	QuestsSmartTableService,
	DialoguesSmartTableService,
	DialogueOptionsSmartTableService,
];

@NgModule({
	imports: [
		CommonModule,
	],
	providers: [
		...SERVICES,
	],
})
export class MockDataModule
{
	static forRoot(): ModuleWithProviders<MockDataModule>
	{
		return <ModuleWithProviders<MockDataModule>>{
			ngModule: MockDataModule,
			providers: [
				...SERVICES,
			],
		};
	}
}
