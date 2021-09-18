import {
	ICharacter,
	ICraftable, ICraftCondition,
	IDialogue,
	IDialogueOption,
	IEvent,
	IItem,
	IStory,
} from '@app-core/data/database/interfaces';
import { UtilsService } from '@app-core/utils';

export function Pair<K, V>(k: K, v: V): readonly [K, V] { return [k, v] }

// TODO make a function that checks for new keys that are created by others.

export function createStory(): IStory
{
	return {
		title: {
			'en': '',
		},
		description: {
			'en': '',
		},
		id: -1,
		deleted: false,
		parentId: Number.MAX_SAFE_INTEGER,
		childId: Number.MAX_SAFE_INTEGER,
		typeId: Number.MAX_SAFE_INTEGER,
		taskId: Number.MAX_SAFE_INTEGER,
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
	}
}

export function createDialogue(): IDialogue
{
	return {
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
		deleted: false,
		text: {
			'en': '',
		},
		characterId: Number.MAX_SAFE_INTEGER,
		nextId: Number.MAX_SAFE_INTEGER,
		parentId: Number.MAX_SAFE_INTEGER,
	};
}

export function createDialogueOption(): IDialogueOption
{
	return {
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
		deleted: false,
		text: {
			'en': '',
		},
		childId: Number.MAX_SAFE_INTEGER,
		parentId: Number.MAX_SAFE_INTEGER,
	};
}

export function createCharacter(): ICharacter
{
	return {
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
		deleted: false,
		name: {
			'en': '',
		},
		description: {
			'en': '',
		},
		classId: Number.MAX_SAFE_INTEGER,
		initialLevel: 0,
		maxLevel: 0,
	};
}

export function createItem(): IItem
{
	return {
		deleted: false,
		effectPrimaryValue: 0,
		effectTypeId: 0,
		name: {
			'en': '',
		},
		description: {
			'en': '',
		},
		typeId: Number.MAX_SAFE_INTEGER,
		sellValue: 0,
		sellable: true,

		scope: 0,
		occasion: 0,
		speed: 0,
		successRate: 100,

		critical: false,
		dmgParameter: 0,
		dmgType: 0,
		formula: '',
		repeat: 0,
		variance: 0,

		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
	};
}

export function createCraftable(): ICraftable
{
	return {
		deleted: false,
		childId: 0,
		parentId: 0,
		shopRevisionId: 0,
		value: 0,
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
	}
}

export function createCraftCondition(): ICraftCondition
{
	return {
		deleted: false,
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,

		amount: 0,
		childId: Number.MAX_SAFE_INTEGER,
		parentId: Number.MAX_SAFE_INTEGER,
	}
}

export function createEvent(): IEvent
{
	return {
		name: '', // name of the event
		owner: '', // creator of the event

		inputs: [],

		deleted: false,
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
	}
}
