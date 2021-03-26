import { Injectable } from '@angular/core';
import { IPipelineSchedule, PipelineAsset } from '@app-core/interfaces/pipelines.interface';
import { environment } from '../../../environments/environment';
import { UtilsService } from '@app-core/utils/utils.service';

/**
 * @brief - Options that we can provide to include
 * letters or extra zeros
 */
interface SchedulerOptions { lexicographical: boolean, zeroExtend: boolean }

/**
 * @brief - Scheduler Service that runs pipelines
 * that manipulates data from Firebase.
 * This way we don't have to update Firebase objects manually.
 */
@Injectable()
export class PipelineService
{
	/**
	 * @brief - Schedules
	 */
	schedules: Map<string, IPipelineSchedule> = new Map<string, IPipelineSchedule>();

	/**
	 * @brief - Add Schedule to the scheduler
	 * @param schedule
	 * @constructor
	 */
	public addSchedule(schedule: IPipelineSchedule): void
	{
		this.schedules.set(schedule.name, schedule);
	}

	/**
	 * @brief - Run through all the schedules and items.
	 * and perform the action defined in the schedule.
	 */
	public run(name: string)
	{
		if(!this.schedules.has(name))
		{
			if(environment.production)
				throw new Error('Scheduler not found, did you add it to the service?');

			UtilsService.onError('Scheduler not found, did you add it to the service?');
			return;
		}
		const schedule = this.schedules.get(name);

		if(schedule.items === null || typeof schedule.items === 'undefined') {
			if(environment.production)
				throw new Error('Scheduler has no items. please add items to the scheduler');

			UtilsService.onError('Scheduler has no items. please add items to the scheduler');
			return;
		}

		UtilsService.onDebug(`Running schedule ${schedule.name}`);
		schedule.items.forEach((v: PipelineAsset, key, a) =>
		{
			// 0 if the versions are equal
			// a negative integer if v1 < v2
			// a positive integer if v1 > v2
			// NaN if either version string is in the wrong format
			const compare: number = v.metadata.hasOwnProperty('version') ?
				this.versionCompare(
				`${v.metadata?.version.major}.${v.metadata?.version.minor}.${v.metadata?.version.patch}`,
				`${environment.MAJOR}.${environment.MINOR}.${environment.PATCH}`,
				)
			: NaN;
			if(isNaN(compare) || compare) schedule.resolve(schedule.callbackFn(v, key, a), v, key);
		});
		UtilsService.onDebug(`Schedule finished`);
	}

	/**
	 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
	 *
	 * This function was born in http://stackoverflow.com/a/6832721.
	 *
	 * @param {string} v1 The first version to be compared.
	 * @param {string} v2 The second version to be compared.
	 * @param {object} [options] Optional flags that affect comparison behavior:
	 * <ul>
	 *     <li>
	 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
	 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
	 *         "1.2".
	 *     </li>
	 *     <li>
	 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
	 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
	 *     </li>
	 * </ul>
	 * @returns {number|NaN}
	 * <ul>
	 *    <li>0 if the versions are equal</li>
	 *    <li>a negative integer iff v1 < v2</li>
	 *    <li>a positive integer iff v1 > v2</li>
	 *    <li>NaN if either version string is in the wrong format</li>
	 * </ul>
	 *
	 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
	 * @license This function is in the public domain. Do what you want with it, no strings attached.
	*/
	private versionCompare(v1: string, v2: string, options: SchedulerOptions = null): number
	{
		const lexicographical = options && options.lexicographical,
			zeroExtend = options && options.zeroExtend;

		let v1parts: string[] | number[] = v1.split('.'),
			v2parts: string[] | number[] = v2.split('.');

		const isValidPart = (x: string) => (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);

		if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
			return NaN;
		}

		if (zeroExtend) {
			while (v1parts.length < v2parts.length) v1parts.push('0');
			while (v2parts.length < v1parts.length) v2parts.push('0');
		}

		if (!lexicographical) {
			v1parts = v1parts.map(Number);
			v2parts = v2parts.map(Number);
		}

		for (let i = 0; i < v1parts.length; ++i)
		{
			if (v1parts[i] === v2parts[i]) {
				continue;
			}

			if (v2parts.length === i) {
				return 1; // v1 > v2
			}
			else return v1parts[i] > v2parts[i] ? 1 : -1; // if 1 v1 > v2 if -1 v1 < v2
		}

		if (v1parts.length !== v2parts.length)
			return -1; // v1 < v2

		// versions are equal
		return 0;
	}
}
