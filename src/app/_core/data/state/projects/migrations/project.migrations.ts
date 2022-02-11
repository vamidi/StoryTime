import { Project } from '@app-core/data/state/projects';
import { environment } from '../../../../../../environments/environment';
import { IPipelineSchedule } from '@app-core/interfaces/pipelines.interface';
import { AngularFireObject } from '@angular/fire/database/interfaces';
import { UtilsService } from '@app-core/utils';

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

async function validateMetadata(asset: Project): Promise<boolean> {
	const tables = Object.values(asset.tables);

	for(let i = 0; i < tables.length; i++)
	{
		const table = tables[i];
		if(table.hasOwnProperty('name'))
			return true;
	}

	return false;
}

async function updateTableMetadata(asset: Project, args?: any): Promise<boolean>
{
	let change = false;
	const tables = Object.keys(asset.tables);
	tables.forEach((tableId) => {
		const table = asset.tables[tableId];
		if(table.hasOwnProperty('name'))
		{
			table.metadata = {
				name: table.name,
				description: table.description ?? '',
				columns: table.columns ?? {},
			};
			UtilsService.deleteProperty(UtilsService.deleteProperty(table, 'name'), 'description');

			change = true;
		}
	});

	return change;
}

async function addColumnsToTable(asset: Project, args?: any): Promise<boolean>
{
	console.log(asset);
	if(args !== null)
	{
		const tables = Object.keys(asset.tables);
		tables.forEach((tableId) => {
			if(args.hasOwnProperty(tableId)) {
				(args[tableId] as AngularFireObject<any>).valueChanges().subscribe((entry) => {
					console.log(asset);
					asset.toColumns(tableId, entry,args ? args.relationData : null);
				});
			}
		});
		return true;
	}
	return false;
}

export const name: string = 'ProjectsServiceScheduler';
export const migrations: IPipelineSchedule[] = [
	{ name: 'Update project version', callbackFn: updateProjectVersion, validateFn: validateProjectVersion, force: false },
	{ name: 'Update project languages', callbackFn: updateProjectLanguages, validateFn: validateProjectLanguages, force: false},
	{ name: 'Update project table metadata', callbackFn: updateTableMetadata, validateFn: validateMetadata, force: false},
	{ name: 'Insert columns in project', callbackFn: addColumnsToTable, validateFn: async () => true, force: false },
];
