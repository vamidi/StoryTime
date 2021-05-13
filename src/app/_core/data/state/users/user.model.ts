import { BehaviorSubject, Observable } from 'rxjs';
import { UtilsService } from '@app-core/utils/utils.service';
import firebase from 'firebase/app';

export interface IUserTicket
{
	id?: string,
	uid: string,			// uid of the creator
	recipient: string		// uid of the recipient
	recipientName: string	// display name of the recipient
	email: string,			// email of the recipient
	token: string,			// token generated
	displayName: string,	// display name of the user that invited the recipient
	title: string			// title of the project.
	projectID: string,		// projectID we want to add the recipient to.
	pending: boolean,		// to see if the ticket is pending
	declined: boolean		// If the user declined the invited.
	roles: Roles			// Roles that the user is going to get
}

export interface IFoundAbleUser
{
	email: string,
	displayName: string,
}

export interface IUserResponse {
	users: IFoundAbleUser[],
}

export interface Roles {
	superAdmin?: boolean, // – A super is the owner of the project. This user is able to do everything inside a project
	admin?: boolean, // – somebody that has the same abilities as the super, except they can't rename/delete project
	editor?: boolean, // – somebody who can publish and manage tables including the tables of other users.
	author?: boolean, // – somebody who can publish and manage their own tables.
	subscriber?: boolean, // – somebody who can only manage their profile.
	// TODO see if we need this
	contributor?: boolean, // – somebody who can write and manage their own tables but cannot publish them.
	reader?: boolean,
}

export const onlySuper = ['superAdmin']
export const onlyAdmin = ['admin'];
export const onlyReader = ['reader'];
export const onlyEdit = ['superAdmin', 'admin', 'editor'];
export const onlyDelete = onlySuper;

interface IUserData {
	displayName?: string;
	email: string;
	firstName: string;
	lastName: string;
	photoURL?: string;
	created_at: Object;
	updated_at: Object;
}

export interface User
{
	/**
	 * @brief User Unique ID
	 */
	uid: string;

	/**
	 * @brief - User Metadata
	 */
	metadata: IUserData;

	/**
	 * @brief - Project data
	 * This explains which projects the player
	 * belongs to.
	 */
	projects: { [key: string]: { roles: Roles } };
}

export interface Contacts
{
	user: User;
	type: string;
}

export interface RecentUsers extends Contacts
{
	time: number;
}

export class UserModel implements User
{
	public metadata: IUserData = {
		displayName: '',
		email: '',
		firstName: '',
		lastName: '',
		photoURL: '',
		created_at: UtilsService.timestamp,
		updated_at: UtilsService.timestamp,
	}

	constructor(public uid: string, displayName: string)
	{
		this.metadata.displayName = displayName;
	}

	// Standard give the user privileges to access the project,
	// and read them.
	public projects: { [key: string]: { roles: Roles } } = { };
}

export abstract class UserData
{
	/**
	 * Checks whether the user is a super user.
	 * @return {boolean} returns true if user meets condition.
	 */
	abstract get isSuper(): boolean;

	/**
	 * Checks whether the user is a admin user.
	 * @return {boolean} returns true if user meets condition.
	 */
	abstract get isAdmin(): boolean;

	/**
	 * Checks whether the user is able to read certain data.
	 * @return {boolean} returns true if user meets condition.
	 */
	abstract get canRead(): boolean;

	/**
	 * Checks whether the user is able to edit certain data.
	 * @return {boolean} returns true if user meets condition.
	 */
	abstract get canEdit(): boolean;

	/**
	 * Checks whether the user is able to delete certain data.
	 * @return {boolean} returns true if user meets condition.
	 */
	abstract get canDelete(): boolean;

	/**
	 * Checks whether the user is verified.
	 * @return {boolean} returns true if user meets condition.
	 */
	abstract get isVerified();

	abstract getUser(): BehaviorSubject<UserModel>; // Observable<UserModel>;

	abstract getMembers(): Observable<User[]>;

	abstract getRecentUsers(): Observable<RecentUsers[]>;

	abstract getContacts(): Observable<Contacts[]>;
}
