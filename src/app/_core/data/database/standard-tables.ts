// Will grow overtime
import { TableTemplate } from '@app-core/data/state/tables';
import { Pair } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import {
	ICharacter, ICharacterClass, IClassParameterCurve,
	ICraftable, ICraftCondition,
	IDialogue,
	IDialogueOption, IEnemy, IEnemyParameterCurve, IEquipment, IEvent, IInventoryTabType,
	IItem,
	IItemDrop, IItemInventoryActionType, IITemTabType, IItemType, ISkill,
	IStory,
} from '@app-core/data/database/interfaces';

export const standardTablesDescription: Map<string, string> = new Map<string, string>([
	Pair('classes', 'Defines the classes a character can have in the game.'),
	Pair('itemTypes', 'Represents group for the items'),
]);

export const standardTables: Map<string, TableTemplate> = new Map<string, TableTemplate>([
	// Dialogues
	Pair<string, { [key: number]: IDialogue }>('dialogues', {
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
	Pair<string, { [key: number]: IItem }>('items', {
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
	// Item drops
	Pair<string, { [key: number]: IItemDrop }>('itemDrops', {
		0: {
			chance: false,
			deleted: false,
			enemyId: Number.MAX_SAFE_INTEGER,
			enemyCategoryId: Number.MAX_SAFE_INTEGER,
			function: '',
			name: Number.MAX_SAFE_INTEGER,
			percentage: 100,

			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// characters
	Pair<string, { [key: number]: ICharacter }>('characters', {
		0: {
			classId: Number.MAX_SAFE_INTEGER,
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
	Pair<string, { [key: number]: IDialogueOption }>('dialogueOptions', {
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
	Pair('dialogueOptionEvents', {
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
	Pair('questTypes', {
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
	Pair('questEvents', {
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
	Pair<string, { [key: number]: IStory }>('stories', {
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
	Pair('Tasks', {
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
	Pair('taskEvents', {
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
	Pair('effectTypes', {
		0: {
			deleted: false,
			name: 'None',
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// Shops
	Pair('shops', {
		0: {
			deleted: false,
			name: '',
			parentId: 0,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// Shop craftables
	Pair<string, { [key: number]: ICraftable }>('shopCraftables', {
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
	Pair<string, { [key: number]: ICraftCondition }>('shopCraftConditions', {
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
	Pair<string, { [key: number]: IEnemy }>('enemies', {
		0: {
			deleted: false,
			name: {
				en: '',
			},
			category: 0,
			exp: 0,
			money: 0,

			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
	// Enemy categories
	Pair('enemyCategories', {
		0: {
			deleted: false,
			name: {
				en: '',
			},
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

	Pair<string, { [key: number]: ICharacterClass }>('classes', {
		0: {
			className: {
				en: '',
			},
			expCurve: '',

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	/**
	 * @brief - Parameter curves
	 * This can either belong to a class or an enemy.
 	 */
	Pair<string, { [key: number]: IClassParameterCurve | IEnemyParameterCurve }>('parameterCurves', {
		0: {
			alias: 'MP',
			base: 65,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: 'Magic Points',
			paramFormula: 'base + (level * level * 6 / 105) + level * 12 * (rate - flat)',
			rate: 0.12,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			alias: 'ATK',
			base: 160,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: 'Attack',
			paramFormula: 'level * base + level * level * level * rate',
			rate: 0.1149999,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		2: {
			alias: 'HP',
			base: 540,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: 'Health Points',
			paramFormula: 'level * base + level * level * level * rate',
			rate: 0.1109999,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		3: {
			alias: 'DEF',
			base: 140,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: 'Defense',
			paramFormula: 'level * base + level * level * level * rate',
			rate: 0.1129999,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: ISkill }>('skills', {
		0: {
			classId: Number.MAX_SAFE_INTEGER,
			skillName: {
				en: '',
			},
			level: 0,
			description: {
				en: '', // Description of the skill in game.
			},
			skillType: 0, // type of the skill
			scope: 0, // Turn based only, but this is for how many enemies we can attack.
			occasion: 0, // When/where we can use the skill.
			speed: 0, // basically priorities how quick the player can attack with this skill.
			successRate: 0, // The success rate of the attack in %.
			repeat: 0, // How many times you repeat the moves.

			dmgType: 0, // What kind of damage is this. elemental or physical.
			formula: '', // Formula we use for when we use this skill.
			variance: 0, // how much % off -/+ we can be from the final result when calculated the dmg.
			critical: 0, // See if this has a chance of hitting critical.

			note: '', // Notes that designer can leave behind.

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

	Pair<string, { [key: number]: IEquipment }>('equipments', {
		0: {
			characterId: Number.MAX_SAFE_INTEGER,
			equipment: Number.MAX_SAFE_INTEGER,
			typeId: Number.MAX_SAFE_INTEGER,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	/** @brief Add more to generate automatically. **/
]);
