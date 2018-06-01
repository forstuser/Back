/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _accessory = require('../Adaptors/accessory');

var _accessory2 = _interopRequireDefault(_accessory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let modals;
let accessoryAdaptor;

class AccessoryController {
  constructor(modal) {
    accessoryAdaptor = new _accessory2.default(modal);
    modals = modal;
  }

  static getAccessories(request, reply) {

    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter

      return accessoryAdaptor.getAccessoriesList({
        user_id: user.id || user.ID,
        queryOptions: request.query
      }).then(result => reply.response({
        status: true,
        result
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        console.log(err);
        return reply.response({
          status: false,
          message: 'Unable to retrieve accessories data'
        });
      });
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  static getOrderHistory(request, reply) {

    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      accessoryAdaptor.getOrderHistory({
        user_id: user.id || user.ID
      }).then(result => reply.response({
        status: true,
        result
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        return reply.response({
          status: false,
          message: 'Unable to retrieve order history'
        });
      });
    } else {
      return _shared2.default.preValidation(request.pre, reply);
    }
  }

  // static functionName(request, reply) {
  //
  //   const user = shared.verifyAuthorization(request.headers);
  //   if (request.pre.userExist && !request.pre.forceUpdate) {
  //     // this is where make us of adapter
  //
  //   } else {
  //     return shared.preValidation(request.pre, reply);
  //   }
  // }

}

exports.default = AccessoryController;