import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, Observable, of, of as observableOf, Subscription } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';

import { IProject, Project, ProjectData } from '@app-core/data/state/projects/project.model';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { BreadcrumbsService, UtilsService } from '@app-core/utils';
import { NbMenuItem, NbMenuService, NbToastrService } from '@nebular/theme';
import { Table, TablesService } from '@app-core/data/state/tables';
import { FilterCallback, firebaseFilterConfig } from '@app-core/providers/firebase-filter.config';
import { ProxyObject } from '@app-core/data/base';
import { IPipelineSchedule } from '@app-core/interfaces/pipelines.interface';

import {
	KeyLanguage,
	KeyLanguageObject,
	SystemLanguage,
	systemLanguages,
} from '@app-core/data/state/node-editor/languages.model';
import { FirebaseStorageService } from '@app-core/utils/firebase/firebase-storage.service';
import pick from 'lodash.pick';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root'})
export class ProjectsService extends ProjectData implements Iterable<Project>
{
	private counter: number = 0;

	private project: Project | null = null;

	private project$: BehaviorSubject<Project | null> = new BehaviorSubject<Project>(null);

	private projects: Map<string, Project> = new Map<string, Project>();

	private temporaryProjects: Map<string, Project> = new Map<string, Project>();

	private deletedProjects: Map<string, Project> = new Map<string, Project>();

	private recentProjects: Project[] = [];

	protected mainSubscription: Subscription = new Subscription();

	constructor(
		protected toastrService: NbToastrService,
		protected menuService: NbMenuService,
		protected firebaseService: FirebaseService,
		protected storageService: FirebaseStorageService,
		protected tablesService: TablesService,
		protected breadcrumbService: BreadcrumbsService,
		protected router: Router,
	)
	{
		super();
	}

	/**
	 * @brief - clear out current project list.
	 * @param except - exception ids
	 */
	public clear(except: string[] = [])
	{
		if(!except.length)
		{
			this.projects.clear();
			return;
		}

		for (const k of this.projects.keys())
		{
			if (!except.find((e) => k === e))
				this.projects.delete(k);
		}
	}

	/**
	 * @brief - Unset the current project
	 */
	public unset()
	{
		if(this.project)
			this.firebaseService.getRef(`projects/${this.project.id}/metadata/updated_at`).off('value');
	}

	/**
	 * @brief - Get current project
	 * @return BehaviorSubject<Project>
	 */
	public getProject$(): BehaviorSubject<Project>
	{
		return this.project$;
	}

	public getProject(): Project
	{
		return this.project;
	}

	/**
	 * @brief - Return a project if found based on ID
	 * @param id
	 * @return Project | null
	 */
	public getProjectById(id: string): Project | null
	{
		return this.projects.get(id);
	}

	/**
	 * @brief - Get All the projects in array form
	 * @return Observable<Project[]>
	 */
	public getProjects(): Observable<Project[]>
	{
		return observableOf(Array.from(this.projects.values()));
	}

	/**
	 * @brief - Get recent selected projects
	 * @return Observable<Project[]>
	 */
	public getRecentOpenProjects(): Observable<Project[]> {
		return observableOf(this.recentProjects);
	}

	public loadTables(project: Project, onTableLoaded: Function = null)
	{
		// load the tables as well
		// TODO now we have to listen to project changes
		for(const key of Object.keys(project.tables))
		{
			this.firebaseService.getRef('tables').child(key).on('value', (snapshot) =>
			{
				if (snapshot.exists())
				{
					// TODO Where do we store table data?
					const payload = snapshot.val();
					const table: Table = new Table({ ...payload, id: snapshot.key });

					this.tablesService.setTable(table.id, table);
					if(onTableLoaded)
						onTableLoaded();
					else
					{
						const filterFunc: FilterCallback<ProxyObject> =
							// TODO see if this is still correct
							firebaseFilterConfig.tableFilters.find((t) => t.table === table.metadata.title);

						// filter the data if needed
						table.load([
							(d: ProxyObject) => !!+d.deleted === false,
							filterFunc,
						]).then();
					}
				}
			},
			(error) => {
				UtilsService.onError(error);
			});
		}
	}

	public set(key: string, current: boolean = false): Promise<void | Project>
	{
		// if we don't have the project, grab it again.
		if(!this.projects.has(key))
		{
			console.log(key);
			return this.firebaseService.getRef('projects/' + key).once('value')
			.then((result) =>
			{
				if(result.exists())
				{
					const project: Project = UtilsService.assignProperties(new Project, { ...result.val(), id: result.key });

					return this.setProject(project.id, project, current);
				}
			});
		}

		return Promise.resolve();
	}

