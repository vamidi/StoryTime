import { Type } from '@angular/core';
import { Node, Component, OnCreated, OnDestroyed } from 'visualne';
import { AngularComponent, AngularComponentData } from 'visualne-angular-plugin';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';

export abstract class BaseNodeComponent extends Component implements AngularComponent
{
	public data: AngularComponentData;

	protected constructor(titleName: string, comp: Type<any>)
	{
		super(titleName);
		this.data.render = 'angular';
		this.data.component = comp;
	}

	public abstract builder(node: Node): Promise<void>;
	public abstract worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]): void;

	public createNode(data?: any): Promise<Node>
	{
		// There will be more basic data
		return super.createNode(data);
	}
}
