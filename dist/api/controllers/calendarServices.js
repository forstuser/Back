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

var _moment = require('moment/moment');

var _moment2 = _interopRequireDefault(_moment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return calendarServiceAdaptor.retrieveCalendarServices({ status_type: 1 }, request.language).then(function (referenceData) {
          return reply({
            status: true,
            items: referenceData
          }).code(200);
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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var productBody = {
          product_name: request.payload.product_name,
          user_id: user.id || user.ID,
          service_id: request.params.service_id,
          provider_name: request.payload.provider_name,
          wages_type: request.payload.wages_type || 0,
          selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
          updated_by: user.id || user.ID,
          status_type: 11
        };

        var serviceCalculationBody = {
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          quantity: request.payload.quantity,
          unit_price: request.payload.unit_price,
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
        var effectiveYear = effectiveDate.year();
        var servicePaymentArray = [];
        var yearDiff = currentYear > effectiveYear ? currentYear - effectiveYear : null;
        if (!yearDiff) {
          var currentMth = (0, _moment2.default)().month();
          var _currentYear = (0, _moment2.default)().year();
          var effectiveMth = effectiveDate.month();
          servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
            currentMth: currentMth,
            effectiveMth: effectiveMth,
            effectiveDate: effectiveDate,
            productBody: productBody,
            serviceCalculationBody: serviceCalculationBody,
            user: user,
            currentYear: _currentYear
          });
        } else {
          var yearArr = [];
          for (var i = 0; i <= yearDiff; i++) {
            yearArr.push(effectiveYear + i);
          }
          yearArr.forEach(function (currentYear) {
            var _servicePaymentArray;

            var yearStart = (0, _moment2.default)([currentYear, 0, 1]);
            var yearEnd = (0, _moment2.default)([currentYear, 0, 31]).endOf('Y');
            var currentMth = (0, _moment2.default)().endOf('M').diff(yearEnd, 'M') > 0 ? yearEnd.month() : (0, _moment2.default)().month();
            var effectiveMth = currentYear > effectiveYear ? yearStart.month() : effectiveDate.month();
            (_servicePaymentArray = servicePaymentArray).push.apply(_servicePaymentArray, _toConsumableArray((0, _shared.monthlyPaymentCalc)({
              currentMth: currentMth,
              effectiveMth: effectiveMth,
              effectiveDate: effectiveDate,
              productBody: productBody,
              serviceCalculationBody: serviceCalculationBody,
              user: user,
              currentYear: currentYear
            })));
          });
        }

        return calendarServiceAdaptor.createCalendarItem({
          productBody: productBody,
          servicePaymentArray: servicePaymentArray,
          serviceAbsentDayArray: serviceAbsentDayArray,
          serviceCalculationBody: serviceCalculationBody,
          user: user
        }).then(function (result) {
          return reply({
            status: true,
            message: 'successful',
            calendar_item: result[0],
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
        reply({
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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceAbsentDetail = {
          absent_date: (0, _moment2.default)(request.payload.absent_date, _moment2.default.ISO_8601).startOf('days'),
          payment_id: request.params.id,
          updated_by: user.id || user.ID,
          status_type: 1
        };
        var monthStartDate = (0, _moment2.default)(request.payload.absent_date, _moment2.default.ISO_8601).startOf('M').format();
        return calendarServiceAdaptor.retrieveCurrentCalculationDetail({
          ref_id: request.params.ref_id, effective_date: {
            $lte: request.payload.absent_date
          }
        }).then(function (calcResults) {
          var currentCalcDetail = calcResults;

          return Promise.all([calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
            quantity: currentCalcDetail.quantity,
            end_date: request.payload.absent_date,
            unit_price: currentCalcDetail.unit_price,
            absent_day: 1
          }), calendarServiceAdaptor.markAbsentForItem(serviceAbsentDetail)]);
        }).then(function (result) {
          return reply({
            status: true,
            message: 'successful',
            payment_detail: result[0],
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
        reply({
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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceAbsentDetail = {
          absent_date: (0, _moment2.default)(request.payload.absent_date, _moment2.default.ISO_8601).startOf('days'),
          payment_id: request.params.id
        };
        return calendarServiceAdaptor.retrieveCurrentCalculationDetail({
          ref_id: request.params.ref_id, effective_date: {
            $lte: request.payload.absent_date
          }
        }).then(function (calcResults) {
          var currentCalcDetail = calcResults;

          return Promise.all([calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
            quantity: currentCalcDetail.quantity,
            unit_price: -currentCalcDetail.unit_price,
            end_date: request.payload.absent_date,
            absent_day: -1
          }), calendarServiceAdaptor.markPresentForItem(serviceAbsentDetail)]);
        }).then(function (result) {
          return reply({
            status: true,
            message: 'successful',
            payment_detail: result[0],
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
        reply({
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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return calendarServiceAdaptor.retrieveCalendarItemList({
          user_id: user.id || user.ID
        }, request.language).then(function (result) {
          return reply({
            status: true,
            message: 'successful',
            items: result,
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
        reply({
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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return calendarServiceAdaptor.retrieveCalendarItemById(request.params.id, request.language).then(function (result) {
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
        reply({
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
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var serviceCalculationBody = {
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          quantity: request.payload.quantity,
          unit_price: request.payload.unit_price,
          updated_by: user.id || user.ID,
          status_type: 1,
          ref_id: request.params.id
        };

        return calendarServiceAdaptor.addServiceCalc({
          effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days'),
          ref_id: request.params.id
        }, serviceCalculationBody).then(function (result) {
          if (result) {
            return calendarServiceAdaptor.manipulatePaymentDetail({ ref_id: request.params.id, effective_date: (0, _moment2.default)(request.payload.effective_date, _moment2.default.ISO_8601).startOf('days') }, result.toJSON()).then(function () {
              return reply({
                status: true,
                message: 'successful',
                product: result,
                forceUpdate: request.pre.forceUpdate
              });
            });
          }
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
        reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'updateUserReview',
    value: function updateUserReview(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var id = request.params.id;
        if (request.params.reviewfor === 'brands') {
          return reply(calendarServiceAdaptor.updateBrandReview(user, id, request));
        } else if (request.params.reviewfor === 'sellers') {
          return reply(calendarServiceAdaptor.updateSellerReview(user, id, request.query.isonlineseller, request));
        } else {
          return reply(calendarServiceAdaptor.updateProductReview(user, id, request));
        }
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveProductDetail',
    value: function retrieveProductDetail(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        return reply(calendarServiceAdaptor.prepareProductDetail({
          user: user,
          request: request
        })).code(200);
      } else {
        return reply({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate
        });
      }
    }
  }, {
    key: 'retrieveCenterProducts',
    value: function retrieveCenterProducts(request, reply) {
      var user = _shared2.default.verifyAuthorization(request.headers);
      if (!request.pre.userExist) {
        return reply({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate
        });
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        var brandId = (request.query.brandids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean);
        var categoryId = (request.query.categoryids || '[]').split('[')[1].split(']')[0].split(',').filter(Boolean);
        var options = {
          main_category_id: [2, 3],
          status_type: [5, 11],
          user_id: user.id || user.ID
        };

        if (brandId.length > 0) {
          options.brand_id = brandId;
        }

        if (categoryId.length > 0) {
          options.category_id = categoryId;
        }

        return calendarServiceAdaptor.retrieveProducts(options).then(function (result) {
          return reply({
            status: true,
            productList: result /* :productList.slice((pageNo * 10) - 10, 10) */
            , forceUpdate: request.pre.forceUpdate
            /* ,
                nextPageUrl: productList.length > listIndex + 10 ?
                 `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
                 &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
                 &offlinesellerids=${offlineSellerIds}&onlinesellerids=
                 ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
          });
        }).catch(function (err) {
          console.log('Error on ' + new Date() + ' for user ' + (user.id || user.ID) + ' is as follow: \n \n ' + err);

          return reply({
            status: false,
            message: 'Unable to fetch product list',
            forceUpdate: request.pre.forceUpdate
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