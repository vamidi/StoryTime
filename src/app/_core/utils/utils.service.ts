import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import {
	NbComponentStatus,
	NbGlobalLogicalPosition,
	NbGlobalPhysicalPosition,
	NbGlobalPosition,
	NbToastrService,
} from '@nebular/theme';
import { NbIconConfig } from '@nebular/theme/components/icon/icon.component';
import { NbSnackbarService } from '@app-theme/components/snackbar/snackbar.service';
import firebase from 'firebase/app'
import 'firebase/database';
import { Observable } from 'rxjs/Observable';
import { NbAuthResult } from '@nebular/auth';

import cloneDeep from 'lodash.clonedeep';
import { Parser, Value } from 'expr-eval';

export interface ObjectKeyValue<T>
{
	[key: string]: T;
}

export declare type NbThemeNames = 'default' | 'dark' | 'cosmic' | 'corporate';
export interface UserPreferences
{
	currentTheme: NbThemeNames;
	version: string,
	changelogSeen: boolean,
	gridModes: { [key: string]: boolean },
	recentUsedMenuItems: { title: string, icon?: string | NbIconConfig, link?: string }[],
	// table and all the columns
	visibleColumns: any,
	// table and all the column layouts
	indexColumns: any,
}

export enum DebugType
{
	LOG, // normal log output
	TRACE, // show trace of the log being logged
	TABLE, // show log in table form
	WARN,
	ERROR,
	// TODO add more
}


declare type PromiseExecutor<T> =
	(resolve: (value?: T | PromiseLike<T>) => void, reject: (reason?: any) => void) => void;

export class QueryablePromise<T> extends Promise<T>
{
	public get isPending() { return this.pending; }
	public get isResolved() { return this.resolved; }
	public get isRejected() { return this.rejected; }

	protected pending: boolean = false;
	protected resolved: boolean = false;
	protected rejected: boolean = false;

	public constructor (executor: PromiseExecutor<T>) {
		super((resolve, reject) => executor(
			data => {
				resolve(data)
				this.onExecuted()
			},
			err => {
				reject(err)
				this.onRejected()
			},
		))
		this.pending = true;
	}

	protected onExecuted()
	{
		this.resolved = true;
		this.pending = false;
	}

	protected onRejected()
	{
		this.rejected = true;
		this.pending = false;
	}
}

/** VERSIONING **/

/**
 * @brief - Options that we can provide to include
 * letters or extra zeros
 */
export interface SchedulerOptions { lexicographical?: boolean, zeroExtend?: boolean }

export interface IEvaluation
{
	readonly expression: string;
	evaluate(expression: string, values?: Value): number;
}

@Injectable()
export class UtilsService
{
	static readonly positions: string[] = [
		NbGlobalPhysicalPosition.TOP_RIGHT,
		NbGlobalPhysicalPosition.TOP_LEFT,
		NbGlobalPhysicalPosition.BOTTOM_LEFT,
		NbGlobalPhysicalPosition.BOTTOM_RIGHT,
		NbGlobalLogicalPosition.TOP_END,
		NbGlobalLogicalPosition.TOP_START,
		NbGlobalLogicalPosition.BOTTOM_END,
		NbGlobalLogicalPosition.BOTTOM_START,
	];

	// authorization code and tokens
	public authorizationCode: string;
	public oAuthToken: string;
	public oAuthVerifier: string;

	// popup related
	private windowHandle: Window;   // reference to the window object we will create
	private intervalId: any = null;  // For setting interval time between we check for authorization code or token
	private loopCount = 600;   // the count until which the check will be done, or after window be closed automatically.
	private intervalLength = 100;   // the gap in which the check will be done for code.

	/**
	 * @brief Parser class to transform formula's into equations and return the value.
	 */
	static Parser = class
	{
		/**
		 *
		 * @param expression
		 */
		public static parse(expression: string): IEvaluation
		{
			return {
				expression,
				evaluate: (rex) => Parser.parse(expression).evaluate(rex),
			};
		}

		/**
		 *
		 * @param expression
		 * @param rex
		 * @param debug
		 */
		public static evaluate(expression: string, rex?: { [key:string]: number }): number
		{
			return Parser.evaluate(expression, rex);
		}
	}

	static onDebug(msg: any, type: DebugType = DebugType.LOG, ...optionalParams: any[])
	{
		if (!environment.production)
		{
			switch(type) {
				case DebugType.LOG:
					console.log(msg, optionalParams);
					break;
				case DebugType.TRACE:
					console.trace(msg, optionalParams);
					break;
				case DebugType.TABLE:
					console.table(msg, optionalParams);
					break;
				case DebugType.WARN:
					console.warn(msg, optionalParams);
					break;
				case DebugType.ERROR:
					console.error(msg, optionalParams);
					break;
				default:
					console.log(msg, optionalParams);
					break;
			}
		}
	}

