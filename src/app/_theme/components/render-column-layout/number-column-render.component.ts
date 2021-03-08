import { Component, OnInit } from '@angular/core';
import { DefaultEditor } from '@vamidicreations/ng2-smart-table';

@Component({
	template: `<input type=number nbInput fullWidth [(ngModel)]='this.cell.newValue'>
  `,
})

export class NumberColumnComponent extends DefaultEditor implements OnInit {
	ngOnInit()
	{
		this.cell.newValue = this.cell.getValue() === '' ? 0 : this.cell.getValue();
	}
}
