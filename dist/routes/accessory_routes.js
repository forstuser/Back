/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareAccessoryRoute = prepareAccessoryRoute;

var _accessory = require('../api/controllers/accessory');

var _accessory2 = _interopRequireDefault(_accessory);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//accessoryRoute
function prepareAccessoryRoute(modal, route, middleware) {

  const varController = new _accessory2.default(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/accessories/categories',
      handler: _accessory2.default.getAccessoryCategories,
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }]
      }
    });

    route.push({
      method: 'GET',
      path: '/accessories',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _accessory2.default.getAccessories
      }
    });

    route.push({
      method: 'GET',
      path: '/order/history',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _accessory2.default.getOrderHistory
      }
    });

    route.push({
      method: 'POST',
      path: '/order',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _accessory2.default.createTransaction,
        validate: {
          payload: {
            'transaction_id': _joi2.default.string().required(),
            'status_type': [_joi2.default.number(), _joi2.default.allow(null)],
            'price': [_joi2.default.number(), _joi2.default.allow(null)],
            'quantity': [_joi2.default.number(), _joi2.default.allow(null)],
            'online_seller_id': _joi2.default.number().required(),
            'seller_detail': [_joi2.default.object().keys({
              'name': [_joi2.default.string(), _joi2.default.allow(null)],
              'address': _joi2.default.number(),
              'phone': _joi2.default.string()
            }), _joi2.default.allow(null)],
            'delivery_address': [_joi2.default.string(), _joi2.default.allow(null)],
            'delivery_date': [_joi2.default.string(), _joi2.default.allow(null)],
            'product_id': _joi2.default.number().required(),
            'accessory_product_id': _joi2.default.number().required(),
            'payment_mode': [_joi2.default.number(), _joi2.default.allow(null)],
            'details_url': _joi2.default.string().required()
          }
        }
      }
    });
  }
}