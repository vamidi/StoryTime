import { Component, OnChanges, SimpleChanges } from '@angular/core';
import { NbContextMenuComponent } from '@nebular/theme';

@Component({
	selector: 'nb-context-menu',
	templateUrl: 'context-menu.component.html',
	styleUrls: [
		'context-menu.component.scss',
	],
})
export class NgxContextMenuComponent extends NbContextMenuComponent implements OnChanges
{
	public ngOnChanges(changes: SimpleChanges) {
		console.log(changes);
	}
}
