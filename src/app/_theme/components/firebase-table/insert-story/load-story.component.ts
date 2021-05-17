import { Component, Input, OnInit } from '@angular/core';
import { Project } from '@app-core/data/state/projects';
import { NbDialogRef } from '@nebular/theme';
import { UtilsService } from '@app-core/utils';
import { FirebaseStorageService } from '@app-core/utils/firebase/firebase-storage.service';
import { map } from 'rxjs/operators';

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

	@Input()
	public childPath: string = 'stories';

	public fileUploads: any[] = [];

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

	private project: Project = null;

	constructor(
		protected ref: NbDialogRef<LoadStoryComponent>,
		protected storageService: FirebaseStorageService,
	) { }

	public ngOnInit()
	{
		this.storageService.getFiles(`${this.childPath}`, 6).snapshotChanges().pipe(
			map(changes => {
				// store the key
				changes.forEach((c) => console.log({ key: c.payload.key, ...c.payload.val() }));
				return changes.map(c => ({key: c.payload.key, ...c.payload.val()}));
			}),
		).subscribe(fileUploads => {
			this.fileUploads = fileUploads;
		});
	}

	protected loadStory(idx: number, url: string)
	{
		console.log(url);
		this.storageService.getJsonFile(url).then((result) =>
		{
			console.log(result);
			result.text().then((text) =>
			{
				console.log(text);
				const d: { data: string, storyId?: number, itemId?: number } = { data: text };
				if(this.fileUploads[idx].hasOwnProperty('storyId'))
					d.storyId = this.fileUploads[idx].storyId;
				else
					d.itemId = this.fileUploads[idx].itemId;

				this.ref.close(d);
			});
		}, e => UtilsService.onError(e));
	}
}
