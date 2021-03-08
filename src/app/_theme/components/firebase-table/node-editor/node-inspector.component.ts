import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
	OnInit,
} from '@angular/core';

import { Node as VisualNENode } from 'visualne';
import { INSPECTOR_STATE, NodeEditorComponent } from './node-editor.component';

@Component({
	selector: 'ngx-node-inspector',
	styleUrls: ['node-editor.component.scss'],
	templateUrl: 'node-inspector.component.html',
})
export class NodeInspectorComponent implements OnInit, AfterViewInit, OnDestroy
{
	@Input()
	public title: string = '';

	// TODO remove after fixing multiple forms
	public active: boolean = false;

	public nodeEditor: NodeEditorComponent = null;

	public setNodeEditor(editor: NodeEditorComponent)
	{
		this.nodeEditor = editor;
	}

	constructor(protected cd: ChangeDetectorRef)
	{
		// this.formContext = new FormContext(
		const o =
		{
			title: this.title,
			id_form: 0,
			alias: 'insert-dialogue',
			required_text: 'Required',
			submit_url: '',
		};
	}

	public ngOnInit(): void { }

	public ngAfterViewInit()
	{
		// super.ngAfterViewInit();
	}

	public ngOnDestroy(): void
	{
	}

	public initForm()
	{
		// Type - textfield
		/*this.formBuilderService.addTextField({
			value: '',
			text: 'Input title',
			name: 'input-title',
			required: true,
		});

		this.formBuilderService.addTextField({
			value: '',
			text: 'Title',
			name: 'title',
			required: true,
		});

		this.formBuilderService.addTextField({
			value: '',
			text: 'Linked Dialogue',
			name: 'linkedDialogue',
			required: true,
		});

		// Parent ID - two options --> yes or no
		const options: Option<string>[] = [];

		this.formBuilderService.addSelectionList({
			value: ' ',
			text: 'Linked Dialogue',
			name: 'linkedDialogueOption',
			required: true,
			options: options,
		});

		this.formBuilderService.addSubmitButton();
		*/
	}

	public onSendForm()
	{

	}

	public onNodeClicked(node: VisualNENode) {
		console.log(node);
		if(this.nodeEditor)
		{
			switch(this.nodeEditor.getState())
			{
				case INSPECTOR_STATE.DIALOGUE:
					break;
				case INSPECTOR_STATE.DIALOGUE_OPTION:
					break;
			}
		}
	}
}
