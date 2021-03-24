import { Component, Input, OnInit } from '@angular/core';
import { AngularFireStorage } from '@angular/fire/storage';
import { ListResult } from '@angular/fire/storage/interfaces';
import { Project } from '@app-core/data/state/projects';
import { NbDialogRef } from '@nebular/theme';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import firebase from 'firebase/app';
import { UtilsService } from '@app-core/utils';

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
		const metadata = this.metadata[idx];
		if(metadata)
		{
			const lastText = metadata.customMetadata.name.split('_').pop();
			return UtilsService.titleCase(UtilsService.replaceCharacter(lastText,/-/g, ' '));
		}

		return '';
	}

	public stories: BehaviorSubject<firebase.storage.Reference[]> = new BehaviorSubject<firebase.storage.Reference[]>([]);
	public metadata: { customMetadata: any }[] = [];

	private project: Project = null;

	constructor(
		protected ref: NbDialogRef<LoadStoryComponent>,
		protected http: HttpClient,
		protected firebaseStorage: AngularFireStorage,
	) { }

	public async ngOnInit(): Promise<void>
	{
		const httpOptions = {
			headers: new HttpHeaders({
				'Content-Type': 'application/json',
				'Access-Control-Allow-Origin': '*',
			}),
			responseType: 'blob',
		};

		// get the all the files from the project.
		this.firebaseStorage.ref(
			'node-editor/stories',
		).listAll().toPromise().then((listResult: ListResult) => {
			listResult.items.forEach(async (ref) => {
				this.metadata.push(await ref.getMetadata());
			})
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
		}, e => console.log(e))
	}
}
