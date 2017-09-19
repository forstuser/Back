/*jshint esversion: 6 */
'use strict';

const Bluebird = require("bluebird");
const request = require("request-promise");

const URL_ICUBES = 'http://tracking.icubeswire.com/aff_lsr';

const postbackTracking = function (transactionId, uniqueUserId) {
	return Bluebird.try(() => {
		const query = {
			transaction_id: transactionId,
			adv_sub: uniqueUserId
		};

		const options = {
			method: "GET",
			uri: URL_ICUBES,
			qs: query,
			json: true
		};

		return request(options);
	});
};

module.exports = {
	postbackTracking: postbackTracking
};