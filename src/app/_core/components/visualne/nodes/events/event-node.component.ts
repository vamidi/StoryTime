import { KeyValue } from '@angular/common';
import { Input, Node, Output } from 'visualne';
import {
	execInSocket,
	execOutSocket,
	numSocket,
	targetSocket,
} from '@app-core/components/visualne/sockets';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';
import { InputOutputMap } from '@app-core/components/visualne/nodes/data/interfaces';
import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';
import { MyNodeComponent } from '@app-theme/components';
import { IEventInput } from '@app-core/data/standard-tables';


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
		if(!node.data.hasOwnProperty('events'))
			node.data.events = <InputOutputMap<number, IEventInput>>{};

		// TODO hook this up to different stories
		node.addInput(new Input('execIn', '', execInSocket))
		node.addInput(new Input('targetIn', 'Target', targetSocket))
			.addOutput(new Output('ExecOut', '', execOutSocket));

		const events = Object.keys(node.data.events as InputOutputMap<number, IEventInput>);

		events.forEach((key) =>
		{
			const event: KeyValue<number, IEventInput> = node.data.events[key];
			const input = new Input(key, 'Out ID [NULL]' , numSocket, false);
			input.name = `${ event.value.paramName }`;
			node.addInput(input);
		});
	}

	public worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs)
	{
		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		// Update the output
		// outputs['ExecOut'] = currentNode.data.dialogueId ?? Number.MAX_SAFE_INTEGER;

		// update the output
		if(currentNode)
		{
			// get all the out options and set it in the output
			const eventsMap = node.data.events as InputOutputMap<number, IEventInput>;
			const events = Object.keys(eventsMap);
			if(events.length)
			{
				events.forEach((index) => {
					const event: KeyValue<number, IEventInput> = eventsMap[index];
					outputs[index] = eventsMap[index].value;
				});
			}

			// update the renderer
			currentNode.update();
		}
	}
}
