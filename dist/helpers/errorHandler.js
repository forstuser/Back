/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _shared = require('./shared');

const curlyBrace = '{';
const bigBrace = '[';

/**
 *
 * @param {string} err error in callback.
 */
function handleError(err) {
	if (err) {
		_shared.logger.info(err);
	}
}

/**
 *
 * @param {string} body Body contain fields required to be added or updated by service.
 * @returns {object} body Body contain fields required to be added or updated by service.
 */
function parseStringToJson(body) {
	if (body && typeof body === 'string' && (body.indexOf(curlyBrace) === 0 || body.indexOf(bigBrace) === 0)) {
		return JSON.parse(body);
	}

	return body;
}

exports.default = (err, req, res, next) => {
	if (err) {
		try {
			res.status(err.status || 500).send(parseStringToJson(err.message));
			handleError(err.message);
		} catch (ex) {
			res.status(500).send(parseStringToJson(ex));
			handleError(ex);
		}
	}

	return next();
};