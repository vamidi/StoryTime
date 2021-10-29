import { Injectable } from '@angular/core';

import { IPipelineSchedule, PipelineAsset } from '@app-core/interfaces/pipelines.interface';
import { environment } from '../../../../environments/environment';
import { UtilsService } from '@app-core/utils';

Injectable({ providedIn: 'root'})
export class MigrationsService
{
	/**
	 * @brief - Schedules
	 */
	private readonly migrations: Map<string, IPipelineSchedule> = new Map<string, IPipelineSchedule>();

	/**
	 * @brief - Add Schedule to the scheduler
	 * @param schedule
	 * @constructor
	 */
	public addMigration(schedule: IPipelineSchedule): void
	{
		this.migrations.set(schedule.name, schedule);
	}

	public getMigration(name: string)
	{
		if(!this.migrations.has(name))
			return null;

		return this.migrations.get(name);
	}

	/**
	 * @brief - Run through all the schedules and items.
	 * and perform the action defined in the schedule.
	 */
	public async run(name: string): Promise<boolean>
	{
		if(!this.migrations.has(name))
		{
			if(environment.production)
				throw new Error('Scheduler not found, did you add it to the service?');

			UtilsService.onError('Scheduler not found, did you add it to the service?');
			return;
		}
		const schedule = this.migrations.get(name);

		if(schedule.item === null || typeof schedule.item === 'undefined') {
			if(environment.production)
				throw new Error('Scheduler has no item to process. please add data to the scheduler');

			UtilsService.onError('Scheduler has no item to process. please add data to the scheduler');
			return;
		}

		// Validate before we continue
		if(await schedule.validateFn(schedule.item))
		{
			UtilsService.onDebug(`Schedule finished. Validation returned true for ${schedule.name}`);
			// if we had nothing to do just return true.
			return false;
		}

		UtilsService.onDebug(`Running schedule ${schedule.name}`);
		const compare: number = schedule.item.metadata.hasOwnProperty('version') ?
			UtilsService.versionCompare(
				`${schedule.item.metadata?.version.major}.${schedule.item.metadata?.version.minor}.${schedule.item.metadata?.version.release}`,
				`${environment.MAJOR}.${environment.MINOR}.${environment.RELEASE}`,
				{ lexicographical: true },
			)
			: NaN;
		if(isNaN(compare) || compare) {
			UtilsService.onDebug(`Schedule is processing`);
			return schedule.callbackFn(schedule.item, schedule.args);
		}
		UtilsService.onDebug(`Schedule finished without processing`);
		// if we had nothing to do just return true.
		return false;
	}
}
