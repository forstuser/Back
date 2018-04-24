/*jshint esversion: 6 */
'use strict';

import WhatToServiceAdaptor from '../Adaptors/whatToServices';
import Promise from 'bluebird';
import shared from '../../helpers/shared';

let modals;
let whatToServiceAdaptor;

export default class WhatToController {
  constructor(modal) {
    modals = modal;
    whatToServiceAdaptor = new WhatToServiceAdaptor(modals);
  }

  /**
   * Retrieve State Data
   * @param request
   * @param reply
   */
  static retrieveStateReference(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.retrieveAllStateData({})).
          then((states) => reply({
            status: true,
            states,
          })).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);

            return reply({
              status: false,
            });
          });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  /**
   * Retrieve State Meal List
   * @param request
   * @param reply
   * @returns {*}
   */
  static retrieveStateMealData(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.retrieveStateMealItems({
        state_id: request.params.state_id,
        user_id: user.ID || user.id,
        is_veg: request.query.is_veg,
      })).
          then((mealList) => reply({
            status: true,
            mealList,
          })).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);

            return reply({
              status: false,
            });
          });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  /**
   * Retrieve User Meal List
   * @param request
   * @param reply
   * @returns {*}
   */
  static retrieveUserMealList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.retrieveUserMealItems({
        user_id: user.ID || user.id,
        is_veg: request.query.is_veg,
        current_date: request.query.current_date,
      })).then((mealList) => reply({
        status: true,
        mealList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static prepareUserMealList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.prepareUserMealList({
        user_id: user.ID || user.id,
        selected_ids: request.payload.selected_ids || [],
        unselected_ids: request.payload.unselected_ids || [],
        state_id: request.payload.state_id,
      })).then((mealList) => reply({
        status: true,
        mealList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static addUserMealItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.prepareUserMealList({
        user_id: user.ID || user.id,
        meal_name: request.payload.meal_name,
        is_veg: request.payload.is_veg,
        state_id: request.payload.state_id,
      })).then((mealList) => reply({
        status: true,
        mealList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateMealCurrentDate(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.updateUserMealCurrentDate({
        user_id: user.ID || user.id,
        meal_id: request.params.meal_id,
        current_date: request.payload.current_date,
      })).then((mealList) => reply({
        status: true,
        mealList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static removeMealCurrentDate(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.deleteUserMealCurrentDate({
        user_id: user.ID || user.id,
        meal_id: request.params.meal_id,
        current_date: request.payload.current_date,
      })).then((mealList) => reply({
        status: true,
        mealList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveToDoListItems(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.retrieveToDoList({
        user_id: user.ID || user.id,
      })).
          then((todoList) => reply({
            status: true,
            todoList,
          })).catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);

            return reply({
              status: false,
            });
          });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveUserToDoList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.retrieveUserToDoList({
        user_id: user.ID || user.id,
        current_date: request.query.current_date,
      })).then((todoList) => reply({
        status: true,
        todoList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static addUserToDoList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.addUserToDoList({
        user_id: user.ID || user.id,
        todo_items: request.payload.names.map((todoItem) => ({
          created_by: user.ID || user.id,
          updated_by: user.ID || user.id,
          name: todoItem,
          status_type: 11,
        })),
      })).then((todoList) => reply({
        status: true,
        todoList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateToDoItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.updateToDoItem({
        user_id: user.ID || user.id,
        todo_id: request.params.todo_id,
        current_date: request.payload.current_date,
      })).then((todoItem) => reply({
        status: true,
        todoItem,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static prepareUserToDoList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.prepareUserToDoList({
        user_id: user.ID || user.id,
        selected_ids: request.payload.selected_ids || [],
        unselected_ids: request.payload.unselected_ids || [],
      })).then((todoList) => reply({
        status: true,
        todoList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }

  }

  static removeToDos(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.deleteUsertodoCurrentDate({
        user_id: user.ID || user.id,
        todo_id: request.params.todo_id,
        current_date: request.payload.current_date,
      })).then((removelist) => reply({
        status: true,
        removelist,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static removeWhatToDos(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.deleteWhatTodo({
        created_by: user.ID || user.id,
        id: request.params.todo_id,
        status_type: 11,
      })).then(() => reply({
        status: true,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static addUserMealItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => whatToServiceAdaptor.prepareUserMealList({
        user_id: user.ID || user.id,
        meal_name: request.payload.meal_name,
        is_veg: request.payload.is_veg,
        state_id: request.payload.state_id,
      })).then((mealList) => reply({
        status: true,
        mealList,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
        });
      });
    } else if (request.pre.userExist === 0) {
      return reply({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate,
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      }).code(401);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

}