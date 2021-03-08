import { Component } from '@angular/core';

@Component({
	selector: 'ngx-split-view-columns-layout',
	styleUrls: ['./split-view-columns.layout.scss'],
	template: `
		<nb-layout windowMode>
			<nb-layout-column>
				<ng-content select="ngx-node-editor"></ng-content>
			</nb-layout-column>
		</nb-layout>
	`,
})
export class SplitViewColumnsLayoutComponent
{
}
