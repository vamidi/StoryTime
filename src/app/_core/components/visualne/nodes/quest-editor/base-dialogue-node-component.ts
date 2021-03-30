import { Type } from '@angular/core';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';
import { Node } from 'visualne';
import { BaseNodeComponent } from '../base-node-component';
import { Table } from '@app-core/data/state/tables';
import { NodeEditor } from 'visualne';
import { Subject } from 'rxjs';

export abstract class BaseDialogueNodeComponent extends BaseNodeComponent
{
	public static dialogues: Table; // Sharing data
	public static dialogueOptions: Table; // Sharing data

	public static currentState: any = null;

	protected static nodeEditor: NodeEditor = null;

	public dialogue: any = {};

	protected constructor(titleName: string, comp: Type<any>)
	{
		super(titleName, comp);
	}

	public async builder(node: Node): Promise<void>
	{
		if(!BaseDialogueNodeComponent.nodeEditor)
			BaseDialogueNodeComponent.nodeEditor = this.editor;

		node.meta.editMode = new Subject<boolean>();

	}

	public abstract worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs, ...args: unknown[]): void;

	public createNode(data?: any): Promise<Node>
	{
		return super.createNode(data);
	}
}
