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
            status: false,
            message: 'Unable to retrieve all states data'
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
            status: false,
            message: 'Unable to retrieve state meal items'
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
            status: false,
            message: 'Unable to  retrieve user meal items'
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
            status: false,
            message: 'Unable to  prepare user meal list '
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
    key: 'addUserMealItem',
    value: function addUserMealItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.addUserMealItem({
            user_id: user.ID || user.id,
            meal_items: request.payload.names.map(function (mealItem) {
              return {
                created_by: user.ID || user.id,
                updated_by: user.ID || user.id,
                name: mealItem,
                is_veg: !(request.payload.is_veg && request.payload.is_veg === false),
                status_type: 11
              };
            }),
            is_veg: request.payload.is_veg,
            state_id: request.payload.state_id,
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
            status: false,
            message: 'Unable to add user meal item'
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
            status: false,
            message: 'Unable to update user meal current date '
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
  }, {
    key: 'removeMeal',
    value: function removeMeal(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.removeMeals({
            where: {
              created_by: user.ID || user.id,
              id: request.params.meal_id,
              status_type: 11
            }
          });
        }).then(function () {
          return reply({
            status: true
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to remove meals '
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
    key: 'retrieveUserWearables',
    value: function retrieveUserWearables(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.retrieveWearables({
            user_id: user.ID || user.id,
            current_date: request.query.current_date
          });
        }).then(function (wearableList) {
          return reply({
            status: true,
            wearableList: wearableList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'unable to  retrieve Wearables'
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
    key: 'addUserWearables',
    value: function addUserWearables(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.addWearable({
            item_name: request.payload.name,
            user_id: user.ID || user.id,
            current_date: request.payload.current_date
          });
        }).then(function (wearable) {
          return reply({
            status: true,
            wearable: wearable
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to add wearable'
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
    key: 'updateUserWearables',
    value: function updateUserWearables(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.updateWearable({
            item_name: request.payload.name,
            user_id: user.ID || user.id, id: request.params.id
          });
        }).then(function () {
          return reply({
            status: true,
            wearable: {
              name: request.payload.name,
              id: request.params.id
            }
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to update wearable'
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
    key: 'updateWearableCurrentDate',
    value: function updateWearableCurrentDate(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.updateWearableCurrentDate({
            user_id: user.ID || user.id,
            id: request.params.id,
            current_date: request.payload.current_date
          });
        }).then(function (wearablelList) {
          return reply({
            status: true,
            wearablelList: wearablelList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to update wearable current date'
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
    key: 'destroyUserWearables',
    value: function destroyUserWearables(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.deleteWearable({
            user_id: user.ID || user.id, id: request.params.id
          });
        }).then(function () {
          return reply({
            status: true,
            wearable: {
              id: request.params.id
            }
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to Delete wearable'
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
    key: 'removeWearable',
    value: function removeWearable(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.removeWearableCurrentDate({
            user_id: user.ID || user.id,
            id: request.params.id,
            current_date: request.payload.current_date
          });
        }).then(function (wearablelList) {
          return reply({
            status: true,
            wearablelList: wearablelList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to remove wearable current date'
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
    key: 'retrieveToDoListItems',
    value: function retrieveToDoListItems(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.retrieveToDoList({
            user_id: user.ID || user.id
          });
        }).then(function (todoList) {
          return reply({
            status: true,
            todoList: todoList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to retrieve ToDoList'
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
    key: 'retrieveUserToDoList',
    value: function retrieveUserToDoList(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.retrieveUserToDoList({
            user_id: user.ID || user.id,
            current_date: request.query.current_date
          });
        }).then(function (todoList) {
          return reply({
            status: true,
            todoList: todoList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to retrieve UserToDoList'
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
    key: 'addUserToDoList',
    value: function addUserToDoList(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.addUserToDoList({
            user_id: user.ID || user.id,
            todo_items: request.payload.names.map(function (todoItem) {
              return {
                created_by: user.ID || user.id,
                updated_by: user.ID || user.id,
                name: todoItem,
                status_type: 11
              };
            }),
            current_date: request.payload.current_date
          });
        }).then(function (todoList) {
          return reply({
            status: true,
            todoList: todoList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to User ToDoList '
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
    key: 'updateToDoItem',
    value: function updateToDoItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.updateToDoItem({
            user_id: user.ID || user.id,
            todo_id: request.params.todo_id,
            current_date: request.payload.current_date
          });
        }).then(function (todoItem) {
          return reply({
            status: true,
            todoItem: todoItem
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to update ToDoItem'
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
    key: 'prepareUserToDoList',
    value: function prepareUserToDoList(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.prepareUserToDoList({
            user_id: user.ID || user.id,
            selected_ids: request.payload.selected_ids || [],
            unselected_ids: request.payload.unselected_ids || []
          });
        }).then(function (todoList) {
          return reply({
            status: true,
            todoList: todoList
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to prepare user ToDoList'
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
    key: 'removeToDos',
    value: function removeToDos(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.deleteUserTodoCurrentDate({
            user_id: user.ID || user.id,
            todo_id: request.params.todo_id,
            current_date: request.payload.current_date
          });
        }).then(function (removelist) {
          return reply({
            status: true,
            removelist: removelist
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to delete user ToDo current Date'
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
    key: 'removeWhatToDos',
    value: function removeWhatToDos(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return whatToServiceAdaptor.deleteWhatTodo({
            where: {
              created_by: user.ID || user.id,
              id: request.params.todo_id,
              status_type: 11
            }
          });
        }).then(function () {
          return reply({
            status: true
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to delete what ToDo'
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