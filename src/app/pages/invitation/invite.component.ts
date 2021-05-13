import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirebaseService } from '@app-core/utils/firebase/firebase.service';
import { switchMap, takeUntil } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { IUserTicket } from '@app-core/data/state/users';
import { NbThemeService, NbToastrService } from '@nebular/theme';
import { UtilsService } from '@app-core/utils';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { NbThemeNames } from '@app-core/utils/utils.service';

@Component({
	selector: 'ngx-invite',
	templateUrl: './invite.component.html',
	styleUrls: ['./invite.component.scss'],
})
export class NgxInviteComponent implements OnInit, OnDestroy
{
	private destroy$ = new Subject<void>();

	constructor(
		protected themeService: NbThemeService,
		protected nbToastrService: NbToastrService,
		protected firebaseService: FirebaseService,
		private activatedRoute: ActivatedRoute,
		private userPreferencesService: UserPreferencesService,
	) { }

	public ngOnInit(): void
	{
		this.userPreferencesService.getUserPreferences().subscribe((userPreferences) => {
			this.themeService.changeTheme(<NbThemeNames>userPreferences.currentTheme);
		});

		this.activatedRoute.queryParams.pipe(
			takeUntil(this.destroy$),
			switchMap(value =>  of({id: value.id, token: value.token })),
			switchMap((value) =>
			{
				return this.firebaseService.getItem(value.id, `projectRequests`).valueChanges();
			}),
		).subscribe((value: IUserTicket) => {
			this.firebaseService.addUserToProject(value).toPromise().then((values) => {
				console.log(values);
				UtilsService.showToast(
					this.nbToastrService,
					'User Added',
					'User successfully add to project [ProjectName]',
					'danger',
				);
			});
		}, () => UtilsService.showToast(
			this.nbToastrService,
			'No permission',
			'User could not be added to project',
			'danger',
		))
	}

	public ngOnDestroy(): void
	{
		this.userPreferencesService.getUserPreferences().unsubscribe();
		this.destroy$.next();
		this.destroy$.complete();
	}
}
