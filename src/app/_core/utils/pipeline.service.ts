import { Injectable } from '@angular/core';
import { IPipelineSchedule, PipelineAsset } from '@app-core/interfaces/pipelines.interface';
import { environment } from '../../../environments/environment';
import { UtilsService } from '@app-core/utils/utils.service';

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
				UtilsService.versionCompare(
				`${v.metadata?.version.major}.${v.metadata?.version.minor}.${v.metadata?.version.release}`,
				`${environment.MAJOR}.${environment.MINOR}.${environment.RELEASE}`,
				{ lexicographical: true },
				)
			: NaN;
			if(isNaN(compare) || compare) schedule.resolve(schedule.callbackFn(v, key, a), v, key);
		});
		UtilsService.onDebug(`Schedule finished`);
	}
}
