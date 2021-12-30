import { Input, Node, OnCreated, Output } from 'visualne';
import { numSocket } from '@app-core/components/visualne/sockets';
import { NumControl } from '../controls';
import { MyNodeComponent } from '@app-theme/components/visualne/node.component';
import { AngularComponent } from 'visualne-angular-plugin';
import { BaseNodeComponent } from './base-node-component';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';
import { UtilsService } from '@app-core/utils';

export class AddComponent extends BaseNodeComponent implements AngularComponent, OnCreated
{
	constructor()
	{
		super('Add', MyNodeComponent);
	}

	async builder(node: Node)
	{
		const inp1 = new Input('num1', 'Number', numSocket);
		const inp2 = new Input('num2', 'Number', numSocket);
		const out = new Output('num', 'Number', numSocket);

		inp1.addControl(new NumControl(this.editor, 'num1'));
		inp2.addControl(new NumControl(this.editor, 'num2'));

		node.addInput(inp1)
			.addInput(inp2)
			.addControl(new NumControl(this.editor, 'preview', true))
			.addOutput(out);
	}

	worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs)
	{
		UtilsService.onDebug(inputs);
		const n1: number = inputs['num1'].length ? <number>inputs['num1'][0] : <number>node.data.num1;
		const n2: number = inputs['num2'].length ? <number>inputs['num2'][0] : <number>node.data.num2;
		const sum = n1 + n2;

		const ctrl = <NumControl>this.editor.nodes.find(n => n.id === node.id).controls.get('preview');
		ctrl.setValue(sum);
		outputs['num'] = sum;
	}

	public onCreated(node: any)
	{
		node.meta.headColor = '#2ecc71';
	}
}