	/**
	 * @brief - Adds the project to the list if not existed
	 * It will also set the current selected project to current is true
	 * @param key
	 * @param newProject
	 * @param current
	 */
	public setProject(key: string, newProject: Project, current: boolean = false): Project
	{
		let project: Project | null;

		if(this.projects.has(key))
		{
			project = this.projects.get(key);

			// check which project is newer
			if(!newProject.metadata.deleted && project.metadata.updated_at < newProject.metadata.updated_at)
				this.projects.set(newProject.id, newProject);
		}
		else
		{
			project = newProject;

			if(project.metadata.deleted)
			{
				this.deletedProjects.set(key, newProject);
			}
			else {
				this.projects.set(key, newProject);
			}
		}

		if(current)
		{
			this.project = project;
			this.project$.next(this.project);

			/** ----------------------------------- Set tables ------------------------------ **/

			// TODO hide tables that the user is not allowed to see.
			const tables = Object.keys(this.project.tables);
			this.breadcrumbService.addDropdownForRouteRegex(`/dashboard/projects/${this.project.id}/tables`,
				tables.map<NbMenuItem>((t) => {
					const table = this.project.tables[t];
					const version: string = UtilsService.convertToVersion(this.project.metadata.version);
					const name = UtilsService.versionCompare(version, '2020.1.6.1', { lexicographical: true }) >= 0 ?
						table.metadata.name : table.name;

					return {title: UtilsService.title(name), data: { method: 'tables', id: t }}
				}).sort((a, b) => UtilsService.sortAlphabeticFunc(a, b, 'title')),
			);

			this.mainSubscription.add(this.menuService.onItemClick()
				.pipe(
					filter(({ tag }) => tag === 'open-breadcrumb-menu'),
				).subscribe(({ item: { title, data } }) => this.onCardOptionClicked({ title, data })));

			this.breadcrumbService.addCallbackForRouteRegex('/dashboard/projects/-[a-zA-Z]', (id) =>
				id === this.project.id ? this.project.metadata.title : id);

			console.log(project.id);
			this.firebaseService.getRef(`projects/${project.id}/metadata/updated_at`).on('value', (snapshot) => {
				this.project.metadata.updated_at = snapshot.val();
				this.project$.next(this.project);
			});

			// set the project ref in the storage service
			this.storageService.Project = this.project;
		}

		return project;
	}

	/**
	 * @brief - update the table in firebase
	 * @param key
	 * @return boolean
	 */
	public update(key: string): Promise<any>
	{
		if(this.projects.has(key))
		{
			const project: IProject = pick(this.projects.get(key), ['id', 'members', 'tables', 'metadata']);

			if(!this.firebaseService.permissions)
				return Promise.reject(`No permissions to make changes to ${key}`);

			console.log(key, project);
			return this.firebaseService.updateItem(key, project, true, `projects`);
		}

		return Promise.reject(`294 - Couldn't find project ${key}`);
	}

	public loadProject(key: string, onProjectLoaded: Function)
	{
		if(this.projects.has(key))
		{
			onProjectLoaded({ key: key, val: () => this.projects.get(key) });
			// in case temporaryProjects is filled with current key
			this.temporaryProjects.delete(key);
			return;
		}

		this.temporaryProjects.set(key, new Project);
		this.firebaseService.getRef(`projects/${key}`).on('value', (snapshot) =>
		{
			if (snapshot.exists())
			{
				onProjectLoaded(snapshot);
				this.temporaryProjects.delete(key);
			}
		},
		(error: Error) =>
		{
			UtilsService.onError(error);
		});
	}

	/**
	 * @brief - Mark the project as deleted.
	 * @param key
	 * @param update
	 */
	public markAsDelete(key: string, update: boolean = true)
	{
		if(this.projects.has(key))
		{
			if(update)
			{
				const project: IProject = pick(this.projects.get(key), ['id', 'members', 'tables', 'metadata']);
				project.metadata.updated_at = UtilsService.timestamp;
				project.metadata.deleted = true;

				this.firebaseService.updateItem(project.id, project, true, 'projects').then(() => {
					UtilsService.showToast(this.toastrService, 'Project deleted',
						`Project ${project.metadata.title} deleted!`);

					this.projects.delete(project.id);
					this.deletedProjects.set(project.id, <Project>project);
				}, () => {
					// if we have an error we need to invalidate the project
					project.metadata.deleted = false;
				});

				return;
			}

			// only delete projects from the list
			this.projects.delete(key);
		}
	}

	public Exists(key: string): boolean
	{
		return this.projects.has(key);
	}

