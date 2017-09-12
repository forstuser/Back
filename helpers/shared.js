/*jshint esversion: 6 */
'use strict';

const {verify} = require('jsonwebtoken');
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
	stringHasSubString
};
