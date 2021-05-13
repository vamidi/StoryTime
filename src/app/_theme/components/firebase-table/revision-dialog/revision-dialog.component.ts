import { Component, Input, OnInit } from '@angular/core';
import { NbDialogRef } from '@nebular/theme';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { User } from '@app-core/data/state/users';
import { Observable } from 'rxjs';
import { UtilsService } from '@app-core/utils';

@Component({
	selector: 'ngx-revision-dialog',
	templateUrl: 'revision-dialog.component.html',
})
export class RevisionDialogComponent implements OnInit
{
	@Input()
	public tableName = '';

	@Input()
	public id: number = Number.MAX_SAFE_INTEGER;

	public user: Observable<User>;

	public revisions: any[] = [];

	constructor(
		protected ref: NbDialogRef<RevisionDialogComponent>,
		protected firebaseService: FirebaseService,
	) { }

	public ngOnInit(): void
	{
		this.firebaseService.getRef('revisions').orderByChild('tableName').equalTo(this.tableName).limitToLast(2).on('child_added', (snapshots) =>
		{
			const payload = snapshots.val();
			if(payload.elementId === this.id)
			{
				this.revisions.push({
					...payload,
					user: this.firebaseService.getItemByString(payload.uid, 'users').valueChanges(),
				});
			}
		}, (error: any) => {
			UtilsService.onError(error);
		});
	}

	public toDate(timestamp: number): string
	{
		const date = new Date(timestamp * 1000);

		// day part from the timestamp
		const fullDate = date.getMonth() + '/' + date.getDay() + '/' + date.getFullYear();
		// Hours part from the timestamp
		const hours = date.getHours();
		// Minutes part from the timestamp
		const minutes = '0' + date.getMinutes();
		// Seconds part from the timestamp
		const seconds = '0' + date.getSeconds();

		// Will display time in 10:30:23 format
		return fullDate + ',' + hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
	}

	public dismiss() {
		// this.closeEvent.emit();
		this.ref.close();
	}
}