	/**
	 * @brief - Add table if it not exists.
	 * example usage is for loading relation data.
	 * @param key
	 */
	public addIfNotExists(key: string): Promise<Project | boolean>
	{
		if(!this.projects.has(key) && !this.deletedProjects.has(key) && !this.temporaryProjects.has(key))
		{
			const subscription = new Subscription();
			const project: Project = new Project();
			project.id = key;

			// add it to the temporary tables
			this.temporaryProjects.set(key, project);

			// get the table data
			// make a separate function in order to get a reference to this.

			return new Promise((resolve, reject) =>
			{
				subscription.add(this.firebaseService.getItem(key, 'projects').valueChanges().subscribe((snapshots) =>
				{
					console.log(snapshots);
					// configure fields
					snapshots.forEach((snapshot) =>
					{
						project[snapshot.key] = snapshot.payload.val();
					});

					// Remove it from the temporary project
					this.temporaryProjects.delete(key);
					this.projects.set(key, project);
					resolve(project);
					subscription.unsubscribe();
				}, reject));
			});
		}

		return Promise.resolve(true);
	}

	/**
	 * @brief - Generates table data based on the projects
	 * @param columns
	 * @param onItemAdded
	 */
	public getSource(columns: string[], onItemAdded: Function = null): any[]
	{
		const source: any[] = [];

		this.projects.forEach((value: Project, key) =>
		{
			const obj = { id: key };
			columns.forEach((column) =>
			{
				if(value.metadata.hasOwnProperty(column))
				{
					obj[column] = value.metadata[column];
				}
			});

			source.push(obj);
		});
		return source;
	}

	/** ITERATIONS **/

	public next(): IteratorResult<Project>
	{
		const data = Array.from(this.projects.values());
		if(data.length > 0 && this.counter <= data.length - 1)
			return { value: data[this.counter++], done: false };
		return { value: null, done: true };
	}

	[Symbol.iterator](): Iterator<Project> {
		const that = this;
		let step = 0;
		return {
			next() {
				const data = Array.from(that.projects.values());
				if(data.length > 0 && step <= data.length - 1)
					return { value: data[step++], done: false };
				return { value: null, done: true };
			},
		};
	}

	protected onCardOptionClicked(item: { title: string, data: { id: string, method: string } })
	{
		switch (item.data.method)
		{
			// TODO change all urls to /dashboard/projects/project/
			case 'projects':
				this.router.navigate(['/dashboard/projects/', item.data.id]).then();
				break;
			case 'tables':
				this.router.navigate([`/dashboard/projects/${this.project.id}/tables/`, item.data.id]).then();
				break;
		}
	}
}

@Injectable({ providedIn: 'root' })
export class LanguageService
{
	public static GetLanguageFromProperty(prop: KeyLanguageObject, lang: KeyLanguage): string
	{
		if(prop === null) {
			return '';
		}

		if(prop && prop.hasOwnProperty(lang))
			return prop[lang];

		if(prop && prop.hasOwnProperty(this.fallBackLanguage))
			return prop[this.fallBackLanguage];

		return '';
	}

	public set SetLanguage(lang: KeyLanguage)
	{
		this.selectedLanguage = lang; this.selectedLanguage$.next(this.selectedLanguage);
	}

	public get Language(): Observable<KeyLanguage> { return this.selectedLanguage$.asObservable(); }

	public get SystemLanguages(): Map<KeyLanguage, SystemLanguage> { return systemLanguages; }

	public get ProjectLanguages(): Observable<Map<KeyLanguage, SystemLanguage>>
	{
		return this.projectsService.getProject$().pipe(
			switchMap((project) => {
				if(project && project.metadata.hasOwnProperty('languages'))
				{
					const map: Map<KeyLanguage, SystemLanguage> = new Map<KeyLanguage, SystemLanguage>();
					const languages = Object.keys(project.metadata.languages);
					languages.forEach((k: KeyLanguage) => {
						if(project.metadata.languages[k])
							map.set(k, systemLanguages.get(k));
					});

					return of(map);
				}
				return of(null);
			}),
		);
	}

	private selectedLanguage$: BehaviorSubject<KeyLanguage> = new BehaviorSubject<KeyLanguage>('en');

	private selectedLanguage: KeyLanguage = null;

	private static fallBackLanguage: KeyLanguage = 'en';

	constructor(protected projectsService: ProjectsService) {}

	public getLanguageFromProperty(prop: KeyLanguageObject, lang: KeyLanguage): string
	{
		return LanguageService.GetLanguageFromProperty(prop, lang);
	}
}
