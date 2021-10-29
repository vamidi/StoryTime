import { EventsTypes } from 'visualne/types/events';
// import { OptionMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { ICraftable, ICraftCondition, IDialogue, IDialogueOption, IEvent, IItem } from '@app-core/data/database/interfaces';

export interface AdditionalEvents extends EventsTypes
{
	saveDialogue: {
		currDialogue: number | IDialogue, 	// The current node that contains the current dialogueId
		nextDialogue: number | null,		// The next dialogueId the node has to go to.
		// optionMap?: OptionMap, 			// the options in the current dialogue
	},
	saveOption: {
		fOption: number | IDialogueOption, 	// the option in the current dialogue
		fNextId: number, 					// the dialogue that is the nextId of the option
	}
	saveEvent: {
		fEvent: number | IEvent,			// The current event
	},
	saveItem: {
		fItem: number | IItem,
		fCondition: number | ICraftCondition,
	}
	saveCraftable: {
		fCraftable: number[] | ICraftable,
	},
	saveCraftableLinks: {
		fItems: number[] | IItem[], 		// Items that are linked to the master.
	}
}

export * from './controls';
export * from './nodes/number-component';
export * from './nodes/story-editor/dialogue-node-component';
export * from './nodes/story-editor/dialogue-option-node-component';
export * from './nodes/story-editor/start-node-component';

export * from './nodes/item-editor/item-master-node.component';
export * from './nodes/item-editor/item-node.component';
