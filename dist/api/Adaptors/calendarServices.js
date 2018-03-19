'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _shared = require('../../helpers/shared');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

require('moment-weekday-calc');

var CalendarServiceAdaptor = function () {
  function CalendarServiceAdaptor(modals) {
    _classCallCheck(this, CalendarServiceAdaptor);

    this.modals = modals;
  }

  _createClass(CalendarServiceAdaptor, [{
    key: 'retrieveCalendarServices',
    value: function retrieveCalendarServices(options, language) {
      return Promise.all([this.modals.calendar_services.findAll({
        where: options,
        attributes: ['id', ['service_name', 'default_name'], ['' + (language ? 'service_name_' + language : 'service_name'), 'name'], [this.modals.sequelize.literal('"quantity"."quantity_name"'), 'default_quantity_type'], [this.modals.sequelize.literal('"quantity"."' + (language ? 'quantity_name_' + language : 'quantity_name') + '"'), 'quantity_type'], [this.modals.sequelize.fn('CONCAT', '/calendarservice/', this.modals.sequelize.literal('"calendar_services"."id"'), '/images/'), 'calendarServiceImageUrl']],
        include: {
          model: this.modals.quantities,
          as: 'quantity',
          attributes: [],
          required: false
        },
        order: ['id']
      }), this.modals.quantities.findAll({
        where: options,
        attributes: ['id', ['quantity_name', 'default_title'], ['' + (language ? 'quantity_name_' + language : 'quantity_name'), 'title']],
        order: ['id']
      })]).then(function (result) {
        return {
          items: result[0].map(function (item) {
            var calendarServiceItem = item.toJSON();
            calendarServiceItem.name = calendarServiceItem.name || calendarServiceItem.default_name;
            calendarServiceItem.quantity_type = calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type;
            return calendarServiceItem;
          }),
          unit_types: result[1].map(function (item) {
            var unitTypes = item.toJSON();
            unitTypes.title = unitTypes.title || unitTypes.default_title;
            return unitTypes;
          })
        };
      });
    }
  }, {
    key: 'retrieveCalendarServiceById',
    value: function retrieveCalendarServiceById(id, language) {
      return this.modals.calendar_services.findById(id, {
        attributes: ['id', ['service_name', 'default_name'], ['' + (language ? 'service_name_' + language : 'service_name'), 'name'], [this.modals.sequelize.literal('"quantity"."quantity_name"'), 'default_quantity_type'], [this.modals.sequelize.literal('"quantity"."' + (language ? 'quantity_name_' + language : 'quantity_name') + '"'), 'quantity_type'], [this.modals.sequelize.fn('CONCAT', '/calendarservice/', this.modals.sequelize.literal('"calendar_services"."id"'), '/images/'), 'calendarServiceImageUrl']],
        include: {
          model: this.modals.quantities,
          as: 'quantity',
          attributes: [],
          required: true
        },
        order: ['id']
      }).then(function (result) {
        var calendarServiceItem = result.toJSON();
        calendarServiceItem.name = calendarServiceItem.name || calendarServiceItem.default_name;
        calendarServiceItem.quantity_type = calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type;
        return calendarServiceItem;
      });
    }
  }, {
    key: 'createCalendarItem',
    value: function createCalendarItem(calendarItemDetail) {
      var _this = this;

      var productBody = calendarItemDetail.productBody,
          servicePaymentArray = calendarItemDetail.servicePaymentArray,
          serviceAbsentDayArray = calendarItemDetail.serviceAbsentDayArray,
          serviceCalculationBody = calendarItemDetail.serviceCalculationBody,
          user = calendarItemDetail.user;

      return this.modals.user_calendar_item.findCreateFind({
        where: productBody
      }).then(function (calendarItem) {
        console.log(calendarItem);
        calendarItem = calendarItem[0].toJSON();
        serviceCalculationBody.ref_id = calendarItem.id;
        var subPromiseArray = [calendarItem, _this.modals.service_calculation.findCreateFind({
          where: serviceCalculationBody
        })];
        servicePaymentArray.forEach(function (item) {
          item.ref_id = calendarItem.id;
          subPromiseArray.push(_this.modals.service_payment.findCreateFind({ where: item }));
        });
        serviceAbsentDayArray.forEach(function (item) {
          item.ref_id = calendarItem.id;
          subPromiseArray.push(_this.modals.service_absent_days.findCreateFind({ where: item }));
        });

        return Promise.all(subPromiseArray);
      });
    }
  }, {
    key: 'markAbsentForItem',
    value: function markAbsentForItem(absentDayDetail) {
      return this.modals.service_absent_days.findCreateFind({ where: absentDayDetail });
    }
  }, {
    key: 'markPresentForItem',
    value: function markPresentForItem(absentDayDetail) {
      return this.modals.service_absent_days.destroy({ where: absentDayDetail });
    }
  }, {
    key: 'retrieveCalendarItemList',
    value: function retrieveCalendarItemList(options, language) {
      var _this2 = this;

      var calendarItemList = void 0;
      return this.modals.user_calendar_item.findAll({
        where: options,
        include: [{
          model: this.modals.service_payment,
          as: 'payment_detail',
          include: {
            model: this.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false
          },
          where: {
            start_date: { $gte: (0, _moment2.default)().startOf('M').valueOf() },
            end_date: { $lte: (0, _moment2.default)().endOf('M').valueOf() }
          },
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
        calendarItemList = result.map(function (item) {
          return item.toJSON();
        });
        return _this2.retrieveCalendarServices({ id: calendarItemList.map(function (item) {
            return item.service_id;
          }) }, language);
      }).then(function (services) {
        return calendarItemList.map(function (item) {
          item.service_type = services.items.find(function (serviceItem) {
            return serviceItem.id === item.service_id;
          });

          item.calculation_detail = _lodash2.default.orderBy(item.calculation_detail, ['effective_date'], ['desc']);

          var item_start_date = (0, _moment2.default)(item.payment_detail[0].start_date, _moment2.default.ISO_8601);
          var item_end_date = (0, _moment2.default)(item.payment_detail[0].end_date, _moment2.default.ISO_8601);
          item.present_days = (0, _moment2.default)().isoWeekdayCalc(item_start_date, item_end_date, item.selected_days);
          if ((0, _moment2.default)().endOf('days').diff((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601), 'days') >= 0) {
            item.present_days = (0, _moment2.default)().isoWeekdayCalc(item_start_date, (0, _moment2.default)().endOf('days'), item.selected_days);
          }

          item.absent_days = item.payment_detail[0].absent_day_detail.length;
          item.present_days = item.present_days - item.absent_days;

          return item;
        });
      });
    }
  }, {
    key: 'retrieveCalendarItemById',
    value: function retrieveCalendarItemById(id, language) {
      var _this3 = this;

      var calendarItemDetail = void 0;
      return this.modals.user_calendar_item.findById(id, {
        include: [{
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
        return _this3.retrieveCalendarServiceById(calendarItemDetail.service_id, language);
      }).then(function (services) {
        calendarItemDetail.service_type = services;
        calendarItemDetail.calculation_detail = _lodash2.default.orderBy(calendarItemDetail.calculation_detail, ['effective_date'], ['desc']);
        calendarItemDetail.payment_detail = _lodash2.default.orderBy(calendarItemDetail.payment_detail, ['end_date'], ['desc']);
        var item_start_date = (0, _moment2.default)(calendarItemDetail.payment_detail[0].start_date, _moment2.default.ISO_8601);
        var item_end_date = (0, _moment2.default)(calendarItemDetail.payment_detail[0].end_date, _moment2.default.ISO_8601);
        calendarItemDetail.present_days = (0, _moment2.default)().isoWeekdayCalc(item_start_date, item_end_date, calendarItemDetail.selected_days);
        if ((0, _moment2.default)().endOf('days').diff((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601), 'days') >= 0) {
          calendarItemDetail.present_days = (0, _moment2.default)().isoWeekdayCalc(item_start_date, (0, _moment2.default)().endOf('days'), calendarItemDetail.selected_days);
        }

        calendarItemDetail.absent_days = calendarItemDetail.payment_detail[0].absent_day_detail.length;
        calendarItemDetail.present_days = calendarItemDetail.present_days - calendarItemDetail.absent_days;

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
    value: function updatePaymentDetail(id, paymentDetail) {
      var _this4 = this;

      return this.modals.service_payment.findById(id, {
        include: {
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true
        }
      }).then(function (result) {
        var currentDetail = result.toJSON();
        var currentEndDate = (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601);
        var end_date = (0, _moment2.default)([currentEndDate.year(), 0, 31]).month(currentEndDate.month());
        var daysInMonth = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, end_date, currentDetail.calendar_item.selected_days);

        if (currentDetail.calendar_item.wages_type === 1) {
          paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
        }

        if (paymentDetail.quantity) {
          paymentDetail.unit_price = paymentDetail.quantity * paymentDetail.unit_price;

          currentDetail.total_units = currentDetail.total_units - ((paymentDetail.absent_day || 0) > 0 ? paymentDetail.quantity : (paymentDetail.absent_day || 0) < 0 ? -paymentDetail.quantity : 0);
        }

        var additional_unit_price = 0;
        var daysInPeriod = 0;
        if (paymentDetail.end_date) {
          var monthDiff = (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).month() - (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601).month();
          if (monthDiff > 0) {
            return _this4.addPaymentDetail({
              start_date: (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).startOf('M'),
              end_date: (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).endOf('days'),
              last_end_date: currentEndDate,
              ref_id: currentDetail.ref_id,
              monthDiff: monthDiff
            }, paymentDetail);
          } else if ((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).endOf('days').diff((0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601), 'days') > 0) {
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(currentDetail.end_date, (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).endOf('days'), currentDetail.calendar_item.selected_days) - 1;
            additional_unit_price = paymentDetail.unit_price * daysInPeriod;
          }
        }

        result.updateAttributes({
          total_amount: paymentDetail.total_amount || currentDetail.total_amount + additional_unit_price - paymentDetail.unit_price,
          total_days: paymentDetail.total_days || currentDetail.total_days + daysInPeriod - (paymentDetail.absent_day || 0),
          end_date: paymentDetail.end_date || currentDetail.end_date,
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
        }, include: {
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true
        }
      }).then(function (result) {
        if (result) {
          var currentDetail = result.toJSON();
          var currentEndDate = (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601);
          var end_date = (0, _moment2.default)([currentEndDate.year(), 0, 31]).month(currentEndDate.month());
          var daysInMonth = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, end_date, currentDetail.calendar_item.selected_days);

          if (currentDetail.calendar_item.wages_type === 1) {
            paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
          }

          if (paymentDetail.quantity) {
            paymentDetail.unit_price = paymentDetail.quantity * paymentDetail.unit_price;
          }

          var additional_unit_price = 0;
          var daysInPeriod = 0;
          if (paymentDetail.end_date) {
            if ((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).endOf('days').diff((0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601), 'days') > 0) {
              daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(currentDetail.end_date, (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).endOf('days'), currentDetail.calendar_item.selected_days) - 1;
              additional_unit_price = paymentDetail.unit_price * daysInPeriod;
            }
          }

          result.updateAttributes({
            total_amount: paymentDetail.total_amount || currentDetail.total_amount + additional_unit_price - paymentDetail.unit_price,
            total_days: currentDetail.total_days + daysInPeriod - (paymentDetail.absent_day || 0),
            end_date: paymentDetail.end_date || currentDetail.end_date,
            status_type: paymentDetail.status_type || currentDetail.status_type,
            amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid
          });

          return result;
        }
      });
    }
  }, {
    key: 'addServiceCalc',
    value: function addServiceCalc(options, calcDetail) {
      var _this5 = this;

      return this.modals.service_calculation.findOne({
        where: options
      }).then(function (calcResult) {
        if (calcResult) {
          return new Promise(function (resolve, reject) {
            return setImmediate(function () {
              resolve(calcResult.updateAttributes(calcDetail));
              // (calcResult);
            });
          });
        }

        return _this5.modals.service_calculation.create(calcDetail);
      });
    }
  }, {
    key: 'manipulatePaymentDetail',
    value: function manipulatePaymentDetail(options) {
      var _this6 = this;

      var serviceCalcList = void 0;
      var servicePayments = void 0;
      var absentDetail = [];
      return Promise.all([this.modals.service_payment.count({
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
          destroyServicePayment = _this6.modals.service_payment.destroy({
            where: {
              ref_id: servicePayments[0].calendar_item.id
            }
          });
          var effectiveDate = (0, _moment2.default)(options.effective_date, _moment2.default.ISO_8601);
          var currentYear = (0, _moment2.default)().year();
          var effectiveYear = effectiveDate.year();
          var yearDiff = currentYear > effectiveYear ? currentYear - effectiveYear : null;
          var absent_date = (0, _moment2.default)(absentDetail[absentDetail.length - 1].absent_date, _moment2.default.ISO_8601);
          var currentDate = absent_date.diff((0, _moment2.default)(), 'days') > 0 ? absent_date : (0, _moment2.default)();
          if (!yearDiff) {
            var currentMth = currentDate.month();
            var _currentYear = currentDate.year();
            var effectiveMth = effectiveDate.month();
            servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
              currentMth: currentMth,
              effectiveMth: effectiveMth,
              effectiveDate: effectiveDate,
              productBody: servicePayments[0].calendar_item,
              serviceCalculationBody: serviceCalcList[0],
              user: {
                id: servicePayments[0].calendar_item.user_id
              },
              currentYear: _currentYear,
              currentDate: currentDate
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
              var currentMth = (0, _moment2.default)().endOf('M').diff(yearEnd, 'M') > 0 ? yearEnd.month() : currentDate.month();
              var effectiveMth = currentYear > effectiveYear ? yearStart.month() : effectiveDate.month();
              (_servicePaymentArray = servicePaymentArray).push.apply(_servicePaymentArray, _toConsumableArray((0, _shared.monthlyPaymentCalc)({
                currentMth: currentMth,
                effectiveMth: effectiveMth,
                effectiveDate: effectiveDate,
                productBody: servicePayments[0].calendar_item,
                serviceCalculationBody: serviceCalcList[0],
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
        return Promise.all([Promise.all(servicePaymentArray.map(function (item) {
          item.ref_id = servicePayments[0].calendar_item.id;
          return _this6.modals.service_payment.findCreateFind({ where: item });
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

        return _this6.updatePaymentDetailForCalc(servicePayments, serviceCalcList, absentDetailToUpdate);
      }).then(function (result) {
        return Promise.all(result[0].length > 0 ? result[0].map(function (absentItem) {
          return _this6.markAbsentForItem(absentItem);
        }) : []);
      });
    }
  }, {
    key: 'updatePaymentDetailForCalc',
    value: function updatePaymentDetailForCalc(servicePayments, serviceCalcList, absentDetailToUpdate) {
      var _this7 = this;

      return Promise.all([absentDetailToUpdate].concat(_toConsumableArray(servicePayments.map(function (paymentItem) {
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
          var effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601).valueOf();
          var next_effective_date = (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).valueOf();
          var absentDays = 0;
          var daysInMonth = 0;
          var daysInPeriod = 0;
          if (effective_date <= start_date && start_date !== next_effective_date) {
            daysInMonth = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601), (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).endOf('M'), paymentItem.calendar_item.selected_days);
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601), (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).subtract(1, 'd'), paymentItem.calendar_item.selected_days);
            absentDays = paymentItem.absent_day_detail.filter(function (absentDayItem) {
              var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
              return absent_date.diff((0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601), 'days') >= 0 && absent_date.diff((0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601), 'days') <= 0;
            }).length;
          } else if (index === 0) {
            daysInMonth = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601), (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).endOf('M'), paymentItem.calendar_item.selected_days);
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601), (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601), paymentItem.calendar_item.selected_days);

            absentDays = paymentItem.absent_day_detail.filter(function (absentDayItem) {
              var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
              return absent_date.diff((0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601), 'days') >= 0 && absent_date.diff((0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601), 'days') <= 0;
            }).length;
          } else {
            daysInMonth = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601), (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).endOf('M'), paymentItem.calendar_item.selected_days);
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601), (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).subtract(1, 'd'), paymentItem.calendar_item.selected_days);

            absentDays = paymentItem.absent_day_detail.filter(function (absentDayItem) {
              var absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
              return absent_date.diff((0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601), 'days') >= 0 && absent_date.diff((0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601), 'days') <= 0;
            }).length;
          }

          daysInPeriod = daysInPeriod - absentDays;
          var unit_price = calcItem.unit_price;
          if (paymentItem.calendar_item.wages_type === 1) {
            unit_price = unit_price / daysInMonth;
          }

          var current_total_amount = unit_price * daysInPeriod;
          if (calcItem.quantity) {
            total_amount += calcItem.quantity * current_total_amount;
            total_units += calcItem.quantity * daysInPeriod;
          }

          total_days += daysInPeriod;
        });

        return _this7.modals.service_payment.update({
          start_date: start_date,
          end_date: end_date,
          updated_by: paymentItem.updated_by,
          status_type: paymentItem.status_type,
          total_amount: total_amount,
          total_days: total_days,
          total_units: total_units,
          amount_paid: 0
        }, {
          where: {
            id: paymentItem.id
          }
        }).catch(function (err) {
          return Console.log('Error is here', err);
        });
      })))).catch(function (err) {
        return Console.log('Error is here', err);
      });
    }
  }]);

  return CalendarServiceAdaptor;
}();

exports.default = CalendarServiceAdaptor;