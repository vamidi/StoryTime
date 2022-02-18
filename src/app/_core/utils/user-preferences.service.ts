import { Injectable } from '@angular/core';
import { ObjectKeyValue, UserPreferences, UtilsService } from '@app-core/utils/utils.service';
import { BehaviorSubject } from 'rxjs';


@Injectable({ providedIn: 'root' })
export class UserPreferencesService
{
	protected userPreferences: BehaviorSubject<UserPreferences> = null;

	public constructor() {
		this.userPreferences = new BehaviorSubject<UserPreferences>(
			UtilsService.getItemFromLocalStorage('userPreferences', <UserPreferences>{
				currentTheme: 'default',
				version: '',
				changelogSeen: false,
				recentUsedMenuItems: [],
				visibleColumns: new Map<string, ObjectKeyValue<boolean>>(),
				indexColumns: new Map<string, ObjectKeyValue<number>>(),
				introSet: false,
				localServer: false,
			}, true),
		);
	}

	public getUserPreferences(): BehaviorSubject<UserPreferences>
	{
		return this.userPreferences;
	}

	public setUserPreferences(userPreferences: UserPreferences): void
	{
		// resolve the issue with parents in the NbMenuItems
		const arr: any[] = userPreferences.recentUsedMenuItems ?? [];
		arr.forEach((v, index: number, array: any[]) => {
			const arrItem: any = array[index];
			arrItem.parent = {};
			array[index] = arrItem;
		});

		if(userPreferences.hasOwnProperty('visibleColumns'))
			userPreferences.visibleColumns = Array.from(userPreferences.visibleColumns.entries());

		if(userPreferences.hasOwnProperty('indexColumns'))
			userPreferences.indexColumns = Array.from(userPreferences.indexColumns.entries());

		this.userPreferences.next(userPreferences);
		UtilsService.setItemInLocalStorage('userPreferences', userPreferences);
	}
}
