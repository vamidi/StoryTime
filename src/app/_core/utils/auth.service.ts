import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import * as firebase from 'firebase/app';
import 'firebase/auth';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/firestore';

import { UtilsService } from '@app-core/utils/utils.service';

@Injectable({ providedIn: 'root' })
export class AuthService
{
	constructor(
		protected afAuth: AngularFireAuth,
		protected afs: AngularFirestore,
		private router: Router,
	)
	{
		this.afAuth.onAuthStateChanged((user) =>
		{
			if(user)
			{
				localStorage.setItem('user', JSON.stringify(user));

				// expire after 3600 seconds (1 hour)
				UtilsService.setItemInLocalStorage('expire_at', new Date().getTime() + (3600 * 1000));

			} else {
				localStorage.setItem('user', null);
			}
		});
	}

	public async authenticate(email: string, password: string)
	{
		const credential = await this.afAuth.signInWithEmailAndPassword(email, password);
		UtilsService.onDebug(credential);
		// this.userData = credential.user;
		return this.updateUserData(credential.user);
	}

	async googleSignIn()
	{
		const provider = new firebase.auth.GoogleAuthProvider();
		const credential = await this.afAuth.signInWithPopup(provider);
		return this.updateUserData(credential.user);
	}

	async signOut()
	{
		await this.afAuth.signOut();
		localStorage.removeItem('expires_at');
		return this.router.navigate(['login']);
	}

	public async updateUserData({ uid, email, displayName, photoURL }: firebase.User)
	{
		const userRef: AngularFirestoreDocument<{ uid, email, displayName, photoURL }> = this.afs.doc(`users/${uid}`);
		const data = {
			uid,
			email,
			displayName,
			photoURL,
		};

		UtilsService.onDebug(data);
		userRef.get().subscribe((user) => {
			UtilsService.onDebug(user.data());
		});
		return userRef.set(data, { merge : true });
	}

	// ...
	public isAuthenticated(): boolean
	{
		const user = UtilsService.getItemFromLocalStorage('user', null);
		// Check if current time is past access token's expiration
		const expiresAt = UtilsService.getItemFromLocalStorage('expires_at');
		// Check whether the token is expired and return
		// true or false
		return (user && expiresAt) /* && Date.now() < expiresAt */;
	}
}
