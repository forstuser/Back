/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('moment-weekday-calc');

var calendarServiceAdaptor = void 0;
var models = void 0;

var CalendarServiceController = function () {
  function CalendarServiceController(modal) {
    _classCallCheck(this, CalendarServiceController);

    calendarServiceAdaptor = new _calendarServices2.default(modal);
    models = modal;
  }

  _createClass(CalendarServiceController, null, [{
    key: 'retrieveCalendarServices',
    value: function retrieveCalendarServices(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.retrieveCalendarServices({ status_type: 1 }, request.language);
        }).spread(function (items, unit_types) {
          return reply({
            status: true,
            items: items,
            unit_types: unit_types,
            default_ids: _main2.default.CATEGORIES.CALENDAR_ITEM
          }).code(200);
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in retrieving calendar service list.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'createItem',
    value: function createItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var productBody = {
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

        var serviceCalculationBody = {
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          quantity: request.payload.quantity,
          unit_price: parseFloat(Number(request.payload.unit_price).toFixed(2)),
          unit_type: request.payload.unit_type,
          selected_days: request.payload.selected_days,
          updated_by: user.id || user.ID,
          status_type: 1
        };

        var serviceAbsentDayArray = (request.payload.absent_dates || []).map(function (item) {
          return {
            absent_date: (0, _moment2.default)(item, _moment2.default.ISO_8601).startOf('days'),
            updated_by: user.id || user.ID,
            status_type: 1
          };
        });
        var effectiveDate = (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601);
        var currentYear = (0, _moment2.default)().year();
        var servicePaymentArray = [];
        var currentMth = (0, _moment2.default)().month();
        var effectiveMth = effectiveDate.month();

        var selected_days = productBody.selected_days,
            wages_type = productBody.wages_type;

        selected_days = serviceCalculationBody ? serviceCalculationBody.selected_days || selected_days : selected_days;
        servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
          currentMth: currentMth,
          effectiveMth: effectiveMth,
          effectiveDate: effectiveDate,
          selected_days: selected_days,
          wages_type: wages_type,
          serviceCalculationBody: serviceCalculationBody,
          user: user,
          currentYear: currentYear
        });
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.createCalendarItem({
            productBody: productBody,
            servicePaymentArray: servicePaymentArray,
            serviceAbsentDayArray: serviceAbsentDayArray,
            serviceCalculationBody: serviceCalculationBody,
            user: user
          });
        }).spread(function (calendar_item) {
          return reply({
            status: true,
            message: 'successful',
            calendar_item: calendar_item,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in calendar item creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateItem',
    value: function updateItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var productBody = {
          product_name: request.payload.product_name,
          provider_name: request.payload.provider_name,
          provider_number: request.payload.provider_number,
          updated_by: user.id || user.ID,
          status_type: 11
        };
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.updateCalendarItem(productBody, request.params.id);
        }).then(function () {
          return reply({
            status: true,
            message: 'successful',
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in calendar item creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'markAbsent',
    value: function markAbsent(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceAbsentDetail = {
          absent_date: (0, _moment2.default)(request.payload.absent_date, _moment2.default.ISO_8601).startOf('days'),
          payment_id: request.params.id,
          updated_by: user.id || user.ID,
          status_type: 1
        };
        return _bluebird2.default.try(function () {
          return _bluebird2.default.all([calendarServiceAdaptor.retrieveCurrentCalculationDetail({
            ref_id: request.params.ref_id, effective_date: {
              $lte: request.payload.absent_date
            }
          }), calendarServiceAdaptor.markAbsentForItem({ where: serviceAbsentDetail })]);
        }).spread(function (calcResults) {
          var currentCalcDetail = calcResults;

          return calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
            quantity: currentCalcDetail.quantity,
            end_date: request.payload.absent_date,
            unit_price: currentCalcDetail.unit_price,
            selected_days: currentCalcDetail.selected_days
          }, true);
        }).then(function (payment_detail) {
          return reply({
            status: true,
            message: 'successful',
            payment_detail: payment_detail,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Unable to mark absent.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'markPaid',
    value: function markPaid(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var servicePaymentDetail = {
          paid_on: (0, _moment2.default)(request.payload.paid_on, _moment2.default.ISO_8601),
          amount_paid: request.payload.amount_paid,
          updated_by: user.id || user.ID,
          status_type: 5,
          ref_id: request.params.id
        };
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.markPaymentPaid(request.params.id, servicePaymentDetail);
        }).then(function (payment_detail) {
          return reply({
            status: true,
            message: 'successful',
            payment_detail: payment_detail,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Unable to mark paid.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'markPresent',
    value: function markPresent(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceAbsentDetail = {
          absent_date: (0, _moment2.default)(request.payload.present_date, _moment2.default.ISO_8601).startOf('days'),
          payment_id: request.params.id
        };
        return _bluebird2.default.try(function () {
          return _bluebird2.default.all([calendarServiceAdaptor.retrieveCurrentCalculationDetail({
            ref_id: request.params.ref_id, effective_date: {
              $lte: request.payload.present_date
            }
          }), calendarServiceAdaptor.markPresentForItem({ where: serviceAbsentDetail })]);
        }).spread(function (calcResults) {
          var currentCalcDetail = calcResults;

          return calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
            quantity: currentCalcDetail.quantity,
            unit_price: currentCalcDetail.unit_price,
            end_date: request.payload.present_date,
            selected_days: currentCalcDetail.selected_days
          }, true);
        }).then(function (payment_detail) {
          return reply({
            status: true,
            message: 'successful',
            payment_detail: payment_detail,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'Unable to mark absent.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveCalendarItemList',
    value: function retrieveCalendarItemList(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      console.log({ user_exist: request.pre.userExist });
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.retrieveCalendarItemList({
            user_id: user.id || user.ID
          }, request.language, request.query.limit, request.query.offset);
        }).then(function (items) {
          return reply({
            status: true,
            message: 'successful',
            items: items,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'An error occurred in retrieving calendar item list.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveCalendarItem',
    value: function retrieveCalendarItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.retrieveCalendarItemById(request.params.id, request.language);
        }).then(function (result) {
          return reply({
            status: true,
            message: 'successful',
            item: result,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in retrieving calendar item list.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'addServiceCalc',
    value: function addServiceCalc(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceCalculationBody = {
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          quantity: request.payload.quantity,
          unit_price: request.payload.unit_price,
          unit_type: request.payload.unit_type,
          selected_days: request.payload.selected_days,
          updated_by: user.id || user.ID,
          status_type: 1,
          ref_id: request.params.id
        };
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.addServiceCalc({
            effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
            ref_id: request.params.id
          }, serviceCalculationBody);
        }).then(function (result) {
          return _bluebird2.default.all([calendarServiceAdaptor.manipulatePaymentDetail({
            ref_id: request.params.id,
            effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days')
          }), result.toJSON()]);
        }).spread(function (manipulatedResult, calculation_detail) {
          return reply({
            status: true,
            message: 'successful',
            calculation_detail: calculation_detail,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in adding effective calculation method for service.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateServiceCalc',
    value: function updateServiceCalc(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceCalculationBody = {
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          quantity: request.payload.quantity,
          unit_price: request.payload.unit_price,
          unit_type: request.payload.unit_type,
          selected_days: request.payload.selected_days,
          updated_by: user.id || user.ID,
          status_type: 1,
          ref_id: request.params.id
        };

        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.addServiceCalc({
            id: request.params.calc_id,
            ref_id: request.params.id
          }, serviceCalculationBody);
        }).then(function (result) {
          return _bluebird2.default.all([calendarServiceAdaptor.manipulatePaymentDetail({
            id: request.params.calc_id,
            effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
            ref_id: request.params.id
          }), result]);
        }).spread(function (manipulatedResult, calculation_detail) {
          return reply({
            status: true,
            message: 'successful',
            calculation_detail: calculation_detail,
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in adding effective calculation method for service.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'deleteCalendarItem',
    value: function deleteCalendarItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.deleteCalendarItemById(request.params.id, user.id || user.ID);
        }).then(function () {
          return reply({
            status: true,
            message: 'successful',
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in adding effective calculation method for service.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'finishCalendarItem',
    value: function finishCalendarItem(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (request.pre.userExist === 0) {
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
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return _bluebird2.default.try(function () {
          return calendarServiceAdaptor.retrieveLatestServiceCalculation({
            where: {
              ref_id: request.params.id
            }
          });
        }).then(function (data) {
          var finalEffectiveDate = data.effective_date;
          if ((0, _moment2.default)(finalEffectiveDate, _moment2.default.ISO_8601).isSameOrBefore(request.payload.end_date)) {
            var productBody = {
              end_date: request.payload.end_date
            };

            return calendarServiceAdaptor.updateCalendarItem(productBody, request.params.id);
          } else {
            console.log('end_date should be greater than effective date');
            return null;
          }
        }).then(function (result) {
          if (result === null) {
            return reply({
              status: false,
              message: 'An error occurred in calendar item creation.',
              forceUpdate: request.pre.forceUpdate
            });
          }
          return reply({
            status: true,
            message: 'successful',
            forceUpdate: request.pre.forceUpdate
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);
          return reply({
            status: false,
            message: 'An error occurred in calendar item creation.',
            forceUpdate: request.pre.forceUpdate,
            err: err
          });
        });
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }]);

  return CalendarServiceController;
}();

exports.default = CalendarServiceController;