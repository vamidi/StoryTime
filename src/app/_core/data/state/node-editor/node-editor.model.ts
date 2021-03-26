import { IStory } from '@app-core/data/standard-tables';
import { UtilsService } from '@app-core/utils';
import { KeyLanguage, SystemLanguage, systemLanguages } from '@app-core/data/state/node-editor/languages.model';
import { KeyValue } from '@angular/common';


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
		selectedStory: {
			parentId: Number.MAX_SAFE_INTEGER,
			childId: Number.MAX_SAFE_INTEGER,
			description: '',
			title: '',
			storyFile: '',
			typeId: Number.MAX_SAFE_INTEGER,
			taskId: Number.MAX_SAFE_INTEGER,
			deleted: false,
			created_at: UtilsService.timestamp,
			updated_at: UtilsService.timestamp,
		},
		languages: systemLanguages,
	};
	selectedLanguage: {
		key: 'en',
		value: 'English',
	};
}
