import { Input, Node, Output } from 'visualne';
import { NodeData, WorkerInputs, WorkerOutputs } from 'visualne/types/core/data';
import { dialogueSocket, execInSocket, execOutSocket } from '@app-core/components/visualne/sockets';
import { MyNodeComponent } from '@app-theme/components/visualne/node.component';
import { BaseDialogueNodeComponent } from './base-dialogue-node-component';
import { DialogueControl } from '../../controls';

export class StartNodeComponent extends BaseDialogueNodeComponent
{
	constructor()
	{
		super('Start', MyNodeComponent);
	}

	public async builder(node: Node): Promise<void>
	{
		await super.builder(node);

		node.addOutput(new Output('ExecOut', '', execOutSocket))
			.addOutput(new Output('dialogueOut', `First Dialogue [${ Number.MAX_SAFE_INTEGER }]`, dialogueSocket));
	}

	public worker(node: NodeData, inputs: WorkerInputs, outputs: WorkerOutputs)
	{
		const currentNode: Node = this.editor.nodes.find(n => n.id === node.id);

		// Update the output
		outputs['dialogueOut'] = currentNode.data.dialogueId ?? Number.MAX_SAFE_INTEGER;

		// update the output
		if(currentNode)
		{
			const el = currentNode.outputs.get('dialogueOut');
			if (el)
			{
				const dialogueIdText: string = currentNode.data.dialogueId as string ?? 'NULL';
				el.name = `First Dialogue ID [${dialogueIdText}]`;
			}

			// update the renderer
			currentNode.update();
		}


		/*
				const haveConnection = output.hasConnection();
				if(this.prevDialogueId !== parentId)
				{
					// we have chosen a different dialogue or even choose a new dialogue
					if (haveConnection)
					{
						// if we assign it to none we need to disconnect
						if (parentId === Number.MAX_SAFE_INTEGER) {
							output.connections.forEach((connection) => this.editor.removeConnection(connection));
							currentNode.update();

							this.editor.view.updateConnections({node: currentNode});
							this.editor.view.resize();

						} else {
							// we know we have a connection and it is a dialogue
							if (output.connections[0].output.socket === dialogueSocket) {
								const input = output.connections[0].input;
								const inputData = input.node.data;
								if (inputData.hasOwnProperty('DialogueControlOut')) {
									const nextData: any = <any>inputData.DialogueControlOut;

									// if the data nextId is different then the one connected we need to change it.
									if (nextData.dialogueId !== data.nextId) {
										data.nextId = nextData.dialogueId;
									}
								}

							}
							// if we are connected to a dialogueOptionNode
							else if (output.connections[0].output.socket === dialogueOptionInSocket) {

							}
						}
						this.updatePrevDialogue(node, ctrl, parentId);
						this.syncNode(node, currentNode, parentId, ctrl, data);

					} else // if we don't have a connection but the id has been changed
					{
						// fix the previous selected start node
						this.updatePrevDialogue(node, ctrl, parentId);
						const dialogue = StartNodeComponent.dialogues.find(parentId);
						if (dialogue)
							this.syncNode(node, currentNode, parentId, ctrl, dialogue);

						// Generate the whole story if we already have one and the user request it.
						if (!haveConnection)
						{
							setTimeout(() =>
							{
								const el = StartNodeComponent.dialogues.find(parentId);
								if (el && el.nextId !== Number.MAX_SAFE_INTEGER
								&& window.confirm('Next ID available do you want generate the rest of the story?')) {
									currentNode.data = {
										...currentNode.data,
										...el,
									};
									// @ts-ignore
									BaseDialogueNodeComponent.nodeEditor.trigger('generate', {startNode: currentNode});
								}
							}, 500);
						}
					}
				}

				if(output)
				{
					const ID =  data.dialogueId !== Number.MAX_SAFE_INTEGER ? data.dialogueId : Number.MAX_SAFE_INTEGER;
					output.name = 'Out ID [' + ID + ']';
				}

				if(parentId !== Number.MAX_SAFE_INTEGER)
					outputs['dialogueOut'] = parentId;
		 */
	}

	public onCreated(node: Node)
	{
		node.meta.headColor = '#e67e22';
	}
/*
	private updatePrevDialogue(_: NodeData, ctrl: DialogueControl, parentId: number)
	{
		const el = StartNodeComponent.dialogues.find(this.prevDialogueId);
		if(el)
		{
			el.parentId = el.nextId = Number.MAX_SAFE_INTEGER;
			ctrl.onSave(this.firebaseService, Number(el.id), el).then(() =>
			{

				UtilsService.showToast(
					this.toastrService,
					'Dialogue updated!',
					`Dialogue ${this.prevDialogueId} updated!`,
				);

				const story = this.stories.find((s) => s.childId === el.id);
				if(story)
					this.updateStory(story, ctrl, Number.MAX_SAFE_INTEGER);

				this.prevDialogueId = parentId;
			});
		}
	}
*/
	private updateStory(story: any, ctrl: DialogueControl, newChildId: number)
	{
		// adjust the story
		const oldStory = { ...story };
		story.childId = newChildId;
		/*
		this.firebaseService.updateData(story.id, '/', story, oldStory, 'stories')
		.then(() => {
			UtilsService.showToast(
				this.toastrService,
				'Story updated!',
				`Story ${story.id} updated!`,
			);

			const ctrlData: any = <any>(ctrl.getData(ctrl.key));
			ctrlData.storyId = story.id;
			ctrl.putData(ctrl.key, ctrlData);
		});
*/
	}

/*
	private syncNode(_: NodeData, currentNode: Node, parentId: number, ctrl: DialogueControl, data: any)
	{
		this.prevDialogueId = parentId;

		// @ts-ignore
		BaseDialogueNodeComponent.nodeEditor.trigger('save', { id: currentNode.id, func: () =>
		{
			ctrl.onSave(this.firebaseService, parentId, data).then(() =>
			{
				UtilsService.showToast(
					this.toastrService,
					'Dialogue updated!',
					`Dialogue ${ this.prevDialogueId } updated!`,
				);

				const story = this.stories.find((s) => s.id === StartNodeComponent.currentState.storyId);
				if(story)
					this.updateStory(story, ctrl, this.prevDialogueId);
			});
		}});
	}
	*/
}
