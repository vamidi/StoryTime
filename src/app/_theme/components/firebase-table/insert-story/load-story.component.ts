import { Component, Input, OnInit, Type } from '@angular/core';
import { Project, StoryFileUpload } from '@app-core/data/state/projects';
import { NbDialogRef } from '@nebular/theme';
import { UtilsService } from '@app-core/utils';
import { FirebaseStorageService } from '@app-core/utils/firebase/firebase-storage.service';
import { map } from 'rxjs/operators';
import { FileUpload } from '@app-core/data/file-upload.model';
import { CraftableFileUpload } from '@app-core/data/state/tables';

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
export class LoadStoryComponent<T extends StoryFileUpload | CraftableFileUpload> implements OnInit
{
	public get Ref(): NbDialogRef<LoadStoryComponent<T>>
	{
		return this.ref;
	}

	@Input()
	public childPath: string = 'stories';

	@Input()
	public project: Project = null;

	public fileUploads: T[] = [];

	public onFileClicked(event, idx: number, file: any)
	{
		this.loadStory(idx, file.url);
	}

	public getTitle(idx: number): string
	{
		const metadata: any = this.fileUploads[idx].metadata;
		if(metadata)
		{
			const lastText = metadata.name.split('_').pop();
			return UtilsService.titleCase(UtilsService.replaceCharacter(lastText,/-/g, ' '));
		}

		return '';
	}

	constructor(
		protected ref: NbDialogRef<LoadStoryComponent<T>>,
		protected storageService: FirebaseStorageService,
	) { }

	public ngOnInit()
	{
		this.storageService.getFiles<T>(`${this.childPath}`, (ref) => this.searchFn(ref)).snapshotChanges().pipe(
			map(changes => {
				// store the key
				return changes.map(c => {
					const payload = c.payload.val();
					if(payload.hasOwnProperty('storyId'))
						return new StoryFileUpload({ id: c.payload.key, ...payload });

					return new CraftableFileUpload({ id: c.payload.key, ...payload });
				});
			}),
		).subscribe((fileUploads: T[]) => {
			console.log(fileUploads);
			this.fileUploads = fileUploads;
		});
	}

	protected create(Ctor: new (...args: any[]) => T, data: any): T
	{
		return new Ctor(data);
	}

	protected loadStory(idx: number, url: string)
	{
		this.storageService.getJsonFile(url).then((result) =>
		{
			result.text().then((text) =>
			{
				const d: T = this.fileUploads[idx];
				d.data = text;
				this.ref.close(d);
			});
		}, e => UtilsService.onError(e));
	}

	protected searchFn(ref)
	{
		return ref.orderByChild('metadata/projectID')
			.equalTo(this.project.id)
			.limitToLast(6);
	}
}
