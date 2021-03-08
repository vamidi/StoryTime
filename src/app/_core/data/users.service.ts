import { of as observableOf, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { Injectable, OnDestroy } from '@angular/core';
import {
	Contacts,
	onlyAdmin,
	onlyEdit,
	onlyReader,
	onlySuper,
	RecentUsers,
	User,
	UserData,
	UserModel,
} from '../data/users';
import { switchMap } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { SnapshotAction } from '@angular/fire/database/interfaces';

import { NbToastrService } from '@nebular/theme';
import * as firebase from 'firebase';
import { ProjectService } from '@app-core/data/projects.service';
import { TablesService } from '@app-core/data/tables.service';
import { UtilsService } from '@app-core/utils';
import isEqual from 'lodash.isequal';
import isEmpty from 'lodash.isempty';
import intersection from 'lodash.intersection';

@Injectable()
export class UserService extends UserData implements OnDestroy
{
	public get isSuper(): boolean
	{
		return this.matchingRole(onlySuper);
	}

	public get isAdmin(): boolean
	{
		return this.matchingRole(onlyAdmin);
	}

	public get canRead(): boolean
	{
		return this.matchingRole(onlyReader);
	}

	public get canEdit(): boolean
	{
		return this.matchingRole(onlyEdit);
	}

	public get canDelete(): boolean
	{
		return this.matchingRole(onlySuper);
	}

	public get isVerified()
	{
		return this.firebaseUser ? this.firebaseUser.emailVerified : false;
	}

	protected subscription: Subscription = new Subscription();

	private user$: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null);

	private user: UserModel = null;

	private users: Map<string, UserModel> = new Map<string, UserModel>();

	private members: UserModel[] = [];

	private contacts: Contacts[] = [];

	private recentUsers: RecentUsers[] = [];

	private firebaseUser: firebase.User = null;

	private userRoles: string[] = [
		'reader',
	];

	constructor(
		protected afd: AngularFireDatabase,
		protected afAuth: AngularFireAuth,
		protected toastrService: NbToastrService,
	)
	{
		super();

		this.subscription.add(this.afAuth.authState.pipe(
			switchMap((user: firebase.User ) =>
			{
				if (user)
				{
					this.firebaseUser = user;
					UtilsService.onDebug(user.uid);
					const userRef$ = this.afd.list<any>(`users/${user.uid}`);
					return userRef$.snapshotChanges(['child_added', 'child_changed', 'child_removed']);
				}

				return of(null);
			}),
		).subscribe((snapshot: SnapshotAction<any>[] | null) =>
		{
			if(snapshot)
			{
				// console.log(this.firebaseUser.uid);
				const userModel: User = new UserModel();
				snapshot.forEach((member) => userModel[member.key] = member.payload.val());
				this.setUser(this.firebaseUser.uid, userModel);
				return;
			}

			this.user$.next(null);
		}));
	}

	public ngOnDestroy(): void
	{
		this.subscription.unsubscribe();
	}

	public setUserPermissions(projectService: ProjectService)
	{
		const project = projectService.getProject();
		if(this.user)
		{
			if(project)
				this.userRoles = ['subscriber', ...Object.keys(this.user.projects[project.id].roles)];
			else
				this.userRoles = ['subscriber'];
		}

		// if the user is owner of the project he can do everything
		if(this.user && project && project.metadata.owner === this.user.uid)
		{
			// add the superAdmin role
			this.userRoles = [...this.userRoles, ...onlySuper];
		}

		this.userRoles = UtilsService.excludeDuplicates(this.userRoles);
		console.log(this.userRoles);

		// TODO work out for multiple admin roles
		// this.userRoles.filter((role) => role !== onlySuper[0]);
	}

	public checkTablePermissions(tableService: TablesService): boolean
	{
		if(!this.user)
			return false;

		return this.canEdit || tableService.getTable().metadata.owner === this.user.uid;
	}

	public setUser(key: string, newUser: UserModel, current: boolean = true)
	{
		let user: UserModel | null;
		if(this.users.has(key))
		{
			user = { uid: key, ...newUser };
			if(!isEqual(user, this.users.get(key)))
				this.users.set(key, user);
		}
		else
		{
			user = { uid: key, ...newUser };
			this.users.set(key, user);
		}

		if(current)
		{
			this.user = user;
			this.user$.next(this.user);
		}
	}

	public getUser(): BehaviorSubject<User>
	{
		return this.user$;
	}

	public getMembers(): Observable<User[]>
	{
		return observableOf(this.members);
	}

	public getContacts(): Observable<Contacts[]>
	{
		return observableOf(this.contacts);
	}

	public getRecentUsers(): Observable<RecentUsers[]>
	{
		return observableOf(this.recentUsers);
	}

	public async setPersistence(persistence: firebase.auth.Auth.Persistence)
	{
		return this.afAuth.setPersistence(persistence);
	}

	public updateUserInfo(profile: User): Promise<void>
	{
		if(this.afAuth.user)
		{
			return this.afAuth.currentUser.then((user) =>
			{
				return user.updateProfile({
					displayName: profile.metadata.displayName,
					photoURL: profile.metadata.photoURL,
				});
			});
		}
	}

	public resendMail(): Promise<void>
	{
		return this.firebaseUser.sendEmailVerification();
	}

	private matchingRole(allowedRoles: any[]): boolean
	{
		// TODO retrieve current project\
		return !isEmpty(intersection(allowedRoles, this.userRoles));
	}
}
