import { Base } from './base/base.class';

export class Dialogue extends Base<Dialogue>
{
	text?: string = '';
	prev?: Dialogue = null;
	characterId?: number = null;

	constructor(props: any = {})
	{
		super(props);

		if(props)
			this.assign(props);
	}

	protected assign({ text = '', characterId = Number.MAX_SAFE_INTEGER, prev= null }: any)
	{
		this.text = text;
		this.characterId = characterId;
		this.prev = prev;
	}
}

export class DialogueOption extends Base<DialogueOption>
{
	text?: string = '';
	parent?: Dialogue = null;
	next?: Dialogue = null;

	constructor(props: any = {})
	{
		super(props);

		if(props)
			this.assign(props);
	}

	protected assign({ text = '', parent = null, next = null }: DialogueOption)
	{
		this.text = text;
		this.parent = parent;
		this.next = next;
	}
}
