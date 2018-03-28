'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _product = require('./product');

var _product2 = _interopRequireDefault(_product);

var _shared = require('../../helpers/shared');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('moment-weekday-calc');

var CalendarServiceAdaptor = function () {
  function CalendarServiceAdaptor(modals) {
    _classCallCheck(this, CalendarServiceAdaptor);

    this.modals = modals;
    this.productAdaptor = new _product2.default(modals);
  }

  _createClass(CalendarServiceAdaptor, [{
    key: 'retrieveCalendarServices',
    value: function retrieveCalendarServices(options, language) {
      var _this = this;

      return _bluebird2.default.try(function () {
        return [_this.retrieveAllCalendarServices(options, language), _this.retrieveAllQuantities(options, language)];
      }).spread(function (calendar_services, unit_types) {
        return [calendar_services.map(function (item) {
          var calendarServiceItem = item.toJSON();
          calendarServiceItem.name = calendarServiceItem.name || calendarServiceItem.default_name;
          calendarServiceItem.quantity_type = calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type;
          return calendarServiceItem;
        }), unit_types.map(function (item) {
          var unitTypes = item.toJSON();
          unitTypes.title = unitTypes.title || unitTypes.default_title;
          return unitTypes;
        })];
      });
    }
  }, {
    key: 'retrieveAllQuantities',
    value: function retrieveAllQuantities(options, language) {
      return this.modals.quantities.findAll({
        where: options,
        attributes: ['id', ['quantity_name', 'default_title'], ['' + (language ? 'quantity_name_' + language : 'quantity_name'), 'title']],
        order: ['id']
      });
    }
  }, {
    key: 'retrieveAllCalendarServices',
    value: function retrieveAllCalendarServices(options, language) {
      return this.modals.calendar_services.findAll({
        where: options,
        attributes: ['id', ['service_name', 'default_name'], ['' + (language ? 'service_name_' + language : 'service_name'), 'name'], [this.modals.sequelize.literal('"quantity"."quantity_name"'), 'default_quantity_name'], [this.modals.sequelize.literal('"quantity"."' + (language ? 'quantity_name_' + language : 'quantity_name') + '"'), 'quantity_name'], 'quantity_type', 'category_id', 'main_category_id', 'sub_category_id', 'wages_type', [this.modals.sequelize.fn('CONCAT', '/calendarservice/', this.modals.sequelize.literal('"calendar_services"."id"'), '/images'), 'calendarServiceImageUrl']],
        include: {
          model: this.modals.quantities,
          as: 'quantity',
          attributes: [],
          required: false
        },
        order: ['id']
      });
    }
  }, {
    key: 'retrieveCalendarServiceById',
    value: function retrieveCalendarServiceById(id, language) {
      return this.modals.calendar_services.findById(id, {
        attributes: ['id', ['service_name', 'default_name'], ['' + (language ? 'service_name_' + language : 'service_name'), 'name'], [this.modals.sequelize.literal('"quantity"."quantity_name"'), 'default_quantity_name'], [this.modals.sequelize.literal('"quantity"."' + (language ? 'quantity_name_' + language : 'quantity_name') + '"'), 'quantity_name'], 'quantity_type', 'wages_type', [this.modals.sequelize.fn('CONCAT', '/calendarservice/', this.modals.sequelize.literal('"calendar_services"."id"'), '/images'), 'calendarServiceImageUrl'], 'category_id', 'main_category_id', 'sub_category_id'],
        include: {
          model: this.modals.quantities,
          as: 'quantity',
          attributes: [],
          required: false
        },
        order: ['id']
      }).then(function (calendar_services) {
        var calendarServiceItem = calendar_services.toJSON();
        calendarServiceItem.name = calendarServiceItem.name || calendarServiceItem.default_name;
        calendarServiceItem.quantity_type = calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type;
        return calendarServiceItem;
      });
    }
  }, {
    key: 'createCalendarItem',
    value: function createCalendarItem(calendarItemDetail) {
      var _this2 = this;

      var productBody = calendarItemDetail.productBody,
          servicePaymentArray = calendarItemDetail.servicePaymentArray,
          serviceAbsentDayArray = calendarItemDetail.serviceAbsentDayArray,
          serviceCalculationBody = calendarItemDetail.serviceCalculationBody,
          user = calendarItemDetail.user;

      return _bluebird2.default.try(function () {
        return _this2.findAndCreateCalendarItem({ where: productBody });
      }).spread(function (calendarItem) {
        calendarItem = calendarItem.toJSON();
        serviceCalculationBody.ref_id = calendarItem.id;
        var subPromiseArray = [calendarItem, _this2.findCreateCalculationDetail({ where: serviceCalculationBody })];
        servicePaymentArray.forEach(function (item) {
          item.ref_id = calendarItem.id;
          subPromiseArray.push(_this2.findCreateServicePayment({ where: item }));
        });
        serviceAbsentDayArray.forEach(function (item) {
          item.ref_id = calendarItem.id;
          subPromiseArray.push(_this2.markAbsentForItem({ where: item }));
        });

        return subPromiseArray;
      });
    }
  }, {
    key: 'updateCalendarItem',
    value: function updateCalendarItem(calendarItemDetail, id) {
      var _this3 = this;

      return _bluebird2.default.try(function () {
        return _this3.modals.user_calendar_item.update(calendarItemDetail, { where: { id: id } });
      });
    }
  }, {
    key: 'findCreateAbsentDateDetails',
    value: function findCreateAbsentDateDetails(parameters) {
      return this.modals.service_absent_days.findCreateFind(parameters);
    }
  }, {
    key: 'findCreateServicePayment',
    value: function findCreateServicePayment(parameters) {
      return this.modals.service_payment.findCreateFind(parameters);
    }
  }, {
    key: 'findCreateCalculationDetail',
    value: function findCreateCalculationDetail(parameters) {
      return this.modals.service_calculation.findCreateFind(parameters);
    }
  }, {
    key: 'findAndCreateCalendarItem',
    value: function findAndCreateCalendarItem(parameters) {
      return this.modals.user_calendar_item.findCreateFind(parameters);
    }
  }, {
    key: 'markAbsentForItem',
    value: function markAbsentForItem(parameters) {
      return this.modals.service_absent_days.findCreateFind(parameters);
    }
  }, {
    key: 'markPresentForItem',
    value: function markPresentForItem(parameters) {
      return this.modals.service_absent_days.destroy(parameters);
    }
  }, {
    key: 'retrieveCalendarItemList',
    value: function retrieveCalendarItemList(options, language, limit, offset) {
      var _this4 = this;

      var calendarItemList = void 0;
      var calendarItemOptions = {
        where: options,
        order: [['created_at', 'desc']]
      };
      if (limit) {
        calendarItemOptions.limit = limit;
      }

      if (offset) {
        calendarItemOptions.offset = offset;
      }

      return _bluebird2.default.try(function () {
        return _this4.retrieveAllCalendarItems(calendarItemOptions);
      }).then(function (result) {
        calendarItemList = result;

        return [_this4.retrieveCalendarServices({ id: calendarItemList.map(function (item) {
            return item.service_id;
          }) }, language), _bluebird2.default.all(calendarItemList.map(function (item) {
          return _this4.retrieveLatestServicePaymentDetails({
            include: {
              model: _this4.modals.service_absent_days,
              as: 'absent_day_detail',
              required: false
            },
            where: {
              end_date: { $lte: (0, _moment2.default)().endOf('M').valueOf() },
              ref_id: item.id
            }
          });
        })), _bluebird2.default.all(calendarItemList.map(function (item) {
          return _this4.retrieveLatestServiceCalculation({
            where: {
              ref_id: item.id
            },
            include: {
              model: _this4.modals.quantities,
              as: 'unit',
              attributes: ['id', ['quantity_name', 'default_title'], ['' + (language ? 'quantity_name_' + language : 'quantity_name'), 'title']],
              required: false
            }
          });
        }))];
      }).spread(function (services, latest_payment_details, latest_calculation_details) {
        return calendarItemList.map(function (item) {
          item.service_type = services[0].find(function (serviceItem) {
            return serviceItem.id === item.service_id;
          });

          item.latest_payment_detail = latest_payment_details.find(function (paymentItem) {
            return paymentItem.ref_id === item.id;
          });
          item.latest_calculation_detail = latest_calculation_details.find(function (calcItem) {
            return calcItem.ref_id === item.id;
          });
          item.present_days = item.latest_payment_detail ? item.latest_payment_detail.total_days : 0;
          item.absent_days = item.latest_payment_detail ? item.latest_payment_detail.absent_day_detail.length : 0;

          return item;
        });
      });
    }
  }, {
    key: 'retrieveAllCalendarItems',
    value: function retrieveAllCalendarItems(options) {
      return this.modals.user_calendar_item.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'retrieveServicePaymentDetails',
    value: function retrieveServicePaymentDetails(options) {
      return this.modals.service_payment.findAll(options);
    }
  }, {
    key: 'retrieveLatestServicePaymentDetails',
    value: function retrieveLatestServicePaymentDetails(options) {
      options.order = [['end_date', 'DESC']];
      return this.modals.service_payment.findOne(options).then(function (result) {
        return result ? result.toJSON() : {};
      });
    }
  }, {
    key: 'retrieveLatestServiceCalculation',
    value: function retrieveLatestServiceCalculation(options) {
      options.order = [['effective_date', 'DESC']];
      return this.modals.service_calculation.findOne(options).then(function (result) {
        return result ? result.toJSON() : {};
      });
    }
  }, {
    key: 'updateServicePaymentForLatest',
    value: function updateServicePaymentForLatest(options) {
      var _this5 = this;

      var productBody = options.productBody,
          serviceCalculationBody = options.serviceCalculationBody;

      console.log(serviceCalculationBody);
      var effectiveDate = serviceCalculationBody ? (0, _moment2.default)(options.latest_payment_detail ? options.latest_payment_detail.end_date : serviceCalculationBody.effective_date, _moment2.default.ISO_8601) : (0, _moment2.default)();
      var currentYear = (0, _moment2.default)().year();
      var effectiveYear = effectiveDate.year();
      var servicePaymentArray = [];
      var yearDiff = currentYear > effectiveYear ? currentYear - effectiveYear : null;
      var selected_days = productBody.selected_days,
          wages_type = productBody.wages_type;

      selected_days = serviceCalculationBody.selected_days || selected_days;
      if (!yearDiff) {
        var currentMth = (0, _moment2.default)().month();
        var _currentYear = (0, _moment2.default)().year();
        var effectiveMth = effectiveDate.month();
        servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
          currentMth: currentMth,
          effectiveMth: effectiveMth,
          effectiveDate: options.latest_payment_detail ? effectiveDate.add(1, 'days') : effectiveDate,
          selected_days: selected_days, wages_type: wages_type,
          serviceCalculationBody: serviceCalculationBody,
          user: {
            id: productBody.user_id
          },
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
          var selected_days = productBody.selected_days,
              wages_type = productBody.wages_type;

          selected_days = serviceCalculationBody.selected_days || selected_days;
          (_servicePaymentArray = servicePaymentArray).push.apply(_servicePaymentArray, _toConsumableArray((0, _shared.monthlyPaymentCalc)({
            currentMth: currentMth,
            effectiveMth: effectiveMth,
            effectiveDate: options.latest_payment_detail ? effectiveDate.add(1, 'days') : effectiveDate,
            selected_days: selected_days, wages_type: wages_type,
            serviceCalculationBody: serviceCalculationBody,
            user: {
              id: productBody.user_id
            },
            currentYear: currentYear
          })));
        });
      }

      return _bluebird2.default.all(servicePaymentArray.map(function (payItem) {
        if (options.latest_payment_detail && effectiveDate.diff((0, _moment2.default)(payItem.start_date, _moment2.default.ISO_8601), 'days') === 0) {
          var _options$latest_payme = options.latest_payment_detail,
              start_date = _options$latest_payme.start_date,
              total_amount = _options$latest_payme.total_amount,
              total_days = _options$latest_payme.total_days,
              total_units = _options$latest_payme.total_units,
              amount_paid = _options$latest_payme.amount_paid;
          var end_date = payItem.end_date;

          total_amount += payItem.total_amount;
          total_days += payItem.total_days;
          total_units += payItem.total_units;
          return _this5.modals.service_payment.update({
            start_date: start_date,
            end_date: end_date,
            total_amount: total_amount.toFixed(2),
            total_days: total_days,
            total_units: total_units,
            amount_paid: amount_paid
          }, {
            where: {
              id: options.latest_payment_detail.id
            }
          });
        }
        payItem.ref_id = options.ref_id;
        return _this5.modals.service_payment.create(payItem);
      }));
    }
  }, {
    key: 'retrieveCalendarItemById',
    value: function retrieveCalendarItemById(id, language) {
      var _this6 = this;

      var calendarItemDetail = void 0;
      return this.modals.user_calendar_item.findById(id, {
        include: [{
          model: this.modals.calendar_item_payment,
          as: 'payments',
          order: [['paid_on', 'asc']],
          required: false
        }, {
          model: this.modals.service_payment,
          as: 'payment_detail',
          include: {
            model: this.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          },
          order: [['end_date', 'desc']],
          required: true
        }, {
          model: this.modals.service_calculation,
          as: 'calculation_detail',
          include: {
            model: this.modals.quantities,
            as: 'unit',
            attributes: ['id', ['quantity_name', 'default_title'], ['' + (language ? 'quantity_name_' + language : 'quantity_name'), 'title']],
            required: false
          },
          required: true,
          order: [['effective_date', 'desc']]
        }]
      }).then(function (result) {
        calendarItemDetail = result.toJSON();
        return _this6.retrieveCalendarServiceById(calendarItemDetail.service_id, language);
      }).then(function (services) {
        calendarItemDetail.service_type = services;
        calendarItemDetail.calculation_detail = _lodash2.default.orderBy(calendarItemDetail.calculation_detail, ['effective_date'], ['desc']);
        calendarItemDetail.payment_detail = _lodash2.default.orderBy(calendarItemDetail.payment_detail, ['end_date'], ['desc']);
        var item_start_date = (0, _moment2.default)(calendarItemDetail.payment_detail[0].start_date, _moment2.default.ISO_8601);
        var item_end_date = (0, _moment2.default)(calendarItemDetail.payment_detail[0].end_date, _moment2.default.ISO_8601);

        if ((0, _moment2.default)().endOf('days').diff((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601), 'days') >= 0) {
          var lastItemMonth = item_end_date.month();
          var lastItemYear = item_end_date.year();
          var monthDiff = (0, _moment2.default)().month() - lastItemMonth;
          var yearDiff = (0, _moment2.default)().year() - lastItemYear;
          if (yearDiff > 0) {} else if (monthDiff > 0) {
            calendarItemDetail.payment_detail[0].end_date = (0, _moment2.default)([(0, _moment2.default)().year(), 0, 31]).month(lastItemMonth);
            for (var i = 1; i <= monthDiff; i++) {
              var start_date = (0, _moment2.default)([(0, _moment2.default)().year(), lastItemMonth + i, 1]);
              var month_end_date = (0, _moment2.default)([(0, _moment2.default)().year(), 0, 31]).month(lastItemMonth + i);
              calendarItemDetail.payment_detail.push({
                start_date: start_date,
                end_date: month_end_date.diff((0, _moment2.default)(), 'days') > 0 ? (0, _moment2.default)() : month_end_date,
                absent_day_detail: [],
                ref_id: id
              });
            }
          } else {
            calendarItemDetail.payment_detail[0].end_date = (0, _moment2.default)();
          }
        }

        calendarItemDetail.payment_detail = calendarItemDetail.payment_detail.map(function (pItem) {
          pItem.calendar_item = {
            selected_days: calendarItemDetail.selected_days,
            wages_type: calendarItemDetail.wages_type
          };
          return pItem;
        });

        return _bluebird2.default.all([calendarItemDetail, _this6.updatePaymentDetailForCalc({
          servicePayments: calendarItemDetail.payment_detail,
          serviceCalcList: calendarItemDetail.calculation_detail,
          absentDetailToUpdate: []
        })]);
      }).spread(function (calendarItemDetail) {
        return [calendarItemDetail, _this6.retrieveServicePaymentDetails({
          where: {
            ref_id: id
          },
          include: {
            model: _this6.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          },
          order: [['end_date', 'desc']]
        })];
      }).spread(function (calendarItemDetail, paymentDetailResult) {
        console.log(JSON.stringify({ calendarItemDetail: calendarItemDetail, paymentDetailResult: paymentDetailResult }));
        calendarItemDetail.payment_detail = paymentDetailResult;
        return calendarItemDetail;
      });
    }
  }, {
    key: 'retrieveCurrentCalculationDetail',
    value: function retrieveCurrentCalculationDetail(options) {
      return this.modals.service_calculation.findOne({
        where: options,
        order: [['effective_date', 'desc']]
      }).then(function (result) {
        return result.toJSON();
      });
    }
  }, {
    key: 'retrieveAllCalculationDetail',
    value: function retrieveAllCalculationDetail(options) {
      return this.modals.service_calculation.findAll({
        where: options,
        order: [['effective_date', 'desc']]
      }).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
    }
  }, {
    key: 'updatePaymentDetail',
    value: function updatePaymentDetail(id, paymentDetail, isForAbsent) {
      var _this7 = this;

      return this.modals.service_payment.findById(id, {
        include: [{
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true
        }, {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false
        }]
      }).then(function (result) {
        var currentDetail = result.toJSON();
        var currentEndDate = (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601);
        var newEndDate = paymentDetail.end_date && (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).diff(currentEndDate, 'days') > 0 ? (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601) : (0, _moment2.default)().diff(currentEndDate, 'days') > 0 && !isForAbsent ? (0, _moment2.default)() : currentEndDate;

        var end_date = (0, _moment2.default)([currentEndDate.year(), 0, 31]).month(currentEndDate.month());
        var daysInMonth = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, end_date, paymentDetail.selected_days || currentDetail.calendar_item.selected_days);

        if (currentDetail.calendar_item.wages_type === 1) {
          paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
        }

        if (paymentDetail.quantity || paymentDetail.quantity === 0) {
          paymentDetail.unit_price = paymentDetail.quantity * paymentDetail.unit_price;

          console.log(JSON.stringify({
            quantity: paymentDetail.quantity,
            total_units: currentDetail.total_units
          }));
        }

        var daysInPeriod = 0;
        if (newEndDate) {
          var monthDiff = newEndDate.month() - (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601).month();
          if (monthDiff > 0) {
            return _this7.addPaymentDetail({
              start_date: newEndDate.startOf('M'),
              end_date: newEndDate.endOf('days'),
              latest_end_date: currentEndDate,
              ref_id: currentDetail.ref_id,
              monthDiff: monthDiff
            }, paymentDetail);
          } else {
            paymentDetail.absent_day = currentDetail.absent_day_detail.length;
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, (0, _moment2.default)(newEndDate, _moment2.default.ISO_8601).endOf('days'), paymentDetail.selected_days || currentDetail.calendar_item.selected_days) - paymentDetail.absent_day;

            console.log('\n\n\n\n', JSON.stringify({
              cEnd_date: currentDetail.end_date,
              PEnd_date: paymentDetail.end_date,
              daysInPeriod: daysInPeriod
            }));
            paymentDetail.total_days = daysInPeriod;
            paymentDetail.total_units = paymentDetail.quantity ? paymentDetail.quantity * daysInPeriod : 0;
            paymentDetail.total_amount = paymentDetail.unit_price * daysInPeriod;
          }
        }

        paymentDetail.total_amount = paymentDetail.total_amount || paymentDetail.total_days === 0 ? paymentDetail.total_amount : currentDetail.total_amount;
        paymentDetail.total_days = paymentDetail.total_days || paymentDetail.total_days === 0 ? paymentDetail.total_days : currentDetail.total_days;
        paymentDetail.total_units = paymentDetail.total_units || paymentDetail.total_units === 0 ? paymentDetail.total_units : currentDetail.total_units;
        result.updateAttributes({
          total_amount: paymentDetail.total_amount.toFixed(2),
          total_days: paymentDetail.total_days,
          end_date: newEndDate,
          status_type: paymentDetail.status_type || currentDetail.status_type,
          amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
          total_units: paymentDetail.total_units
        });

        return result;
      });
    }
  }, {
    key: 'addPaymentDetail',
    value: function addPaymentDetail(options, paymentDetail) {
      return this.modals.service_payment.findOne({
        where: {
          start_date: options.start_date,
          end_date: {
            $lte: (0, _moment2.default)(options.end_date, _moment2.default.ISO_8601).endOf('M')
          },
          ref_id: options.ref_id
        }, include: [{
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true
        }, {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false
        }]
      }).then(function (result) {
        if (result) {
          var currentDetail = result.toJSON();
          var currentEndDate = (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601);
          var end_date = (0, _moment2.default)([currentEndDate.year(), 0, 31]).month(currentEndDate.month());
          var daysInMonth = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, end_date, paymentDetail.selected_days || currentDetail.calendar_item.selected_days);

          if (currentDetail.calendar_item.wages_type === 1) {
            paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
          }

          if (paymentDetail.quantity || paymentDetail.quantity === 0) {
            paymentDetail.unit_price = paymentDetail.quantity * paymentDetail.unit_price;
          }

          var additional_unit_price = 0;
          var daysInPeriod = 0;
          if (paymentDetail.end_date) {
            if ((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).endOf('days').diff((0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601), 'days') > 0) {
              daysInPeriod = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(currentDetail.start_date, _moment2.default.ISO_8601).endOf('days'), (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601).endOf('days'), paymentDetail.selected_days || currentDetail.calendar_item.selected_days) - currentDetail.absent_day_detail.length;
              paymentDetail.total_days = daysInPeriod;
              paymentDetail.total_units = paymentDetail.quantity ? paymentDetail.quantity * daysInPeriod : 0;
              paymentDetail.total_amount = paymentDetail.unit_price * daysInPeriod;
            }
          }

          paymentDetail.total_amount = paymentDetail.total_amount || currentDetail.total_amount;
          result.updateAttributes({
            total_amount: paymentDetail.total_amount > 1 ? paymentDetail.total_amount.toFixed(2) : 0,
            total_days: paymentDetail.total_days || currentDetail.total_days,
            status_type: paymentDetail.status_type || currentDetail.status_type,
            amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
            total_units: paymentDetail.total_units
          });

          return result;
        }
      });
    }
  }, {
    key: 'addServiceCalc',
    value: function addServiceCalc(options, calcDetail) {
      var _this8 = this;

      return this.modals.service_calculation.findOne({
        where: options
      }).then(function (calcResult) {
        if (calcResult) {
          return new _bluebird2.default(function (resolve, reject) {
            return setImmediate(function () {
              resolve(calcResult.updateAttributes(calcDetail));
              // (calcResult);
            });
          });
        }

        return _this8.modals.service_calculation.create(calcDetail);
      });
    }
  }, {
    key: 'deleteCalendarItemById',
    value: function deleteCalendarItemById(id, user_id) {
      return this.modals.user_calendar_item.destroy({
        where: { id: id, user_id: user_id }
      });
    }
  }, {
    key: 'manipulatePaymentDetail',
    value: function manipulatePaymentDetail(options) {
      var _this9 = this;

      var serviceCalcList = void 0;
      var servicePayments = void 0;
      var absentDetail = [];
      return _bluebird2.default.all([this.modals.service_payment.count({
        where: {
          ref_id: options.ref_id,
          start_date: {
            $lte: options.effective_date
          }
        },
        include: [{
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true
        }, {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false
        }]
      }), this.modals.service_calculation.findAll({
        where: {
          ref_id: options.ref_id
        }
      }), this.modals.service_payment.findAll({
        where: {
          ref_id: options.ref_id,
          end_date: {
            $gte: options.effective_date
          }
        },
        include: [{
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true
        }, {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false
        }]
      })]).then(function (serviceResult) {
        serviceCalcList = serviceResult[1].map(function (item) {
          return item.toJSON();
        });
        serviceCalcList = _lodash2.default.orderBy(serviceCalcList, ['effective_date'], ['asc']);
        servicePayments = serviceResult[2].map(function (item) {
          return item.toJSON();
        });
        servicePayments.forEach(function (item) {
          var _absentDetail;

          return (_absentDetail = absentDetail).push.apply(_absentDetail, _toConsumableArray(item.absent_day_detail || []));
        });
        absentDetail = _lodash2.default.orderBy(absentDetail, ['absent_date'], ['asc']);
        var servicePaymentArray = [];
        var destroyServicePayment = void 0;
        if (serviceResult[0] === 0) {
          destroyServicePayment = _this9.modals.service_payment.destroy({
            where: {
              ref_id: servicePayments[0].calendar_item.id
            }
          });
          var effectiveDate = (0, _moment2.default)(options.effective_date, _moment2.default.ISO_8601);
          var currentYear = (0, _moment2.default)().year();
          var effectiveYear = effectiveDate.year();
          var yearDiff = currentYear > effectiveYear ? currentYear - effectiveYear : null;
          var absent_date = absentDetail.length > 0 ? (0, _moment2.default)(absentDetail[absentDetail.length - 1].absent_date, _moment2.default.ISO_8601) : (0, _moment2.default)();
          var currentDate = absent_date.diff((0, _moment2.default)(), 'days') > 0 ? absent_date : (0, _moment2.default)();
          if (!yearDiff) {
            var currentMth = currentDate.month();
            var _currentYear2 = currentDate.year();
            var effectiveMth = effectiveDate.month();
            var _servicePayments$0$ca = servicePayments[0].calendar_item,
                selected_days = _servicePayments$0$ca.selected_days,
                wages_type = _servicePayments$0$ca.wages_type;

            var serviceCalculationBody = serviceCalcList[0];
            selected_days = serviceCalculationBody.selected_days || selected_days;
            servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
              currentMth: currentMth,
              effectiveMth: effectiveMth,
              effectiveDate: effectiveDate,
              selected_days: selected_days,
              wages_type: wages_type,
              serviceCalculationBody: serviceCalculationBody,
              user: {
                id: servicePayments[0].calendar_item.user_id
              },
              currentYear: _currentYear2,
              currentDate: currentDate
            });
          } else {
            var yearArr = [];
            for (var i = 0; i <= yearDiff; i++) {
              yearArr.push(effectiveYear + i);
            }
            yearArr.forEach(function (currentYear) {
              var _servicePaymentArray2;

              var yearStart = (0, _moment2.default)([currentYear, 0, 1]);
              var yearEnd = (0, _moment2.default)([currentYear, 0, 31]).endOf('Y');
              var currentMth = (0, _moment2.default)().endOf('M').diff(yearEnd, 'M') > 0 ? yearEnd.month() : currentDate.month();
              var effectiveMth = currentYear > effectiveYear ? yearStart.month() : effectiveDate.month();
              var _servicePayments$0$ca2 = servicePayments[0].calendar_item,
                  selected_days = _servicePayments$0$ca2.selected_days,
                  wages_type = _servicePayments$0$ca2.wages_type;

              var serviceCalculationBody = serviceCalcList[0];
              selected_days = serviceCalculationBody.selected_days || selected_days;
              (_servicePaymentArray2 = servicePaymentArray).push.apply(_servicePaymentArray2, _toConsumableArray((0, _shared.monthlyPaymentCalc)({
                currentMth: currentMth,
                effectiveMth: effectiveMth,
                effectiveDate: effectiveDate, selected_days: selected_days, wages_type: wages_type,
                serviceCalculationBody: serviceCalculationBody,
                user: {
                  id: servicePayments[0].calendar_item.user_id
                },
                currentYear: currentYear,
                currentDate: currentDate
              })));
            });
          }
        }

        serviceCalcList = _lodash2.default.orderBy(serviceCalcList, ['effective_date'], ['desc']);
        return _bluebird2.default.all([_bluebird2.default.all(servicePaymentArray.map(function (item) {
          item.ref_id = servicePayments[0].calendar_item.id;
          return _this9.modals.service_payment.findCreateFind({ where: item });
        })), destroyServicePayment, serviceResult[0], servicePayments[0].calendar_item]);
      }).then(function (results) {
        console.log(JSON.stringify(results));
        var absentDetailToUpdate = [];
        if (results[2] === 0) {
          servicePayments = results[0].map(function (paymentItem) {
            var paymentDetail = paymentItem[0].toJSON();
            var absent_day_detail = absentDetail.filter(function (absentItem) {
              return (0, _moment2.default)(absentItem.absent_date, _moment2.default.ISO_8601).diff((0, _moment2.default)(paymentDetail.start_date, _moment2.default.ISO_8601), 'days') >= 0 && (0, _moment2.default)(absentItem.absent_date, _moment2.default.ISO_8601).diff((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601), 'days') <= 0;
            });
            paymentDetail.absent_day_detail = absent_day_detail;
            absentDetailToUpdate.push.apply(absentDetailToUpdate, _toConsumableArray(absent_day_detail.map(function (absentItem) {
              absentItem = _lodash2.default.omit(absentItem, 'id');
              absentItem.payment_id = paymentDetail.id;
              return absentItem;
            })));
            paymentDetail.calendar_item = results[3];
            return paymentDetail;
          });
        }

        return _this9.updatePaymentDetailForCalc({
          servicePayments: servicePayments,
          serviceCalcList: serviceCalcList,
          absentDetailToUpdate: absentDetailToUpdate
        });
      }).then(function (result) {
        return _bluebird2.default.all(result[0].length > 0 ? result[0].map(function (absentItem) {
          return _this9.markAbsentForItem({ where: absentItem });
        }) : []);
      });
    }
  }, {
    key: 'updatePaymentDetailForCalc',
    value: function updatePaymentDetailForCalc(parameters) {
      var _this10 = this;

      var servicePayments = parameters.servicePayments,
          serviceCalcList = parameters.serviceCalcList,
          absentDetailToUpdate = parameters.absentDetailToUpdate;

      return _bluebird2.default.all([absentDetailToUpdate].concat(_toConsumableArray(servicePayments.map(function (paymentItem) {
        var start_date = (0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601).valueOf();
        var end_date = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).valueOf();
        var prevServiceCalc = serviceCalcList.find(function (calcItem) {
          var effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601).valueOf();
          return effective_date <= start_date;
        });

        var isPrevCalcExist = false;
        var serviceCalc = serviceCalcList.filter(function (calcItem) {
          var effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601).valueOf();
          return effective_date >= start_date && effective_date <= end_date;
        });
        serviceCalc = serviceCalc.map(function (calcItem) {
          if (prevServiceCalc && prevServiceCalc.id === calcItem.id) {
            isPrevCalcExist = true;
          }

          return calcItem;
        });

        if (prevServiceCalc && !isPrevCalcExist) {
          serviceCalc.push(prevServiceCalc);
          serviceCalc = _lodash2.default.orderBy(serviceCalc, ['effective_date'], ['desc']);
        }

        var total_amount = 0;
        var total_days = 0;
        var total_units = 0;
        serviceCalc.forEach(function (calcItem, index) {
          var nextIndex = index > 0 ? index - 1 : index;
          var periodStartDate = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601);
          var effective_date = periodStartDate.valueOf();
          var next_effective_date = (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).valueOf();
          var absentDays = 0;
          var daysInMonth = 0;
          var daysInPeriod = 0;

          var selected_days = paymentItem.calendar_item.selected_days;
          selected_days = calcItem.selected_days || selected_days;
          var startDate = (0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601);
          var periodEndDate = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601);
          var monthEndDate = periodEndDate.endOf('M');
          console.log('\n\n\n\n\n\n', JSON.stringify({
            effective_date: effective_date,
            start_date: start_date,
            next_effective_date: next_effective_date,
            nextEffective: serviceCalc[nextIndex].effective_date
          }));
          if (effective_date <= start_date && start_date !== next_effective_date) {
            var nextEffectDate = (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).subtract(1, 'days');
            periodEndDate = monthEndDate.diff(nextEffectDate, 'months') > 0 ? periodEndDate : nextEffectDate;
            periodStartDate = (0, _moment2.default)(start_date);
            var __ret = _this10.retrieveDayInPeriod({
              daysInMonth: daysInMonth, startDate: startDate, monthEndDate: monthEndDate, selected_days: selected_days, daysInPeriod: daysInPeriod,
              periodStartDate: periodStartDate, periodEndDate: periodEndDate, absentDays: absentDays, paymentItem: paymentItem
            });
            daysInMonth = __ret.daysInMonth;
            daysInPeriod = __ret.daysInPeriod;
            absentDays = __ret.absentDays;
            console.log('I am here', JSON.stringify({
              paymentItem: paymentItem,
              startDate: startDate,
              monthEndDate: monthEndDate,
              periodStartDate: periodStartDate,
              periodEndDate: periodEndDate,
              selected_days: selected_days,
              daysInMonth: daysInMonth,
              daysInPeriod: daysInPeriod,
              absentDays: absentDays
            }));
          } else if (index === 0) {
            periodEndDate = periodEndDate.diff((0, _moment2.default)(), 'days') > 0 || startDate.startOf('months').diff((0, _moment2.default)(), 'months') <= 0 ? periodEndDate : (0, _moment2.default)();
            var _ret = _this10.retrieveDayInPeriod({
              daysInMonth: daysInMonth,
              startDate: startDate,
              monthEndDate: monthEndDate,
              selected_days: selected_days,
              daysInPeriod: daysInPeriod,
              periodStartDate: periodStartDate,
              periodEndDate: periodEndDate,
              absentDays: absentDays,
              paymentItem: paymentItem
            });
            daysInMonth = _ret.daysInMonth;
            daysInPeriod = _ret.daysInPeriod;
            absentDays = _ret.absentDays;
            console.log('You Are here', JSON.stringify({
              paymentItem: paymentItem,
              startDate: startDate,
              monthEndDate: monthEndDate,
              periodStartDate: periodStartDate,
              periodEndDate: periodEndDate,
              selected_days: selected_days,
              daysInMonth: daysInMonth,
              daysInPeriod: daysInPeriod,
              absentDays: absentDays
            }));
          } else {
            periodEndDate = (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).subtract(1, 'd');
            var _ret2 = _this10.retrieveDayInPeriod({
              daysInMonth: daysInMonth,
              startDate: startDate,
              monthEndDate: monthEndDate,
              selected_days: selected_days,
              daysInPeriod: daysInPeriod,
              periodStartDate: periodStartDate,
              periodEndDate: periodEndDate,
              absentDays: absentDays,
              paymentItem: paymentItem
            });
            daysInMonth = _ret2.daysInMonth;
            daysInPeriod = _ret2.daysInPeriod;
            absentDays = _ret2.absentDays;

            console.log('We are here', JSON.stringify({
              paymentItem: paymentItem,
              startDate: startDate,
              monthEndDate: monthEndDate,
              periodStartDate: periodStartDate,
              periodEndDate: periodEndDate,
              selected_days: selected_days,
              daysInMonth: daysInMonth,
              daysInPeriod: daysInPeriod,
              absentDays: absentDays
            }));
          }

          daysInPeriod = daysInPeriod - absentDays;
          var unit_price = calcItem.unit_price;
          if (paymentItem.calendar_item.wages_type === 1) {
            unit_price = unit_price / daysInMonth;
          }

          var current_total_amount = unit_price * daysInPeriod;
          if (calcItem.quantity || calcItem.quantity === 0) {
            total_amount += calcItem.quantity * current_total_amount;
            total_units += calcItem.quantity * daysInPeriod;
          } else {
            total_amount += current_total_amount;
            total_units += daysInPeriod;
          }

          total_days += daysInPeriod;
        });

        return paymentItem.id ? _this10.modals.service_payment.update({
          start_date: start_date,
          end_date: end_date,
          updated_by: paymentItem.updated_by,
          status_type: paymentItem.status_type,
          total_amount: total_amount.toFixed(2),
          total_days: total_days,
          total_units: total_units,
          amount_paid: 0
        }, {
          where: {
            id: paymentItem.id
          }
        }) : _this10.modals.service_payment.create({
          start_date: start_date,
          end_date: end_date,
          updated_by: paymentItem.updated_by,
          status_type: paymentItem.status_type,
          total_amount: total_amount.toFixed(2),
          total_days: total_days,
          total_units: total_units,
          amount_paid: 0
        });
      })))).catch(function (err) {
        return Console.log('Error is here', err);
      });
    }
  }, {
    key: 'retrieveDayInPeriod',
    value: function retrieveDayInPeriod(parameters) {
      var daysInMonth = parameters.daysInMonth,
          startDate = parameters.startDate,
          monthEndDate = parameters.monthEndDate,
          selected_days = parameters.selected_days,
          daysInPeriod = parameters.daysInPeriod,
          periodStartDate = parameters.periodStartDate,
          periodEndDate = parameters.periodEndDate,
          absentDays = parameters.absentDays,
          paymentItem = parameters.paymentItem;

      daysInMonth = (0, _moment2.default)().isoWeekdayCalc(startDate.startOf('month'), monthEndDate, selected_days);
      daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(periodStartDate, periodEndDate, selected_days);
      absentDays = paymentItem.absent_day_detail.filter(function (absentDayItem) {
        var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
        return absent_date.diff(periodStartDate, 'days') >= 0 && absent_date.diff(periodEndDate, 'days') <= 0;
      }).length;
      return { daysInMonth: daysInMonth, daysInPeriod: daysInPeriod, absentDays: absentDays };
    }
  }, {
    key: 'markPaymentPaid',
    value: function markPaymentPaid(id, servicePaymentDetail) {
      var _this11 = this;

      return _bluebird2.default.all([this.modals.calendar_item_payment.create(servicePaymentDetail), this.retrieveCalendarItemById(id, 'en')]).then(function (result) {
        var _result$ = result[1],
            product_name = _result$.product_name,
            service_type = _result$.service_type,
            user_id = _result$.user_id;
        var category_id = service_type.category_id,
            main_category_id = service_type.main_category_id,
            sub_category_id = service_type.sub_category_id;

        return _this11.productAdaptor.createEmptyProduct({
          document_date: servicePaymentDetail.paid_on,
          category_id: category_id, main_category_id: main_category_id, sub_category_id: sub_category_id,
          product_name: product_name,
          purchase_cost: servicePaymentDetail.amount_paid,
          status_type: 11,
          updated_by: user_id,
          user_id: user_id,
          model: servicePaymentDetail.name
        });
      });
    }
  }]);

  return CalendarServiceAdaptor;
}();

exports.default = CalendarServiceAdaptor;