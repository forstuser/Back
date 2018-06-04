/*jshint esversion: 6 */
'use strict';

import shared from '../../helpers/shared';
import AccessoryAdaptor from '../Adaptors/accessory';

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
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        console.log(err);
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
        console.log(err);
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
          result: await accessoryAdaptor.getOrderHistory({
            user_id: (user.id || user.ID),
          }),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
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
        return reply.response({
          status: true,
          result: await accessoryAdaptor.createTransaction({
            'transaction_id': request.payload.transaction_id,
            'status_type': request.payload.status_type,
            'price': request.payload.price,
            'quantity': request.payload.quantity,
            'seller_detail': request.payload.seller_detail,
            'delivery_date': request.payload.delivery_date,
            'product_id': request.payload.product_id,
            'accessory_product_id': request.payload.accessory_product_id,
            'payment_mode': request.payload.payment_mode,
            'details_url': request.payload.details_url,
            'delivery_address': request.payload.delivery_address,
            'online_seller_id': request.payload.online_seller_id,
            'user_id': user.id || user.ID,
          }),
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        return reply.response({
          status: false,
          message: 'Unable to retrieve order history',
        });
      }
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }
}

export default AccessoryController;
