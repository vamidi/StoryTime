import { KeyValue } from '@angular/common';

export interface InputOutputMap<K = number, V = number> {
	[key: string]: KeyValue<K, V>;
}
