/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _accessory = require('../Adaptors/accessory');

var _accessory2 = _interopRequireDefault(_accessory);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals;
let accessoryAdaptor;

class AccessoryController {
  constructor(modal) {
    accessoryAdaptor = new _accessory2.default(modal);
    modals = modal;
  }

  static async getAccessoryCategories(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await accessoryAdaptor.getAccessoryCategories({
            user_id: user.id || user.ID,
            queryOptions: request.query
          }),
          default_ids: _main2.default.CATEGORIES.ACCESSORY
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve categories'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getAccessories(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        return reply.response({
          status: true,
          result: await accessoryAdaptor.getAccessoriesList({
            user_id: user.id || user.ID,
            queryOptions: request.query
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve accessories data'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async getOrderHistory(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      try {
        return reply.response({
          status: true,
          result: await accessoryAdaptor.getOrderHistory({
            user_id: user.id || user.ID
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve order history'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static async createTransaction(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      try {
        let {
          transaction_id, status_type, price, quantity,
          seller_detail, delivery_date, product_id, accessory_product_id,
          payment_mode, details_url, delivery_address, online_seller_id
        } = request.payload;
        const user_id = user.id || user.ID;
        status_type = status_type || 1;
        return reply.response({
          status: true,
          result: await accessoryAdaptor.createTransaction({
            transaction_id, status_type, price, quantity, seller_detail,
            delivery_date, product_id, accessory_product_id, payment_mode,
            details_url, delivery_address, online_seller_id, user_id
          })
        });
      } catch (err) {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        modals.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user ? user.id || user.ID : undefined,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to retrieve order history'
        });
      }
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }
}

exports.default = AccessoryController;