import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';
import { MyNodeComponent } from '@app-theme/components';
import { Input, Node, Output } from 'visualne';
import { execInSocket, execOutSocket, targetSocket } from '@app-core/components/visualne/sockets';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';


export class EventNodeComponent extends BaseNodeComponent
{
	constructor()
	{
		super('Event', MyNodeComponent);
	}

	public onCreated(node: Node)
	{
		node.meta.headColor = '#e74c3c';
	}

	public async builder(node: Node): Promise<void>
	{
		// TODO hook this up to different stories
		node.addInput(new Input('execIn', '', execInSocket))
		node.addInput(new Input('targetIn', 'Target', targetSocket))
			.addOutput(new Output('ExecOut', '', execOutSocket));
	}

	public worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs)
	{
		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		// Update the output
		// outputs['ExecOut'] = currentNode.data.dialogueId ?? Number.MAX_SAFE_INTEGER;

		// update the output
		if(currentNode)
		{
			// update the renderer
			currentNode.update();
		}
	}
}
