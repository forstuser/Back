'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareCalendarServiceRoutes = prepareCalendarServiceRoutes;

var _calendarServices = require('../api/controllers/calendarServices');

var _calendarServices2 = _interopRequireDefault(_calendarServices);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareCalendarServiceRoutes(modal, calendarRoutes, middleware) {
  //= ========================
  // Calendar Item Routes
  //= ========================
  var controllerInit = new _calendarServices2.default(modal);
  if (controllerInit) {
    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/referencedata',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.retrieveCalendarServices,
        description: 'Get Calender Service as Reference Data.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'POST',
      path: '/calendar/{service_id}/items',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.createItem,
        description: 'Create Calendar Item.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
            provider_number: [_joi2.default.string(), _joi2.default.allow(null)],
            wages_type: [_joi2.default.number(), _joi2.default.allow(null)],
            selected_days: [_joi2.default.array().items(_joi2.default.number()).required().min(0), _joi2.default.allow(null)],
            unit_price: _joi2.default.number().required(),
            unit_type: [_joi2.default.number(), _joi2.default.allow(null)],
            quantity: [_joi2.default.number(), _joi2.default.allow(null)],
            absent_dates: [_joi2.default.array().items(_joi2.default.string()).required().min(0), _joi2.default.allow(null)],
            effective_date: _joi2.default.string().required()
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/items',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.retrieveCalendarItemList,
        description: 'Retrieve List of Calendar Items.'
      }
    });

    calendarRoutes.push({
      method: 'GET',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.retrieveCalendarItem,
        description: 'Retrieve Calendar Item by id.'
      }
    });

    calendarRoutes.push({
      method: 'DELETE',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.deleteCalendarItem,
        description: 'Delete Calendar Item by id.'
      }
    });

    calendarRoutes.push({
      method: 'POST',
      path: '/calendar/items/{id}/calc',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.addServiceCalc,
        description: 'Add new calculation detail for calendar services.',
        validate: {
          payload: {
            unit_price: _joi2.default.number().required(),
            unit_type: [_joi2.default.number(), _joi2.default.allow(null)],
            quantity: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: _joi2.default.string().required(),
            selected_days: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/calc/{calc_id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.updateServiceCalc,
        description: 'Update calculation detail for calendar services.',
        validate: {
          payload: {
            unit_price: _joi2.default.number().required(),
            unit_type: [_joi2.default.number(), _joi2.default.allow(null)],
            quantity: [_joi2.default.number(), _joi2.default.allow(null)],
            effective_date: _joi2.default.string().required(),
            selected_days: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{ref_id}/payments/{id}/absent',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.markAbsent,
        description: 'Mark Absent.',
        validate: {
          payload: {
            absent_date: _joi2.default.string().required()
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.updateItem,
        description: 'Update Calendar Item.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
            provider_number: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/finish',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.finishCalendarItem,
        description: 'Finish Calendar Item.',
        validate: {
          payload: {
            end_date: _joi2.default.string().required()
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{id}/paid',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.markPaid,
        description: 'Mark Paid.',
        validate: {
          payload: {
            amount_paid: _joi2.default.number().required(),
            paid_on: _joi2.default.string().required()
          }
        }
      }
    });

    calendarRoutes.push({
      method: 'PUT',
      path: '/calendar/items/{ref_id}/payments/{id}/present',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _calendarServices2.default.markPresent,
        description: 'Mark Present.',
        validate: {
          payload: {
            present_date: _joi2.default.string().required()
          }
        }
      }
    });
  }
}