/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareAccessoryRoute = prepareAccessoryRoute;

var _accessory = require('../api/controllers/accessory');

var _accessory2 = _interopRequireDefault(_accessory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//accessoryRoute
function prepareAccessoryRoute(modal, route, middleware) {

  const varController = new _accessory2.default(modal);

  if (varController) {

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

    // route.push({
    //   method: 'POST',
    //   path: '/order',
    //   config: {
    //     auth: 'jwt',
    //     pre: [
    //       {
    //         method: middleware.checkAppVersion,
    //         assign: 'forceUpdate',
    //       },
    //       {
    //         method: middleware.updateUserActiveStatus,
    //         assign: 'userExist',
    //       },
    //     ],
    //     handler: controller.getaccessoryDetails,
    //     validation : {
    //       // add all the validation parameters here
    //       // amazon/flipkart product id
    //       // order id
    //       // quantity
    //       // if no product then add a product also
    //     }
    //   },
    // });
  }
}