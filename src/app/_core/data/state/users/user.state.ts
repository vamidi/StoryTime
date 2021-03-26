import { Injectable } from '@angular/core';

import * as userActions from './user.actions';
import { UserModel } from './user.model';
import { Action, State, StateContext } from '@ngxs/store';
import { Authenticated } from './user.actions';

export type Action = userActions.All;

export const defaultUser: UserModel = new UserModel(null, 'GUEST');


/// Reducer function
@State<UserModel>({
	name: 'user',
	defaults: defaultUser,
})
@Injectable()
export class UserState
{
	@Action(Authenticated)
	public onUserAuthenticated(ctx: StateContext<UserModel>, { payload }: Authenticated)
	{
		ctx.patchState(payload);
	}
}
/*
(state: UserModel = defaultUser, action: Action)
{
	switch (action.type)
	{
		case userActions.GET_USER:
			return { ...state, loading: true };

		case userActions.USER_UPDATE:
			return { ...state, loading: true };

		case userActions.USER_UPDATE_SUCCESS:
			return { ...state, ...action.payload, loading: false };

		case userActions.USER_UPDATE_FAILED:
			return { ...state, loading: false };

		case userActions.AUTHENTICATED:
			return { ...state, ...action.payload, loading: false };

		case userActions.NOT_AUTHENTICATED:
			return { ...state, ...defaultUser, loading: false };

		case userActions.AUTH_ERROR:
			return { ...state, ...action.payload, loading: false };

		case userActions.LOGOUT:
			return { ...state, loading: true };

		default:
			return state;
	}
}
*/
