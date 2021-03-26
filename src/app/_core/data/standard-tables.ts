// Will grow overtime
import { TableTemplate } from '@app-core/data/state/tables';
import { ProxyObject } from '@app-core/data/base';
import { Pair } from '@app-core/utils/firebase.service';
import { UtilsService } from '@app-core/utils';
import { Data as VisualNEData } from 'visualne/types/core/data';
import { environment } from '../../../environments/environment';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';

export interface IDialogue extends ProxyObject
{
	characterId: number,
	nextId: number,
	parentId: number,
	text: { [key in KeyLanguage]?: string },
}

export interface IDialogueOption extends ProxyObject
{
	childId: number,
	parentId: number,
	text: string,
}

export interface IStory extends ProxyObject
{
	parentId: number; 		// character ID
	childId: number; 		// dialogue start node
	description: string; 	// description of the story
	title: string;			// title of the story
	storyFile: string		// location of the file that describes the nodes.
	typeId: number, 		// type of quest it is main story or somethings different, the player decide.
	taskId: number,			// Where the first task is.
}

export interface IStoryData
{
	storyId: number,
	data: VisualNEData,
}

export interface ICharacter extends ProxyObject
{
	name: string;
	description: string;
}

export const standardTablesDescription: Map<string, string> = new Map<string, string>([

]);

export const standardTables: Map<string, TableTemplate> = new Map<string, TableTemplate>([
	// Dialogues
	Pair('dialogues', {
		0: {
			deleted: false,
			characterId: 0,
			nextId: 0,
			parentId: 0,
			text: {
				'en': '',
			},
			options: '',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Items
	Pair( 'items', 	{
		0: {
			deleted: false,
			effectPrimaryValue: 0,
			effectTypeId: 0,
			name: '',
			sellValue: 0,
			Sellable: true,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// characters
	Pair( 'characters', 	{
		0: {
			deleted: false,
			name: '',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Dialogue Options
	Pair( 'dialogueOptions', 	{
		0: {
			deleted: false,
			childId: 0,
			parentId: 0,
			Text: '',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Dialogue Option Events
	Pair( 'dialogueOptionEvents', 	{
		0: {
			deleted: false,
			characterId: 0,
			dialogueOptionId: 0,
			name: '',
			value: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// QuestTypes
	Pair( 'questTypes', 	{
		0: {
			deleted: false,
			name: 'Main',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
		1: {
			deleted: false,
			name: 'Sub',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	Pair('nonPlayableCharacters', {
		0: {
			deleted: false,
			name: 'A NPC',
			description: 'Just a plain non playable character',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Reward types
	Pair('rewardTypes', {
		0: {
			deleted: false,
			name: 'None',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Quest Events
	Pair( 'questEvents', 	{
		0: {
			deleted: false,
			questId: 0,
			name: '',
			value: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Stories / Quests
	// Stories does not need to contain a quest.
	Pair( 'stories',{
		0: {
			deleted: false,
			childId: 0, 						// the dialogue is will start
			description: '', 					// description what the player will face in the quest
			parentId: 0, 						// the character that we can grab from the character table.
			title: '', 							// the title of the quest
			typeId: 0, 							// type of quest it is main story or somethings different, the player decide.
			taskId: Number.MAX_SAFE_INTEGER,	// Where the first task is.
			storyFile: '',						// Location of the story file
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	/* TODO see if we need this
	Pair( 'storyEvents', 	{
		0: {
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	*/
	// Tasks
	Pair( 'Tasks', 	{
		0: {
			deleted: false,
			description: '',
			childId: 0,
			nextId: 0,
			hidden: false,
			npc: 0,
			parentId: 0,
			requiredCount: 0,
			enemyCategory: 0,
			typeId: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Task completion types
	Pair('taskCompletionTypes', {
		0: {
			deleted: false,
			name: 'Collect',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
		1: {
			deleted: false,
			name: 'Defeat',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
		2: {
			deleted: false,
			name: 'Talk',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
		3: {
			deleted: false,
			name: 'Collect',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
		4: {
			deleted: false,
			name: 'Interact',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
		5: {
			deleted: false,
			name: 'Defend',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Task events
	Pair( 'taskEvents', 	{
		0: {
			name: '',
			characterId: 0,
			taskId: 0,
			value: 0,
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Effect types
	Pair( 'effectTypes', 	{
		0: {
			deleted: false,
			name: 'None',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Shops
	Pair( 'shops', 	{
		0: {
			deleted: false,
			name: '',
			parentId: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Shop craftables
	Pair( 'shopCraftables', 	{
		0: {
			deleted: false,
			childId: 0,
			parentId: 0,
			shopRevisionId: 0,
			value: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Shop craft conditions
	Pair( 'shopCraftConditions', {
		0: {
			deleted: false,
			amount: 0,
			childId: 0,
			parentId: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Enemies
	Pair( 'enemies', {
		0: {
			deleted: false,
			name: '',
			category: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),
	// Enemy categories
	Pair( 'enemyCategories', {
		0: {
			deleted: false,
			name: '',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,

			major: environment.MAJOR,
			minor: environment.MINOR,
			patch: environment.PATCH,
		},
	}),

	/** @brief Add more to generate automatically. **/
]);
