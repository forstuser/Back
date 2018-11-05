/*jshint esversion: 6 */
'use strict';

import {createClient} from '@google/maps';
import request from 'request-promise';
import Promise from 'bluebird';
import {PhoneNumberUtil} from 'google-libphonenumber';
import _ from 'lodash';
import config from '../config/main';

const phoneUtil = PhoneNumberUtil.getInstance();
const googleMapsClient = createClient({
  key: config.GOOGLE.API_KEY,
});
Promise.promisifyAll(googleMapsClient);

const distanceMatrix = (origins, destinations) => {
  if (destinations.length > 25) {
    destinations = _.chunk(destinations, 25);
  }

  const promises = destinations.map((destinationsElem) => {
    return googleMapsClient.distanceMatrixAsync({
      origins: origins,
      destinations: destinationsElem,
    });
  });

  return Promise.all(promises).then((result) => {
    const rows = result.map((elem) => {
      return elem.json.rows;
    });

    return _.chain(rows).flatten().map((elem) => {
      return elem.elements;
    }).flatten().value();
  });
};

const isValidPhoneNumber = async phone => {
  return await Promise.try(() => {
    const regionCode = phoneUtil.getRegionCodeForCountryCode('91');
    if (regionCode.toUpperCase() === 'ZZ') {
      return false;
    }

    console.log('REGION CODE: ', regionCode);

    return phoneUtil.parse(phone, regionCode);
  }).then((phoneNumber) => {

    console.log('IS PHONE VALID: ', phoneUtil.isValidNumber(phoneNumber));
    console.log('PHONE NUMBER TYPE: ', phoneUtil.getNumberType(phoneNumber));
    // Allow only mobile and fixed_line_or_mobile to pass

    // return true;
    return phoneUtil.isValidNumber(phoneNumber) &&
        (phoneUtil.getNumberType(phoneNumber) === 0 ||
            phoneUtil.getNumberType(phoneNumber) === 1 ||
            phoneUtil.getNumberType(phoneNumber) === 2);
  });
};

const isValidGSTIN = async gstin => {
  const qs = {
    aspid: config.GST.ID, password: config.GST.PASSWORD, gstin,
    Action: config.GST.ACTION,
  };
  if (config.GST.ENABLED) {
    const gstDetails = await request({
      uri: `${config.GST.HOST}${config.GST.ROUTE}`,
      qs, json: true,
    });

    if (gstDetails.error && gstDetails.sts.toLowerCase() !== 'active') {
      return false;
    }

    return gstDetails;
  }
  return true;
};

export default {
  distanceMatrix,
  isValidPhoneNumber,
  isValidGSTIN,
};
