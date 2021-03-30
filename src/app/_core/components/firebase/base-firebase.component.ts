import { OnDestroy, OnInit } from '@angular/core';
import { ObjectKeyValue, UserPreferences } from '@app-core/utils/utils.service';
import { FirebaseService } from '@app-core/utils/firebase.service';
import { UserService } from '@app-core/data/state/users';
import { UserPreferencesService } from '@app-core/utils/user-preferences.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { User, UserModel, defaultUser } from '@app-core/data/state/users';
import isEqual from 'lodash.isequal';
import { ProxyObject } from '@app-core/data/base';
import * as firebase from 'firebase';

/**
 * @brief simple base firebase implementation
 * where the class calculates the user permissions.
 */
export abstract class BaseFirebaseComponent implements OnInit, OnDestroy
{
	protected userPreferences: UserPreferences = null;

	protected user$: BehaviorSubject<UserModel> = new BehaviorSubject<UserModel>(null);
	protected user: UserModel = defaultUser;

	protected set setTblName(tblName: string)
	{
		this.tableName = tblName;
		this.firebaseService.setTblName(this.tableName);
	}

	// Main subscription to all events
	protected mainSubscription: Subscription = new Subscription();

	protected constructor(
		protected firebaseService: FirebaseService,
		protected userService: UserService,
		protected userPreferencesService: UserPreferencesService,
		protected tableName: string = '',
	) {

	}

	public ngOnInit(): void
	{
		this.mainSubscription.add(this.userPreferencesService.getUserPreferences().subscribe((userPreferences) =>
		{
			this.userPreferences = { ...userPreferences };

			if(!this.userPreferences.hasOwnProperty('visibleColumns'))
			{
				this.userPreferences.visibleColumns = new Map<string, ObjectKeyValue<boolean>>();
				this.userPreferencesService.setUserPreferences(this.userPreferences);
			}

			if(this.userPreferences.visibleColumns.length > 0)
				this.userPreferences.visibleColumns = new Map(this.userPreferences.visibleColumns);
			else
				this.userPreferences.visibleColumns = new Map<string, ObjectKeyValue<boolean>>();

			// Indexes
			if(!this.userPreferences.hasOwnProperty('indexColumns'))
			{
				this.userPreferences.indexColumns = new Map<string, ObjectKeyValue<number>>();
				this.userPreferencesService.setUserPreferences(this.userPreferences);
			}

			if(this.userPreferences.indexColumns.length > 0)
				this.userPreferences.indexColumns = new Map(this.userPreferences.indexColumns);
			else
				this.userPreferences.indexColumns = new Map<string, ObjectKeyValue<number>>();
		}));

		this.mainSubscription.add(this.userService.getUser().subscribe((user: User) =>
		{
			// Only push changed users.
			if(!isEqual(this.user, user))
			{
				this.user = user;
				this.user$.next(this.user);
				// const canDelete: boolean = !_.isEmpty(_.intersection( ['admin', 'author'], allowedRoles));
				this.onUserReceived(user);
			}
		}));
	}

	public ngOnDestroy(): void
	{
		if(!this.mainSubscription.closed)
			this.mainSubscription.unsubscribe();
	}

	protected updateFirebaseData(
		event: { data: ProxyObject, newData: ProxyObject, confirm?: any },
		obj: ProxyObject,
		oldObj: ProxyObject): Promise<void | string | firebase.database.Reference>
	{
		// TODO resolve if data is wrong or if we also need to do something with the lastID
		// console.log({ id: event.newData.id, tbl: this.tableName, obj, oldObj });
		return this.firebaseService.updateData(
			event.newData.id,this.tableName + '/revisions', obj, oldObj, this.tableName + '/data');
	}

	protected onUserReceived(__: User) { }
}
