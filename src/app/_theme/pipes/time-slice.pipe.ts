/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import { Pipe, PipeTransform } from '@angular/core';
import { invalidPipeArgumentError } from '@app-theme/pipes/invalid_pipe_argument_error';

/**
 * @ngModule CommonModule
 * @description
 *
 * Creates a new `Array` or `String` containing a subset (slice) of the elements.
 *
 * @usageNotes
 *
 * All behavior is based on the expected behavior of the JavaScript API `Array.prototype.slice()`
 * and `String.prototype.slice()`.
 *
 * When operating on an `Array`, the returned `Array` is always a copy even when all
 * the elements are being returned.
 *
 * When operating on a blank value, the pipe returns the blank value.
 *
 * ### List Example
 *
 * This `ngFor` example:
 *
 * {@example common/pipes/ts/slice_pipe.ts region='SlicePipe_list'}
 *
 * produces the following:
 *
 * ```html
 * <li>b</li>
 * <li>c</li>
 * ```
 *
 * ### String Examples
 *
 * {@example common/pipes/ts/slice_pipe.ts region='SlicePipe_string'}
 *
 * @publicApi
 */

export interface TimePipe
{
	[key: string]: any;
	metadata: {
		[key: string]: any;
		created_at: number;
		updated_at: number;
	}
}

@Pipe({ name: 'timeSlice', pure: false })
export class TimeSlicePipe implements PipeTransform {
	/**
	 * @param value a list to be sliced.
	 * @param days the starting index of the subset to return:
	 *   - **a positive integer**: return the item at `start` index and all items after
	 *     in the list or string expression.
	 *   - **a negative integer**: return the item at `start` index from the end and all items after
	 *     in the list or string expression.
	 *   - **if positive and greater than the size of the expression**: return an empty list or
	 * string.
	 *   - **if negative and greater than the size of the expression**: return entire list or string.
	 */
	transform<T>(value: Iterable<T>, days: number): Array<T>;
	transform<T>(value: null|undefined, days: number): null;
	transform<T>(value: Iterable<T>|null|undefined, days: number): Array<T>|null;
	transform<T>(value: Iterable<T>|null|undefined, days: number): Array<T>|null
	{
		if (value == null) return null;

		const arrValue: T[] = Array.from(value);

		if (!this.supports(arrValue)) {
			throw invalidPipeArgumentError(TimeSlicePipe, arrValue);
		}

		const date = new Date();
		const last = new Date(date.getTime() - (days * 24 * 60 * 60 * 1000));
		return arrValue.filter((v: any) => v.metadata.updated_at > last.getTime());
	}

	private supports(obj: any): boolean {
		return typeof obj === 'string' || Array.isArray(obj);
	}
}
