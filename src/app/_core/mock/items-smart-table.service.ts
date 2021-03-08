import { Injectable } from '@angular/core';
import { SmartTableService } from './smart-table.service';

export interface ItemRow
{
	id: number;
	name: string;
	description: string;
	tstamp: string
	deleted: boolean;
}

@Injectable()
export class ItemsSmartTableService extends SmartTableService<ItemRow> {}
