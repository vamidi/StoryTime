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
import * as firebase from 'firebase/app';
import 'firebase/database';

export interface ObjectKeyValue<T>
{
	[key: string]: T;
}

/*
export function convertToBoolProperty(val: any): boolean {
	if (typeof val === 'string') {
		val = val.toLowerCase().trim();

		return (val === 'true' || val === '');
	}

	return !!val;
}
*/

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
				default:
					console.log(msg, optionalParams);
					break;
			}
		}
	}

	static onError(msg: any, ...optionalParams: any[])
	{
		if (!environment.production)
			console.error(msg, optionalParams);
	}

	static truncate(text: string, maxLength: number)
	{
		return text.length > maxLength ? `${ text.substring(0, maxLength)}...` : text;
	}

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
		const copy = Object.create(Object.getPrototypeOf(other));
		const propNames = Object.getOwnPropertyNames(other);

		propNames.forEach(function(name) {
			const desc = Object.getOwnPropertyDescriptor(other, name);
			Object.defineProperty(copy, name, desc);
		});

		return copy;
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
		return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
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
		if(str !== '' && char !== '') // /\s+/g
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

	// Array settings

	/**
	 * @brief Sort array in alphabetic order.
	 * @param arr - the array pushed
	 * @param key - the key to sort on
	 * @return array
	 */
	public static sortAlphabetic(arr: any[], key: string)
	{
		return arr.sort((a: any, b) => {
			if(a[key] < b[key]) { return -1; }
			if(a[key] > b[key]) { return 1; }
			return 0;
		});
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
	public static findDuplicates(arr: any[])
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
}
