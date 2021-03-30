import { KeyValue } from '@angular/common';
import { Context, Input, Node, OnCreated, OnDestroyed, Output } from 'visualne';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';
import { EventsTypes } from 'visualne/types/events';
import { dialogueOptionSocket, dialogueSocket } from '@app-core/components/visualne/sockets';
import { MyNodeComponent } from '@app-theme/components/visualne/node.component';
import { OptionMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { BaseDialogueNodeComponent } from './base-dialogue-node-component';
import { AdditionalEvents } from '@app-core/components/visualne';

export class DialogueNodeComponent extends BaseDialogueNodeComponent implements OnCreated, OnDestroyed
{
	constructor()
	{
		super('Dialogue', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		await super.builder(node);

		if(!node.data.hasOwnProperty('options'))
			node.data.options = <OptionMap>{};

		node
			.addInput(new Input('dialogueIn', 'In ID [NULL]', dialogueSocket, false))
			.addOutput(new Output('dialogueOut', 'Out ID [NULL]' , dialogueSocket, true),
		);

		const options = Object.keys(node.data.options as OptionMap);

		options.forEach((key) =>
		{
			const option: KeyValue<number, number> = node.data.options[key];
			const output = new Output(key, 'Out ID [NULL]' , dialogueOptionSocket, false);
			output.name = `Option Out ${option.key} - [${ option.value }]`;
			node.addOutput(output);
		});
	}

	public worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs)
	{
		// Can be the dialogue Id or a option id.
		const prevId: number = inputs['dialogueIn'].length !== 0 ? <number>inputs['dialogueIn'][0] : null;

		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		if(currentNode)
		{
			const data = currentNode.data;

			// Set the out to the id of the node.
			outputs['dialogueOut'] = data.dialogueId as number ?? Number.MAX_SAFE_INTEGER;

			const dialogueOutput = currentNode.outputs.get('dialogueOut');
			if(dialogueOutput)
			{
				const dialogueIdText: string = data.dialogueId as string ?? 'NULL';
				dialogueOutput.name = `Out ID [${dialogueIdText}]`;
			}

			const ID: string = prevId !== null ? prevId.toString(10) : 'NULL';
			currentNode.inputs.get('dialogueIn').name = 'In ID [' + ID + ']';

			// get all the out options and set it in the output
			const optionMap = node.data.options as OptionMap;
			const options = Object.keys(optionMap);
			if(options.length)
			{
				options.forEach((index) => {
					const option: KeyValue<number, number> = optionMap[index];
					currentNode.outputs.get(index).name = `Option Out ${option.key} - [${ option.value }]`;
					outputs[index] = optionMap[index].value;
				});
			}

			// connections
			const input: Input = currentNode.inputs.get('dialogueIn');
			const output: Output = currentNode.outputs.get('dialogueOut');
			const inputConnected = input && input.hasConnection();
			const outputConnected = output && output.hasConnection();

			const context: Context<AdditionalEvents & EventsTypes> = this.editor;

			// console.log(inputs, outputs, input, output);
			if(input.hasConnection() || output.hasConnection())
			{
				const payload = {
					currDialogue: null,
					nextDialogue: null,
					// optionMap: null,
				}

				const inputFromOutput: Input = outputConnected ? output.connections[0].input : null;
				if(inputFromOutput)
				{
					payload.nextDialogue = inputFromOutput.node.data.dialogueId;
				}

				// we need to find out if the output connection is a option or dialogue
				// output is the previous node.
				const inOutput: Output = inputConnected ? input.connections[0].output : null;
				// are we dealing with a option
				if(inOutput && inOutput.key.includes('optionOut'))
				{
					context.trigger('saveOption', {
						fOption: prevId, fNextId: outputs['dialogueOut'],
					});
				}
				else
				{
					payload.currDialogue = outputs['dialogueOut'];
					// payload.optionMap = options.length ? optionMap : null;
				}

				// save the current node
				context.trigger('saveDialogue', payload);
			}

			// update the renderer
			currentNode.update();
		}
	}

	public onCreated(node: Node)
	{
		// @ts-ignore
		// node.data.headColor = '#bdc3c7';
		node.meta.headColor = '#2ecc71';
	}

	public onDestroyed(node: Node)
	{
	}
}
