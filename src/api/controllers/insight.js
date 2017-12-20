/*jshint esversion: 6 */
'use strict';

import InsightAdaptor from '../Adaptors/insight';
import shared from '../../helpers/shared';

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
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			reply(insightAdaptor
				.prepareInsightData(user, request))
				.code(200);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate})
		}
	}

	static retrieveInsightForSelectedCategory(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
		if (!user) {
			reply({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
			});
		} else if (user && !request.pre.forceUpdate) {
			reply(insightAdaptor
				.prepareCategoryInsight(user, request))
				.code(200);
		} else {
			reply({status: false, message: "Forbidden", forceUpdate: request.pre.forceUpdate});
		}
	}
}

export default InsightController;
