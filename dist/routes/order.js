'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareOrderRoutes = prepareOrderRoutes;

var _order = require('../api/controllers/order');

var _order2 = _interopRequireDefault(_order);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareOrderRoutes(modal, routeObject, middleware, socket) {
  const controllerInit = new _order2.default(modal, socket);
  if (controllerInit) {

    /*Retrieve Seller Order by id*/
    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/orders/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.getOrderDetails
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/orders',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.getOrderList
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/sellers/{seller_id}/orders/active',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.getActiveOrders
      }
    });

    /*Retrieve Consumer Order by id*/
    routeObject.push({
      method: 'GET',
      path: '/consumer/orders/{id}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _order2.default.getOrderDetails
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/approve',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.approveOrder,
        description: 'Approved order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: _joi2.default.number().required(),
            order_details: [_joi2.default.array().items(_joi2.default.object()), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/reject',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.rejectOrderFromConsumer,
        description: 'Reject order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: _joi2.default.number().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/consumer/orders/{order_id}/cancel',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.cancelOrderFromConsumer,
        description: 'Cancel order on behalf of Consumer.',
        validate: {
          payload: {
            seller_id: _joi2.default.number().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/orders',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _order2.default.getOrderList
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/consumer/orders/active',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _order2.default.getActiveOrders
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/consumer/orders/place',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _order2.default.placeOrder,
        description: 'Place order on behalf of User.',
        validate: {
          payload: {
            seller_id: _joi2.default.number().required(),
            order_type: _joi2.default.number().required(),
            user_address_id: [_joi2.default.number(), _joi2.default.allow(null)],
            user_address: [_joi2.default.object({
              address_line_1: [_joi2.default.string(), _joi2.default.allow(null)],
              address_line_2: [_joi2.default.string(), _joi2.default.allow(null)],
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              city_id: [_joi2.default.number(), _joi2.default.allow(null)],
              state_id: [_joi2.default.number(), _joi2.default.allow(null)],
              locality_id: [_joi2.default.number(), _joi2.default.allow(null)],
              address_type: [_joi2.default.number(), _joi2.default.allow(null)],
              pin: [_joi2.default.string(), _joi2.default.allow(null)],
              latitude: [_joi2.default.number(), _joi2.default.allow(null)],
              longitude: [_joi2.default.number(), _joi2.default.allow(null)],
              output: 'data',
              parse: true
            }), _joi2.default.allow(null)],
            service_type_id: [_joi2.default.number(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/modify',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.modifyOrder,
        description: 'Modify order on behalf of Seller.',
        validate: {
          payload: {
            user_id: _joi2.default.number().required(),
            order_details: [_joi2.default.array().items(_joi2.default.object()), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/approve',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.approveOrder,
        description: 'Approved order on behalf of Seller.',
        validate: {
          payload: {
            user_id: _joi2.default.number().required(),
            order_details: [_joi2.default.array().items(_joi2.default.object()), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/reject',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.rejectOrderFromSeller,
        description: 'Reject order on behalf of Seller.',
        validate: {
          payload: {
            user_id: _joi2.default.number().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/orders/{order_id}/outfordelivery',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _order2.default.orderOutForDelivery,
        description: 'Approved order on behalf of Seller.',
        validate: {
          payload: {
            user_id: _joi2.default.number().required(),
            delivery_user_id: _joi2.default.number().required(),
            order_details: [_joi2.default.array().items(_joi2.default.object()), _joi2.default.allow(null)]
          }
        }
      }
    });
  }
}