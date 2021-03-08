import { Base, BaseResponse, BaseRow } from './base/base.class';
import { Item } from './items';

export class Quest extends Base<Quest>
{
	name?: string = '';
	type?: string = '';
	active?: boolean = true;
	completed?: boolean = false;
	item?: Item | null = null;
	zone?: string = '';
	collected?: boolean = false;
	money_amount?: number = 0;
	exp?: number = 0;
	enabled?: boolean = true;
	chain?: Quest | null = null;
	chain_counter?: number = 0;

	public constructor(props: any = {})
	{
		super(props);

		if(props)
			this.assign(props);
	}

	protected assign(data: Quest)
	{
		this.id = data.id || -1;
		this.name = data.name || '';
		this.type = data.type || '';
		this.active = data.active || true;
		this.completed = data.completed || false;
		this.item = data.item || null;
		this.zone = data.zone || '';
		this.collected = data.collected || false;
		this.money_amount = data.money_amount || 0;
		this.exp = data.exp || 0;
		this.enabled = data.enabled || true;
		this.chain = data.chain || null;
		this.chain_counter = data.chain_counter || 0;
		this.tstamp = data.tstamp || 0;
		this.deleted = data.deleted || false;
	}
}
