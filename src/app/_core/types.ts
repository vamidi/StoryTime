export enum BehaviourType
{
	INSERT, // Insert new column
	UPDATE, // Update new column
	DELETE, // Delete column
}

export interface DebouncedFunc<T extends (...args: any[]) => any>
{
	(...args: Parameters<T>): ReturnType<T> | undefined;
	cancel(): void;
	flush(): ReturnType<T> | undefined;
}