	static onWarn(msg: any, ...optionalParams: any[])
	{
		this.onDebug(msg, DebugType.WARN, optionalParams);
	}

	static onError(msg: any, ...optionalParams: any[])
	{
		this.onDebug(msg, DebugType.ERROR, optionalParams);
	}

	static onAssert(value: any, message?: string, ...optionalParams: any[])
	{
		if (!environment.production)
			console.assert(value, message, optionalParams);

		// TODO fix node assert
		// assert(value, message);
	}

	static truncate(text: string, maxLength: number)
	{
		return text.length > maxLength ? `${ text.substring(0, maxLength)}...` : text;
	}

	/**
	 * @brief - Show notification
	 * @param service
	 * @param title - title of the notification
	 * @param body - body of the notification
	 * @param type - type of notification
	 * @param duration - How long the notification should stay on screen.
	 * @param position - Position on screen.
	 * @param hasIcon - If it should consist of an icon.
	 * @param preventDuplicates - Prevent to have duplicate notifications.
	 * @param destroyByClick - If you can remove notification by clicking.
	 */
	public static showToast(
		service: NbToastrService,
		title: string,
		body: string,
		type: NbComponentStatus = 'primary',
		duration: number = 2000,
		position: NbGlobalPosition = NbGlobalPhysicalPosition.TOP_RIGHT,
		hasIcon: boolean = true,
		preventDuplicates: boolean = true,
		destroyByClick: boolean = false)
	{
		const config = {
			status: type,
			destroyByClick: destroyByClick,
			duration: duration,
			hasIcon: hasIcon,
			position: position,
			preventDuplicates: preventDuplicates,
		};
		const titleContent = title ? `${title}` : '';

		service.show(body, `${titleContent}`, config);
	}

	public static showSnackbar(
		service: NbSnackbarService,
		title: string,
		body: string,
		onClick: Function,
		type: NbComponentStatus = 'basic',
		duration: number = 6000,
		position: NbGlobalPosition = NbGlobalLogicalPosition.BOTTOM_START,
		hasIcon: boolean = true,
		preventDuplicates: boolean = true,
	)
	{
		const config = {
			click: onClick,
			status: type,
			duration: duration,
			hasIcon: hasIcon,
			position: position,
			preventDuplicates: preventDuplicates,
		};

		service.show(body, title, config);
	}

	/**
	 * @brief - Copy object
	 * @param other
	 */
	static copyObj<T extends any>(other: T): T
	{
		// const copy = Object.create(Object.getPrototypeOf(other));
		// const propNames = Object.getOwnPropertyNames(other);
		//
		// propNames.forEach(function(name) {
		// 	const desc = Object.getOwnPropertyDescriptor(other, name);
		// 	Object.defineProperty(copy, name, desc);
		// });

		return cloneDeep(other) as T;
	}

	/**
	 * @brief store the somewhat cookie item
	 * @param key
	 * @param value
	 */
	static setItemInLocalStorage(key: string, value: Object)
	{
		localStorage.setItem(key, JSON.stringify(value));
	}

	/**
	 * @brief create a sort of cookie item to retrieve back
	 * @param key
	 * @param defaultValue
	 * @param create
	 */
	static getItemFromLocalStorage(key: string, defaultValue: Object = {}, create: boolean = false): any
	{
		const value: string | null = localStorage.getItem(key);
		if (value === null || value === undefined || value === 'undefined')
		{
			if(create) UtilsService.setItemInLocalStorage(key, defaultValue);
			return defaultValue;
		}
		return JSON.parse(value);
	}

	/**
	 * @brief -
	 * @param word
	 */
	public static titleCaseFirst(word: string)
	{
		if (!word) return word;
		return word[0].toUpperCase() + word.substr(1);
	}

	public static titleCase(str: string)
	{
		const splitStr = str.toLowerCase().split(' ');
		for (let i = 0; i < splitStr.length; i++) {
			// You do not need to check if i is larger than splitStr length, as your for does that for you
			// Assign it back to the array
			splitStr[i] = splitStr[i].charAt(0).toUpperCase() + splitStr[i].substring(1);
		}
		// Directly return the joined string
		return splitStr.join(' ');
	}

	/**
	 * @brief transforms the camelized string back
	 * to uppercase.
	 * @param str
	 */
	public static title(str: string)
	{
		let word = str;
		word = word.replace(/([A-Z])/g, ' $1').trim();
		word = word.charAt(0).toUpperCase() + word.substr(1);

		return word;
	}

	public static camelize(str: string)
	{
		if (!str) return str;
		return str.replace(/^\w|[A-Z]|\b\w/g, (word, index) =>
			index === 0 ? word.toLowerCase() : word.toUpperCase(),
		).replace(/\s+/g, '');
	}

