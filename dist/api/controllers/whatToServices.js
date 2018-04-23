/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _whatToServices = require('../Adaptors/whatToServices');

var _whatToServices2 = _interopRequireDefault(_whatToServices);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var modals = void 0;
var whatToServiceAdaptor = void 0;

var WhatToController = function () {
  function WhatToController(modal) {
    _classCallCheck(this, WhatToController);

    modals = modal;
    whatToServiceAdaptor = new _whatToServices2.default(modals);
  }

  /**
   * Retrieve State Data
   * @param request
   * @param reply
   */


  _createClass(WhatToController, null, [{
    key: 'retrieveStateReference',
    value: function retrieveStateReference(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.retrieveAllStateData({});
        }).then(function (states) {
          return reply({
            status: true,
            states: states
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }

    /**
     * Retrieve State Meal List
     * @param request
     * @param reply
     * @returns {*}
     */

  }, {
    key: 'retrieveStateMealData',
    value: function retrieveStateMealData(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.retrieveStateMealItems({
            state_id: request.params.state_id,
            user_id: user.ID || user.id,
            is_veg: request.query.is_veg
          });
        }).then(function (mealList) {
          return reply({
            status: true,
            mealList: mealList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }

    /**
     * Retrieve User Meal List
     * @param request
     * @param reply
     * @returns {*}
     */

  }, {
    key: 'retrieveUserMealList',
    value: function retrieveUserMealList(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.retrieveUserMealItems({
            user_id: user.ID || user.id,
            is_veg: request.query.is_veg,
            current_date: request.query.current_date
          });
        }).then(function (mealList) {
          return reply({
            status: true,
            mealList: mealList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'prepareUserMealList',
    value: function prepareUserMealList(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.prepareUserMealList({
            user_id: user.ID || user.id,
            selected_ids: request.payload.selected_ids || [],
            unselected_ids: request.payload.unselected_ids || [],
            state_id: request.payload.state_id
          });
        }).then(function (mealList) {
          return reply({
            status: true,
            mealList: mealList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateMealCurrentDate',
    value: function updateMealCurrentDate(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.updateUserMealCurrentDate({
            user_id: user.ID || user.id,
            meal_id: request.params.meal_id,
            current_date: request.payload.current_date
          });
        }).then(function (mealList) {
          return reply({
            status: true,
            mealList: mealList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'removeMealCurrentDate',
    value: function removeMealCurrentDate(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.deleteUserMealCurrentDate({
            user_id: user.ID || user.id,
            meal_id: request.params.meal_id,
            current_date: request.payload.current_date
          });
        }).then(function (mealList) {
          return reply({
            status: true,
            mealList: mealList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false
          });
        });
      } else if (request.pre.userExist === 0) {
        return reply({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        }).code(401);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return WhatToController;
}();

exports.default = WhatToController;