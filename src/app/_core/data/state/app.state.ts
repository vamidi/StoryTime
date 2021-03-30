import { State } from '@ngxs/store';
import { UserModel, UserState } from '@app-core/data/state/users';
import { Project, ProjectsState } from '@app-core/data/state/projects';
import { Table, TablesState } from '@app-core/data/state/tables';
import { NodeEditorModel, NodeEditorState } from '@app-core/data/state/node-editor';

/**
 * @brief this is the state of the app
 * that uses Redux to make sure the app data is
 * correct between different pages.
 * @reference: https://github.com/codediodeio/ngrx-fire
 */
export interface AppStateModel {
	user: UserModel,
	projects: Project[],
	tables: Table[],
	nodeEditor: NodeEditorModel,
}

@State<AppStateModel>({
	name: 'app',
	children: [
		UserState,
		ProjectsState,
		TablesState,
		NodeEditorState,
	],
})
export class AppState { }


