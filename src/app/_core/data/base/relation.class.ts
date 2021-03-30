import { FirebaseService } from '../../utils/firebase.service';
import { Observable } from 'rxjs';
import { SnapshotAction } from '@angular/fire/database';
import { BaseResponse } from '@app-core/data/base/base.class';
import { StringPair } from '@app-core/data/base/string-pair.class';
import { FirebaseRelationService } from '@app-core/utils/firebase-relation.service';
import { TablesService } from '@app-core/data/state/tables';
import { Table } from '@app-core/data/state/tables';

import * as firebase from 'firebase';

// TODO see if needed
// export enum ERenderComponent
// {
// 	ENone,
// 	EDateComponent,
// 	ETextComponent,
// }

export class TblConnection
{
	public tbl = '';
	public column = '';

	constructor(tbl1: string = '', column1: string = '')
	{
		this.tbl = tbl1;
		this.column = column1;
	}
}

/**
 * In this relationship class we want to define
 * the relationship between tables.
 */
export class Relation
{
	public relationRef: firebase.database.Reference = null;
	public relationReceiver$: Observable<SnapshotAction<BaseResponse> | Table> = null;

	public id: string;

	constructor(
		public tableId: string,
		private firebaseService: FirebaseService,
		private firebaseRelationService: FirebaseRelationService,
		private tableService: TablesService,
		public tblColumnRelation: StringPair, // second table with column name and value
	)
	{
	}

	public init(): void
	{
		if(this.tableId !== '' && this.tableId === this.tblColumnRelation.key)
		{
			this.relationReceiver$ = this.tableService.getTable$();
		}
		else
		{
			const ref = `tables/${this.tblColumnRelation.key}/`;
			this.relationRef =  this.firebaseService.getRef(ref);
			this.relationReceiver$ = this.firebaseService.getItem(this.id, `${ref}data/`).snapshotChanges();
		}


		// this.firebaseService.getRef('/').order

		// console.log('here', this.tblColumnRelation.key);
		// UtilsService.onError(`Could not find ${this.tblColumnRelation.key}`);
	}

	public getItem(id: number, key: string)
	{
		const ref = `tables/${key}/data`;
		return this.firebaseService.getItem(id, ref);
	}

	public getRelationData(tableName: string)
	{
		return this.firebaseRelationService.getData().get(tableName);
	}
}
