import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';
import { MyNodeComponent } from '@app-theme/components';
import { Node, Output } from 'visualne';
import { itemSocket } from '@app-core/components/visualne/sockets';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';


export class ItemNodeComponent extends BaseNodeComponent
{
	constructor()
	{
		super('ItemNode', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		// node.addInput(new Input('itemIn', `Item ID [NULL]`, itemSocket));
		node.addOutput(new Output('itemOut', `Item ID [NULL]`, itemSocket));
	}

	public onCreated(node: Node)
	{
		node.meta.headColor = '#2ecc71';
	}

	worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]): void
	{
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

			// update the renderer
			currentNode.update();
		}
	}
}
