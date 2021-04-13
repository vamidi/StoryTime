import { ICharacter, IDialogue, IDialogueOption, IStory } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';

export function Pair<K, V>(k: K, v: V): readonly [K, V] { return [k, v] }

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
		storyFile: '',
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
	};
}
