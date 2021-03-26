import {
	AfterViewInit,
	ChangeDetectorRef,
	Component,
	OnDestroy,
	OnInit, ViewChild,
} from '@angular/core';
import {
	NbDialogService,
	NbMediaBreakpointsService,
	NbMenuService,
	NbSidebarService,
	NbThemeService, NbToastrService,
} from '@nebular/theme';

import { IUserTicket, UserModel } from '@app-core/data/state/users';
import { LayoutService, UtilsService } from '@app-core/utils';
import { environment } from '../../../../environments/environment';
import { ChangelogDialogComponent } from '@app-theme/components/changelog/changelog-dialog.component';
import { NbThemeNames, UserPreferences } from '@app-core/utils/utils.service';
import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { UserService, GetUser } from '@app-core/data/state/users';
import { NgxMenuItem } from '@app-theme/components';
import { ProjectsService } from '@app-core/data/state/projects';
import { NgxContextMenuDirective } from '@app-core/directives/ngx-context-menu.directive';
import { Store } from '@ngxs/store';

@Component({
	selector: 'ngx-header',
	styleUrls: ['./header.component.scss'],
	templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy
{
	@ViewChild('cdire')
	public el: NgxContextMenuDirective = null;

	public user: UserModel = null;

	userPictureOnly: boolean = false;

	themes = [
		{
			value: 'default',
			name: 'Light',
		},
		{
			value: 'dark',
			name: 'Dark',
		},
		{
			value: 'cosmic',
			name: 'Cosmic',
		},
		{
			value: 'corporate',
			name: 'Corporate',
		},
	];

	currentTheme = 'dark';

	userMenu = [{ title: 'Profile' }, { title: 'Log out', link: '/auth/logout' }];

	userPreferences: UserPreferences = null;

	userNotifications: NgxMenuItem[] = new Array<NgxMenuItem>();

	userNotifications$: BehaviorSubject<NgxMenuItem[]> = new BehaviorSubject(new Array<NgxMenuItem>());

	userNotificationsLen: string = '';

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	private destroy$: Subject<void> = new Subject<void>();

	constructor(
		protected cd: ChangeDetectorRef,
		private toastrService: NbToastrService,
		private sidebarService: NbSidebarService,
		private menuService: NbMenuService,
		private themeService: NbThemeService,
		private userService: UserService,
		private projectService: ProjectsService,
		private layoutService: LayoutService,
		private breakpointService: NbMediaBreakpointsService,
		private dialogService: NbDialogService,
		private firebaseService: FirebaseService,
		private userPreferencesService: UserPreferencesService,
		private store: Store)
	{
	}

	public ngOnInit(): void
	{
		this.currentTheme = this.themeService.currentTheme;

		const { xl } = this.breakpointService.getBreakpointsMap();
		this.themeService.onMediaQueryChange()
			.pipe(
				map(([, currentBreakpoint]) => currentBreakpoint.width < xl),
				takeUntil(this.destroy$),
			)
			.subscribe((isLessThanXl: boolean) => this.userPictureOnly = isLessThanXl);


		this.mainSubscription.add(this.userService.getUser().subscribe((obsUser) =>
		{
			console.log(obsUser);
			if(obsUser)
			{
				// this.userNotifications = [];
				// this.userNotifications$.next(this.userNotifications);

				this.user = { ...obsUser };
				this.firebaseService.getRef('projectRequests').orderByChild('recipient')
					.equalTo(this.user.uid).on('value', result =>
					{
						if(result.exists())
						{
							const data: { [key: string]: IUserTicket } = result.val();
							if(data)
							{
								for (const key of Object.keys(data))
								{
									const ticket: IUserTicket = data[key];

									// See if it is pending
									// see if we already added it to the list
									if (ticket.pending &&
										(this.userNotifications.length || !this.userNotifications.find((v) => v.data.id === key)))
									{
										this.userNotifications.push(
											{
												data: {
													id: key, ...ticket,
												},
												title: `${ticket.displayName} has invited you to join project ${ticket.title}`,
												onAccept: (t: any) => this.onInviteAccepted(t),
											},
										);
									}
								}
							}

							this.userNotifications$.next(this.userNotifications);
							this.userNotificationsLen = this.userNotifications.length.toString();
							this.el.items = this.userNotifications;
							this.cd.detectChanges();
						}
					},
				);
				return;
			}
		}));
		if(environment.redux) this.store.dispatch(new GetUser());

		this.themeService.onThemeChange()
			.pipe(
				map(({ name }) => name),
				takeUntil(this.destroy$),
			)
			.subscribe(themeName => this.currentTheme = themeName);

		this.userPreferencesService.getUserPreferences().subscribe((userPreferences: UserPreferences) =>
		{
			this.userPreferences = { ...userPreferences };

			this.changeTheme(this.userPreferences.currentTheme);

			setTimeout(() =>
			{
				if(!this.userPreferences.changelogSeen ||
					this.userPreferences.version === '' ||
					this.userPreferences.version !== environment.appVersion)
				{
					this.dialogService.open(ChangelogDialogComponent);
					this.userPreferences.changelogSeen = true;
					this.userPreferences.version = environment.appVersion;
					this.userPreferencesService.setUserPreferences(this.userPreferences);
				}
			},500);
		});

		// this.firebaseService.updateUserInfo({
		// 	displayName: 'Buas Programmers',
		// 	photoURL: 'assets/images/kitten-corporate.png',
		// });
	}

	public ngAfterViewInit(): void {}

	public ngOnDestroy()
	{
		//
		this.destroy$.next();
		this.destroy$.complete();

		this.firebaseService.getRef('projectRequests').orderByChild('recipient').equalTo(this.user.uid).off();
		this.mainSubscription.unsubscribe();

	}

	/**
	 * @brief change the theme
	 * @param themeName
	 */
	changeTheme(themeName: string)
	{
		// if the theme has been changed put it in the localstorage
		if(this.userPreferences.currentTheme !== <NbThemeNames>(themeName))
		{
			this.userPreferences.currentTheme = <NbThemeNames>(themeName);
			this.userPreferencesService.setUserPreferences(this.userPreferences);
		}
		this.themeService.changeTheme(themeName);
	}

	openChangeLog()
	{
		this.dialogService.open(ChangelogDialogComponent);
	}

	protected onInviteAccepted(data: IUserTicket)
	{
		this.firebaseService.addUserToProject(data).toPromise().then((values: any[]) =>
		{
			if(values[0])
			{
				const value: IUserTicket = values[0];
				UtilsService.showToast(
					this.toastrService,
					'User Added',
					`User successfully add to project ${value.title}`,
					'danger',
				);

				const idx = this.userNotifications.findIndex((u) => u.data.id === data.id);
				if(idx !== -1)
				{
					this.userNotifications.splice(idx, 1);
					this.userNotifications$.next(this.userNotifications);
					this.userNotificationsLen = this.userNotifications.length.toString();
				}
			}
		}).catch((e) => console.log(e));
	}
}
