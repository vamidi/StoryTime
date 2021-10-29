import { Project } from '@app-core/data/state/projects';
import { environment } from '../../../../../../environments/environment';
import { IPipelineSchedule } from '@app-core/interfaces/pipelines.interface';

async function validateProjectVersion(asset: Project): Promise<boolean>
{
	return asset.metadata.hasOwnProperty('version');
}

/**
 * @brief - Simple scheduler func to update project version
 */
async function updateProjectVersion(asset: Project): Promise<boolean>
{
	// alright we check if the version exists in the project.
	if(!asset.metadata.hasOwnProperty('version'))
	{
		console.log('we dont have a version at all');
		asset.metadata.version = {
			major: environment.MAJOR,
			minor: environment.MINOR,
			release: environment.RELEASE,
		}

		return true;
	}

	return false;
}

async function validateProjectLanguages(asset: Project): Promise<boolean>
{
	return asset.metadata.hasOwnProperty('languages');
}
async function updateProjectLanguages(asset: Project): Promise<boolean>
{
	// alright we check if the version exists in the project.
	if(!asset.metadata.hasOwnProperty('languages'))
	{
		asset.metadata.languages = {
			'en': true,
		}
		return true;
	}

	return false;
}

export const name: string = 'ProjectsServiceScheduler';
export const migrations: IPipelineSchedule[] = [
	{ name: 'Update project version', callbackFn: updateProjectVersion, validateFn: validateProjectVersion, force: false },
	{ name: 'Update project languages', callbackFn: updateProjectLanguages, validateFn: validateProjectLanguages, force: false},
];
