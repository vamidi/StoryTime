import { Injectable } from '@angular/core';
import { KeyValue } from '@angular/common';
import {
	FirebaseService,
	RelationDictionary,
	RelationPair,
} from '@app-core/utils/firebase/firebase.service';
import { StringPair } from '@app-core/data/base/string-pair.class';
import { Pair } from '@app-core/functions/helper.functions';
import { NbToastrService } from '@nebular/theme';

/**
 * TODO You can create a new table in those you can make settings to say what it is.
 * it will make you enable cards as a first page and then link the children.
 * in those children you can therefore see the overview.
 *
 * for example make table Quests
 * --> children are Tasks
 * --> Tasks can have multiple relation with other tables.
 *
 * So we can create a map. in consists of TableName. this name is link to children can be multiple.
 * those children can have multiple relations with other tables.
 */

// NOTE map with key for tblName, value for map with colName and relation as value
// export declare type RelationPair = Map<string, StringPair>; // key, value
// export declare type RelationDictionary = Map<string, RelationPair>; // tblName, relation pair

/**
 * @brief this child relation interface is for
 * tables that are either associated with the table or
 * a child of the table.
 *
 * The key represent the table name.
 * The value represent the associated column names
 */
export interface AssociatedRelation extends KeyValue<string, StringPair>
{
	// Table name
	key: string;
	// Column relation links
	value: StringPair;
}

export class TableRelation
{
	// quests --> parent
	// tasks --> associated
	// parentId, childId --> child
	// tasksEvents --> associated
	public tableName: string = '';
	public associatedTable: KeyValue<string, string[]>;

	public children: StringPair[];
	public associated: AssociatedRelation[];

	public constructor(
		tblName: string, associated: { key: string, value: string[] },
		children: StringPair[], associatedTables: AssociatedRelation[])
	{
		this.tableName = tblName;
		this.associatedTable = associated;
		this.children = children;
		this.associated = associatedTables;
	}
}

@Injectable({ providedIn: 'root' })
export class FirebaseRelationService
{
	protected static relationshipContainer: RelationDictionary<RelationPair>;

	// TODO Find a way to link tables together
	protected static tableRelationshipContainer: RelationDictionary<TableRelation>;

	/**
	 * @brief - See if we can edit the relations
	 * @param table
	 * @param column
	 */
	public isEditable(table: string, column: string)
	{
		const container: RelationPair = FirebaseRelationService.relationshipContainer.get(table);

		let val: StringPair | null = null;
		if(container && container.has(column))
			val = container.get(column);

		return val ? !val.locked : true;
	}

