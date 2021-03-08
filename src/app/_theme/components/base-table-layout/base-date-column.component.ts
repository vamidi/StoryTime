import { Component, OnInit } from '@angular/core';
import { ViewCell } from '@vamidicreations/ng2-smart-table';
import { UtilsService } from '@app-core/utils';

@Component({
	template: `
		{{ convertedValue }}
  	`,
})
export class DateColumnComponent implements ViewCell, OnInit
{
	public rowData: any;
	public value: string | number;
	public convertedValue: string;

	ngOnInit(): void
	{
		this.convertedValue = UtilsService.convertTimeStampToDate(+this.value);
	}
}
