import { Injectable, OnDestroy } from '@angular/core';
import { Action, Actions, StateContext, Store } from '@ngxs/store';

import { NbToastrService } from '@nebular/theme';
import { NbAuthService } from '@nebular/auth';

import { of as observableOf, Observable, Subscription, BehaviorSubject } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs/observable/of';

import firebase from 'firebase/app';

import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFireDatabase } from '@angular/fire/database';
import { SnapshotAction } from '@angular/fire/database/interfaces';

import { environment } from '../../../../../environments/environment';

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
} from './user.model';

import { UserUpdate, Authenticated } from './user.actions';

import * as userActions from './user.actions';
type Action = userActions.All;

import { ProjectsService } from '@app-core/data/state/projects';
import { TablesService } from '@app-core/data/state/tables';
import { UtilsService } from '@app-core/utils';

import isEmpty from 'lodash.isempty';
import intersection from 'lodash.intersection';
import isEqual from 'lodash.isequal';

/**
 *
 */
@Injectable()
export class UserService extends UserData implements OnDestroy
{
	/**
	 * Checks whether the user is a super user.
	 * @return {boolean} returns true if user meets condition.
	 */
	public get isSuper(): boolean
	{
		return this.matchingRole(onlySuper);
	}

	/**
	 * Checks whether the user is a admin user.
	 * @return {boolean} returns true if user meets condition.
	 */
	public get isAdmin(): boolean
	{
		return this.matchingRole(onlyAdmin);
	}

	/**
	 * Checks whether the user is able to read certain data.
	 * @return {boolean} returns true if user meets condition.
	 */
	public get canRead(): boolean
	{
		return this.matchingRole(onlyReader);
	}

	/**
	 * Checks whether the user is able to edit certain data.
	 * @return {boolean} returns true if user meets condition.
	 */
	public get canEdit(): boolean
	{
		return this.matchingRole(onlyEdit);
	}

	/**
	 * Checks whether the user is able to delete certain data.
	 * @return {boolean} returns true if user meets condition.
	 */
	public get canDelete(): boolean
	{
		return this.matchingRole(onlySuper);
	}

	/**
	 * Checks whether the user is verified.
	 * @return {boolean} returns true if user meets condition.
	 */
	public get isVerified()
	{
		return this.firebaseUser ? this.firebaseUser.emailVerified : false;
	}

	// ************************************************
	// Observable Queries available for consumption by views
	// ************************************************

	// @Select()
	private user$: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null); // Observable<UserModel>;

	protected subscription: Subscription = new Subscription();

	private user: UserModel = null;

	private users: Map<string, UserModel> = new Map<string, UserModel>();

	private members: UserModel[] = [];

	private contacts: Contacts[] = [];

	private recentUsers: RecentUsers[] = [];

	private firebaseUser: firebase.User = null;

	private userRoles: string[] = [
		'reader',
	];

	/**
	 * Service that takes care of the user state
	 * @method {constructor}
	 * @param afd
	 * @param afAuth
	 * @param service
	 * @param toastrService
	 * @param actions$
	 * @param store
	 */
	constructor(
		protected afd: AngularFireDatabase,
		protected afAuth: AngularFireAuth,
		protected service: NbAuthService,
		protected toastrService: NbToastrService,
		private store: Store,
		private actions$: Actions,
	)
	{
		super();

		this.initUser();
	}

	public ngOnDestroy(): void
	{
		this.subscription.unsubscribe();
	}

	public setUserPermissions(projectService: ProjectsService)
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

		// TODO work out for multiple admin roles
		// this.userRoles.filter((role) => role !== onlySuper[0]);
	}

	public checkTablePermissions(tableService: TablesService): boolean
	{
		if(!this.user)
			return false;

		return this.canEdit || tableService.getTable().metadata.owner === this.user.uid;
	}

	public retrieveUserData(authData: firebase.User): Observable<Action>
	{
		const userRef$ = this.afd.list<any>(/* this, */`users/${authData.uid}`);
		return userRef$.snapshotChanges(['child_added', 'child_changed', 'child_removed']).pipe(
			map((snapshot: SnapshotAction<any>[] | null) =>
			{
				if(snapshot)
				{
					console.log(this.firebaseUser.uid);
					const user = new UserModel(authData.uid, authData.displayName);
					snapshot.forEach((member) => user[member.key] = member.payload.val());
					return new userActions.Authenticated(user);
				}

				/// User not logged in
				return new userActions.NotAuthenticated();
			}),
		);
	}

	/**
	 * Effects to be registered at the Module level
	 * @return {Observable} returns an observable with user information
	 */
	@Action(UserUpdate)
	public updateUser(ctx: StateContext<UserModel>, { payload }: UserUpdate)
	{
		console.log('updating user');
		// const currUser = ctx.getState();
		// ctx.patchState({ currUser, ...payload });
		// ctx.dispatch(new userActions.UserUpdateSuccess(payload));
		/*
		ofType(userActions.USER_UPDATE),
		map((action: userActions.UserUpdate) => action.payload ),
		// TODO also update firebase child
		mergeMap(payload => from(this.afAuth.currentUser).pipe(
			mergeMap(user => from(user.updateProfile({
					displayName: payload.metadata.displayName,
					photoURL: payload.metadata.photoURL,
				}),
			)),
		)),
		map(() => new userActions.UserUpdateSuccess()),
		catchError(err => of (new userActions.UserUpdateFail( { error: err.message } )) ),
		 */
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

	public resendMail(): Promise<void>
	{
		return this.firebaseUser.sendEmailVerification();
	}

	private matchingRole(allowedRoles: any[]): boolean
	{
		// TODO retrieve current project
		return !isEmpty(intersection(allowedRoles, this.userRoles));
	}

	private initUser()
	{

		if(environment.redux)
		{
			// See if the user is logged in
			this.subscription.add(this.afAuth.authState.pipe(
				switchMap((user: firebase.User ) =>
				{
					if (user)
					{
						this.firebaseUser = user;
						UtilsService.onDebug(user.uid);
						const userRef$ = this.afd.list<any>(/* this, */`users/${user.uid}`);
						return userRef$.snapshotChanges(['child_added', 'child_changed', 'child_removed']);
					}

					return of(null);
				}),
			).subscribe((snapshot: SnapshotAction<any>[] | null) =>
			{
				if(snapshot)
				{
					// console.log(this.firebaseUser.uid);
					const userModel: User = new UserModel(this.firebaseUser.uid, this.firebaseUser.displayName);
					snapshot.forEach((member) => userModel[member.key] = member.payload.val());
					this.store.dispatch(new Authenticated(userModel));
				}
			}));
			return;
		}

		this.subscription.add(this.afAuth.authState.pipe(
			switchMap((user: firebase.User ) =>
			{
				if (user)
				{
					this.firebaseUser = user;
					UtilsService.onDebug(user.uid);
					const userRef$ = this.afd.list<any>(/* this, */`users/${user.uid}`);
					return userRef$.snapshotChanges(['child_added', 'child_changed', 'child_removed']);
				}

				return of(null);
			}),
		).subscribe((snapshot: SnapshotAction<any>[] | null) =>
		{
			if(snapshot)
			{
				// console.log(this.firebaseUser.uid);
				const userModel: User = new UserModel(this.firebaseUser.uid, this.firebaseUser.displayName);
				snapshot.forEach((member) => userModel[member.key] = member.payload.val());
				this.setUser(this.firebaseUser.uid, userModel);
				return;
			}

			this.user$.next(null);
		}));

	}
}
