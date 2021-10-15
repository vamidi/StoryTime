// Will grow overtime
import { TableTemplate } from '@app-core/data/state/tables';
import { Pair } from '@app-core/functions/helper.functions';
import { UtilsService } from '@app-core/utils';
import {
	DmgType,
	ICharacter, ICharacterClass, ICharacterEquipment, IClassParameterCurve,
	ICraftable, ICraftCondition,
	IDialogue,
	IDialogueOption, IEnemy, IEnemyActionPattern, IEnemyParameterCurve, IEquipment, IEvent, IInventoryTabType,
	IItem,
	IItemDrop, IITemTabType, IItemType, ISkill,
	IStory, NbParameterCurves, StatType,
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

			scope: 0,
			occasion: 0,
			speed: 0,
			successRate: 0,

			critical: false,
			dmgParameter: 0,
			dmgType: 0,
			formula: '',
			repeat: 0,
			variance: 0,

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
	// Enemy attack pattern
	Pair<string, { [key: number]: IEnemyActionPattern }>('enemyActionPatterns', {
		0: {
			deleted: false,

			skillId: Number.MAX_SAFE_INTEGER,
			rating: 0,
			enemyId: Number.MAX_SAFE_INTEGER,
			enemyCategoryId: Number.MAX_SAFE_INTEGER,
			conditionFunction: '',

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
	Pair<string, { [key: number]: NbParameterCurves }>('parameterCurves', {
		0: {
			alias: 'MP',
			base: 65,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: {
				en: 'Magic Points',
			},
			paramFormula: 'base + (level * level * 6 / 105) + level * 12 * (rate - flat)',
			rate: 0.12,

			statType: StatType.Flat,                // Stat addition for the user.

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			alias: 'ATK',
			base: 160,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: {
				en: 'Attack',
			},
			paramFormula: 'level * base + level * level * level * rate',
			rate: 0.1149999,

			statType: StatType.Flat,                // Stat addition for the user.

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		2: {
			alias: 'HP',
			base: 540,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: {
				en: 'Health Points',
			},
			paramFormula: 'level * base + level * level * level * rate',
			rate: 0.1109999,

			statType: StatType.Flat,                // Stat addition for the user.

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		3: {
			alias: 'DEF',
			base: 140,
			classId: Number.MAX_SAFE_INTEGER,
			flat: 0,
			paramName: {
				en: 'Defense',
			},
			paramFormula: 'level * base + level * level * level * rate',
			rate: 0.1129999,

			statType: StatType.Flat,                // Stat addition for the user.

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: ISkill }>('skills', {
		0: {
			classId: Number.MAX_SAFE_INTEGER,
			name: {
				en: '',
			},
			level: 0,
			description: {
				en: '', // Description of the skill in game.
			},

			magicCurve: Number.MAX_SAFE_INTEGER,
			magicCost: 0,

			skillType: 0,               // type of the skill
			scope: 0,                   // Turn based only, but this is for how many enemies we can attack.
			occasion: 0,                // When/where we can use the skill.
			speed: 0,                   // basically priorities how quick the player can attack with this skill.
			successRate: 0,             // The success rate of the attack in %.
			repeat: 0,                  // How many times you repeat the moves.

			dmgParameter: Number.MAX_SAFE_INTEGER,
			dmgType: DmgType.Damage,    // What kind of damage is this. elemental or physical.
			formula: '',                // Formula we use for when we use this skill.
			variance: 0,                // how much % off -/+ we can be from the final result when calculated the dmg.
			critical: false,            // See if this has a chance of hitting critical.

			note: {
				en: '',
			},                          // Notes that designer can leave behind.

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
				en: 'None',
			},
			actionType: 0,
			inventoryType: 0,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		1: {
			name: {
				en: 'Cook',
			},
			actionType: 1,
			inventoryType: 0,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		2: {
			name: {
				en: 'Craft',
			},
			actionType: 2,
			inventoryType: 2,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		3: {
			name: {
				en: 'Use',
			},
			actionType: 2,
			inventoryType: 4,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		4: {
			name: {
				en: 'Equip',
			},
			actionType: 4,
			inventoryType: 1,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),
/*
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
*/
	Pair<string, { [key: number]: IEquipment }>('equipments', {
		0: {
			name: {
				en: '',
			},
			description: {
				en: '',
			},

			categoryId: Number.MAX_SAFE_INTEGER,
			typeId: Number.MAX_SAFE_INTEGER,
			classId: Number.MAX_SAFE_INTEGER,

			sellValue: 0,                            // Sell value of the item
			sellable: false,                         // To see if the item is sellable.

			dmgParameter: Number.MAX_SAFE_INTEGER,  // Which parameter we are going to use for adding or subtracting.
			dmgType: DmgType.Damage,                // What kind of damage is this. damage, drain, recover.
			formula: '',                            // formula we are going to use for this item.
			variance: 0,                            // How off we can be when we calculate the value.

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	Pair<string, { [key: number]: ICharacterEquipment }>('characterEquipments', {
		0: {
			name: Number.MAX_SAFE_INTEGER,
			characterId: Number.MAX_SAFE_INTEGER,

			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
	}),

	/** @brief Add more to generate automatically. **/
]);
