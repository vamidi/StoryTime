export class Factory
{
	create<T>(type: (new (d: any) => T), data: any ): T
	{
		return new type(data);
	}
}
