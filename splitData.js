/* jshint esversion: 6 */
'use strict';

const _ = require('lodash');
const Bluebird = require('bluebird');
const fs = require('fs');

Bluebird.promisifyAll(fs);

if (process.argv.length !== 3) {
	console.log('Usage ./splitData <file_in_the_same_directory>');
	process.exit(1);
}

console.log("FILE: ", process.argv[2]);

const ascList = require(process.argv[2]);

const splitData = _.chunk(ascList, 5000);

const filePromises = splitData.map((elem, index) => {
	return fs.writeFileAsync(index + '.json', JSON.stringify(elem));
});

Bluebird.all(filePromises).then(console.log).catch(console.log);