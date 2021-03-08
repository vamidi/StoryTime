import { Injectable } from '@angular/core';
import { SmartTableService } from './smart-table.service';
import { BaseRow } from '../data/base/base.class';

export class DialogueRow
{
	id: number;
	text: string;
	next: string;
	tstamp: number;
	deleted: boolean;
}

export interface DialogueOptionRow
{
	id: number;
	text: string;
	parent: string;
	next: string;
	tstamp: number;
	deleted: boolean;
}

@Injectable()
export class DialoguesSmartTableService extends SmartTableService<DialogueRow> {}

export class DialogueOptionsSmartTableService extends SmartTableService<DialogueOptionRow> {}
