import { Context, Input, Node, OnCreated, Output } from 'visualne';
import { dialogueOptionSocket, dialogueSocket } from '@app-core/components/visualne/sockets';
import { MyNodeComponent } from '@app-theme/components/visualne/node.component';
import { BaseNodeComponent } from '../base-node-component';
import { AdditionalEvents } from '@app-core/components/visualne';
import { EventsTypes } from 'visualne/types/events';

export class DialogueOptionNodeComponent extends BaseNodeComponent implements OnCreated
{
	public dialogues: any[];
	public dialogueOptions: any[];

	constructor()
	{
		super('Dialogue Option', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		node
			.addInput(new Input('optionIn', 'In ID [NULL]', dialogueOptionSocket))
			.addOutput(new Output('optionOut', 'Out ID [NULL]' , dialogueSocket))
	}

	public worker(node, inputs, outputs)
	{
		// get the dialogue ID
		const parentId: number = inputs['dialogueIn'] ? inputs['dialogueIn'][0] : null;
		// const parent: any = parentId !== null ? this.dialogues.find((dialogue) => dialogue.id === parentId) : null;
		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);// get the data from the control node.

		if(currentNode) {
			// get input
			const optionIn = currentNode.inputs.get('optionIn');
			const optionOut = currentNode.outputs.get('optionOut');

			if (optionIn) {
				console.log(inputs['optionIn'] !== undefined && inputs['optionIn'][0] !== undefined);
				if (inputs['optionIn'] !== undefined && inputs['optionIn'][0] !== undefined) {
					optionIn.name = 'In ID [' + inputs['optionIn'][0] + ']';
				} else
					optionIn.name = 'In ID [NULL]';
			}

			if (optionOut) {
				console.log(currentNode.data);
				const outputValue: unknown | null = currentNode.data.optionId ?? null
				const dialogueIdText: string = outputValue as string ?? 'NULL';
				optionOut.name = `Out ID [${dialogueIdText}]`;

				// send the option to the next dialogue.
				outputs['optionOut'] = outputValue as number ?? Number.MAX_SAFE_INTEGER;
			}

			currentNode.update();
		}
		/*

		// get the option object
		const currentOption: any = (outputValue !== Number.MAX_SAFE_INTEGER)
			? this.dialogueOptions.find((dialogueOption) => dialogueOption.id === outputValue) : null;

		// Adjust the output to the right id if exist
		// if we have a parentId which is from the dialogue
		if(parentId)
		{
			// if we are not already linked
			if(currentOption && currentOption.parentId !== parentId)
			{

				// change the element in the array as well
				currentOption.parentId = parentId;

				data.parentId = parentId;

				if(dialogueInput)
					dialogueInput.name = 'In ID [' + parentId + ']';

				// ctrl.onSave(this.firebaseService, parentId, parent);
				// send on save event to the editor
				// @ts-ignore
				this.editor.trigger('save', { id: node.id, func: () =>
					{ // currentOption id is the key, and the data we want to update is parentId --> new parentId
						ctrl.onSave(this.firebaseService, currentOption.id, currentOption)
					},
				});

				ctrl.setValue(data);
			}
		}
		else
		{
			// this means we have no parent anymore
			if(currentOption)
			{
				// if the option exists and the parentId is not the same as this id.
				if(currentOption.parentId !== Number.MAX_SAFE_INTEGER)
				{
					// change the element in the array as well
					currentOption.parentId = Number.MAX_SAFE_INTEGER;

					data.parentId = Number.MAX_SAFE_INTEGER;
				}

				// @ts-ignore
				this.editor.trigger('save', { id: node.id, func: () =>
					{ // currentOption id is the key, and the data we want to update is parentId --> new parentId
						ctrl.onSave(this.firebaseService, currentOption.id, currentOption)
					},
				});

				// ctrl.onSave(this.firebaseService, parent.id, parent);
			}

			ctrl.setValue(data);
		}

		// if the output has been disconnected
		if(currentOption) // do we have an option
		{
			const output = currentNode.outputs.get('optionOut');
			// if we have a connection
			if(output.connections.length !== 0)
			{
				const connection = output.connections[0];
				const nodeData: any = connection.input.node.data;
				let dialogueId;
				if(nodeData.hasOwnProperty('DialogueControlOut'))
				{
					dialogueId = nodeData.DialogueControlOut.hasOwnProperty('dialogueId')
						? <number>nodeData.DialogueControlOut.dialogueId : Number.MAX_SAFE_INTEGER;
				}
				else
					dialogueId = Number.MAX_SAFE_INTEGER;

				// set the next dialogue id
				currentOption.childId = dialogueId;

				data.childId = dialogueId;

				// @ts-ignore
				this.editor.trigger('save', { id: node.id, func: () =>
					{ // currentOption id is the key, and the data we want to update is parentId --> new parentId
						ctrl.onSave(this.firebaseService, currentOption.id, currentOption).then(() => {
							UtilsService.showToast(
								this.toastrService,
								'Dialogue Option updated!',
								`Dialogue option ${ currentOption.id } updated!`,
							);
						});
					},
				});
			}
			else
			{
				// if were already MAX_SAFE_INTEGER
				if(currentOption.childId !== Number.MAX_SAFE_INTEGER)
				{
					currentOption.childId = Number.MAX_SAFE_INTEGER;

					data.childId = Number.MAX_SAFE_INTEGER;

					// @ts-ignore
					this.editor.trigger('save', { id: node.id, func: () =>
						{ // currentOption id is the key, and the data we want to update is parentId --> new parentId
							ctrl.onSave(this.firebaseService, currentOption.id, currentOption).then(() =>
							{
								ctrl.onSave(this.firebaseService, currentOption.id, currentOption).then(() => {
									UtilsService.showToast(
										this.toastrService,
										'Dialogue Option updated!',
										`Dialogue option ${ currentOption.id } updated!`,
									);
								});
							})
						},
					});
				}
			}

			// const input = currentNode.inputs.get('dialogueIn');
			// const connection = input.connections[0];
			// if the input is coming from a option dialogue handle things different
			// if(connection.input.key === 'optionOut')
			// 	console.log('handle Option');
			// else
			// 	this.handleDialogue(currentNode, parentId, data, ctrl);
		}

		// this.handleDialogueOption();
		 */
	}

	public onCreated(node: Node)
	{
		// @ts-ignore
		// node.data.headColor = '#bdc3c7';
		node.meta.headColor = '#3498db';

		node.update();
	}
}
