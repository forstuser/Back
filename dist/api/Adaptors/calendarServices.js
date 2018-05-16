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

var _sellers = require('./sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _shared = require('../../helpers/shared');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('moment-weekday-calc');

var CalendarServiceAdaptor = function () {
  function CalendarServiceAdaptor(modals) {
    _classCallCheck(this, CalendarServiceAdaptor);

    this.modals = modals;
    this.sellerAdaptor = new _sellers2.default(modals);
    this.productAdaptor = new _product2.default(modals);
  }

  _createClass(CalendarServiceAdaptor, [{
    key: 'retrieveCalendarServices',
    value: function retrieveCalendarServices(options, language) {
      var _this = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this.retrieveAllCalendarServices(options, language), _this.retrieveAllQuantities(options, language)]);
      }).spread(function (calendar_services, unit_types) {
        return [calendar_services.map(function (item) {
          var calendarServiceItem = item.toJSON();
          calendarServiceItem.calendarServiceImageUrl = calendarServiceItem.calendarServiceImageUrl + '/thumbnail';
          calendarServiceItem.name = calendarServiceItem ? calendarServiceItem.name || calendarServiceItem.default_name : '';
          calendarServiceItem.quantity_type = calendarServiceItem ? calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type : '';
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

        return _bluebird2.default.all(subPromiseArray);
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

        var calendarItemIds = calendarItemList.map(function (item) {
          return item.id;
        });
        return _bluebird2.default.all([_this4.retrieveCalendarServices({ id: calendarItemList.map(function (item) {
            return item.service_id;
          }) }, language), _this4.retrieveServicePaymentDetails({
          include: {
            model: _this4.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          },
          where: {
            ref_id: calendarItemIds,
            end_date: {
              $in: [_this4.modals.sequelize.literal('SELECT MAX("service_payment"."end_date") FROM "table_service_payment" \n                        as "service_payment" ' + (calendarItemIds.length > 0 ? 'WHERE "service_payment"."ref_id" in \n                        (' + calendarItemIds.toString() + ')' : '') + ' GROUP BY ref_id')]
            }
          }
        }), _this4.modals.service_calculation.findAll({
          where: {
            ref_id: calendarItemIds,
            effective_date: {
              $in: [_this4.modals.sequelize.literal('SELECT MAX("service_calc"."effective_date") FROM "table_service_calculation" \n                        as "service_calc" ' + (calendarItemIds.length > 0 ? 'WHERE "service_calc"."ref_id" in \n                        (' + calendarItemIds.toString() + ')' : '') + ' GROUP BY ref_id')]
            }
          },
          include: {
            model: _this4.modals.quantities,
            as: 'unit',
            attributes: ['id', ['quantity_name', 'default_title'], ['' + (language ? 'quantity_name_' + language : 'quantity_name'), 'title']],
            required: false
          }
        }), _this4.retrieveServicePaymentDetails({
          where: {
            ref_id: calendarItemIds
          },
          attributes: ['ref_id', [_this4.modals.sequelize.fn('SUM', _this4.modals.sequelize.col('total_amount')), 'total_amount']],
          group: ['ref_id']
        }), _this4.modals.calendar_item_payment.findAll({
          where: {
            ref_id: calendarItemIds
          },
          attributes: ['ref_id', [_this4.modals.sequelize.fn('SUM', _this4.modals.sequelize.col('amount_paid')), 'total_amount_paid']],
          group: ['ref_id']
        })]);
      }).spread(function (services, latest_payment_details, latest_calculation_details, attendance_totals, payment_totals) {
        payment_totals = payment_totals.map(function (paymentItem) {
          return paymentItem ? paymentItem.toJSON() : undefined;
        });
        latest_calculation_details = latest_calculation_details.map(function (calcItem) {
          var calculationItem = calcItem.toJSON();
          if (calculationItem.unit) {
            calculationItem.unit.title = calculationItem.unit.title || calculationItem.unit.default_title;
          }
          return calculationItem;
        });
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
          var attendance_calc = attendance_totals.find(function (paymentItem) {
            return paymentItem && paymentItem.ref_id === item.id;
          });
          var payment_calc = payment_totals.find(function (paymentItem) {
            return paymentItem && paymentItem.ref_id === item.id;
          });
          var attendance_total = attendance_calc ? attendance_calc.total_amount : 0;
          var payment_total = payment_calc ? payment_calc.total_amount_paid || 0 : 0;
          console.log('\n\n\n\n', {
            payment_calc: payment_calc,
            attendance_calc: attendance_calc,
            attendance_total: attendance_total,
            payment_total: payment_total
          });
          item.outstanding_amount = (payment_total - attendance_total).toFixed(2);

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
      return this.modals.service_payment.findAll(options).then(function (result) {
        return result.map(function (item) {
          return item.toJSON();
        });
      });
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
    key: 'retrieveCalendarItemById',
    value: function retrieveCalendarItemById(id, language) {
      var _this5 = this;

      var calendarItemDetail = void 0;
      var destroyablePaymentDetail = [];
      var destroyableAbsentDetails = [];
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
        return _this5.retrieveCalendarServiceById(calendarItemDetail.service_id, language);
      }).then(function (services) {
        calendarItemDetail.service_type = services;
        calendarItemDetail.calculation_detail = _lodash2.default.orderBy(calendarItemDetail.calculation_detail, ['effective_date'], ['desc']);
        calendarItemDetail.calculation_detail = calendarItemDetail.end_date ? calendarItemDetail.calculation_detail.filter(function (cDItem) {
          return (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(cDItem.effective_date, _moment2.default.ISO_8601));
        }) : calendarItemDetail.calculation_detail;
        destroyablePaymentDetail = calendarItemDetail.end_date ? calendarItemDetail.payment_detail.filter(function (pDItem) {
          return (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isBefore((0, _moment2.default)(pDItem.start_date, _moment2.default.ISO_8601));
        }) : [];
        calendarItemDetail.payment_detail = _lodash2.default.orderBy(calendarItemDetail.payment_detail, ['end_date'], ['desc']);
        calendarItemDetail.payment_detail = calendarItemDetail.end_date ? calendarItemDetail.payment_detail.filter(function (pDItem) {
          return (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(pDItem.start_date, _moment2.default.ISO_8601));
        }) : calendarItemDetail.payment_detail;
        var item_end_date = (0, _moment2.default)(calendarItemDetail.payment_detail[0].end_date, _moment2.default.ISO_8601);
        console.log(item_end_date);
        var current_date = calendarItemDetail.end_date && (0, _moment2.default)().isAfter(calendarItemDetail.end_date) ? (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601) : (0, _moment2.default)();
        if (current_date.isSameOrAfter((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601))) {

          console.log('If is here', { current_date: current_date });
          var lastItemMonth = item_end_date.month();
          var monthDiff = (0, _moment2.default)(current_date, _moment2.default.ISO_8601).startOf('months').diff((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601).startOf('months'), 'months');
          if (monthDiff > 0) {
            calendarItemDetail.payment_detail[0].end_date = (0, _moment2.default)([current_date.year(), 0, 31]).month(lastItemMonth);
            for (var i = 1; i <= monthDiff; i++) {
              var start_date = (0, _moment2.default)([current_date.year(), lastItemMonth + i, 1]);
              var month_end_date = (0, _moment2.default)([current_date.year(), 0, 31]).month(lastItemMonth + i);
              calendarItemDetail.payment_detail.push({
                start_date: start_date,
                end_date: month_end_date.isAfter(current_date) ? current_date : month_end_date,
                absent_day_detail: [],
                ref_id: id
              });
            }
          } else {
            console.log('Else is here', { current_date: current_date });
            calendarItemDetail.payment_detail[0].end_date = current_date;
          }
        }

        calendarItemDetail.payment_detail = calendarItemDetail.payment_detail.map(function (pItem) {
          pItem.end_date = !calendarItemDetail.end_date || calendarItemDetail.end_date && current_date.isSameOrAfter((0, _moment2.default)(pItem.end_date, _moment2.default.ISO_8601)) ? pItem.end_date : current_date;

          pItem.absent_day_detail = calendarItemDetail.end_date ? pItem.absent_day_detail.filter(function (aDayDetail) {
            return (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(aDayDetail.absent_date, _moment2.default.ISO_8601));
          }) : pItem.absent_day_detail;
          var last_absent_date = pItem.absent_day_detail[pItem.absent_day_detail.length - 1];
          if (last_absent_date) {
            pItem.end_date = (0, _moment2.default)(pItem.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(last_absent_date.absent_date, _moment2.default.ISO_8601)) ? pItem.end_date : last_absent_date.absent_date;
          }

          pItem.end_date = (0, _moment2.default)(pItem.start_date, _moment2.default.ISO_8601).endOf('months').isSameOrAfter((0, _moment2.default)(pItem.end_date, _moment2.default.ISO_8601)) ? pItem.end_date : (0, _moment2.default)(pItem.start_date, _moment2.default.ISO_8601).endOf('months');

          destroyableAbsentDetails = calendarItemDetail.end_date ? pItem.absent_day_detail.filter(function (aDayDetail) {
            return (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isBefore((0, _moment2.default)(aDayDetail.absent_date, _moment2.default.ISO_8601));
          }) : [];
          pItem.calendar_item = {
            selected_days: calendarItemDetail.selected_days,
            wages_type: calendarItemDetail.wages_type,
            end_date: calendarItemDetail.end_date
          };
          return pItem;
        });

        return _bluebird2.default.all([calendarItemDetail, _this5.updatePaymentDetailForCalc({
          servicePayments: calendarItemDetail.payment_detail,
          serviceCalcList: calendarItemDetail.calculation_detail,
          absentDetailToUpdate: []
        })].concat(_toConsumableArray(destroyablePaymentDetail.map(function (dPDItem) {
          return _this5.modals.service_payment.destroy({
            where: {
              id: dPDItem.id
            }
          });
        })), _toConsumableArray(destroyableAbsentDetails.map(function (dAbsentDetail) {
          return _this5.markPresentForItem({
            where: {
              id: dAbsentDetail.id
            }
          });
        }))));
      }).spread(function (calendarItemDetail) {
        return _bluebird2.default.all([calendarItemDetail, _this5.retrieveServicePaymentDetails({
          where: {
            ref_id: id
          },
          include: {
            model: _this5.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          },
          order: [['end_date', 'desc']]
        }), _this5.retrieveLatestServicePaymentDetails({
          where: {
            ref_id: id
          },
          attributes: ['ref_id', [_this5.modals.sequelize.fn('SUM', _this5.modals.sequelize.col('total_amount')), 'total_amount']],
          group: ['ref_id', 'end_date']
        }), _this5.modals.calendar_item_payment.findOne({
          where: {
            ref_id: id
          },
          attributes: ['ref_id', [_this5.modals.sequelize.fn('SUM', _this5.modals.sequelize.col('amount_paid')), 'total_amount_paid']],
          group: ['ref_id']
        })]);
      }).spread(function (calendarItemDetail, paymentDetailResult, attendance_total, payment_total) {
        calendarItemDetail.payment_detail = paymentDetailResult;
        calendarItemDetail.payment_detail[0].absent_day_detail = calendarItemDetail.end_date ? calendarItemDetail.payment_detail[0].absent_day_detail.filter(function (aDayDetail) {
          return (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(aDayDetail.absent_date, _moment2.default.ISO_8601));
        }) : calendarItemDetail.payment_detail[0].absent_day_detail;
        var attendance_total_amount = attendance_total ? attendance_total.total_amount : 0;
        payment_total = payment_total ? payment_total.toJSON() : undefined;
        var payment_total_amount = payment_total ? payment_total.total_amount_paid : 0;

        calendarItemDetail.outstanding_amount = (payment_total_amount - attendance_total_amount).toFixed(2);
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
      var _this6 = this;

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
        var newEndDate = paymentDetail.end_date && (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).isAfter(currentEndDate) ? (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601) : (0, _moment2.default)().isAfter(currentEndDate) && !isForAbsent ? (0, _moment2.default)() : currentEndDate;

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
            return _this6.addPaymentDetail({
              start_date: (0, _moment2.default)(newEndDate, _moment2.default.ISO_8601).startOf('M'),
              end_date: (0, _moment2.default)(newEndDate, _moment2.default.ISO_8601).endOf('days'),
              latest_end_date: currentEndDate,
              ref_id: currentDetail.ref_id,
              monthDiff: monthDiff
            }, paymentDetail);
          } else {
            paymentDetail.absent_day = currentDetail.absent_day_detail.length;
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, (0, _moment2.default)(newEndDate, _moment2.default.ISO_8601).endOf('days'), paymentDetail.selected_days || currentDetail.calendar_item.selected_days) - paymentDetail.absent_day;

            paymentDetail.total_days = daysInPeriod;
            paymentDetail.total_units = paymentDetail.quantity ? paymentDetail.quantity * daysInPeriod : 0;
            paymentDetail.total_amount = paymentDetail.unit_price * daysInPeriod;
          }
        }

        paymentDetail.total_amount = paymentDetail.total_amount || paymentDetail.total_days === 0 ? paymentDetail.total_amount : currentDetail.total_amount;
        paymentDetail.total_days = paymentDetail.total_days || paymentDetail.total_days === 0 ? paymentDetail.total_days : currentDetail.total_days;
        paymentDetail.total_units = paymentDetail.total_units || paymentDetail.total_units === 0 ? paymentDetail.total_units : currentDetail.total_units;
        return _bluebird2.default.try(function () {
          return result.updateAttributes({
            total_amount: paymentDetail.total_amount.toFixed(2),
            total_days: paymentDetail.total_days,
            end_date: newEndDate,
            status_type: paymentDetail.status_type || currentDetail.status_type,
            amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
            total_units: paymentDetail.total_units
          });
        });
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
            if ((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).isAfter((0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601))) {
              daysInPeriod = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(currentDetail.start_date, _moment2.default.ISO_8601).endOf('days'), (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601).endOf('days'), paymentDetail.selected_days || currentDetail.calendar_item.selected_days) - currentDetail.absent_day_detail.length;
              paymentDetail.total_days = daysInPeriod;
              paymentDetail.total_units = paymentDetail.quantity ? paymentDetail.quantity * daysInPeriod : 0;
              paymentDetail.total_amount = paymentDetail.unit_price * daysInPeriod;
            }
          }

          paymentDetail.total_amount = paymentDetail.total_amount || currentDetail.total_amount;
          return _bluebird2.default.try(function () {
            return result.updateAttributes({
              total_amount: paymentDetail.total_amount > 1 ? paymentDetail.total_amount.toFixed(2) : 0,
              total_days: paymentDetail.total_days || currentDetail.total_days,
              status_type: paymentDetail.status_type || currentDetail.status_type,
              amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
              total_units: paymentDetail.total_units
            });
          });
        }
      });
    }
  }, {
    key: 'addServiceCalc',
    value: function addServiceCalc(options, calcDetail) {
      var _this7 = this;

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

        return _this7.modals.service_calculation.create(calcDetail);
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
      var _this8 = this;

      var serviceCalcList = void 0;
      var servicePayments = void 0;
      var absentDetail = [];
      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this8.modals.service_payment.count({
          where: {
            ref_id: options.ref_id,
            start_date: {
              $lte: options.effective_date
            }
          },
          include: [{
            model: _this8.modals.user_calendar_item,
            as: 'calendar_item',
            required: true
          }, {
            model: _this8.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          }]
        }), _this8.modals.service_calculation.findAll({
          where: {
            ref_id: options.ref_id
          }
        }), _this8.modals.service_payment.findAll({
          where: {
            ref_id: options.ref_id,
            end_date: {
              $gte: options.effective_date
            }
          },
          include: [{
            model: _this8.modals.user_calendar_item,
            as: 'calendar_item',
            required: true
          }, {
            model: _this8.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          }]
        })]);
      }).then(function (serviceResult) {
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
          destroyServicePayment = _this8.modals.service_payment.destroy({
            where: {
              ref_id: servicePayments[0].calendar_item.id
            }
          });
          var effectiveDate = (0, _moment2.default)(options.effective_date, _moment2.default.ISO_8601);
          var absent_date = (0, _moment2.default)(servicePayments[0].end_date, _moment2.default.ISO_8601).startOf();
          var currentDate = absent_date.isAfter((0, _moment2.default)().startOf('days')) ? absent_date : (0, _moment2.default)();
          var currentMth = currentDate.month();
          var currentYear = currentDate.year();
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
            currentYear: currentYear,
            currentDate: currentDate
          });
        }

        console.log('\n\n\n\n\n\n\n\n', JSON.stringify(servicePaymentArray));
        serviceCalcList = _lodash2.default.orderBy(serviceCalcList, ['effective_date'], ['desc']);
        return _bluebird2.default.all([destroyServicePayment, servicePaymentArray.map(function (item) {
          item.ref_id = servicePayments[0].calendar_item.id;
          return item;
        }), serviceResult[0], servicePayments[0].calendar_item]);
      }).spread(function (destroyedItems, servicePaymentArray, serviceResult, payment_calendar_item) {
        return _bluebird2.default.all([_bluebird2.default.all(servicePaymentArray.map(function (item) {
          return _this8.modals.service_payment.findCreateFind({ where: item });
        })), serviceResult, payment_calendar_item]);
      }).then(function (results) {
        console.log(JSON.stringify(results));
        var absentDetailToUpdate = [];
        if (results[1] === 0) {
          servicePayments = results[0].map(function (paymentItem) {
            var paymentDetail = paymentItem[0].toJSON();
            var absent_day_detail = absentDetail.filter(function (absentItem) {
              var absent_date = (0, _moment2.default)(absentItem.absent_date, _moment2.default.ISO_8601);
              return absent_date.isSameOrAfter((0, _moment2.default)(paymentDetail.start_date, _moment2.default.ISO_8601)) && absent_date.isSameOrBefore((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601));
            });
            paymentDetail.absent_day_detail = absent_day_detail;
            absentDetailToUpdate.push.apply(absentDetailToUpdate, _toConsumableArray(absent_day_detail.map(function (absentItem) {
              absentItem = _lodash2.default.omit(absentItem, 'id');
              absentItem.payment_id = paymentDetail.id;
              return absentItem;
            })));
            paymentDetail.calendar_item = results[2];
            return paymentDetail;
          });
        }

        return _this8.updatePaymentDetailForCalc({
          servicePayments: servicePayments,
          serviceCalcList: serviceCalcList,
          absentDetailToUpdate: absentDetailToUpdate
        });
      }).then(function (result) {
        return _bluebird2.default.all(result.length > 0 ? result.map(function (absentItem) {
          return _this8.markAbsentForItem({ where: absentItem });
        }) : []);
      });
    }
  }, {
    key: 'updatePaymentDetailForCalc',
    value: function updatePaymentDetailForCalc(parameters) {
      var _this9 = this;

      var servicePayments = parameters.servicePayments,
          serviceCalcList = parameters.serviceCalcList;

      var absentDetailToUpdate = [];
      return _bluebird2.default.all([].concat(_toConsumableArray(servicePayments.map(function (paymentItem) {
        var start_date = (0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601).valueOf();
        var end_date = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).valueOf();
        var prevServiceCalc = serviceCalcList.find(function (calcItem) {
          var effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601);
          return effective_date.isSameOrBefore((0, _moment2.default)(start_date));
        });

        var isPrevCalcExist = false;
        var serviceCalc = serviceCalcList.filter(function (calcItem) {
          var effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601);
          return effective_date.isSameOrAfter((0, _moment2.default)(start_date)) && effective_date.isSameOrBefore((0, _moment2.default)(end_date));
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
        /*return Promise.try(() => setImmediate(() => {*/
        var total_amount = 0;
        var total_days = 0;
        var total_units = 0;

        var absentDaysToDestroy = [];
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
          var monthEndDate = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).endOf('M');
          console.log('\n\n\n\n\n\n', JSON.stringify({
            effective_date: effective_date,
            start_date: start_date,
            next_effective_date: next_effective_date,
            nextEffective: serviceCalc[nextIndex].effective_date
          }));
          if ((0, _moment2.default)(effective_date).isSameOrBefore((0, _moment2.default)(start_date)) && !(0, _moment2.default)(start_date).isSame((0, _moment2.default)(next_effective_date))) {
            var nextEffectDate = (0, _moment2.default)(next_effective_date).subtract(1, 'days');
            var nextEffectStartDate = (0, _moment2.default)(nextEffectDate.format('YYYY-MM-DD'), _moment2.default.ISO_8601).startOf('months');
            console.log(paymentItem.end_date);
            var monthDiff = (0, _moment2.default)(start_date).startOf('M').diff(nextEffectStartDate, 'M');
            periodEndDate = monthDiff > 0 ? (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601) : nextEffectDate;
            periodStartDate = (0, _moment2.default)(start_date);
            console.log({
              monthEndDate: monthEndDate,
              nextEffectStartDate: nextEffectStartDate
            });
            var __ret = _this9.retrieveDayInPeriod({
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
            daysInMonth = __ret.daysInMonth;
            daysInPeriod = __ret.daysInPeriod;
            absentDays = __ret.absentDays;
            console.log('I am here', JSON.stringify({
              paymentItem: paymentItem,
              startDate: startDate,
              periodStartDate: periodStartDate,
              periodEndDate: periodEndDate,
              selected_days: selected_days,
              daysInMonth: daysInMonth,
              daysInPeriod: daysInPeriod,
              absentDays: absentDays,
              monthDiff: monthDiff
            }));
          } else if (index === 0) {
            console.log({
              periodEndDate: periodEndDate,
              startDate: (0, _moment2.default)(startDate, _moment2.default.ISO_8601).startOf('months'),
              difference: (0, _moment2.default)(startDate, _moment2.default.ISO_8601).startOf('months').diff((0, _moment2.default)(), 'months')
            });

            periodEndDate = periodEndDate.isAfter((0, _moment2.default)()) || (0, _moment2.default)(startDate, _moment2.default.ISO_8601).isSameOrBefore((0, _moment2.default)(), 'months') ? periodEndDate : (0, _moment2.default)();
            var _ret = _this9.retrieveDayInPeriod({
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
            console.log('\n\n\n\n\n You Are here', JSON.stringify({
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
            var _ret2 = _this9.retrieveDayInPeriod({
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
          }

          total_days += daysInPeriod;
          absentDetailToUpdate.push.apply(absentDetailToUpdate, _toConsumableArray(paymentItem.absent_day_detail.filter(function (absentDayItem) {
            var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
            return selected_days.includes(absent_date.isoWeekday());
          }).map(function (absentDayItem) {
            absentDayItem.payment_id = paymentItem.id;
            return absentDayItem;
          })));

          absentDaysToDestroy.push.apply(absentDaysToDestroy, _toConsumableArray(paymentItem.absent_day_detail.filter(function (absentDayItem) {
            var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
            return !selected_days.includes(absent_date.isoWeekday());
          })));
        });

        return _bluebird2.default.all([paymentItem.id ? _this9.modals.service_payment.update({
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
        }) : _this9.modals.service_payment.create({
          start_date: start_date,
          end_date: end_date,
          updated_by: paymentItem.updated_by,
          status_type: paymentItem.status_type,
          total_amount: total_amount.toFixed(2),
          total_days: total_days,
          total_units: total_units,
          ref_id: paymentItem.ref_id,
          amount_paid: 0
        })].concat(_toConsumableArray(absentDaysToDestroy.map(function (absentItem) {
          return _this9.markPresentForItem({ where: { id: absentItem.id } });
        }))));
        /*}));*/
      })))).then(function () {
        return absentDetailToUpdate;
      }).catch(function (err) {
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

      daysInMonth = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(startDate, _moment2.default.ISO_8601).startOf('month'), monthEndDate, selected_days);
      daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(periodStartDate, periodEndDate, selected_days);
      absentDays = paymentItem.absent_day_detail.filter(function (absentDayItem) {
        var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
        return absent_date.isSameOrAfter(periodStartDate) && absent_date.isSameOrBefore(periodEndDate) && selected_days.includes(absent_date.isoWeekday());
      }).length;
      return { daysInMonth: daysInMonth, daysInPeriod: daysInPeriod, absentDays: absentDays };
    }
  }, {
    key: 'markPaymentPaid',
    value: function markPaymentPaid(id, servicePaymentDetail) {
      var _this10 = this;

      return _bluebird2.default.try(function () {
        return _bluebird2.default.all([_this10.modals.calendar_item_payment.create(servicePaymentDetail), _this10.retrieveCalendarItemById(id, 'en')]);
      }).then(function (result) {
        var _result$ = result[1],
            user_id = _result$.user_id,
            provider_name = _result$.provider_name,
            provider_number = _result$.provider_number;


        var sellerOption = {
          seller_name: {
            $iLike: provider_name
          }
        };

        if (provider_number) {
          sellerOption.contact_no = provider_number;
        }
        return _bluebird2.default.all([provider_number && provider_number.trim() || provider_name && provider_name.trim() ? _this10.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption, {
          seller_name: provider_name,
          contact_no: provider_number,
          updated_by: user_id,
          created_by: user_id,
          status_type: 11
        }) : '', result[1]]);
      }).spread(function (sellerDetail, productDetail) {
        var product_name = productDetail.product_name,
            service_type = productDetail.service_type,
            user_id = productDetail.user_id;
        var category_id = service_type.category_id,
            main_category_id = service_type.main_category_id,
            sub_category_id = service_type.sub_category_id;

        return _this10.productAdaptor.createEmptyProduct(JSON.parse(JSON.stringify({
          document_date: servicePaymentDetail.paid_on,
          category_id: category_id, main_category_id: main_category_id, sub_category_id: sub_category_id,
          product_name: product_name,
          seller_id: sellerDetail ? sellerDetail.sid : undefined,
          purchase_cost: servicePaymentDetail.amount_paid,
          status_type: 11,
          updated_by: user_id,
          user_id: user_id,
          model: servicePaymentDetail.name
        })));
      });
    }
  }]);

  return CalendarServiceAdaptor;
}();

exports.default = CalendarServiceAdaptor;