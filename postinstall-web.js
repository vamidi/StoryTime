// Allow angular using electron module (native node modules)
const fs = require('fs');
const f_angular = 'node_modules/@angular-devkit/build-angular/src/webpack/configs/browser.js';

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

const init = require('./postinstall');
init();
