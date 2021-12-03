export interface ProxyObject {
	id?: number;
	deleted: boolean;
	created_at: Object,
	updated_at: Object,
	[key: string]: any;
}

export abstract class Base<TBase>
{
	public id?: number;
	public tstamp?: number = 0;
	public deleted?: boolean = false;

	static find(tClass: any, id: number): any | null
	{
		if(Base.empty(tClass)) return null;

		const foundQuest = tClass.filter((r: any) => r.id === id );

		if(Base.empty(foundQuest)) return null;

		return foundQuest[0];
	}

	static empty(tClass: any) { return tClass.length === 0; }

	protected constructor(
		{id = Number.MAX_SAFE_INTEGER, tstamp = 0, deleted = false }: { id: number, tstamp: number, deleted: boolean },
	)
	{
		this.id = <number>id;
		this.tstamp = tstamp;
		this.deleted = deleted;
	}

	protected abstract assign(data: TBase);
}

export interface BaseResponse
{
	key: number,
	payload: ProxyObject;
}

export abstract class BaseRow
{
	public id: number = Number.MAX_SAFE_INTEGER;
	public tstamp: number = 0;
	public deleted: boolean = false;

	private columns: any[] = [];

	protected constructor({ id, tstamp, deleted }: any)
	{
		this.id = id;
		this.tstamp = tstamp;
		this.deleted = deleted;
	}
}

export interface BaseModel {
	created_at: number;
	updated_at: number;
}
