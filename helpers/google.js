/*jshint esversion: 6 */
'use strict';

const Bluebird = require("bluebird");
const config = require("../config/main");
const util = require("util");
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
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

const isValidPhoneNumber = function (phone) {
	const regionCode = phoneUtil.getRegionCodeForCountryCode("91");
	if (regionCode.toUpperCase() === "ZZ") {
		return false;
	}

	console.log("REGION CODE: ", regionCode);

	const phoneNumber = phoneUtil.parse(phone, regionCode);

	console.log("IS PHONE VALID: ", phoneUtil.isValidNumber(phoneNumber));
	console.log("PHONE NUMBER TYPE: ", phoneUtil.getNumberType(phoneNumber));
	// Allow only mobile and fixed_line_or_mobile to pass

	// return true;
	return phoneUtil.isValidNumber(phoneNumber) && (phoneUtil.getNumberType(phoneNumber) === 0 || phoneUtil.getNumberType(phoneNumber) === 1 || phoneUtil.getNumberType(phoneNumber) === 2);
};

module.exports = {
	distanceMatrix: distanceMatrix,
	isValidPhoneNumber: isValidPhoneNumber
};


