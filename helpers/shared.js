/*jshint esversion: 6 */
'use strict';

const {verify} = require('jsonwebtoken');
const moment = require('moment');
const {readFileSync, readFile} = require('fs');
const url = require('url-join');
const dateFormat = require('dateformat');
const uuid = require('uuid');
const {stringify} = require('querystring');
const _ = require('lodash');
const path = require('path');
const config = require("../config/main");
const filePath = '';
const jsonFileType = '.json';
const utfFormatting = 'utf8';
const spaceString = ' ';
const basicStringConst = 'basic';
const emptyObject = {};
const emptyString = '';
const authorizationParamConst = 'authorization';
const readJSONFile = (fileName, lang) => new Promise((resolve, reject) => {
	const completeFilePath = path.resolve(__dirname, `${filePath}${fileName}${jsonFileType}`);
	readFile(completeFilePath, utfFormatting, (err, data) => {
		if (err) {
			reject(err);
		}
		try {
			resolve(JSON.parse(data));
		} catch (ex) {
			reject(ex);
		}
	});
});

/**
 *
 * @param {string} authorization The authorization Token in header
 * @returns {object} The Empty String
 */
function validateAccessToken(authorization) {
	if (!authorization) {
		return null;
	}
	// noinspection Eslint
	const data = config.JWT_SECRET;
	const auth = authorization.split(spaceString)[1];
	try {
		return verify(auth, data, {algorithms: ["HS512"]});
	} catch (e) {
		return null;
	}
}

/**
 *
 * @param {string} authorization The authorization Token in header
 * @returns {string} The Empty String
 */
function isAccessTokenBasic(authorization) {
	if (authorization.indexOf(basicStringConst) >= 0) {
		return emptyObject;
	}

	return validateAccessToken(authorization);
}

/**
 *
 * @param rootNode
 * @param currentField
 * @param defaultValue
 * @returns {*}
 */
function verifyParameters(rootNode, currentField, defaultValue) {
	return _.get(rootNode, currentField, defaultValue);
}

/**
 *
 * @param headers
 * @returns {string}
 */
function verifyAuthorization(headers) {
	return isAccessTokenBasic(verifyParameters(headers, authorizationParamConst, emptyString));
}

function sumProps(arrayItem, prop) {
    let total = 0;
    for (let i = 0; i < arrayItem.length; i += 1) {
        total += parseFloat(arrayItem[i][prop] || 0);
    }
    return total.toFixed(2);
}

const getAllDays = function() {
    let s = moment(moment.utc().subtract(6, 'd')).utc().startOf('d');
    const e = moment.utc();
    const a = [];
    while (s.valueOf() < e.valueOf()) {
        a.push({
            value: 0,
            purchaseDate: moment(s).utc()
        });
        s = moment(s).utc().add(1, 'd').startOf('d');
    }

    return a;
};


function retrieveDaysInsight(distinctInsight) {
    const allDaysInWeek = getAllDays();
    distinctInsight.map((item) => {
        const currentDate = moment(item.purchaseDate);
        for (let i = 0; i < allDaysInWeek.length; i += 1) {
            const weekData = allDaysInWeek[i];
            if (weekData.purchaseDate.valueOf() === currentDate.valueOf()) {
                weekData.value = item.value;
                weekData.purchaseDate = moment(weekData.purchaseDate);
                break;
            }
        }

        return item;
    });

    return allDaysInWeek.map(weekItem => ({
        value: weekItem.value,
        purchaseDate: moment(weekItem.purchaseDate),
        purchaseDay: moment(weekItem.purchaseDate).format('ddd')
    }));
}

const formatDate = (actualValue, dateFormatString) => dateFormat(actualValue, dateFormatString);
const prepareUrl = (basePath, ...relPath) => url(basePath, ...relPath);
const queryStringFromObject = queryObject => stringify(queryObject);
const retrieveHeaderValue = headers => ({
	authorization: verifyParameters(headers, authorizationParamConst, emptyString),
	CorrelationId: uuid.v4()
});
const iterateToCollection = (collection, callback, ...relativeItems) => {
	const result = [];
	_.forEach(collection, item => result.push(callback(item, relativeItems[0])));

	return result;
};
const stringHasSubString = (stringItem, subString) => _.includes(stringItem, subString);

module.exports = {
	readJSONFile,
	formatDate,
	prepareUrl,
	verifyParameters,
	queryStringFromObject,
	verifyAuthorization,
	retrieveHeaderValue,
	iterateToCollection,
	stringHasSubString,
    getAllDays,
    sumProps,
    retrieveDaysInsight
};
