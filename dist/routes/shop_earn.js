/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareShopEarnRoute = prepareShopEarnRoute;

var _shop_earn = require('../api/controllers/shop_earn');

var _shop_earn2 = _interopRequireDefault(_shop_earn);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//Shop and earn routes
function prepareShopEarnRoute(modal, route, middleware) {

  const varController = new _shop_earn2.default(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/sku/list',
      handler: _shop_earn2.default.getSKUs,
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
      path: '/sku/{bar_code}/item',
      handler: _shop_earn2.default.getSKUItem,
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
      path: '/sku/{id}/detail',
      handler: _shop_earn2.default.getSKUItem,
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
      path: '/sku/reference/data',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.getReferenceData
      }
    });

    route.push({
      method: 'GET',
      path: '/sku/wishlist',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.getSKUWishList
      }
    });

    route.push({
      method: 'DELETE',
      path: '/sku/wishlist',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.clearSKUWishList
      }
    });

    route.push({
      method: 'POST',
      path: '/sku/wishlist',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.createSKUWishList,
        validate: {
          payload: {
            'id': [_joi2.default.number(), _joi2.default.allow(null)],
            'brand_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'main_category_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'category_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'sub_category_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'title': _joi2.default.string().required(),
            'hsn_code': [_joi2.default.string(), _joi2.default.allow(null)],
            'mrp': [_joi2.default.number(), _joi2.default.allow(null)],
            'quantity': _joi2.default.number().required(),
            'sku_measurement': [_joi2.default.object().keys({
              'id': [_joi2.default.number(), _joi2.default.allow(null)],
              'sku_id': [_joi2.default.number(), _joi2.default.allow(null)],
              'measurement_type': [_joi2.default.number(), _joi2.default.allow(null)],
              'measurement_value': [_joi2.default.number(), _joi2.default.allow(null)],
              'pack_numbers': [_joi2.default.number(), _joi2.default.allow(null)],
              'cashback_percent': [_joi2.default.number(), _joi2.default.allow(null)],
              'discount_percent': [_joi2.default.number(), _joi2.default.allow(null)],
              'bar_code': [_joi2.default.string(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/sku/past',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.addToPastSelection,
        validate: {
          payload: {
            'id': [_joi2.default.number(), _joi2.default.allow(null)],
            'brand_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'main_category_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'category_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'sub_category_id': [_joi2.default.number(), _joi2.default.allow(null)],
            'title': _joi2.default.string().required(),
            'hsn_code': [_joi2.default.string(), _joi2.default.allow(null)],
            'mrp': [_joi2.default.number(), _joi2.default.allow(null)],
            'quantity': _joi2.default.number().required(),
            'added_date': [_joi2.default.string(), _joi2.default.allow(null)],
            'sku_measurement': [_joi2.default.object().keys({
              'id': [_joi2.default.number(), _joi2.default.allow(null)],
              'sku_id': [_joi2.default.number(), _joi2.default.allow(null)],
              'measurement_type': [_joi2.default.number(), _joi2.default.allow(null)],
              'measurement_value': [_joi2.default.number(), _joi2.default.allow(null)],
              'pack_numbers': [_joi2.default.number(), _joi2.default.allow(null)],
              'cashback_percent': [_joi2.default.number(), _joi2.default.allow(null)],
              'discount_percent': [_joi2.default.number(), _joi2.default.allow(null)],
              'bar_code': [_joi2.default.string(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/expenses/init',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.initializeUserExpenses,
        description: 'Create Product.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            brand_name: [_joi2.default.string(), _joi2.default.allow(null)],
            main_category_id: _joi2.default.number(),
            category_id: _joi2.default.number(),
            brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
            colour_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            taxes: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            document_number: [_joi2.default.string(), _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/expenses/{product_id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.updateExpenses,
        description: 'Update Expense.',
        validate: {
          payload: {
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            taxes: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            document_number: [_joi2.default.string(), _joi2.default.allow(null)],
            document_date: _joi2.default.string().isoDate(),
            digitally_verified: [_joi2.default.boolean(), _joi2.default.allow(null)],
            home_delivered: [_joi2.default.boolean(), _joi2.default.allow(null)],
            is_complete: [_joi2.default.boolean(), _joi2.default.allow(null)]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/expenses/{product_id}/sku',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.updateExpenseSKUs,
        description: 'Update Expense SKU.',
        validate: {
          payload: {
            job_id: _joi2.default.number().required(),
            sku_items: _joi2.default.array().items(_joi2.default.object().keys({
              selling_price: [_joi2.default.number(), _joi2.default.allow(null)],
              quantity: _joi2.default.number().required(),
              sku_measurement_id: [_joi2.default.number(), _joi2.default.allow(null)],
              sku_id: _joi2.default.number().required(),
              cashback_job_id: [_joi2.default.number(), _joi2.default.allow(null)],
              seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
              added_date: _joi2.default.string().required()
            })).required()
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/wallet/details',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.getWalletDetail
      }
    });

    route.push({
      method: 'GET',
      path: '/cashback/details',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _shop_earn2.default.getCashBackTransactions
      }
    });
  }
}