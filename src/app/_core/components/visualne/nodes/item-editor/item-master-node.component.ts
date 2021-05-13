import { Node, Input } from 'visualne';

import { itemSocket } from '@app-core/components/visualne/sockets';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';

import { MyNodeComponent } from '@app-theme/components';
import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';

export class ItemMasterNodeComponent extends BaseNodeComponent
{
	constructor()
	{
		super('ItemMaster', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		node.addInput(new Input('itemIn', `Item Master [${ Number.MAX_SAFE_INTEGER }]`, itemSocket));
	}

	public onCreated(node: Node)
	{
		node.meta.headColor = '#e67e22';
	}

	worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]): void
	{
		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		// Update the input
		inputs['itemIn'] = [
			...inputs['itemIn'],
			currentNode.data.itemId ?? Number.MAX_SAFE_INTEGER,
		];
		// update the output
		if(currentNode)
		{
			const el = currentNode.inputs.get('itemIn');
			if (el)
			{
				const itemIdText: string = currentNode.data.itemId as string ?? 'NULL';
				el.name = `Item ID [${itemIdText}]`;
			}

			// update the renderer
			currentNode.update();
		}

	}
}
