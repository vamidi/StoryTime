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
	 * @brief - Items that are going to be manipulated
	 */
	items: Map<string, T>;

	/**
	 * @see {PipelineService}
	 * @brief - function we are going to call in the scheduler
	 * @param v
	 * @param idx
	 * @param array
	 */
	callbackFn: (v: T, key: string, map: Map<string, T>) => boolean;

	/**
	 * @brief - Force the change even when the version is the same.
	 */
	force: boolean;

	resolve: (dirty: boolean, project: T, key: string) => void;
}


