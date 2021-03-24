// Allow angular using electron module (native node modules)
const fs = require('fs');
const f_angular = 'node_modules/@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/browser.js';

fs.readFile(f_angular, 'utf8', function (err, data) {
  if (err) {
    return console.log(err);
  }
  var result = data.replace(/target: "electron-renderer",/g, '');
  result = result.replace(/target: "web",/g, '');
  result = result.replace(/return {/g, 'return {target: "web",');

  fs.writeFile(f_angular, result, 'utf8', function (err) {
    if (err) return console.log(err);
  });
});

// File 'node_modules/rete/types/socket.d.ts' will be created or overwritten by default.
fs.copyFile('types/socket.d.ts', 'node_modules/rete/types/socket.d.ts', (err) => {
	if (err) throw err;
	console.log('socket.d.ts was copied to node_modules/rete/types/socket.d.ts\n');
});

/** Create environment file */
const { argv } = require('yargs');
const { version } = require('./package.json');

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

export const environment = {
   title: '${process.env.APP_NAME}',
   production: ${isProduction},
   appVersion: '${version}',
   firebase: {
   		apiKey: '${process.env.FIREBASE_API_KEY}',
		authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
		databaseURL: '${process.env.FIREBASE_DATABASE_URL}',
		projectId: '${process.env.FIREBASE_PROJECT_ID}',
		storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
		messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
		appId: '${process.env.FIREBASE_APP_ID}',
	},
};
`;

// write the content to the respective file
fs.writeFile(targetPath, environmentFileContent, { flag: 'w', encoding: 'utf8' }, function (err) {
	if (err) {
		console.log(err);
	}
	console.log(`Wrote variables to ${targetPath}`);
});
