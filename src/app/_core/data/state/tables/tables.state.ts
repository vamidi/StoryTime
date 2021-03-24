import { State } from '@ngxs/store';
import { Injectable } from '@angular/core';

import { Table } from '@app-core/data/state/tables';

export interface TableModel
{
	tables: Table[],
}

@State<TableModel>({
	name: 'tables',
})
@Injectable()
export class TablesState
{

}
