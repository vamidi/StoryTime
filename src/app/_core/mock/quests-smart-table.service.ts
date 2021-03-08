import { Injectable } from '@angular/core';
import { SmartTableService } from './smart-table.service';

export class QuestRow
{
	id: number;
	name: string;
	type: string;
	active: boolean;
	completed: boolean;
	item: string;
	zone: string;
	collected: boolean;
	money_amount: number;
	exp: number;
	enabled: boolean;
	chain: string;
	chain_counter: number;
	tstamp: number;
	deleted: boolean;
}

@Injectable()
export class QuestsSmartTableService extends SmartTableService<QuestRow>
{

}