	/**
	 * @brief - replace character in a string by a regular expression
	 * @param str
	 * @param regex
	 * @param char
	 */
	static replaceCharacter(str: string, regex: string | RegExp, char: string)
	{
		if(str !== '') // /\s+/g
			return str.replace(regex, char);

		return str;
	}

	public static replaceRegex(value: string, replaceValue: string, regex: RegExp)
	{
		return this.replaceCharacter(value, regex, replaceValue);
	}

	public static titleLowerCase(value: string, replacingChar: string = '-')
	{
		return value.replace(/\s+/g, replacingChar).toLowerCase();
	}

	/**
	 * @brief - Rename a property of an object.
	 * @param obj
	 * @param oldName
	 * @param newName
	 */
	public static renameProperty<T = any>(obj: T, oldName: string, newName: string): T {
		// Do nothing if the names are the same
		if (oldName === newName) {
			return obj;
		}

		// Check for the old property name to avoid a ReferenceError in strict mode.
		if (obj.hasOwnProperty(oldName)) {
			obj[newName] = obj[oldName];
			delete obj[oldName];
		}
		return obj;
	}

	/**
	 * @brief - Delete a property of an object.
	 * @param obj
	 * @param key
	 */
	public static deleteProperty(obj: any, key: string): any
	{
		// Check for the old property name to avoid a ReferenceError in strict mode.
		if (obj.hasOwnProperty(key)) {
			delete obj[key];
		}
		return obj;
	}

	public static isNull(obj: any): boolean
	{
		return obj === undefined || obj === null;
	}

	// Array settings

	public static sortAlphabeticFunc(a: any, b: any, key:string)
	{
		if(a[key] < b[key]) { return -1; }
		if(a[key] > b[key]) { return 1; }
		return 0;
	}

	/**
	 * @brief Sort array in alphabetic order.
	 * @param arr - the array pushed
	 * @param key - the key to sort on
	 * @return array
	 */
	public static sortAlphabetic(arr: any[], key: string)
	{
		return arr.sort((a, b) => UtilsService.sortAlphabeticFunc(a, b, key));
	}

	public static removeElFromArray(array: any[], index: number, amount: number = 1): boolean
	{
		if (index > -1) {
			array.splice(index, amount);
			return true;
		}

		return false;
	}

	/**
	 * @brief - get duplicates from two arrays
	 */
	public static findDuplicates<T>(arr: T[]): T[]
	{
		const sorted_arr = arr.slice().sort(); // You can define the comparing function here.
		// JS by default uses a crappy string compare.
		// (we use slice to clone the array so the
		// original array won't be modified)
		const results = [];
		for (let i = 0; i < sorted_arr.length - 1; i++) {
			if (sorted_arr[i + 1] === sorted_arr[i]) {
				results.push(sorted_arr[i]);
			}
		}
		return results;
	}

	public static findNonDuplicates(arr: any[])
	{
		return arr.filter((v, i, a) => a.indexOf(v, i + 1) === -1 );
	}

	public static excludeDuplicates(arr: any[])
	{
		return arr.filter((value, index, self) => self.indexOf(value) === index);
	}

	public static isEqual(arr: number[], compare: number[])
	{
		return arr.length === compare.length && arr.sort().every(el => compare.includes(el))
	}

	/**
	 * @brief - Basic functions
	 * @return number
	public static getRandomId() {
		return Math.floor((Math.random() * 6) + 1);
	}
	 */

	// Time settings
	public static convertTimeStampToDate(value: number)
	{
		const t = new Date(1970, 0, 1); // Epoch
		t.setUTCSeconds(value);
		return this.pad(t.getDate()) + '-' +
			this.pad(t.getMonth() + 1) + '-' +
			this.pad(t.getFullYear()) + ' ' +
			this.pad(t.getHours()) + ':' +
			this.pad(t.getMinutes()) + ':' +
			this.pad(t.getSeconds());
	}

	public static get timestamp(): Object {
		return firebase.database.ServerValue.TIMESTAMP;
	}

	protected static pad(n: number): string
	{
		return `0${n}`.slice(-2);
	}

	/** Window settings */

