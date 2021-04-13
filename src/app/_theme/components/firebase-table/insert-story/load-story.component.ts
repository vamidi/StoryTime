import { Component, Input, OnInit } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { ListResult } from '@angular/fire/storage/interfaces';
import { Project } from '@app-core/data/state/projects';
import { NbDialogRef } from '@nebular/theme';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { UtilsService } from '@app-core/utils';
import firebase from 'firebase/app';

const BASE_STORAGE_PATH: string = `node-editor/projects`;

@Component({
	selector: ' ngx-load-story',
	templateUrl: './load-story.component.html',
	styles: [`
		nb-card.minWidth {
			min-width: 1000px;
		}
	`,
	],
})
export class LoadStoryComponent implements OnInit
{
	public get Ref(): NbDialogRef<LoadStoryComponent>
	{
		return this.ref;
	}

	public get Project(): Project { return this.project; }

	@Input()
	public set Project(project: Project)
	{
		this.project = project;
	}

	public onStoryClicked(event, idx: number, story: firebase.storage.Reference)
	{
		story.getDownloadURL().then((URL) => {
			this.loadStory(idx, URL);
		});
	}

	public getTitle(idx: number): string
	{
		const metadata: { customMetadata: any, name: string } = this.metadata[idx];
		if(metadata)
		{
			const lastText = metadata.customMetadata.name.split('_').pop();
			return UtilsService.titleCase(UtilsService.replaceCharacter(lastText,/-/g, ' '));
		}

		return '';
	}

	public stories: BehaviorSubject<firebase.storage.Reference[]> = new BehaviorSubject<firebase.storage.Reference[]>([]);
	public metadata: { customMetadata: any, name: string }[] = [];

	private project: Project = null;

	constructor(
		protected ref: NbDialogRef<LoadStoryComponent>,
		protected http: HttpClient,
		protected firebaseStorage: AngularFireStorage,
	) { }

	public async ngOnInit(): Promise<void>
	{
		// get the all the files from the project.
		this.firebaseStorage.ref(
			`${BASE_STORAGE_PATH}/${this.project.id}/stories/`,
		).listAll().toPromise().then((listResult: ListResult) => {
			listResult.items.forEach((ref) => {
				ref.getMetadata().then((m) => {
					this.metadata.push(m);
				});
			});
			this.stories.next(listResult.items);
		});
	}

	protected loadStory(idx: number, url: string)
	{
		this.http.get(url, { responseType: 'blob' }).subscribe((result) =>
		{
			result.text().then((text) =>
			{
				this.ref.close({ storyId: this.metadata[idx].customMetadata.storyID, data: text });
			});
		}, e => console.log(e));
	}
}
