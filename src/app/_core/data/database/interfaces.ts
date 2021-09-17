import { ProxyObject } from '@app-core/data/base';
import { KeyLanguageObject } from '@app-core/data/state/node-editor/languages.model';
import { Data as VisualNEData } from 'visualne/types/core/data';

/** Interfaces that defines the structure for our RPG games. */

export interface IDialogue extends ProxyObject {
	characterId: number,
	nextId: number,
	parentId: number,
	text: KeyLanguageObject,
}

export interface IDialogueOption extends ProxyObject {
	childId: number,
	parentId: number,
	text: KeyLanguageObject,
}

export interface IStory extends ProxyObject {
	parentId: number; 					// character ID
	childId: number; 					// dialogue start node
	description: KeyLanguageObject; 	// description of the story
	title: KeyLanguageObject;			// title of the story
	typeId: number, 					// type of quest it is main story or somethings different, the player decide.
	taskId: number,						// Where the first task is.
}

export interface IStoryData {
	storyId: number,
	data: VisualNEData,
}

export interface ICharacter extends ProxyObject {
	name: KeyLanguageObject;        // name of the character
	description: KeyLanguageObject; // description of the character
	classId: number,                // Class of the characters
	initialLevel: number,           // Level the character starts with.
	maxLevel: number,               // Max level the character can achieve.
}

// An enemy also has stats.
export interface IEnemy extends ProxyObject {
	name: KeyLanguageObject;        // name of the enemy
	category: number,               // to which category of monster this enemy belongs to.
	exp: number,                    // amount of exp the enemy can drop.
	money: number,                  // amount of money the enemy can give.
}

/**
 * @brief - Parameters that belongs to an enemy.
 * TODO add ability to set parameter curves for enemy categories as well.
 */
export interface IEnemyParameterCurve extends IParameterCurve {
	enemyId: number, // Where the curve belongs to.
	enemyCategoryId: number, // For if we want to add curves and apply it on an enemy category
}

export interface IEnemyCategory extends ProxyObject {
	name: KeyLanguageObject,        // the name of the category,
}

export interface IItem extends ProxyObject {
	description: KeyLanguageObject,
	effectPrimaryValue: number,
	effectTypeId: number,
	name: KeyLanguageObject,
	sellValue: number,
	sellable: boolean,
	typeId: number, /** @type IItemType */
}

export interface IItemDrop extends ProxyObject
{
	enemyId: number,            // For if you want to only drop an item from a specific enemy.
	enemyCategoryId: number,    // If you want to drop items from enemy category.
	name: number,               // the name of the item -> relation to items,
	chance: boolean,            // if there should be a chance to get it.
	function: string,           // Whether we should invoke a method that does the chance calculation.
	percentage: number,         // Probability of getting the item.
}

export interface ICraftable extends ProxyObject {
	childId: number,
	parentId: number,
	shopRevisionId: number,
	value: number,
}

export interface ICraftCondition extends ProxyObject {
	amount: number,
	childId: number,
	parentId: number,
}

export interface IEventInput {
	paramName: string,
	defaultValue: any;
	value: any;
}

export interface IEvent extends ProxyObject {
	name: string, // name of the event
	owner: string, // creator of the event
}

export interface ICharacterClass extends ProxyObject {
	className: KeyLanguageObject,   // Class name -  Name of the class.
	expCurve: string,               // - Exp curve - How fast this class can evolve.
}

export interface IParameterCurve extends ProxyObject
{
	alias: string, // Key value we use for the object in the JSON.
	base: number, // base value we are going to use in our formula.
	paramName: string, // The name of the parameter,
	paramFormula: string, // formula that is going to be parsed.
	rate: number, // The rate that we are going to use in our formula, this determines the speed of growth.
	flat: number, // Flat number that we going to add to the value of the formula,
}

/**
 * @brief - Parameters that belongs to a class.
 */
export interface IClassParameterCurve extends IParameterCurve {
	classId: number, // Where the curve belongs to.
}

export interface ISkill extends ProxyObject {
	classId: number, // The class that is associated with this skill
	skillName: KeyLanguageObject, // The name of the skill
	level: 0, // The level requirement of the skill
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
}

export interface IItemInventoryType extends ProxyObject {
	// Recipe,
	// Utensil,
	// Ingredient,
	// Customisation,
	// Dish,
	name: KeyLanguageObject, // the name of the type --> recipe, utensil, ingredient etc.
}

export interface IItemInventoryActionType extends ProxyObject {
	// Cook,
	// Craft,
	// Use,
	// Equip,
	// DoNothing
	name: KeyLanguageObject, // The type of action for in the inventory
}

export interface IITemTabType extends ProxyObject {
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

export interface IInventoryTabType extends ProxyObject {
	name: KeyLanguageObject, // the name of the tab.
	description: KeyLanguageObject,
	slotCount: number, // the amount of items it can carry.
	type: number, /** @type IITemTabType */
}

/**
 * @brief - represent a group for the items.
 */
export interface IItemType extends ProxyObject {
	name: KeyLanguageObject, // item name type --> armor, sword
	actionName: KeyLanguageObject, // the action name we show when interacting with an item.
	actionType: number,
	/** @type IItemInventoryActionType --> the kind of action to perform in the inventory. */
	type: number, /** @type IItemInventoryType --> The type what the item represent in the inventory */
}

export interface IEquipment extends ProxyObject {
	characterId: number,
	/** @type ICharacter - The character that is linked to this equipment. */
	equipment: number,
	/** @type IItem - The equipment of the character  */
	typeId: number, /** @type IItemType - The item type */
}
