import { Base } from './base/base.class';

export class Item extends Base<Item>
{
	name?: string = '';
	description?: string = '';

	constructor(props: any)
	{
		super(props);

		if(props)
			this.assign(props);
	}

	protected assign({ name = '', description = '' }: Item)
	{
		this.name = name;
		this.description = description;
	}
}
