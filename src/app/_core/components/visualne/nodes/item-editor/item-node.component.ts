import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';
import { MyNodeComponent } from '@app-theme/components';
import { Context, Input, Node, Output } from 'visualne';
import { itemSocket } from '@app-core/components/visualne/sockets';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';
import { AdditionalEvents } from '@app-core/components/visualne';
import { EventsTypes } from 'visualne/types/events';


export class ItemNodeComponent extends BaseNodeComponent
{
	constructor()
	{
		super('Item', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		node.addInput(new Input('itemIn', `Item ID [NULL]`, itemSocket));
		node.addOutput(new Output('itemOut', `Item ID [NULL]`, itemSocket));
	}

	public onCreated(node: Node)
	{
		node.meta.headColor = '#2ecc71';
	}

	worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]): void
	{
		// Can be the item Id
		// const prevId: number = inputs['dialogueIn'].length !== 0 ? <number>inputs['dialogueIn'][0] : null;

		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		if(currentNode)
		{
			const data = currentNode.data;

			// Set the out to the id of the node.
			outputs['itemOut'] = data.itemId as number ?? Number.MAX_SAFE_INTEGER;

			const itemOutput = currentNode.outputs.get('itemOut');
			if(itemOutput)
			{
				const itemIdText: string = data.itemId as string ?? 'NULL';
				itemOutput.name = `Out ID [${itemIdText}]`;
			}

			// const ID: string = prevId !== null ? prevId.toString(10) : 'NULL';
			// currentNode.inputs.get('dialogueIn').name = 'In ID [' + ID + ']';

			// connections
			const input: Input = currentNode.inputs.get('itemIn');
			const output: Output = currentNode.outputs.get('itemOut');
			const outputConnected = output && output.hasConnection();

			const context: Context<AdditionalEvents & EventsTypes> = this.editor;

			// console.log(inputs, outputs);
			// console.log(input, output);
			if(input.hasConnection() || output.hasConnection())
			{
				const payload = {
					currItem: null,
					nextItem: null,
					// optionMap: null,
				}

				const inputFromOutput: Input = outputConnected ? output.connections[0].input : null;
				if(inputFromOutput)
				{
					payload.nextItem = inputFromOutput.node.data.dialogueId;
				}

				// are we dealing with a option
				payload.currItem = outputs['itemOut'];

				// save the current node
				// context.trigger('saveItem', payload);
			}

			// update the renderer
			currentNode.update();
		}
	}
}
