import { EventsTypes } from 'visualne/types/events';
// import { OptionMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { IDialogue } from '@app-core/data/standard-tables';

export interface AdditionalEvents extends EventsTypes
{
	saveDialogue: {
		currDialogue: number | IDialogue, 	// The current node that contains the current dialogueId
		nextDialogue: number | null,	// The next dialogueId the node has to go to.
		// optionMap?: OptionMap, 	// the options in the current dialogue
	},
	saveOption: {
		fOption: number, // the option in the first dialogue
		fNextId: number, // the dialogue that is the nextId of the option
	}
}

export * from './controls';
export * from './nodes/number-component';
export * from './nodes/quest-editor/dialogue-node-component';
export * from './nodes/quest-editor/dialogue-option-node-component';
export * from './nodes/quest-editor/start-node-component';
