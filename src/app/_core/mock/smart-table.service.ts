// import { Injectable } from '@angular/core';
import { SmartTableData } from '../data/smart-table';

export abstract class SmartTableService<TRow> extends SmartTableData
{
	public getData(): TRow[] { return this.data; };

	protected data: TRow[] = [];
}
