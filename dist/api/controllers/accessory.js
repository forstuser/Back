/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _accessory = require('../Adaptors/accessory');

var _accessory2 = _interopRequireDefault(_accessory);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {default: obj};
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var modals = void 0;
var accessoryAdaptor = void 0;

var AccessoryController = function() {
  function AccessoryController(modal) {
    _classCallCheck(this, AccessoryController);

    accessoryAdaptor = new _accessory2.default(modal);
    modals = modal;
  }

  _createClass(AccessoryController, null, [
    {
      key: 'getAccessories',
      value: function getAccessories(request, reply) {

        var user = _shared2.default.verifyAuthorization(request.headers);
        if (request.pre.userExist && !request.pre.forceUpdate) {
          // this is where make us of adapter

          return accessoryAdaptor.getAccessoriesList({
            user_id: user.id || user.ID,
            queryOptions: request.query,
          }).then(function(result) {
            return reply({
              status: true,
              result: result,
            });
          }).catch(function(err) {
            console.log('Error on ' + new Date() + ' for user ' +
                (user.id || user.ID) + ' is as follow: \n \n ' + err);
            console.log(err);
            return reply({
              status: false,
              message: 'Unable to retrieve accessories data',
            });
          });
        } else {
          return _shared2.default.preValidation(request.pre, reply);
        }
      },
    }, {
      key: 'getOrderHistory',
      value: function getOrderHistory(request, reply) {

        var user = _shared2.default.verifyAuthorization(request.headers);
        if (request.pre.userExist && !request.pre.forceUpdate) {
          accessoryAdaptor.getOrderHistory({
            user_id: user.id || user.ID,
          }).then(function(result) {
            return reply({
              status: true,
              result: result,
            });
          }).catch(function(err) {
            console.log('Error on ' + new Date() + ' for user ' +
                (user.id || user.ID) + ' is as follow: \n \n ' + err);
            return reply({
              status: false,
              message: 'Unable to retrieve order history',
            });
          });
        } else {
          return _shared2.default.preValidation(request.pre, reply);
        }
      },

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

    }]);

  return AccessoryController;
}();

exports.default = AccessoryController;