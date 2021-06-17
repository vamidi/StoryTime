import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame } from 'electron';
import * as remote from '@electron/remote';
import * as childProcess from 'child_process';
import * as fs from 'fs';

@Injectable({
	providedIn: 'root',
})
export class ElectronService
{
	public readonly ipcRenderer: typeof ipcRenderer;
	public readonly webFrame: typeof webFrame;
	public readonly remote: typeof remote;
	public readonly childProcess: typeof childProcess;
	public readonly fs: typeof fs;

	get isElectron(): boolean {
		return !!(window && window.process && window.process.type);
	}

	constructor() {
		// Conditional imports
		if (this.isElectron) {
			this.ipcRenderer = window.require('electron').ipcRenderer;
			this.webFrame = window.require('electron').webFrame;

			// If you want to use remote object in renderer process, please set enableRemoteModule to true in main.ts
			// this.remote = window.require('@electron/remote');
			// console.log('remote - globalShortcut', this.remote.globalShortcut);

			this.childProcess = window.require('child_process');
			this.fs = window.require('fs');
		}
	}
}
