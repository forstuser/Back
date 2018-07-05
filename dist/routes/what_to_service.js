'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareWhatToServiceRoutes = prepareWhatToServiceRoutes;

var _whatToServices = require('../api/controllers/whatToServices');

var _whatToServices2 = _interopRequireDefault(_whatToServices);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareWhatToServiceRoutes(modal, routeObject, middleware) {
  //= ========================
  // What To Service Routes
  //= ========================
  const controllerInit = new _whatToServices2.default(modal);
  if (controllerInit) {
    routeObject.push({
      method: 'GET',
      path: '/states',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.retrieveStateReference,
        description: 'Retrieve States.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/states/{state_id}/meals',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.retrieveStateMealData,
        description: 'Retrieve Meals available in State.'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/user/meals',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.retrieveUserMealList,
        description: 'Retrieve Meals available in State.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/user/meals',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.prepareUserMealList,
        description: 'Create or update user meal list.',
        validate: {
          payload: {
            selected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
            unselected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/user/meals/add',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.addUserMealItem,
        description: 'Create or update user meal list.',
        validate: {
          payload: {
            names: [_joi2.default.array().items(_joi2.default.string()).required().min(0), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)],
            is_veg: [_joi2.default.boolean(), _joi2.default.allow(null)],
            current_date: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/user/meals/{meal_id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.updateMealCurrentDate,
        description: 'Update user meal item current date.',
        validate: {
          payload: {
            current_date: _joi2.default.string().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/meals/{meal_id}/remove',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.removeMeal,
        description: 'Remove user meal item.'
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/meals/{meal_id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.removeMealCurrentDate,
        description: 'Remove user meal item current date.',
        validate: {
          payload: {
            current_date: _joi2.default.string().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/todos',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.retrieveToDoListItems,
        description: 'Retrieve To Do List.'
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/user/todos',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.retrieveUserToDoList,
        description: 'Retrieve Meals available in State.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/user/todos',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.prepareUserToDoList,
        description: 'Create or update user todos list.',
        validate: {
          payload: {
            selected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
            unselected_ids: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/user/todos/add',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.addUserToDoList,
        description: 'Create or update user todos list.',
        validate: {
          payload: {
            names: [_joi2.default.array().items(_joi2.default.string()).required().min(0), _joi2.default.allow(null)],
            current_date: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/user/todos/{todo_id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.updateToDoItem,
        description: 'Update user todos.',
        validate: {
          payload: {
            current_date: _joi2.default.string().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/todos/{todo_id}/remove',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.removeWhatToDos,
        description: 'Remove user todos item.'

      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/todos/{todo_id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.removeToDos,
        description: 'Remove user todos item.',
        validate: {
          payload: {
            current_date: _joi2.default.string().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/wearables',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.retrieveUserWearables,
        description: 'Retrieve user wearable list.'
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/wearables',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.addUserWearables,
        description: 'Create user wearable list.',
        validate: {
          payload: {
            name: [_joi2.default.string(), _joi2.default.allow(null)],
            current_date: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.updateUserWearables,
        description: 'Update user wearable list.',
        validate: {
          payload: {
            name: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.destroyUserWearables,
        description: 'DELETE user wearable list.'
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/user/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.updateWearableCurrentDate,
        description: 'Update user wearable item current date.',
        validate: {
          payload: {
            current_date: _joi2.default.string().required()
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _whatToServices2.default.removeWearable,
        description: 'Remove user Wearable item.',
        validate: {
          payload: {
            current_date: _joi2.default.string().required()
          }
        }
      }
    });
  }
}