// Allow angular using electron module (native node modules)
const fs = require('fs');
const f_angular = 'node_modules/@angular-devkit/build-angular/src/webpack/configs/browser.js';

if(fs.existsSync(f_angular)) {
	fs.readFile(f_angular, 'utf8', function (err, data) {
		if (err) {
			return console.log(err);
		}
		let result = data.replace(/target: "electron-renderer",/g, '');
		result = result.replace(/target: "web",/g, '');
		result = result.replace(/return {/g, 'return {target: "web",');

		fs.writeFile(f_angular, result, 'utf8', function (err) {
			if (err) return console.log(err);
		});
	});
}

/** Create environment file */
const { argv } = require('yargs');
const { name, version, release } = require('./package.json');
const path = require('path');
const v1parts = version.split('.');

// read the command line arguments passed with yargs
const environment = argv.environment;
const options = environment === 'prod' ? { path: path.resolve(process.cwd(), '.env.production') } : {};

// read environment variables from .env file
require('dotenv').config(options);

const isProduction = environment === 'prod';

const targetPath = isProduction
	? `./src/environments/environment.prod.ts`
	: `./src/environments/environment.ts`;

if (!process.env.FIREBASE_DATABASE_URL) {
	console.error('All the required environment variables were not provided!');
	process.exit(-1);
}


// we have access to our environment variables
// in the process.env object thanks to dotenv
const environmentFileContent = `
/**
 * @license
 * Copyright Akveo. All Rights Reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 */
// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses \`environment.ts\`, but if you do
// \`ng build --env=prod\` then \`environment.prod.ts\` will be used instead.
// The list of which env maps to which file can be found in \`.angular-cli.json\`.
import { IEnvironment } from '@app-core/interfaces/environment.interface';

export const environment: IEnvironment = {
   title: '${name}',
   production: ${isProduction},
   appVersion: '${version}',
   redux: ${process.env.REDUX},
   MAJOR: ${v1parts[0]},
   MINOR: ${v1parts[1]},
   RELEASE: '${v1parts[2]}${release}',
   provider: '${process.env.DATABASE_PROVIDER}',
   firebase: {
   		apiKey: '${process.env.FIREBASE_API_KEY}',
		authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
		databaseURL: '${process.env.FIREBASE_DATABASE_URL}',
		projectId: '${process.env.FIREBASE_PROJECT_ID}',
		storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
		messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
		appId: '${process.env.FIREBASE_APP_ID}',
	},
	prisma: {
		apiKey: '${process.env.FIREBASE_API_KEY}',
		authDomain: '${process.env.PRISMA_AUTH_DOMAIN}',
		hostUrl: '${process.env.PRISMA_HOST_URI}',
		projectId: '${process.env.FIREBASE_PROJECT_ID}',
		storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
		messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
		appId: '${process.env.FIREBASE_APP_ID}',
		secret: '${process.env.PRISMA_SECRET}',
	},
};
`

// write the content to the respective file
fs.writeFile(targetPath, environmentFileContent, { flag: 'w', encoding: 'utf8' }, function (err) {
	if (err) {
		console.log(err);
	}
	console.log(`Wrote variables to ${targetPath}`);
});
