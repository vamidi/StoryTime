import { IVersion, PipelineAsset } from '@app-core/interfaces/pipelines.interface';
import { KeyLanguage } from '@app-core/data/state/node-editor/languages.model';
import { FileUpload } from '@app-core/data/file-upload.model';
import { Observable } from 'rxjs';

interface ITable
{
	[key: string]: {
		enabled: boolean,
		name: string,
		description?: string,
	},
}

interface IProjectData
{
	// Title of the project
	title: string;

	// Alias of the project
	alias: string;

	// Project description
	description: string;

	// Owner of the project
	owner: string;

	// When the project is created
	created_at: Object;

	// When the project was updated
	updated_at: Object;

	// To see if the project is private
	private: boolean;

	// To see whether the project is deleted
	deleted: boolean;

	relatedTables: {
		items: string,
		equipments: string,
		classes: string,
		enemies: string,
		skills: string,
		[key: string]: string,
	}

	// To see which languages are in the project
	languages: { [key in KeyLanguage]?: boolean },

	version: IVersion;
}

export interface IGameStats
{
	formulaPlayers: string;
	formulaEnemies: string;
	maxLevel: number;
	stats: {
		[key: string]: {},
	};
	modifiers: {
		[key: string]: {},
	};
}

export interface IProject extends PipelineAsset
{
	id?: string;
	tables: ITable;
	metadata: IProjectData;
	members: { [key: string]: boolean };
	gameStats?: IGameStats;
}

export class Project implements IProject
{
	/**
	 * @brief - Unique ID of the project
	 */
	public id: string = '';

	/**
	 * @brief - Members of the project.
	 */
	public members: { [ key: string]: boolean } = {};

	/**
	 * @brief - Tables of the project.
	 */
	public tables: ITable = {};
	/**
	 * @brief - Meta data of the project
	*/
	public metadata: IProjectData = {
		created_at: {},
		updated_at: {},
		title: '',
		alias: '',
		description: '',
		private: false,
		deleted: false,
		owner: '',
		languages: {
			'en': true,
		},

		relatedTables: {
			items: '',
			equipments: '',
			classes: '',
			enemies: '',
			skills: '',
		},

		// Pipeline settings
		version: {
			major: 0,
			minor: 0,
			release: '0',
		},
	}

	public gameStats: IGameStats = {
		formulaPlayers: '(level - 1) * 156 + (level - 1) * (level - 1) * (level - 1) * 1.265 - 3',
		formulaEnemies: '(level - 1) * 156 + (level - 1) * (level - 1) * (level - 1) * 1.265 - 3',
		maxLevel: 200,
		stats: {},
		modifiers: {},
	}

	static find(tClass: any, id: number): any | null
	{
		if(Project.empty(tClass)) return null;

		const foundQuest = tClass.filter((r: any) => r.id === id );

		if(Project.empty(foundQuest)) return null;

		return foundQuest[0];
	}

	static empty(tClass: any) { return tClass.length === 0; }
}

/**
 * @brief - StoryFile that belongs to the project.
 */
export class StoryFileUpload extends FileUpload
{
	storyId: number;        // Story associated with this file.
}

export abstract class ProjectData
{
	abstract setProject(key: string, newUser: Project, current: boolean);

	abstract getProject$(): Observable<Project>;

	abstract getProject(): Project;

	abstract getProjects(): Observable<Project[]>;

	abstract getRecentOpenProjects(): Observable<Project[]>;

	abstract markAsDelete(key: string);
}
