/*jshint esversion: 6 */
'use strict';

const shared = require('../../helpers/shared');

const InsightAdaptor = require('../Adaptors/insight');

let insightAdaptor;

class InsightController {
	constructor(modal) {
		insightAdaptor = new InsightAdaptor(modal);
	}

	static retrieveCategorywiseInsight(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized'
			});
		} else {
			reply(insightAdaptor
				.prepareInsightData(user, request.query.mindate, request.query.maxdate))
				.code(200);
		}
	}

	static retrieveInsightForSelectedCategory(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized'
			});
		} else {
			reply(insightAdaptor
				.prepareCategoryInsight(user, request.params.id, request.query.pageno,
					request.query.mindate, request.query.maxdate,
					request.query.isyear, request.query.ismonth))
				.code(200);
		}
	}
}

module.exports = InsightController;
