import {
	KeyValueChangeRecord,
	KeyValueChanges, KeyValueDiffer, KeyValueDiffers,
	Pipe,
	PipeTransform,
} from '@angular/core';
import { KeyValue } from '@angular/common';

function makeKeyValuePair<K, V>(key: K, value: V): KeyValue<K, V> {
	return {key: key, value: value};
}

@Pipe({name: 'ngxKeyValue'})
export class PairPipe implements PipeTransform
{
	constructor(private readonly differs: KeyValueDiffers) {}

	private differ!: KeyValueDiffer<any, any>;
	private keyValues: Array<KeyValue<any, any>> = [];

	transform<V>(input: null, compareFn?: (a: KeyValue<string, V>, b: KeyValue<string, V>) => number): null;
	transform<V>(
		input: Map<string, V> | ReadonlyMap<string, V>,
		compareFn?: (a: KeyValue<string, V>, b: KeyValue<string, V>) => number):
		Array<KeyValue<string, V>>;
	transform<V>(
		input: Map<string, V> |ReadonlyMap<string, V>|null,
		compareFn?: (a: KeyValue<string, V>, b: KeyValue<string, V>) => number):
		Array<KeyValue<string, V>>|null
	{
		if (!input || (!(input instanceof Map) && typeof input !== 'object')) {
			return null;
		}

		if (!this.differ) {
			// make a differ for whatever type we've been passed in
			this.differ = this.differs.find(input).create();
		}

		const differChanges: KeyValueChanges<string, V> | null = this.differ.diff(input as any);

		if (differChanges) {
			this.keyValues = [];
			differChanges.forEachItem((r: KeyValueChangeRecord<string, V>) => {
				this.keyValues.push(makeKeyValuePair(r.key, r.currentValue!));
			});
			this.keyValues.sort(compareFn);
		}

		return this.keyValues;
	}
}
