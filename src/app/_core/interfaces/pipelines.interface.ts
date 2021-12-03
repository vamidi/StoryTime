export interface IVersion
{
	//
	major: number;
	//
	minor: number;
	//
	release: string;
}

export interface PipelineAsset
{
	id?: string;
	metadata: {
		version: IVersion;
		[key: string]: any;
	}
	[key: string]: any;
}

/**
 * @brief - Runnable class that performs the updates on each object
 */
export interface IPipelineSchedule<T = PipelineAsset>
{
	/**
	 * @brief - the name of the schedule
	 */
	name: string;

	/**
	 * @
	 */
	description?: string;

	/**
	 * @brief - Items that are going to be manipulated
	 */
	item?: T;

	/**
	 * @brief - Additional data that we want to pass around
	 */
	args?: any;

	/**
	 * @see {MigrationsService}
	 * @brief - function we are going to call in the scheduler
	 * @param asset - the asset we are going to manipulate
	 */
	callbackFn: (asset: T, args?: any) => Promise<boolean>;

	rollbackFn?: (asset: T) => Promise<boolean>;

	/**
	 * @brief - validate if we need to make a change.
	 */
	validateFn: (asset: T) => Promise<boolean>;

	/**
	 * @brief - Force the change even when the version is the same.
	 */
	force: boolean;
}


