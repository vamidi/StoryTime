import { OnCreated, Output } from 'visualne';
import { numSocket } from '@app-core/components/visualne/sockets';
import { NumControl } from '@app-core/components/visualne/controls';
import { MyNodeComponent } from '@app-theme/components/visualne/node.component';
import { AngularComponentData } from 'visualne-angular-plugin';
import { BaseNodeComponent } from '@app-core/components/visualne/nodes/base-node-component';

export class NumComponent extends BaseNodeComponent implements OnCreated
{
	data: AngularComponentData;

	constructor()
	{
		super('Number', MyNodeComponent);
	}

	builder(node)
	{
		const out1 = new Output('num', 'Number', numSocket);

		return node.addControl(new NumControl(this.editor, 'num')).addOutput(out1);
	}

	worker(node, inputs, outputs)
	{
		outputs['num'] = node.data.num;
	}

	public onCreated(node: any)
	{
		node.meta.headColor = '#2ecc71';
	}
}
