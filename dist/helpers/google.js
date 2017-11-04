/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _maps = require('@google/maps');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _googleLibphonenumber = require('google-libphonenumber');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _main = require('../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var phoneUtil = _googleLibphonenumber.PhoneNumberUtil.getInstance();
var googleMapsClient = (0, _maps.createClient)({
	key: _main2.default.GOOGLE.API_KEY
});
_bluebird2.default.promisifyAll(googleMapsClient);

var distanceMatrix = function distanceMatrix(origins, destinations) {
	if (destinations.length > 25) {
		destinations = _lodash2.default.chunk(destinations, 25);
	}

	var promises = destinations.map(function (destinationsElem) {
		return googleMapsClient.distanceMatrixAsync({
			origins: origins,
			destinations: destinationsElem
		});
	});

	return _bluebird2.default.all(promises).then(function (result) {
		var rows = result.map(function (elem) {
			// console.log(util.inspect(elem, false, null));
			return elem.json.rows;
		});
		// console.log("~~~~~~~~");
		// console.log(util.inspect(flattenedRows, false, null));

		return _lodash2.default.chain(rows).flatten().map(function (elem) {
			return elem.elements;
		}).flatten().value();
	});
};

var isValidPhoneNumber = function isValidPhoneNumber(phone) {
	var regionCode = phoneUtil.getRegionCodeForCountryCode('91');
	if (regionCode.toUpperCase() === 'ZZ') {
		return false;
	}

	console.log('REGION CODE: ', regionCode);

	var phoneNumber = phoneUtil.parse(phone, regionCode);

	console.log('IS PHONE VALID: ', phoneUtil.isValidNumber(phoneNumber));
	console.log('PHONE NUMBER TYPE: ', phoneUtil.getNumberType(phoneNumber));
	// Allow only mobile and fixed_line_or_mobile to pass

	// return true;
	return phoneUtil.isValidNumber(phoneNumber) && (phoneUtil.getNumberType(phoneNumber) === 0 || phoneUtil.getNumberType(phoneNumber) === 1 || phoneUtil.getNumberType(phoneNumber) === 2);
};

exports.default = {
	distanceMatrix: distanceMatrix,
	isValidPhoneNumber: isValidPhoneNumber
};