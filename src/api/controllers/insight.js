/*jshint esversion: 6 */
'use strict';

import InsightAdaptor from '../Adaptors/insight';
import shared from '../../helpers/shared';

let insightAdaptor;

class InsightController {
	constructor(modal) {
		insightAdaptor = new InsightAdaptor(modal);
	}

  static retrieveCategoryWiseInsight(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response(insightAdaptor
				.prepareInsightData(user, request))
				.code(200);
		} else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
		}
	}

	static retrieveInsightForSelectedCategory(request, reply) {
		const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
				status: false,
				message: 'Unauthorized',
				forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply.response(insightAdaptor
				.prepareCategoryInsight(user, request))
				.code(200);
		} else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
		}
	}
}

export default InsightController;