	public doAuthorization(
		url: string, isRegisterAction: boolean, socialMediaProvider: string = '',
	): Observable<NbAuthResult>
	{
		/* isRegisterAction flag i am using to check if the process is for registration or Login */
		/* socialMediaProvider is for name of social media , it is optional*/

		let loopCount = this.loopCount;

		/* Create the window object by passing url and optional window title */
		this.windowHandle = UtilsService.createOauthWindow(url, 'OAuth login');

		/* Now start the timer for which the window will stay, and after time over window will be closed */
		this.intervalId = window.setInterval(() =>
		{
			if (loopCount-- < 0) {
				window.clearInterval(this.intervalId);
				this.windowHandle.close();
			} else {
				let href: string;  // For referencing window url
				try {
					href = this.windowHandle.location.href; // set window location to href string
				} catch (e) {
					// console.log('Error:', e); // Handle any errors here
				}
				if (href != null) {

					// Method for getting query parameters from query string
					const getQueryString = (field: any, _url: string) => {
						const windowLocationUrl = _url ? _url : href;
						const reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
						const string = reg.exec(windowLocationUrl);
						return string ? string[1] : null;
					};
					/* As i was getting code and oauth-token i added for same, you can replace with your expected variables */
					if (href.match('code')) {
						// for google , fb, github, linkedin
						window.clearInterval(this.intervalId);
						this.authorizationCode = getQueryString('code', href);
						this.windowHandle.close();
						if (isRegisterAction) {
							/* call signup method */
						} else {
							/* call login method */
						}
					} else if (href.match('oauth_token')) {
						// for twitter
						window.clearInterval(this.intervalId);
						this.oAuthToken = getQueryString('oauth_token', href);
						this.oAuthVerifier = getQueryString('oauth_verifier', href);
						this.windowHandle.close();
						if (isRegisterAction) {
							/* call signup */
						} else {
							/* call login */
						}
					}
				}
			}
		}, this.intervalLength);

		return undefined;
	}

	public static createOauthWindow(url: string, name = 'Authorization', width = 500, height = 600, left = 0, top = 0)
	{
		if (url == null) return null;
		const options = `width=${width},height=${height},left=${left},top=${top}`;
		return window.open(url, name, options);
	}

	/** FILE **/
	public static blobToFile(blobFile: Blob, fileName:string): File
	{
		const file: any = blobFile;
		// A Blob() is almost a File() - it's just missing the two properties below which we will add
		file.lastModifiedDate = new Date();
		file.name = fileName;

		// Cast to a File() type
		return <File>blobFile;
	}

	/** VERSIONING **/

	/**
	 * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
	 *
	 * This function was born in http://stackoverflow.com/a/6832721.
	 *
	 * @param {string} v1 The first version to be compared.
	 * @param {string} v2 The second version to be compared.
	 * @param {object} [options] Optional flags that affect comparison behavior:
	 * <ul>
	 *     <li>
	 *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
	 *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
	 *         "1.2".
	 *     </li>
	 *     <li>
	 *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
	 *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
	 *     </li>
	 * </ul>
	 * @returns {number|NaN}
	 * <ul>
	 *    <li>0 if the versions are equal</li>
	 *    <li>a negative integer iff v1 < v2</li>
	 *    <li>a positive integer iff v1 > v2</li>
	 *    <li>NaN if either version string is in the wrong format</li>
	 * </ul>
	 *
	 * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
	 * @license This function is in the public domain. Do what you want with it, no strings attached.
	 */
	public static versionCompare(v1: string, v2: string, options: SchedulerOptions = null): number
	{
		const lexicographical = options && options.lexicographical,
			zeroExtend = options && options.zeroExtend;

		let v1parts: string[] | number[] = v1.split('.'),
			v2parts: string[] | number[] = v2.split('.');

		const isValidPart = (x: string) => (lexicographical ? /^\d+([A-Za-z]\d?)*$/ : /^\d+$/).test(x);

		if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
			return NaN;
		}

		if (zeroExtend) {
			while (v1parts.length < v2parts.length) v1parts.push('0');
			while (v2parts.length < v1parts.length) v2parts.push('0');
		}

		if (!lexicographical) {
			v1parts = v1parts.map(Number);
			v2parts = v2parts.map(Number);
		}

		for (let i = 0; i < v1parts.length; ++i)
		{
			if (v1parts[i] === v2parts[i]) {
				continue;
			}

			if (v2parts.length === i) {
				return 1; // v1 > v2
			}
			else return v1parts[i] > v2parts[i] ? 1 : -1; // if 1 v1 > v2 if -1 v1 < v2
		}

		if (v1parts.length !== v2parts.length)
			return -1; // v1 < v2

		// versions are equal
		return 0;
	}

	/** ENCRYPTION **/

	/**
	 * @brief - Hash string
	 * https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
	 * @param word
	 */
	public static hashCode(word: string): number
	{
		if(word === null || typeof word === undefined)
			return 0;

		let hash = 0, i, chr;
		if (word.length === 0) return hash;
		for (i = 0; i < word.length; i++) {
			chr   = word.charCodeAt(i);
			hash  = ((hash << 5) - hash) + chr;
			hash |= 0; // Convert to 32 bit integer
		}
		return hash;
	}
}
