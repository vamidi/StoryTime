import { User } from './user.model';


/// Get User AuthState

export class GetUser {
	static readonly type = '[Auth] Get user';
	constructor(public payload?: any) {}
}

export class UserUpdate {
	static readonly type = '[Auth] User update';
	constructor(public payload?: any) {}
}

export class UserUpdateSuccess {
	readonly type = '[Auth] User update success';
	constructor(public payload?: any) {}
}

export class UserUpdateFail {
	static readonly type = '[Auth] User update fail';
	constructor(public payload?: any) {}
}

export class Authenticated {
	static readonly type = '[Auth] Authenticated';
	constructor(public payload?: User) {}
}

export class NotAuthenticated {
	static readonly type = '[Auth] Not Authenticated';
	constructor(public payload?: any) {}
}

export class AuthError {
	static readonly type = '[Auth] Error';
	constructor(public payload?: any) {}
}

/// Logout Actions

export class Logout {
	static readonly type = '[Auth] Logout';
	constructor(public payload?: any) {}
}


export type All
	= GetUser
	| UserUpdate
	| UserUpdateSuccess
	| UserUpdateFail
	| Authenticated
	| NotAuthenticated
	| AuthError
	| Logout;
