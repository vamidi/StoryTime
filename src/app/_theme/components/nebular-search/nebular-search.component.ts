import { Component, EventEmitter, Output } from '@angular/core';

@Component({
	selector: 'ngx-nebular-search',
	styleUrls: ['./nebular-search.component.scss'],
	template: `
		<div class="form-group">
			<input id="typeahead-basic" type="text" class="form-control" nbInput fullWidth /> <!--  [ngxTypeAhead]="search" -->
		</div>
	`,
})
export class NbSearchComponent
{
	@Output() search: EventEmitter<string> = new EventEmitter<string>();
}
