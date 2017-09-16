/*jshint esversion: 6 */
'use strict';

const Bluebird = require("bluebird");
const config = require("../config/main");
const util = require("util");
const googleMapsClient = require('@google/maps').createClient({
	key: config.GOOGLE.API_KEY
});

const _ = require("lodash");

Bluebird.promisifyAll(googleMapsClient);

const distanceMatrix = function (origins, destinations) {
	if (destinations.length > 25) {
		destinations = _.chunk(destinations, 25);
	}

	const promises = destinations.map((destinationsElem) => {
		return googleMapsClient.distanceMatrixAsync({
			origins: origins,
			destinations: destinationsElem
		});
	});

	return Bluebird.all(promises).then((result) => {
		const rows = result.map((elem) => {
			// console.log(util.inspect(elem, false, null));
			return elem.json.rows;
		});
		const flattenedRows = _.chain(rows).flatten().map((elem) => {
			return elem.elements;
		}).flatten().value();
		// console.log("~~~~~~~~");
		// console.log(util.inspect(flattenedRows, false, null));

		return flattenedRows;
	});
};


module.exports = {
	distanceMatrix: distanceMatrix
};


