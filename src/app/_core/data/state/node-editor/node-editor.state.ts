import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { NodeEditorModel } from '@app-core/data/state/node-editor/node-editor.model';

/// Reducer function
@State<NodeEditorModel>({
	name: 'nodeEditor',
})
@Injectable()
export class NodeEditorState
{

}