	constructor(
		protected toastrService: NbToastrService,
		protected firebaseService: FirebaseService,
	)
	{
		/**
		 * @brief column name to find for relation, table where to find it, column name
		 *
		 */

		/* Dialogue System */
		const dialogueCharacterStoryDialogues: RelationPair = new Map([
			Pair('characterId', new StringPair('characters', 'name', true)),
			Pair('parentId', new StringPair('stories', 'title', true)),
			Pair('nextId', new StringPair('dialogues', 'text', true)),
		]);

		const dialogueOptionDialogues: RelationPair = new Map([
			Pair('parentId', new StringPair('dialogues', 'text', true)),
			Pair('childId', new StringPair('dialogues', 'text', true)),
		]);

		const dialogueQuests: RelationPair = new Map([
			Pair('acceptDialogueId', new StringPair('dialogues', 'text', true)),
			Pair('denyDialogueId', new StringPair('dialogues', 'text', true)),
		]);

		const dialogueEvents: RelationPair = new Map([
			Pair('dialogueId', new StringPair('dialogues', 'text', true)),
		]);

		const characters: RelationPair = new Map([
			Pair('class', new StringPair('classes', 'className', true)),
		]);

		const storyCharacterDialogues: RelationPair = new Map([
			Pair('parentId', new StringPair('characters', 'name', true)),
			Pair('childId', new StringPair('dialogues', 'text', true)),
			Pair('typeId', new StringPair('questTypes', 'name', true)),
			Pair('taskId', new StringPair('tasks', 'description', true)),
		]);

		/* Quest System */
		const questQuestTypes: RelationPair = new Map([
			Pair('childId', new StringPair('tasks', 'description', true)),
			Pair('typeId', new StringPair('questTypes', 'name', true)),
		]);

		const questEvents: RelationPair = new Map([
			Pair('questId', new StringPair('quests', 'title', true)),
		]);

		const taskQuestTaskCompletionTypeTasks: RelationPair = new Map([
			Pair('parentId', new StringPair('stories', 'title', true)),
			Pair('typeId', new StringPair('taskCompletionTypes', 'name', true)),
			Pair('nextId', new StringPair('tasks', 'description', true)),
			Pair('npc', new StringPair('nonPlayableCharacters', 'name', true)),
			Pair('enemyCategory', new StringPair('enemyCategories', 'name', true)),
		]);

		const taskEvents: RelationPair = new Map([
			Pair('taskId', new StringPair('tasks', 'description', true)),
		]);

		/* Enemy System */
		const enemies: RelationPair = new Map([
			Pair('category', new StringPair('enemyCategories', 'name', true)),
		]);

		const equipments: RelationPair = new Map([
			Pair('characterId', new StringPair('characters', 'name', true)),
			Pair('equipment', new StringPair('items', 'name', true)),
			Pair('typeId', new StringPair('itemTypes', 'name', true)),
		]);

		const parameterCurves: RelationPair = new Map([
			Pair('classId', new StringPair('classes', 'className', true)),
		]);

		/* Shop System */
		const shopCharacter: RelationPair = new Map([
			Pair('parentId', new StringPair('characters', 'name', true)),
		]);

		const shopPricesShopItems: RelationPair = new Map([
			Pair('parentId', new StringPair('shops', 'name', true)),
			Pair('childId', new StringPair('items', 'name', true)),
		]);

		const shopCraftablesShopItem: RelationPair = new Map([
			Pair('parentId', new StringPair('shops', 'name', true)),
			Pair('childId', new StringPair('items', 'name', true)),
		]);

		const shopCraftConditionsShopCraftablesitems: RelationPair = new Map([
			// TODO this should be link to a deeper connection
			Pair('parentId', new StringPair('shopCraftables', 'childId', true)),
			Pair('childId', new StringPair('items', 'name', true)),
		]);

		const skills: RelationPair = new Map([
			Pair('classId', new StringPair('classes', 'className', true)),
		]);

		const itemEffectTypeItemTypes: RelationPair = new Map([
			Pair('effectTypeId', new StringPair('effectTypes', 'name', true)),
			Pair('typeId', new StringPair('itemTypes', 'name', true)),
		]);

		const recipes: RelationPair = new Map([
			Pair('parentId', new StringPair('characters', 'name', true)),
			Pair('childId', new StringPair('items', 'name', true)),
		]);

		const recipesCraftCondition: RelationPair = new Map([
			// TODO this should be link to a deeper connection
			Pair('parentId', new StringPair('items', 'name', true)),
			Pair('childId', new StringPair('items', 'name', true)),
		]);

		FirebaseRelationService.relationshipContainer = new Map([
			Pair('dialogues', dialogueCharacterStoryDialogues ),
			Pair('dialogueOptions', dialogueOptionDialogues),
			Pair('dialogueQuests', dialogueQuests),
			Pair('dialogueEvents', dialogueEvents),

			Pair('characters', characters),

			Pair('items', itemEffectTypeItemTypes),

			Pair('enemies', enemies),
			Pair('equipments', equipments),

			Pair('parameterCurves', parameterCurves),

			Pair('quests', questQuestTypes),
			Pair('questEvents', questEvents),

			Pair('recipes', recipes),
			Pair('recipeCraftConditions', recipesCraftCondition),

			Pair('shops', shopCharacter),
			Pair('stories', storyCharacterDialogues),
			Pair('shopPrices', shopPricesShopItems),
			Pair('shopCraftables', shopCraftablesShopItem),
			Pair('shopCraftConditions', shopCraftConditionsShopCraftablesitems),
			Pair('skills', skills),

			Pair('tasks', taskQuestTaskCompletionTypeTasks),
			Pair('taskEvents', taskEvents),
		]);

		const questTableRelation: TableRelation = new TableRelation(
			'quests', { key: 'tasks', value: ['id', 'childId'] },
			[
				new StringPair('parentId', 'childId'),
			],
			[
				{ key: 'taskEvents', value: new StringPair('id', 'taskId') },
			],
		);

		// quests --> parent
		// tasks --> child
		// tasksEvents --> associated

		const dialoguesTableRelation: TableRelation = new TableRelation(
			'stories', { key: 'dialogues', value: ['id', 'childId'] },
			[
					new StringPair('parentId', 'childId'),
			],
			[
				{ key: 'dialogueOptions', value: new StringPair('parentId', 'childId') },
				{ key: 'dialogueEvents', value: new StringPair('id', 'dialogueId') },
			],
		);

		FirebaseRelationService.tableRelationshipContainer = new Map([
			Pair('quests', questTableRelation),
			Pair('dialogues', dialoguesTableRelation),
		]);
	}

	/**
	 * @brief - Add relation data to a collection
	 * @param table - current table name to make a relation for
	 * @param key - column key of the current table
	 * @param value - key value pair of the other table and column
	 */
	public addData(table: string, key: string, value: StringPair)
	{
		const container = FirebaseRelationService.relationshipContainer.get(table);

		if(container)
			container.set(key, value);
		else
			FirebaseRelationService.relationshipContainer.set(table, new Map([ Pair(key, value) ]));
	}

	public getData(): RelationDictionary<RelationPair>
	{
		return FirebaseRelationService.relationshipContainer;
	}

	public getTableRelationData(): RelationDictionary<TableRelation>
	{
		return FirebaseRelationService.tableRelationshipContainer;
	}
}
