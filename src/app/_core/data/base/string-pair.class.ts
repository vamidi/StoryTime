import { KeyValue } from '@angular/common';

export class StringPair implements KeyValue<string, string>
{
	key: string; // in case of Tbl relation -> key means table name
	value: string; // in case of Tbl relation -> value means column name
	locked: boolean; // in case of Tbl key, value should be locked.

	constructor(key: string, value: string, locked: boolean = false)
	{
		this.key = key;
		this.value = value;
		this.locked = locked;
	}
}
