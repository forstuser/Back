import ControllerObject from '../api/controllers/whatToServices';
import joi from 'joi';

export function prepareWhatToServiceRoutes(modal, routeObject, middleware) {
  //= ========================
  // What To Service Routes
  //= ========================
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {
    routeObject.push({
      method: 'GET',
      path: '/states',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveStateReference,
        description: 'Retrieve States.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Successful'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/states/{state_id}/meals',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveStateMealData,
        description: 'Retrieve Meals available in State.',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/user/meals',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUserMealList,
        description: 'Retrieve Meals available in State.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/user/meals',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.prepareUserMealList,
        description: 'Create or update user meal list.',
        validate: {
          payload: {
            selected_ids: [
              joi.array().items(joi.number()).required().min(0),
              joi.allow(null)],
            unselected_ids: [
              joi.array().items(joi.number()).required().min(0),
              joi.allow(null)],
            state_id: [joi.number(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/user/meals/add',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.addUserMealItem,
        description: 'Create or update user meal list.',
        validate: {
          payload: {
            names: [
              joi.array().items(joi.string()).required().min(0),
              joi.allow(null)],
            state_id: [joi.number(), joi.allow(null)],
            is_veg: [joi.boolean(), joi.allow(null)],
            current_date: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/user/meals/{meal_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateMealCurrentDate,
        description: 'Update user meal item current date.',
        validate: {
          payload: {
            current_date: joi.string().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/meals/{meal_id}/remove',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.removeMeal,
        description: 'Remove user meal item.',
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/meals/{meal_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.removeMealCurrentDate,
        description: 'Remove user meal item current date.',
        validate: {
          payload: {
            current_date: joi.string().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/todos',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveToDoListItems,
        description: 'Retrieve To Do List.',
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/user/todos',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUserToDoList,
        description: 'Retrieve Meals available in State.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/user/todos',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.prepareUserToDoList,
        description: 'Create or update user todos list.',
        validate: {
          payload: {
            selected_ids: [
              joi.array().items(joi.number()).required().min(0),
              joi.allow(null)],
            unselected_ids: [
              joi.array().items(joi.number()).required().min(0),
              joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/user/todos/add',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.addUserToDoList,
        description: 'Create or update user todos list.',
        validate: {
          payload: {
            names: [
              joi.array().items(joi.string()).required().min(0),
              joi.allow(null)],
            current_date: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/user/todos/{todo_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateToDoItem,
        description: 'Update user todos.',
        validate: {
          payload: {
            current_date: joi.string().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/todos/{todo_id}/remove',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.removeWhatToDos,
        description: 'Remove user todos item.',

      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/todos/{todo_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.removeToDos,
        description: 'Remove user todos item.',
        validate: {
          payload: {
            current_date: joi.string().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'GET',
      path: '/wearables',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveUserWearables,
        description: 'Retrieve user wearable list.',
      },
    });

    routeObject.push({
      method: 'POST',
      path: '/wearables',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.addUserWearables,
        description: 'Create user wearable list.',
        validate: {
          payload: {
            name: [joi.string(), joi.allow(null)],
            current_date: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateUserWearables,
        description: 'Update user wearable list.',
        validate: {
          payload: {
            name: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.destroyUserWearables,
        description: 'DELETE user wearable list.',
      },
    });

    routeObject.push({
      method: 'PUT',
      path: '/user/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateWearableCurrentDate,
        description: 'Update user wearable item current date.',
        validate: {
          payload: {
            current_date: joi.string().required(),
          },
        },
      },
    });

    routeObject.push({
      method: 'DELETE',
      path: '/user/wearables/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.removeWearable,
        description: 'Remove user Wearable item.',
        validate: {
          payload: {
            current_date: joi.string().required(),
          },
        },
      },
    });
  }

}