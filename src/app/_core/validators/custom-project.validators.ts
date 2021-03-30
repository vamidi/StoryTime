import { AbstractControl } from '@angular/forms';
import { FirebaseService } from '../utils/firebase.service';
import { from, Observable, of as observableOf } from 'rxjs';
import { map, take, debounceTime } from 'rxjs/operators';
import { UtilsService } from '@app-core/utils';
import { UserModel } from '@app-core/data/state/users';
import firebase from 'firebase/app';
import DataSnapshot = firebase.database.DataSnapshot;

export class CustomProjectValidators
{
	public static validateProject(user: UserModel, firebaseService: FirebaseService):
		(control: AbstractControl) => Observable<{ projectAvailable: false } | null>
	{
		return (control: AbstractControl) =>
		{
			if (control.value)
			{
				const projectName = UtilsService.titleLowerCase(control.value);

				const ref = firebaseService.getRef('projects').orderByChild('metadata/owner').equalTo(user.uid);

				return from(ref
					.once('value', null,  (error) => console.log(error))).pipe(
						// delay query for when the user is typing
						debounceTime(1000),
						take(1),
						map((snapshots: DataSnapshot) => {
							if(snapshots.exists())
							{
								const arr = Object.values<any>(snapshots.val());
								for(let i = 0; i < arr.length; i++)
								{
									if(arr[i].metadata.alias === projectName)
										return { projectAvailable: false }
								}
							}
							return null;
						}),
					)
			}

			return observableOf(null);
		}
	}
}
