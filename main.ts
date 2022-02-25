import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';

const { spawn } = require("child_process");
const StreamZip = require('node-stream-zip');
const zip = new StreamZip.async({ file: './next/next.zip' });

import { app, BrowserWindow, ipcMain, screen, dialog } from 'electron';
import { ChildProcess, ChildProcessWithoutNullStreams, SpawnOptionsWithoutStdio } from 'child_process';

// TODO move this function to better place.
// This function will output the lines from the script
// and will return the full combined output
// as well as exit code when it's done (using the callback).
function run_script(command: string, args, options?: SpawnOptionsWithoutStdio, callback?: Function): any {
	const child = spawn(command, args, options);

	// You can also use a variable to save the output for when the script closes later
	child.on('error', (error) => {
		dialog.showMessageBox({
			title: 'Title',
			type: 'warning',
			message: 'Error occured.\r\n' + error
		});
	});

	child.stdout.setEncoding('utf8');
	child.stdout.on('data', (data) => {
		// Here is the output
		data = data.toString();
		console.log(data);
	});

	child.stderr.setEncoding('utf8');
	child.stderr.on('data', (data) => {
		// Return some data to the renderer process with the mainprocess-response ID
		win.webContents.send('mainprocess-response', data);
		// Here is the output from the command
		console.log(data);
	});

	child.on('close', (code) => {
		// Here you can get the exit code of the script
		switch (code) {
			case 0:
				dialog.showMessageBox({
					title: 'Title',
					type: 'info',
					message: 'End process.\r\n'
				});
			break;
		}
	});

	child.on('exit', () => {
		process.exit()
	});

	if (typeof callback === 'function')
		callback();

	return child;
}

function createConfig(args: string, callback?: Function) {
	const resourceFolder: string = serve ? './src' : process.resourcesPath;
	// set the new config in the file
	const PATH_TO_CONFIG = resourceFolder + '/assets/data/config.json';

	if(fs.existsSync(PATH_TO_CONFIG))
		return;

	fs.writeFile(PATH_TO_CONFIG, JSON.stringify(args, null, '\t'), {flag: 'w', encoding: 'utf8'}, function (err) {
		if (err) {
			console.log(err);
		}
		console.log(`Wrote variables to ${PATH_TO_CONFIG}`);

		if(callback) callback();
	});
}

function startServer() {
	// if we are serving the application we can
	// either start the server from the command line
	// or run it through the npm scripts.
	if(serve) return;

	// unpack the next zip file for server handling
	// zip.on('extract', (entry, file) => {
		// console.log(`Extracted ${entry.name} to ${file}`);
	// });

	zip.extract(null, './next').then((entry) => {
		// run server after the extraction
		serverProcess = run_script("npm", ["run start"], { shell: true, cwd: './next' }, null);

		zip.close().then();
	});
}

// Initialize remote module
require('@electron/remote/main').initialize();

// this.options = environment.production ? { path: path.resolve(process.cwd(), '.env.production') } : {}
// read environment variables from .env file
require('dotenv').config();

let win: BrowserWindow = null;
const args = process.argv.slice(1),
	serve = args.some(val => val === '--serve');

let serverProcess: ChildProcess = null;

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
		if(serverProcess) {
			const process: ChildProcessWithoutNullStreams = spawn("taskkill", ["/pid", serverProcess.pid, '/f', '/t']);
			process.kill();
		}

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

	createConfig(args, () => {
		// send info back that we have set the config file.
		event.sender.send('setConfig');
	});
});

// start express for call to prisma
ipcMain.on('startServer', (event, args) => {
	startServer();
});
