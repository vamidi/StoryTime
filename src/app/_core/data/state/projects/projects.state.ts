import { Injectable } from '@angular/core';
import { State } from '@ngxs/store';

import { Project } from '@app-core/data/state/projects';

export interface ProjectModel
{
	projects: Project[],
}

/// Reducer function
@State<ProjectModel>({
	name: 'projects',
})
@Injectable()
export class ProjectsState
{

}
