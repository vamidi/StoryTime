import { Node, Input, Context } from 'visualne';

import { itemSocket } from '@app-core/components/visualne/sockets';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';

import { MyNodeComponent } from '@app-theme/components';
import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';
import { AdditionalEvents } from '@app-core/components/visualne';
import { EventsTypes } from 'visualne/types/events';
import { UtilsService } from '@app-core/utils';

export class ItemMasterNodeComponent extends BaseNodeComponent
{
	private inputs: number[] = [];

	constructor()
	{
		super('ItemMaster', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		node.addInput(new Input('itemIn', `Item Master [${ Number.MAX_SAFE_INTEGER }]`, itemSocket, true));
	}

	public onCreated(node: Node)
	{
		node.meta.headColor = '#e67e22';
	}

	worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]): void
	{
		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		// update the output
		if(currentNode)
		{
			const el = currentNode.inputs.get('itemIn');
			if (el)
			{
				const itemIdText: string = currentNode.data.itemId as string ?? 'NULL';
				el.name = `Item ID [${itemIdText}]`;
			}

			const itemInputs = inputs['itemIn'] as number[];
			if(itemInputs && !UtilsService.isEqual(this.inputs, itemInputs))
			{
				this.inputs = itemInputs;

				const context: Context<AdditionalEvents & EventsTypes> = this.editor;
				context.trigger('saveCraftableLinks', { fItems: itemInputs as number[] });
			}

			// update the renderer
			currentNode.update();
		}

	}
}
