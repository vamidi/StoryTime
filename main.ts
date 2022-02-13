import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { closeServer, startServer } from './src/api/server';

// Initialize remote module
require('@electron/remote/main').initialize();

// this.options = environment.production ? { path: path.resolve(process.cwd(), '.env.production') } : {}
// read environment variables from .env file
require('dotenv').config();

let win: BrowserWindow = null;
const args = process.argv.slice(1),
	serve = args.some(val => val === '--serve');

const createWindow: () => BrowserWindow = () =>
{
	const size = screen.getPrimaryDisplay().workAreaSize;
	const iconPath = __dirname + serve ? 'src/assets/images/favicon/favicon.ico' : 'assets/images/favicon/favicon.ico';
	// Create the browser window.
	win = new BrowserWindow({
		x: 0,
		y: 0,
		width: size.width,
		height: size.height,
		webPreferences: {
			nodeIntegration: true,
			allowRunningInsecureContent: (serve), // only allow scripts if we are serving the app online as well.
			contextIsolation: false, // false if you want to run 2e2 test with Spectron
			// true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
			enableRemoteModule: true,
		},
		icon: iconPath,
	});

	if (serve) {

		win.webContents.openDevTools();

		require('electron-reload')(__dirname, {
			electron: require(`${__dirname}/node_modules/electron`),
		});
		win.loadURL('http://localhost:4200');

	} else {
		win.loadURL(url.format({
			pathname: path.join(__dirname, 'dist/index.html'),
			protocol: 'file:',
			slashes: true,
		}));
	}

	// Emitted when the window is closed.
	win.on('closed', () => {
		// Dereference the window object, usually you would store window
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null;
	});

	return win;
}

try {
	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	// Added 400 ms to fix the black background issue while using transparent window.
	// More details at https://github.com/electron/electron/issues/15947
	app.on('ready', () => setTimeout(createWindow, 400));

	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
		closeServer();

		// On OS X it is common for applications and their menu bar
		// to stay active until the user quits explicitly with Cmd + Q
		if (process.platform !== 'darwin') {
			app.quit();
		}
	});

	app.on('activate', () => {
		// On OS X it's common to re-create a window in the app when the
		// dock icon is clicked and there are no other windows open.
		if (win === null) {
			createWindow();
		}
	});

} catch (e) {
	// Catch Error
	// throw e;
}

ipcMain.on('saveConfig', (event, args) => {
	console.log(args);

	// set the new config in the file
	const PATH_TO_CONFIG = `./src/assets/data/config.json`;
	fs.writeFile(PATH_TO_CONFIG, JSON.stringify(args, null, '\t'), {flag: 'w', encoding: 'utf8'}, function (err) {
		if (err) {
			console.log(err);
		}
		console.log(`Wrote variables to ${PATH_TO_CONFIG}`);

		// send info back that we have set the config file.
		event.sender.send('setConfig');
	});
});

// start express for call to prisma
ipcMain.on('startServer', (event, args) => startServer());
