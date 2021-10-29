import { Table } from '@app-core/data/state/tables';
import { UtilsService } from '@app-core/utils';
import { environment } from '../../../../../../environments/environment';
import { DebugType } from '@app-core/utils/utils.service';
import { IPipelineSchedule } from '@app-core/interfaces/pipelines.interface';

/**
 * @brief - Simple scheduler func to update project version
 * @private
 */
async function updateTableVersion(asset: Table): Promise<boolean>
{
	// alright we check if the version exists in the project.
	if(!asset.metadata.hasOwnProperty('version'))
	{
		asset.metadata.version = {
			major: environment.MAJOR,
			minor: environment.MINOR,
			release: environment.RELEASE,
		}
		return true;
	}

	return false;
}

async function validateTableVersion(asset: Table): Promise<boolean>
{
	return asset.metadata.hasOwnProperty('version');
}

/**
 * @brief - Method to update tables that are outdated.
 * @param asset
 * @private
 */
async function updateDialogueTblForLocalization(asset: Table): Promise<boolean>
{
	console.log(`changing ${asset.metadata.title}`);

	const entries = Object.entries(asset.data);
	for (const [k, value] of entries)
	{
		// Check for the old property name to avoid a ReferenceError in strict mode.
		if (value.hasOwnProperty('id') )
		{
			UtilsService.onDebug('deleting id from table', DebugType.WARN);
			delete asset.data[k]['id'];
		}

		if (value.hasOwnProperty('text') && typeof value.text !== 'object') {
			asset.data[k].text = {
				'en': value.text,
			};
		}

		if (value.hasOwnProperty('name') && typeof value.name !== 'object') {
			asset.data[k].name = {
				'en': value.name,
			};
		}

		if (value.hasOwnProperty('title') && typeof value.title !== 'object') {
			asset.data[k].title = {
				'en': value.title,
			};
		}

		if (value.hasOwnProperty('description') && typeof value.description !== 'object') {
			asset.data[k].description = {
				'en': value.description,
			};
		}

		if (value.hasOwnProperty('Sellable') && typeof value.text !== 'object') {
			asset.data[k].sellable = value.Sellable;
			delete asset.data[k].Sellable;
		}

		UtilsService.onDebug(asset.data[k]);

		return true;
	}

	return false;
}

async function validateUpdateLocalization(asset: Table): Promise<boolean>
{
	return false;
}

async function validateColumns(asset: Table) { return asset.metadata.hasOwnProperty('columns'); }
async function addColumnsToTable(asset: Table, args?: any): Promise<boolean>
{
	const data = Object.values(asset.data);
	if(data.length > 0)
	{
		const entry = data[0];
		asset.toColumns(entry, args ? args.relationData : null);
		return true;
	}
	return false;
}

export const name: string = 'TableServiceScheduler';
export const migrations: IPipelineSchedule[] = [
	{ name: 'Update table version', callbackFn: updateTableVersion, validateFn: validateTableVersion, force: false },
	{
		name: 'Update table localizations',
		callbackFn: updateDialogueTblForLocalization, validateFn: validateUpdateLocalization, force: false,
	},
	{
		name: 'Insert columns in table',
		callbackFn: addColumnsToTable, validateFn: validateColumns, force: false,
	},
];
