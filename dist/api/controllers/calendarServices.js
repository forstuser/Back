/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _calendarServices = require('../Adaptors/calendarServices');

var _calendarServices2 = _interopRequireDefault(_calendarServices);

var _shared = require('../../helpers/shared');

var _shared2 = _interopRequireDefault(_shared);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

var _main = require('../../config/main');

var _main2 = _interopRequireDefault(_main);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

require('moment-weekday-calc');

let calendarServiceAdaptor;
let models;

class CalendarServiceController {

  constructor(modal) {
    calendarServiceAdaptor = new _calendarServices2.default(modal);
    models = modal;
  }

  static retrieveCalendarServices(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return _bluebird2.default.try(() => calendarServiceAdaptor.retrieveCalendarServices({ status_type: 1 }, request.language)).spread((items, unit_types) => reply.response({
        status: true,
        items,
        unit_types,
        default_ids: _main2.default.CATEGORIES.CALENDAR_ITEM
      }).code(200)).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in retrieving calendar service list.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static createItem(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const productBody = {
        product_name: request.payload.product_name,
        user_id: user.id || user.ID,
        service_id: request.params.service_id,
        provider_name: request.payload.provider_name,
        provider_number: request.payload.provider_number,
        wages_type: request.payload.wages_type || 0,
        selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
        updated_by: user.id || user.ID,
        status_type: 11
      };
      request.payload.quantity = request.payload.quantity ? parseFloat(request.payload.quantity.toFixed(2)) : request.payload.quantity;
      request.payload.unit_price = parseFloat(request.payload.unit_price.toFixed(2));
      const serviceCalculationBody = {
        effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
        quantity: request.payload.quantity,
        unit_price: request.payload.unit_price,
        unit_type: request.payload.unit_type,
        selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
        updated_by: user.id || user.ID,
        status_type: 1
      };

      const serviceAbsentDayArray = (request.payload.absent_dates || []).map(item => ({
        absent_date: (0, _moment2.default)(item, _moment2.default.ISO_8601).startOf('days'),
        updated_by: user.id || user.ID,
        status_type: 1
      }));
      const effectiveDate = (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601);
      const currentYear = (0, _moment2.default)().year();
      let servicePaymentArray = [];
      const currentMth = (0, _moment2.default)().month();
      const effectiveMth = effectiveDate.month();

      let { selected_days, wages_type } = productBody;
      selected_days = serviceCalculationBody ? serviceCalculationBody.selected_days || selected_days : selected_days;
      servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
        currentMth,
        effectiveMth,
        effectiveDate,
        selected_days,
        wages_type,
        serviceCalculationBody,
        user,
        currentYear
      });
      return _bluebird2.default.try(() => calendarServiceAdaptor.createCalendarItem({
        productBody,
        servicePaymentArray,
        serviceAbsentDayArray,
        serviceCalculationBody,
        user
      })).spread(calendar_item => reply.response({
        status: true,
        message: 'successful',
        calendar_item,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in calendar item creation.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static updateItem(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const productBody = {
        product_name: request.payload.product_name,
        provider_name: request.payload.provider_name,
        provider_number: request.payload.provider_number,
        updated_by: user.id || user.ID,
        status_type: 11
      };
      return _bluebird2.default.try(() => calendarServiceAdaptor.updateCalendarItem(productBody, request.params.id)).then(() => reply.response({
        status: true,
        message: 'successful',
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in calendar item creation.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static markAbsent(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceAbsentDetail = {
        absent_date: (0, _moment2.default)(request.payload.absent_date, _moment2.default.ISO_8601).startOf('days'),
        payment_id: request.params.id,
        updated_by: user.id || user.ID,
        status_type: 1
      };
      return _bluebird2.default.try(() => _bluebird2.default.all([calendarServiceAdaptor.retrieveCurrentCalculationDetail({
        ref_id: request.params.ref_id, effective_date: {
          $lte: request.payload.absent_date
        }
      }), calendarServiceAdaptor.markAbsentForItem({ where: serviceAbsentDetail })])).spread(calcResults => {
        const currentCalcDetail = calcResults;

        return calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
          quantity: currentCalcDetail.quantity,
          end_date: request.payload.absent_date,
          unit_price: currentCalcDetail.unit_price,
          selected_days: currentCalcDetail.selected_days
        }, true);
      }).then(payment_detail => reply.response({
        status: true,
        message: 'successful',
        payment_detail,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to mark absent.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static markPaid(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const servicePaymentDetail = {
        paid_on: (0, _moment2.default)(request.payload.paid_on, _moment2.default.ISO_8601),
        amount_paid: request.payload.amount_paid,
        updated_by: user.id || user.ID,
        status_type: 5,
        ref_id: request.params.id
      };
      return _bluebird2.default.try(() => calendarServiceAdaptor.markPaymentPaid(request.params.id, servicePaymentDetail)).then(payment_detail => reply.response({
        status: true,
        message: 'successful',
        payment_detail,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to mark paid.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static markPresent(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceAbsentDetail = {
        absent_date: (0, _moment2.default)(request.payload.present_date, _moment2.default.ISO_8601).startOf('days'),
        payment_id: request.params.id
      };
      return _bluebird2.default.try(() => _bluebird2.default.all([calendarServiceAdaptor.retrieveCurrentCalculationDetail({
        ref_id: request.params.ref_id, effective_date: {
          $lte: request.payload.present_date
        }
      }), calendarServiceAdaptor.markPresentForItem({ where: serviceAbsentDetail })])).spread(calcResults => {
        const currentCalcDetail = calcResults;

        return calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
          quantity: currentCalcDetail.quantity,
          unit_price: currentCalcDetail.unit_price,
          end_date: request.payload.present_date,
          selected_days: currentCalcDetail.selected_days
        }, true);
      }).then(payment_detail => reply.response({
        status: true,
        message: 'successful',
        payment_detail,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'Unable to mark absent.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static retrieveCalendarItemList(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    console.log({ user_exist: request.pre.userExist });
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return _bluebird2.default.try(() => calendarServiceAdaptor.retrieveCalendarItemList({
        user_id: user.id || user.ID
      }, request.language, request.query.limit, request.query.offset)).then(items => reply.response({
        status: true,
        message: 'successful',
        items,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in retrieving calendar item list.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static retrieveCalendarItem(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return _bluebird2.default.try(() => calendarServiceAdaptor.retrieveCalendarItemById(request.params.id, request.language)).then(result => reply.response({
        status: true,
        message: 'successful',
        item: result,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in retrieving calendar item list.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static addServiceCalc(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      request.payload.quantity = request.payload.quantity ? parseFloat(request.payload.quantity.toFixed(2)) : request.payload.quantity;
      const serviceCalculationBody = {
        effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
        quantity: request.payload.quantity,
        unit_price: parseFloat(request.payload.unit_price.toFixed(2)),
        unit_type: request.payload.unit_type,
        selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
        updated_by: user.id || user.ID,
        status_type: 1,
        ref_id: request.params.id
      };
      return _bluebird2.default.try(() => {
        return calendarServiceAdaptor.addServiceCalc({
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          ref_id: request.params.id
        }, serviceCalculationBody);
      }).then(result => {
        if ((0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).isSameOrBefore((0, _moment2.default)())) {
          return _bluebird2.default.all([calendarServiceAdaptor.manipulatePaymentDetail({
            ref_id: request.params.id,
            effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days')
          }), result.toJSON()]);
        }
        return _bluebird2.default.all([[], result.toJSON()]);
      }).spread((manipulatedResult, calculation_detail) => {
        return reply.response({
          status: true,
          message: 'successful',
          calculation_detail,
          forceUpdate: request.pre.forceUpdate
        });
      }).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in adding effective calculation method for service.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static updateServiceCalc(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceCalculationBody = {
        effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
        quantity: request.payload.quantity,
        unit_price: request.payload.unit_price,
        unit_type: request.payload.unit_type,
        selected_days: request.payload.selected_days,
        updated_by: user.id || user.ID,
        status_type: 1,
        ref_id: request.params.id
      };

      return _bluebird2.default.try(() => {
        return calendarServiceAdaptor.addServiceCalc({
          id: request.params.calc_id,
          ref_id: request.params.id
        }, serviceCalculationBody);
      }).then(result => {
        return _bluebird2.default.all([calendarServiceAdaptor.manipulatePaymentDetail({
          id: request.params.calc_id,
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          ref_id: request.params.id
        }), result]);
      }).spread((manipulatedResult, calculation_detail) => reply.response({
        status: true,
        message: 'successful',
        calculation_detail,
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in adding effective calculation method for service.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static deleteCalendarItem(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return _bluebird2.default.try(() => calendarServiceAdaptor.deleteCalendarItemById(request.params.id, user.id || user.ID)).then(() => {
        return reply.response({
          status: true,
          message: 'successful',
          forceUpdate: request.pre.forceUpdate
        });
      }).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in adding effective calculation method for service.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }

  static finishCalendarItem(request, reply) {
    const user = _shared2.default.verifyAuthorization(request.headers);
    if (request.pre.userExist === 0) {
      return reply.response({
        status: false,
        message: 'Inactive User',
        forceUpdate: request.pre.forceUpdate
      }).code(402);
    } else if (!request.pre.userExist) {
      return reply.response({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate
      }).code(401);
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return _bluebird2.default.try(() => {
        const productBody = {
          end_date: request.payload.end_date
        };

        return calendarServiceAdaptor.updateCalendarItem(productBody, request.params.id);
      }).then(() => reply.response({
        status: true,
        message: 'successful',
        forceUpdate: request.pre.forceUpdate
      })).catch(err => {
        console.log(`Error on ${new Date()} for user ${user.id || user.ID} is as follow: \n \n ${err}`);
        models.logs.create({
          api_action: request.method,
          api_path: request.url.pathname,
          log_type: 2,
          user_id: user.id || user.ID,
          log_content: JSON.stringify({
            params: request.params,
            query: request.query,
            headers: request.headers,
            payload: request.payload,
            err
          })
        }).catch(ex => console.log('error while logging on db,', ex));
        return reply.response({
          status: false,
          message: 'An error occurred in calendar item creation.',
          forceUpdate: request.pre.forceUpdate,
          err
        });
      });
    } else {
      return reply.response({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate
      });
    }
  }
}
exports.default = CalendarServiceController;