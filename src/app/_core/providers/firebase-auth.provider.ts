/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { from, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { NbAuthStrategy, NbAuthResult } from '@nebular/auth';
import {
	NbPasswordAuthStrategyOptions,
} from '@nebular/auth/strategies/password/password-strategy-options';
import { NbAuthStrategyClass } from '@nebular/auth/auth.options';
import { AngularFireAuth } from '@angular/fire/auth';
import { NbAuthToken } from '@nebular/auth/services/token/token';

@Injectable()
export class NbFirebaseAuthStrategy extends NbAuthStrategy
{
	static setup(options: NbPasswordAuthStrategyOptions): [NbAuthStrategyClass, NbPasswordAuthStrategyOptions]
	{
		return [NbFirebaseAuthStrategy, options];
	}

	constructor(
		private afAuth: AngularFireAuth,
	) {
		super();

		// const tokenResult = this.afAuth.auth.currentUser.getIdTokenResult();
		// UtilsService.onDebug(tokenResult);
	}

	/**
	 * Firebase authentication.
	 *
	 * @param data any
	 * @returns Observable<NbAuthResult>
	 */
	public authenticate(data?: any): Observable<NbAuthResult>
	{
		const module = 'login';
		// const method = this.getOption(`${module}.method`);
		// const url = this.getActionEndpoint(module);
		// const requireValidToken = this.getOption(`${module}.requireValidToken`);

		// const actionEndpoint: string = this.getOption(`${module}.endpoint`);
		// const baseEndpoint: string = this.getOption('baseEndpoint');

		// this.afAuth.auth.currentUser.getIdToken()
		// 	.then((token) => {
		// 		console.log('the token is', token)
		// 	})
		// 	.catch((err) => {
		// 		console.error('Error refreshing id token', err)
		// 	});

		// TODO if google signup needed
		// const provider = new auth.GoogleAuthProvider();
		// return from(this.afAuth.auth.signInWithPopup(provider))

		return from(this.afAuth.signInWithEmailAndPassword(data.email, data.password))
		.pipe(
			map((res) =>
			{
				return this.processSuccess(res, this.getOption('login.redirect.success'),
					this.getOption('messages.getter')(module, res, this.options));
					// this.createToken(this.getOption('token.getter')(module, res, this.options), requireValidToken));
			}),
			// tap(user => {
			// 	console.log('signed in with email and password succesfully, user:', user);
			// }),
			catchError((error) => {
				return of(this.processFailure(error, this.getOption('resetPass.redirect.failure'),
						[error.message]));
				// return obs;
			}),
		);
	}

	/**
	 * Firebase restore password.
	 *
	 * @param data any
	 * @returns Observable<NbAuthResult>
	 */
	requestPassword(data?: any): Observable<NbAuthResult> {
		return from(this.afAuth.sendPasswordResetEmail(data.email))
			.pipe(
				map((res: any) => {
					return this.processSuccess(res, this.getOption('requestPass.redirect.success'), []);
				}),
				catchError((res) => {
					return of(this.processFailure(res,  this.getOption('requestPass.redirect.failure'),
					[res.message]));
			}));
	}

	/**
	 * Firebase reset password.
	 *
	 * @param data any
	 * @returns Observable<NbAuthResult>
	 */
	resetPassword({ code, password }): Observable<NbAuthResult>
	{
		const module = 'resetPassword';

		return from(this.afAuth.confirmPasswordReset(code, password))
			.pipe(
				map(() => {
					return new NbAuthResult(
						true,
						null,
						this.getOption(`${module}.redirect.success`),
						[],
						this.getOption(`${module}.defaultMessages`),
					);
				}),
				catchError((error) => of(this.processFailure(error, module))),
			);
	}

	/**
	 * Firebase logout.
	 *
	 * @param data any
	 * @returns Observable<NbAuthResult>
	 */
	logout(data?: any): Observable<NbAuthResult>
	{
		if(this.afAuth.currentUser)
		{
			const module = 'logout';

			return from(this.afAuth.signOut())
			.pipe(
				map((res) => {
					return this.processSuccess(res, this.getOption(`${module}.redirect.success`),
						this.getOption('messages.getter')(module, res, this.options));
				}),
				catchError((error) => {
					return of(this.processFailure(error, this.getOption(`${module}.redirect.failure`),
						[error.message]));
					// return obs;
				}),
			);
		}

		return of(this.processFailure({}, this.getOption(`${module}.redirect.failure`), []));
	}

	private processSuccess(response?: any, redirect?: any, messages?: any, token?: NbAuthToken): NbAuthResult {
		return new NbAuthResult(true, response, redirect, [], messages, token);
	}

	private processFailure(response?: any, redirect?: any, errors?: any): NbAuthResult {
		return new NbAuthResult(false, response, redirect, errors, []);
	}

	refreshToken(data?: any): Observable<NbAuthResult>
	{
		console.log('here');
		return undefined;
	}

	register(data?: any): Observable<NbAuthResult> {
		return undefined;
	}
}
