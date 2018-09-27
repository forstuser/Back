/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import AccessoryAdaptor from '../Adaptors/accessory';
import config from '../../config/main';
import moment from 'moment/moment';

let modals;
let accessoryAdaptor;

class AccessoryController {
  constructor(modal) {
    accessoryAdaptor = new AccessoryAdaptor(modal);
    modals = modal;
  }

  static async getAccessoryCategories(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await accessoryAdaptor.getAccessoryCategories({
            user_id: (user.id || user.ID),
            queryOptions: request.query,
          }),
          default_ids: config.CATEGORIES.ACCESSORY,
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

  static async getAccessories(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await accessoryAdaptor.getAccessoriesList({
            user_id: (user.id || user.ID),
            queryOptions: request.query,
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
          message: 'Unable to retrieve accessories data',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async getOrderHistory(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        return reply.response({
          status: true,
          result: await accessoryAdaptor.getOrderHistory(
              {user_id: (user.id || user.ID)}),
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
          message: 'Unable to retrieve order history',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static async createTransaction(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        let {
          transaction_id, status_type, price, quantity,
          seller_detail, delivery_date, product_id, accessory_product_id,
          payment_mode, details_url, delivery_address, online_seller_id,
        } = request.payload;
        delivery_date = moment(delivery_date, moment.ISO_8601).isValid() ?
            moment(delivery_date, moment.ISO_8601) : moment().add(3, 'days');
        const user_id = user.id || user.ID;
        status_type = status_type || 1;
        return await accessoryAdaptor.createTransaction({
          transaction_id, status_type, price, quantity, seller_detail,
          delivery_date, product_id, accessory_product_id, payment_mode,
          details_url, delivery_address, online_seller_id, user_id,
        }, reply, request);
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
          message: 'Unable to create transaction',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }
}

export default AccessoryController;
