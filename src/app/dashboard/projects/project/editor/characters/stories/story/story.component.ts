import {
	AfterViewInit,
	Component,
	OnInit, QueryList,
	ViewChild, ViewChildren,
} from '@angular/core';

import { Location } from '@angular/common';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { NodeEditorComponent, NodeInspectorComponent } from '@app-theme/components/firebase-table/node-editor';
import { BaseFirebaseTableComponent } from '@app-core/components/firebase/base-firebase-table.component';
import { UtilsService } from '@app-core/utils';
import { FirebaseRelationService } from '@app-core/utils/firebase/firebase-relation.service';
import { NbToastrService } from '@nebular/theme';
import { ProxyObject } from '@app-core/data/base';
import { UserData, UserService } from '@app-core/data/state/users';
import { TablesService } from '@app-core/data/state/tables';
import { Table } from '@app-core/data/state/tables';
import { LanguageService, ProjectsService } from '@app-core/data/state/projects';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';

@Component({
	selector: 'ngx-story',
	templateUrl: 'story.component.html',
	styles: [
		`h4 {
			display: inline-block;
		}

		nb-card-header button {
			float: right;
		}
		`,
	],
})
export class StoryComponent extends BaseFirebaseTableComponent implements OnInit, AfterViewInit
{
	// Node editor
	@ViewChildren('nodeEditor')
	public nodeEditor: QueryList<NodeEditorComponent>;

	@ViewChild('nodeInspector', { static: true })
	public nodeInspector: NodeInspectorComponent = null;

	public title: string = '';
	// public AddTitle: string = '';
	public dialogues: Table;

	public stateLoaded: boolean = false;

	public currentState: any = null;

	private supportedTables: string[] = [
		'dialogues',
	];

	private storyLoaded: boolean = false;

	constructor(
		protected location: Location,
		protected firebaseService: FirebaseService,
		protected firebaseRelationService: FirebaseRelationService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected projectService: ProjectsService,
		protected tableService: TablesService,
		protected toasterService: NbToastrService,
		protected snackbarService: NbSnackbarService,
		protected languageService: LanguageService,
		protected router: Router,
		protected activatedRoute: ActivatedRoute,
	)
	{
		super(router, firebaseService, firebaseRelationService, toasterService,
			snackbarService,
			userService, userPreferencesService, projectService,
			tableService, languageService, 'dialogues');
	}

	// public isSupported(): boolean
	// {
	// 	return this.supportedTables.includes(this.tableName);
	// }

	public ngOnInit(): void
	{
		this.currentState = this.location.getState();

		// Get the stories table
		this.tableName = 'dialogues';
		// Let firebase search with current table name
		this.firebaseService.setTblName(this.tableName);

		if(!this.currentState.hasOwnProperty('childId'))
		{
			const that = this;
			const map: ParamMap = this.activatedRoute.snapshot.paramMap;

			this.title = UtilsService.titleCase(UtilsService.replaceCharacter(map.get('story'), /-/g, ' '));
			this.firebaseService.getRef('stories').orderByChild('title').equalTo(this.title).on('value', (snapshots) =>
			{
				if(!snapshots.hasChildren())
				{
					if(window.confirm('Story couldn\'t be located. Nothing will be saved. Return to characters?'))
					{
						this.router.navigate(['/pages/game-db/story-telling/']).then();
						return;
					}

					console.error('Story couldn\'t be found');
					that.stateLoaded = true;
					// retrieve the data after finding the story
					that.getTableData();
				}
				else {
					snapshots.forEach(function (snapshot)
					{
						if (snapshot.exists())
						{
							const q: any = snapshot.exists ? snapshot.val() : {};

							that.currentState =
							{
								...that.currentState,
								storyId: +snapshot.key,
								childId: +q.childId,
								characterId: +q.parentId,
							};
						}

						that.stateLoaded = true;
						// retrieve the data after finding the story
						that.getTableData();
					});
				}
			});

			// 	this.router.navigate(['../../../'], { relativeTo: this.activatedRoute }).then();
		} else
		{
			this.stateLoaded = true;
			if (this.currentState.hasOwnProperty('title'))
			{
				this.title = UtilsService.titleCase(UtilsService.replaceCharacter(this.currentState.title, /-/g, ' '));
			}

			this.getTableData();
		}
	}

	public ngAfterViewInit(): void
	{
		if (this.nodeEditor && this.nodeInspector)
			this.nodeInspector.setNodeEditor(this.nodeEditor.first);
	}

	public onSave()
	{
		if(this.nodeEditor.first)
			this.nodeEditor.first.save();
	}

	protected generateStory(event: { data: ProxyObject })
	{
		if(this.nodeEditor.first)
		{
			this.configureNodeEditor(this.nodeEditor, event);
		}

		this.nodeEditor.changes.subscribe((value: QueryList<NodeEditorComponent>) =>
		{
			this.configureNodeEditor(value, event);
		});
	}

	protected configureNodeEditor(value: QueryList<NodeEditorComponent>, event: { data: ProxyObject })
	{
		if(this.supportedTables.includes('dialogues') && value.first)
		{
			if(value.first.dialogues.length === 0)
				value.first.dialogues = this.dialogues;
			value.first.generate(event).then();
		}
	}

	protected onDataReceived(snapshots: Table)
	{
		const startDialogue: { data: ProxyObject } = { data: null };

		Object.values(snapshots.data).forEach((snapshot) =>
		{
			const elID = +snapshot.id;
			if (typeof snapshot === 'object' && !snapshot.deleted && !this.dialogues.some(elID))
			{
				if (this.currentState.childId === elID) {
					startDialogue.data = { ...snapshot };
				}
				this.dialogues.push(elID, snapshot);
			}
		});

		if (!this.storyLoaded)
		{
			this.storyLoaded = true;
			this.generateStory(startDialogue);
		}
	}
}
