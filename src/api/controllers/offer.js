/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import OfferAdaptor from '../Adaptors/offer';
import config from '../../config/main';

let modals;
let offerAdaptor;

class OfferController {
  constructor(modal) {
    offerAdaptor = new OfferAdaptor(modal);
    modals = modal;
  }

  static async getOfferCategories(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          categories: await offerAdaptor.getOfferCategories({
            queryOptions: request.query,
          }),
          default_ids: config.CATEGORIES.OFFER,
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve categories',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getOffers(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        const result = await offerAdaptor.getOfferList({
          user_id: (user.id || user.ID),
          queryOptions: request.query,
          paramOptions: request.params,
        }) || [];
        return reply.response(
            {status: true, result, trending: []});
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve offer data',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async updateOfferClickCount(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await offerAdaptor.updateOfferClickCounts({
            user_id: (user.id || user.ID),
            queryOptions: request.query,
            paramOptions: request.params,
          }),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user && !user.seller_detail  ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err,
          }),
        }).catch((ex) => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve offer data',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }
}

export default OfferController;
