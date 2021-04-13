import { IStory } from '@app-core/data/standard-tables';
import { KeyLanguage, SystemLanguage, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { KeyValue } from '@angular/common';
import { createStory } from '@app-core/functions/helper.functions';


export interface INodeEditorMetaData
{
	selectedStory: IStory,
	languages: Map<KeyLanguage, SystemLanguage>,
}

export interface INodeEditor
{
	metadata: INodeEditorMetaData,
	selectedLanguage: KeyValue<KeyLanguage, SystemLanguage>,
}

export class NodeEditorModel implements INodeEditor
{
	metadata: INodeEditorMetaData = {
		selectedStory: createStory(),
		languages: systemLanguages,
	};
	selectedLanguage: {
		key: 'en',
		value: 'English',
	};
}
