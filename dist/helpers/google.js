/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _maps = require('@google/maps');

var _requestPromise = require('request-promise');

var _requestPromise2 = _interopRequireDefault(_requestPromise);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _googleLibphonenumber = require('google-libphonenumber');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _main = require('../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const phoneUtil = _googleLibphonenumber.PhoneNumberUtil.getInstance();
const googleMapsClient = (0, _maps.createClient)({
  key: _main2.default.GOOGLE.API_KEY
});
_bluebird2.default.promisifyAll(googleMapsClient);

const distanceMatrix = (origins, destinations) => {
  if (destinations.length > 25) {
    destinations = _lodash2.default.chunk(destinations, 25);
  }

  const promises = destinations.map(destinationsElem => {
    return googleMapsClient.distanceMatrixAsync({
      origins: origins,
      destinations: destinationsElem
    });
  });

  return _bluebird2.default.all(promises).then(result => {
    const rows = result.map(elem => {
      return elem.json.rows;
    });

    return _lodash2.default.chain(rows).flatten().map(elem => {
      return elem.elements;
    }).flatten().value();
  });
};

const isValidPhoneNumber = async phone => {
  return await _bluebird2.default.try(() => {
    const regionCode = phoneUtil.getRegionCodeForCountryCode('91');
    if (regionCode.toUpperCase() === 'ZZ') {
      return false;
    }

    console.log('REGION CODE: ', regionCode);

    return phoneUtil.parse(phone, regionCode);
  }).then(phoneNumber => {

    console.log('IS PHONE VALID: ', phoneUtil.isValidNumber(phoneNumber));
    console.log('PHONE NUMBER TYPE: ', phoneUtil.getNumberType(phoneNumber));
    // Allow only mobile and fixed_line_or_mobile to pass

    // return true;
    return phoneUtil.isValidNumber(phoneNumber) && (phoneUtil.getNumberType(phoneNumber) === 0 || phoneUtil.getNumberType(phoneNumber) === 1 || phoneUtil.getNumberType(phoneNumber) === 2);
  });
};

const isValidGSTIN = async gstin => {
  const qs = {
    aspid: _main2.default.GST.ID, password: _main2.default.GST.PASSWORD, gstin,
    Action: _main2.default.GST.ACTION
  };
  if (_main2.default.GST.ENABLED) {
    const gstDetails = await (0, _requestPromise2.default)({
      uri: `${_main2.default.GST.HOST}${_main2.default.GST.ROUTE}`,
      qs, json: true
    });

    if (gstDetails.error && gstDetails.sts.toLowerCase() !== 'active') {
      return false;
    }

    return gstDetails;
  }
  return true;
};

exports.default = {
  distanceMatrix,
  isValidPhoneNumber,
  isValidGSTIN
};