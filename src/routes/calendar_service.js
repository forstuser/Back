import ControllerObject from '../api/controllers/calendarServices';
import joi from 'joi';

export function prepareCalendarServiceRoutes(modal, calendarRoutes, middleware) {
  //= ========================
  // Calendar Item Routes
  //= ========================
  const controllerInit = new ControllerObject(modal);
  if (controllerInit) {
    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/referencedata',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveCalendarServices,
        description: 'Get Calender Service as Reference Data.',
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

    calendarRoutes.push({
      method: 'POST',
      path: '/calendar/{service_id}/items',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.createItem,
        description: 'Create Calendar Item.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            provider_number: [joi.string(), joi.allow(null)],
            wages_type: [joi.number(), joi.allow(null)],
            selected_days: [
              joi.array().items(joi.number()).required().min(0),
              joi.allow(null)],
            unit_price: joi.number().required(),
            unit_type: [joi.number(), joi.allow(null)],
            quantity: [joi.number(), joi.allow(null)],
            absent_dates: [
              joi.array().items(joi.string()).required().min(0),
              joi.allow(null)],
            effective_date: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/items',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveCalendarItemList,
        description: 'Retrieve List of Calendar Items.',
      },
    });

    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.retrieveCalendarItem,
        description: 'Retrieve Calendar Item by id.',
      },
    });

    calendarRoutes.push({
      method: 'DELETE',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.deleteCalendarItem,
        description: 'Delete Calendar Item by id.',
      },
    });

    calendarRoutes.push({
      method: 'POST',
      path: '/calendar/items/{id}/calc',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.addServiceCalc,
        description: 'Add new calculation detail for calendar services.',
        validate: {
          payload: {
            unit_price: joi.number().required(),
            unit_type: [joi.number(), joi.allow(null)],
            quantity: [joi.number(), joi.allow(null)],
            effective_date: joi.string().required(),
            selected_days: [joi.array().items(joi.number()), joi.allow(null)],
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/calc/{calc_id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateServiceCalc,
        description: 'Update calculation detail for calendar services.',
        validate: {
          payload: {
            unit_price: joi.number().required(),
            unit_type: [joi.number(), joi.allow(null)],
            quantity: [joi.number(), joi.allow(null)],
            effective_date: joi.string().required(),
            selected_days: [joi.array().items(joi.number()), joi.allow(null)],
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{ref_id}/payments/{id}/absent',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.markAbsent,
        description: 'Mark Absent.',
        validate: {
          payload: {
            absent_date: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.updateItem,
        description: 'Update Calendar Item.',
        validate: {
          payload: {
            product_name: [joi.string(), joi.allow(null)],
            provider_name: [joi.string(), joi.allow(null)],
            provider_number: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/finish',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.finishCalendarItem,
        description: 'Finish Calendar Item.',
        validate: {
          payload: {
            end_date: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/paid',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.markPaid,
        description: 'Mark Paid.',
        validate: {
          payload: {
            amount_paid: joi.number().required(),
            paid_on: joi.string().required(),
          },
        },
      },
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{ref_id}/payments/{id}/present',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: ControllerObject.markPresent,
        description: 'Mark Present.',
        validate: {
          payload: {
            present_date: joi.string().required(),
          },
        },
      },
    });
  }
}