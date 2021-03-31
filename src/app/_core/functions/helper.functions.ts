import { IDialogue, IDialogueOption } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';

export function Pair<K, V>(k: K, v: V): readonly [K, V] { return [k, v] }

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
