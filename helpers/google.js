/*jshint esversion: 6 */
'use strict';

const Bluebird = require("bluebird");
const config = require("../config/main");
const util = require("util");
const googleMapsClient = require('@google/maps').createClient({
	key: config.GOOGLE.API_KEY
});

Bluebird.promisifyAll(googleMapsClient);

const distanceMatrix = function (origins, destinations) {
	return googleMapsClient.distanceMatrixAsync({
		origins: origins,
		destinations: destinations
	}).then((result) => {
		return result.json.rows;
		// console.log(util.inspect(result.json.rows, false, null));
	});
};


module.exports = {
	distanceMatrix: distanceMatrix
};


