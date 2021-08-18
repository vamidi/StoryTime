// Will grow overtime
import { TableTemplate } from '@app-core/data/state/tables';
import { ProxyObject } from '@app-core/data/base';
import { Pair } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import { Data as VisualNEData } from 'visualne/types/core/data';
import { KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';
import { IVersion, PipelineAsset } from '@app-core/interfaces/pipelines.interface';

export interface IDialogue extends ProxyObject
{
	characterId: number,
	nextId: number,
	parentId: number,
	text: KeyLanguageObject,
}

export interface IDialogueOption extends ProxyObject
{
	childId: number,
	parentId: number,
	text: KeyLanguageObject,
}

export interface IStory extends ProxyObject
{
	parentId: number; 					// character ID
	childId: number; 					// dialogue start node
	description: KeyLanguageObject; 	// description of the story
	title: KeyLanguageObject;			// title of the story
	typeId: number, 					// type of quest it is main story or somethings different, the player decide.
	taskId: number,						// Where the first task is.
}

export interface IStoryData
{
	storyId: number,
	data: VisualNEData,
}

export interface ICharacter extends ProxyObject
{
	name: KeyLanguageObject;
	description: KeyLanguageObject;
	class: number,
	initialLevel: number,
	maxLevel: number,
}

export interface IItem extends ProxyObject
{
	description: KeyLanguageObject,
	effectPrimaryValue: number,
	effectTypeId: number,
	name: KeyLanguageObject,
	sellValue: number,
	sellable: boolean,
	typeId: number, /** @type IItemType */
}

export interface ICraftable extends ProxyObject
{
	childId: number,
	parentId: number,
	shopRevisionId: number,
	value: number,
}

export interface ICraftCondition extends ProxyObject
{
	amount: number,
	childId: number,
	parentId: number,
}

export interface IEventInput
{
	paramName: string,
	defaultValue: any;
	value: any;
}

export interface IEvent extends ProxyObject
{
	name: string, // name of the event
	owner: string, // creator of the event
}

export interface ICharacterClass extends ProxyObject
{
	className: string, // Class name -  Name of the class.
	expCurve: string, // - Exp curve - How fast this class can evolve.
}

export interface IItemInventoryType extends ProxyObject
{
	// Recipe,
	// Utensil,
	// Ingredient,
	// Customisation,
	// Dish,
	name: KeyLanguageObject, // the name of the type --> recipe, utensil, ingredient etc.
}

export interface IItemInventoryActionType extends ProxyObject
{
	// Cook,
	// Craft,
	// Use,
	// Equip,
	// DoNothing
	name: KeyLanguageObject, // The type of action for in the inventory
}

export interface IITemTabType extends ProxyObject
{
	// None,
	// Customization --> Character customization
	// Artifacts --> Accessories to boost the character
	// Upgrades --> Upgrade materials to level up items.
	// FoodItems --> Items that can be consumed
	// Recipes --> Crafting or cooking recipes
	// Materials --> Gadgets that can be used to activate something
	// Stories --> Items that the player needs to use.
	name: KeyLanguageObject, // the name of the type

}

export interface IInventoryTabType extends ProxyObject
{
	name: KeyLanguageObject, // the name of the tab.
	description: KeyLanguageObject,
	slotCount: number, // the amount of items it can carry.
	type: number, /** @type IITemTabType */
}

/**
 * @brief - represent a group for the items.
 */
export interface IItemType extends ProxyObject
{
	name: KeyLanguageObject, // item name type --> armor, sword
	actionName: KeyLanguageObject, // the action name we show when interacting with an item.
	actionType: number, /** @type IItemInventoryActionType --> the kind of action to perform in the inventory. */
	type: number, /** @type IItemInventoryType --> The type what the item represent in the inventory */
}

export const standardTablesDescription: Map<string, string> = new Map<string, string>([
	Pair('classes', 'Defines the classes a character can have in the game.'),
	Pair('itemTypes', 'Represents group for the items'),
]);

export const standardTables: Map<string, TableTemplate> = new Map<string, TableTemplate>([
	// Dialogues
	Pair<string, { [key: number]: IDialogue }>('dialogues',{
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
		},
	}),
	// Items
	Pair<string, { [key: number]: IItem }>( 'items', 	{
		0: {
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

			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// characters
	Pair<string, { [key: number]: ICharacter }>( 'characters', 	{
		0: {
			class: Number.MAX_SAFE_INTEGER,
			deleted: false,
			name: {
				'en': '',
			},
			description: {
				'en': '',
			},
			initialLevel: 0,
			maxLevel: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// Dialogue Options
	Pair<string, { [key: number]: IDialogueOption }>( 'dialogueOptions', 	{
		0: {
			deleted: false,
			childId: 0,
			parentId: 0,
			text: {
				'en': '',
			},
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
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
		},
	}),
	// QuestTypes
	Pair( 'questTypes', 	{
		0: {
			deleted: false,
			name: 'Main',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			deleted: false,
			name: 'Sub',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	Pair('nonPlayableCharacters', {
		0: {
			deleted: false,
			name: 'A NPC',
			description: 'Just a plain non playable character',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// Reward types
	Pair('rewardTypes', {
		0: {
			deleted: false,
			name: 'None',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
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
		},
	}),
	// Stories / Quests
	// Stories does not need to contain a quest.
	Pair<string, { [key: number]: IStory }>( 'stories',{
		0: {
			deleted: false,
			childId: 0, 						// the dialogue is will start
			description: {
				'en': '',
			}, 									// description what the player will face in the quest
			parentId: 0, 						// the character that we can grab from the character table.
			title: {
				'en': '',
			}, 									// the title of the quest
			typeId: 0, 							// type of quest it is main story or somethings different, the player decide.
			taskId: Number.MAX_SAFE_INTEGER,	// Where the first task is.
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
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
			description: {
				en: '',
			},
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
		},
	}),
	// Task completion types
	Pair('taskCompletionTypes', {
		0: {
			deleted: false,
			name: 'Collect',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			deleted: false,
			name: 'Defeat',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		2: {
			deleted: false,
			name: 'Talk',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		3: {
			deleted: false,
			name: 'Collect',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		4: {
			deleted: false,
			name: 'Interact',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		5: {
			deleted: false,
			name: 'Defend',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
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
		},
	}),
	// Effect types
	Pair( 'effectTypes', 	{
		0: {
			deleted: false,
			name: 'None',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
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
		},
	}),
	// Shop craftables
	Pair<string, { [key:string]: ICraftable }>( 'shopCraftables', 	{
		0: {
			deleted: false,
			childId: 0,
			parentId: 0,
			shopRevisionId: 0,
			value: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// Shop craft conditions
	Pair<string, { [key:string]: ICraftCondition }>( 'shopCraftConditions', {
		0: {
			deleted: false,
			amount: 0,
			childId: 0,
			parentId: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
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
		},
	}),
	// Enemy categories
	Pair( 'enemyCategories', {
		0: {
			deleted: false,
			name: '',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: IEvent }>('events', {
		0: {
			name: '', // name of the event
			owner: '', // creator of the event

			inputs: [],

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: ICharacterClass }>( 'classes', {
		0: {
			className: '',
			expCurve: '',

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: IITemTabType }>('itemTabTypes', {
		0: {
			name: {
				en: 'None',
			},

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),


	Pair<string, { [key: number]: IInventoryTabType }>('inventoryTabs', {
		0: {
			name: {
				en: 'None',
			},
			description: {
				en: 'No definition for the tab',
			},
			slotCount: 0,
			type: Number.MAX_SAFE_INTEGER,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: IItemType }>('itemTypes', {
		0: {
			name: {
				en: 'Sword',
			},
			actionName: {
				en: '',
			},
			actionType: Number.MAX_SAFE_INTEGER,
			type: Number.MAX_SAFE_INTEGER,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			name: {
				en: 'Shield',
			},
			actionName: {
				en: '',
			},
			actionType: Number.MAX_SAFE_INTEGER,
			type: Number.MAX_SAFE_INTEGER,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		2: {
			name: {
				en: 'Armor',
			},
			actionName: {
				en: '',
			},
			actionType: Number.MAX_SAFE_INTEGER,
			type: Number.MAX_SAFE_INTEGER,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: IItemInventoryActionType }>('inventoryActions', {
		0: {
			name: {
				en: 'Do Nothing',
			},
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			name: {
				en: 'Cook',
			},
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		2: {
			name: {
				en: 'Craft',
			},
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		3: {
			name: {
				en: 'Use',
			},
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		4: {
			name: {
				en: 'Equip',
			},
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	/** @brief Add more to generate automatically. **/
]);
