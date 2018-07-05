'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

require('moment-weekday-calc');

class CalendarServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.sellerAdaptor = new _sellers2.default(modals);
    this.productAdaptor = new _product2.default(modals);
  }

  retrieveCalendarServices(options, language) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.retrieveAllCalendarServices(options, language), this.retrieveAllQuantities(options, language)])).spread((calendar_services, unit_types) => [calendar_services.map(item => {
      const calendarServiceItem = item.toJSON();
      calendarServiceItem.calendarServiceImageUrl = `${calendarServiceItem.calendarServiceImageUrl}/thumbnail`;
      calendarServiceItem.name = calendarServiceItem ? calendarServiceItem.name || calendarServiceItem.default_name : '';
      calendarServiceItem.quantity_type = calendarServiceItem ? calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type : '';
      return calendarServiceItem;
    }), unit_types.map(item => {
      const unitTypes = item.toJSON();
      unitTypes.title = unitTypes.title || unitTypes.default_title;
      return unitTypes;
    })]);
  }

  retrieveAllQuantities(options, language) {
    return this.modals.quantities.findAll({
      where: options,
      attributes: ['id', ['quantity_name', 'default_title'], [`${language ? `quantity_name_${language}` : `quantity_name`}`, 'title']],
      order: ['id']
    });
  }

  retrieveAllCalendarServices(options, language) {
    return this.modals.calendar_services.findAll({
      where: options,
      attributes: ['id', ['service_name', 'default_name'], [`${language ? `service_name_${language}` : `service_name`}`, 'name'], [this.modals.sequelize.literal('"quantity"."quantity_name"'), 'default_quantity_name'], [this.modals.sequelize.literal(`"quantity"."${language ? `quantity_name_${language}` : `quantity_name`}"`), 'quantity_name'], 'quantity_type', 'category_id', 'main_category_id', 'sub_category_id', 'wages_type', [this.modals.sequelize.fn('CONCAT', '/calendarservice/', this.modals.sequelize.literal('"calendar_services"."id"'), '/images'), 'calendarServiceImageUrl']],
      include: {
        model: this.modals.quantities,
        as: 'quantity',
        attributes: [],
        required: false
      },
      order: ['id']
    });
  }

  retrieveCalendarServiceById(id, language) {
    return this.modals.calendar_services.findById(id, {
      attributes: ['id', ['service_name', 'default_name'], [`${language ? `service_name_${language}` : `service_name`}`, 'name'], [this.modals.sequelize.literal('"quantity"."quantity_name"'), 'default_quantity_name'], [this.modals.sequelize.literal(`"quantity"."${language ? `quantity_name_${language}` : `quantity_name`}"`), 'quantity_name'], 'quantity_type', 'wages_type', [this.modals.sequelize.fn('CONCAT', '/calendarservice/', this.modals.sequelize.literal('"calendar_services"."id"'), '/images'), 'calendarServiceImageUrl'], 'category_id', 'main_category_id', 'sub_category_id'],
      include: {
        model: this.modals.quantities,
        as: 'quantity',
        attributes: [],
        required: false
      },
      order: ['id']
    }).then(calendar_services => {
      const calendarServiceItem = calendar_services.toJSON();
      calendarServiceItem.name = calendarServiceItem.name || calendarServiceItem.default_name;
      calendarServiceItem.quantity_type = calendarServiceItem.quantity_type || calendarServiceItem.default_quantity_type;
      return calendarServiceItem;
    });
  }

  createCalendarItem(calendarItemDetail) {
    const { productBody, servicePaymentArray, serviceAbsentDayArray, serviceCalculationBody, user } = calendarItemDetail;
    return _bluebird2.default.try(() => this.findAndCreateCalendarItem({ where: productBody })).spread(calendarItem => {
      calendarItem = calendarItem.toJSON();
      serviceCalculationBody.ref_id = calendarItem.id;
      const subPromiseArray = [calendarItem, this.findCreateCalculationDetail({ where: serviceCalculationBody })];
      servicePaymentArray.forEach(item => {
        item.ref_id = calendarItem.id;
        subPromiseArray.push(this.findCreateServicePayment({ where: item }));
      });
      serviceAbsentDayArray.forEach(item => {
        item.ref_id = calendarItem.id;
        subPromiseArray.push(this.markAbsentForItem({ where: item }));
      });

      return _bluebird2.default.all(subPromiseArray);
    });
  }

  updateCalendarItem(calendarItemDetail, id) {
    return _bluebird2.default.try(() => this.modals.user_calendar_item.update(calendarItemDetail, { where: { id } }));
  }

  findCreateAbsentDateDetails(parameters) {
    return this.modals.service_absent_days.findCreateFind(parameters);
  }

  findCreateServicePayment(parameters) {
    return this.modals.service_payment.findCreateFind(parameters);
  }

  findCreateCalculationDetail(parameters) {
    return this.modals.service_calculation.findCreateFind(parameters);
  }

  findAndCreateCalendarItem(parameters) {
    return this.modals.user_calendar_item.findCreateFind(parameters);
  }

  markAbsentForItem(parameters) {
    return this.modals.service_absent_days.findCreateFind(parameters);
  }

  markPresentForItem(parameters) {
    return this.modals.service_absent_days.destroy(parameters);
  }

  retrieveCalendarItemList(options, language, limit, offset) {
    let calendarItemList;
    const calendarItemOptions = {
      where: options,
      order: [['created_at', 'desc']]
    };
    if (limit) {
      calendarItemOptions.limit = limit;
    }

    if (offset) {
      calendarItemOptions.offset = offset;
    }

    return _bluebird2.default.try(() => this.retrieveAllCalendarItems(calendarItemOptions)).then(result => {
      calendarItemList = result;

      const calendarItemIds = calendarItemList.map(item => item.id);
      return _bluebird2.default.all([this.retrieveCalendarServices({ id: calendarItemList.map(item => item.service_id) }, language), this.retrieveServicePaymentDetails({
        include: {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false
        },
        where: {
          ref_id: calendarItemIds,
          end_date: {
            $in: [this.modals.sequelize.literal(`SELECT MAX("service_payment"."end_date") FROM "table_service_payment" 
                        as "service_payment" ${calendarItemIds.length > 0 ? `WHERE "service_payment"."ref_id" in 
                        (${calendarItemIds.toString()})` : ''} GROUP BY ref_id`)]
          }
        }
      }), this.modals.service_calculation.findAll({
        where: {
          ref_id: calendarItemIds,
          effective_date: {
            $in: [this.modals.sequelize.literal(`SELECT MAX("service_calc"."effective_date") FROM "table_service_calculation" 
                        as "service_calc" ${calendarItemIds.length > 0 ? `WHERE "service_calc"."ref_id" in 
                        (${calendarItemIds.toString()})` : ''} GROUP BY ref_id`)]
          }
        },
        include: {
          model: this.modals.quantities,
          as: 'unit',
          attributes: ['id', ['quantity_name', 'default_title'], [`${language ? `quantity_name_${language}` : `quantity_name`}`, 'title']],
          required: false
        }
      }), this.retrieveServicePaymentDetails({
        where: {
          ref_id: calendarItemIds
        },
        attributes: ['ref_id', [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('total_amount')), 'total_amount']],
        group: ['ref_id']
      }), this.modals.calendar_item_payment.findAll({
        where: {
          ref_id: calendarItemIds
        },
        attributes: ['ref_id', [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('amount_paid')), 'total_amount_paid']],
        group: ['ref_id']
      })]);
    }).spread((services, latest_payment_details, latest_calculation_details, attendance_totals, payment_totals) => {
      payment_totals = payment_totals.map(paymentItem => paymentItem ? paymentItem.toJSON() : undefined);
      latest_calculation_details = latest_calculation_details.map(calcItem => {
        const calculationItem = calcItem.toJSON();
        if (calculationItem.unit) {
          calculationItem.unit.title = calculationItem.unit.title || calculationItem.unit.default_title;
        }
        return calculationItem;
      });
      return calendarItemList.map(item => {
        item.service_type = services[0].find(serviceItem => serviceItem.id === item.service_id);

        item.latest_payment_detail = latest_payment_details.find(paymentItem => paymentItem.ref_id === item.id);
        item.latest_calculation_detail = latest_calculation_details.find(calcItem => calcItem.ref_id === item.id);
        item.present_days = item.latest_payment_detail ? item.latest_payment_detail.total_days : 0;
        item.absent_days = item.latest_payment_detail ? item.latest_payment_detail.absent_day_detail.length : 0;
        const attendance_calc = attendance_totals.find(paymentItem => paymentItem && paymentItem.ref_id === item.id);
        let payment_calc = payment_totals.find(paymentItem => {
          return paymentItem && paymentItem.ref_id === item.id;
        });
        const attendance_total = attendance_calc ? attendance_calc.total_amount : 0;
        const payment_total = payment_calc ? payment_calc.total_amount_paid || 0 : 0;
        console.log('\n\n\n\n', {
          payment_calc,
          attendance_calc,
          attendance_total,
          payment_total
        });
        item.outstanding_amount = (payment_total - attendance_total).toFixed(2);

        return item;
      });
    });
  }

  retrieveAllCalendarItems(options) {
    return this.modals.user_calendar_item.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveServicePaymentDetails(options) {
    return this.modals.service_payment.findAll(options).then(result => result.map(item => item.toJSON()));
  }

  retrieveLatestServicePaymentDetails(options) {
    options.order = [['end_date', 'DESC']];
    return this.modals.service_payment.findOne(options).then(result => result ? result.toJSON() : {});
  }

  retrieveLatestServiceCalculation(options) {
    options.order = [['effective_date', 'DESC']];
    return this.modals.service_calculation.findOne(options).then(result => result ? result.toJSON() : {});
  }

  retrieveCalendarItemById(id, language) {
    let calendarItemDetail;
    let destroyablePaymentDetail = [];
    let destroyableAbsentDetails = [];
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
          attributes: ['id', ['quantity_name', 'default_title'], [`${language ? `quantity_name_${language}` : `quantity_name`}`, 'title']],
          required: false
        },
        required: true,
        order: [['effective_date', 'desc']]
      }]
    }).then(result => {
      calendarItemDetail = result.toJSON();
      return this.retrieveCalendarServiceById(calendarItemDetail.service_id, language);
    }).then(services => {
      calendarItemDetail.service_type = services;
      calendarItemDetail.calculation_detail = _lodash2.default.orderBy(calendarItemDetail.calculation_detail, ['effective_date'], ['desc']);
      calendarItemDetail.calculation_detail = calendarItemDetail.end_date ? calendarItemDetail.calculation_detail.filter(cDItem => (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(cDItem.effective_date, _moment2.default.ISO_8601))) : calendarItemDetail.calculation_detail;
      destroyablePaymentDetail = calendarItemDetail.end_date ? calendarItemDetail.payment_detail.filter(pDItem => (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isBefore((0, _moment2.default)(pDItem.start_date, _moment2.default.ISO_8601))) : [];
      calendarItemDetail.payment_detail = _lodash2.default.orderBy(calendarItemDetail.payment_detail, ['end_date'], ['desc']);
      calendarItemDetail.payment_detail = calendarItemDetail.end_date ? calendarItemDetail.payment_detail.filter(pDItem => (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(pDItem.start_date, _moment2.default.ISO_8601))) : calendarItemDetail.payment_detail;
      const item_end_date = (0, _moment2.default)(calendarItemDetail.payment_detail[0].end_date, _moment2.default.ISO_8601);
      console.log(item_end_date);
      const current_date = calendarItemDetail.end_date && (0, _moment2.default)().isAfter(calendarItemDetail.end_date) ? (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601) : (0, _moment2.default)();
      if (current_date.isSameOrAfter((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601))) {

        console.log('If is here', { current_date });
        const lastItemMonth = item_end_date.month();
        const monthDiff = (0, _moment2.default)(current_date, _moment2.default.ISO_8601).startOf('months').diff((0, _moment2.default)(item_end_date, _moment2.default.ISO_8601).startOf('months'), 'months');
        if (monthDiff > 0) {
          calendarItemDetail.payment_detail[0].end_date = (0, _moment2.default)([current_date.year(), 0, 31]).month(lastItemMonth);
          for (let i = 1; i <= monthDiff; i++) {
            const start_date = (0, _moment2.default)([current_date.year(), lastItemMonth + i, 1]);
            const month_end_date = (0, _moment2.default)([current_date.year(), 0, 31]).month(lastItemMonth + i);
            calendarItemDetail.payment_detail.push({
              start_date,
              end_date: month_end_date.isAfter(current_date) ? current_date : month_end_date,
              absent_day_detail: [],
              ref_id: id
            });
          }
        } else {
          console.log('Else is here', { current_date });
          calendarItemDetail.payment_detail[0].end_date = current_date;
        }
      }

      calendarItemDetail.payment_detail = calendarItemDetail.payment_detail.map(pItem => {
        pItem.end_date = !calendarItemDetail.end_date || calendarItemDetail.end_date && current_date.isSameOrAfter((0, _moment2.default)(pItem.end_date, _moment2.default.ISO_8601)) ? pItem.end_date : current_date;

        pItem.absent_day_detail = calendarItemDetail.end_date ? pItem.absent_day_detail.filter(aDayDetail => (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(aDayDetail.absent_date, _moment2.default.ISO_8601))) : pItem.absent_day_detail;
        const last_absent_date = pItem.absent_day_detail[pItem.absent_day_detail.length - 1];
        if (last_absent_date) {
          pItem.end_date = (0, _moment2.default)(pItem.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(last_absent_date.absent_date, _moment2.default.ISO_8601)) ? pItem.end_date : last_absent_date.absent_date;
        }

        pItem.end_date = (0, _moment2.default)(pItem.start_date, _moment2.default.ISO_8601).endOf('months').isSameOrAfter((0, _moment2.default)(pItem.end_date, _moment2.default.ISO_8601)) ? pItem.end_date : (0, _moment2.default)(pItem.start_date, _moment2.default.ISO_8601).endOf('months');

        destroyableAbsentDetails = calendarItemDetail.end_date ? pItem.absent_day_detail.filter(aDayDetail => (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isBefore((0, _moment2.default)(aDayDetail.absent_date, _moment2.default.ISO_8601))) : [];
        pItem.calendar_item = {
          selected_days: calendarItemDetail.selected_days,
          wages_type: calendarItemDetail.wages_type,
          end_date: calendarItemDetail.end_date
        };
        return pItem;
      });

      return _bluebird2.default.all([calendarItemDetail, this.updatePaymentDetailForCalc({
        servicePayments: calendarItemDetail.payment_detail,
        serviceCalcList: calendarItemDetail.calculation_detail,
        absentDetailToUpdate: []
      }), ...destroyablePaymentDetail.map(dPDItem => this.modals.service_payment.destroy({
        where: {
          id: dPDItem.id
        }
      })), ...destroyableAbsentDetails.map(dAbsentDetail => this.markPresentForItem({
        where: {
          id: dAbsentDetail.id
        }
      }))]);
    }).spread(calendarItemDetail => {
      return _bluebird2.default.all([calendarItemDetail, this.retrieveServicePaymentDetails({
        where: {
          ref_id: id
        },
        include: {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false
        },
        order: [['end_date', 'desc']]
      }), this.retrieveLatestServicePaymentDetails({
        where: {
          ref_id: id
        },
        attributes: ['ref_id', [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('total_amount')), 'total_amount']],
        group: ['ref_id', 'end_date']
      }), this.modals.calendar_item_payment.findOne({
        where: {
          ref_id: id
        },
        attributes: ['ref_id', [this.modals.sequelize.fn('SUM', this.modals.sequelize.col('amount_paid')), 'total_amount_paid']],
        group: ['ref_id']
      })]);
    }).spread((calendarItemDetail, paymentDetailResult, attendance_total, payment_total) => {
      calendarItemDetail.payment_detail = paymentDetailResult;
      calendarItemDetail.payment_detail[0].absent_day_detail = calendarItemDetail.end_date ? calendarItemDetail.payment_detail[0].absent_day_detail.filter(aDayDetail => (0, _moment2.default)(calendarItemDetail.end_date, _moment2.default.ISO_8601).isSameOrAfter((0, _moment2.default)(aDayDetail.absent_date, _moment2.default.ISO_8601))) : calendarItemDetail.payment_detail[0].absent_day_detail;
      const attendance_total_amount = attendance_total ? attendance_total.total_amount : 0;
      payment_total = payment_total ? payment_total.toJSON() : undefined;
      const payment_total_amount = payment_total ? payment_total.total_amount_paid : 0;

      calendarItemDetail.outstanding_amount = (payment_total_amount - attendance_total_amount).toFixed(2);
      return calendarItemDetail;
    });
  }

  retrieveCurrentCalculationDetail(options) {
    return this.modals.service_calculation.findOne({
      where: options,
      order: [['effective_date', 'desc']]
    }).then(result => result.toJSON());
  }

  retrieveAllCalculationDetail(options) {
    return this.modals.service_calculation.findAll({
      where: options,
      order: [['effective_date', 'desc']]
    }).then(result => result.map(item => item.toJSON()));
  }

  updatePaymentDetail(id, paymentDetail, isForAbsent) {
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
    }).then(result => {
      const currentDetail = result.toJSON();
      const currentEndDate = (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601);
      let newEndDate = paymentDetail.end_date && (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).isAfter(currentEndDate) ? (0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601) : (0, _moment2.default)().isAfter(currentEndDate) && !isForAbsent ? (0, _moment2.default)() : currentEndDate;

      let end_date = (0, _moment2.default)([currentEndDate.year(), 0, 31]).month(currentEndDate.month());
      const daysInMonth = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, end_date, paymentDetail.selected_days || currentDetail.calendar_item.selected_days);

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

      let daysInPeriod = 0;
      if (newEndDate) {
        const monthDiff = newEndDate.month() - (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601).month();
        if (monthDiff > 0) {
          return this.addPaymentDetail({
            start_date: (0, _moment2.default)(newEndDate, _moment2.default.ISO_8601).startOf('M'),
            end_date: (0, _moment2.default)(newEndDate, _moment2.default.ISO_8601).endOf('days'),
            latest_end_date: currentEndDate,
            ref_id: currentDetail.ref_id,
            monthDiff
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
      return _bluebird2.default.try(() => result.updateAttributes({
        total_amount: paymentDetail.total_amount.toFixed(2),
        total_days: paymentDetail.total_days,
        end_date: newEndDate,
        status_type: paymentDetail.status_type || currentDetail.status_type,
        amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
        total_units: paymentDetail.total_units
      }));
    });
  }

  addPaymentDetail(options, paymentDetail) {
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
    }).then(result => {
      if (result) {
        const currentDetail = result.toJSON();
        const currentEndDate = (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601);
        let end_date = (0, _moment2.default)([currentEndDate.year(), 0, 31]).month(currentEndDate.month());
        const daysInMonth = (0, _moment2.default)().isoWeekdayCalc(currentDetail.start_date, end_date, paymentDetail.selected_days || currentDetail.calendar_item.selected_days);

        if (currentDetail.calendar_item.wages_type === 1) {
          paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
        }

        if (paymentDetail.quantity || paymentDetail.quantity === 0) {
          paymentDetail.unit_price = paymentDetail.quantity * paymentDetail.unit_price;
        }

        let additional_unit_price = 0;
        let daysInPeriod = 0;
        if (paymentDetail.end_date) {
          if ((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601).isAfter((0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601))) {
            daysInPeriod = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(currentDetail.start_date, _moment2.default.ISO_8601).endOf('days'), (0, _moment2.default)(currentDetail.end_date, _moment2.default.ISO_8601).endOf('days'), paymentDetail.selected_days || currentDetail.calendar_item.selected_days) - currentDetail.absent_day_detail.length;
            paymentDetail.total_days = daysInPeriod;
            paymentDetail.total_units = paymentDetail.quantity ? paymentDetail.quantity * daysInPeriod : 0;
            paymentDetail.total_amount = paymentDetail.unit_price * daysInPeriod;
          }
        }

        paymentDetail.total_amount = paymentDetail.total_amount || currentDetail.total_amount;
        return _bluebird2.default.try(() => result.updateAttributes({
          total_amount: paymentDetail.total_amount > 1 ? paymentDetail.total_amount.toFixed(2) : 0,
          total_days: paymentDetail.total_days || currentDetail.total_days,
          status_type: paymentDetail.status_type || currentDetail.status_type,
          amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
          total_units: paymentDetail.total_units
        }));
      }
    });
  }

  addServiceCalc(options, calcDetail) {
    return this.modals.service_calculation.findOne({
      where: options
    }).then(calcResult => {
      if (calcResult) {
        return new _bluebird2.default((resolve, reject) => setImmediate(() => {
          resolve(calcResult.updateAttributes(calcDetail));
          // (calcResult);
        }));
      }

      return this.modals.service_calculation.create(calcDetail);
    });
  }

  deleteCalendarItemById(id, user_id) {
    return this.modals.user_calendar_item.destroy({
      where: { id, user_id }
    });
  }

  manipulatePaymentDetail(options) {
    let serviceCalcList;
    let servicePayments;
    let absentDetail = [];
    return _bluebird2.default.try(() => _bluebird2.default.all([this.modals.service_payment.count({
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
    })])).then(serviceResult => {
      serviceCalcList = serviceResult[1].map(item => item.toJSON());
      serviceCalcList = _lodash2.default.orderBy(serviceCalcList, ['effective_date'], ['asc']);
      servicePayments = serviceResult[2].map(item => item.toJSON());
      servicePayments.forEach(item => absentDetail.push(...(item.absent_day_detail || [])));
      absentDetail = _lodash2.default.orderBy(absentDetail, ['absent_date'], ['asc']);
      let servicePaymentArray = [];
      let destroyServicePayment;
      if (serviceResult[0] === 0) {
        destroyServicePayment = this.modals.service_payment.destroy({
          where: {
            ref_id: servicePayments[0].calendar_item.id
          }
        });
        const effectiveDate = (0, _moment2.default)(options.effective_date, _moment2.default.ISO_8601);
        const absent_date = (0, _moment2.default)(servicePayments[0].end_date, _moment2.default.ISO_8601).startOf();
        const currentDate = absent_date.isAfter((0, _moment2.default)().startOf('days')) ? absent_date : (0, _moment2.default)();
        const currentMth = currentDate.month();
        const currentYear = currentDate.year();
        const effectiveMth = effectiveDate.month();
        let { selected_days, wages_type } = servicePayments[0].calendar_item;
        let serviceCalculationBody = serviceCalcList[0];
        selected_days = serviceCalculationBody.selected_days || selected_days;
        servicePaymentArray = (0, _shared.monthlyPaymentCalc)({
          currentMth,
          effectiveMth,
          effectiveDate,
          selected_days,
          wages_type,
          serviceCalculationBody,
          user: {
            id: servicePayments[0].calendar_item.user_id
          },
          currentYear,
          currentDate
        });
      }

      console.log('\n\n\n\n\n\n\n\n', JSON.stringify(servicePaymentArray));
      serviceCalcList = _lodash2.default.orderBy(serviceCalcList, ['effective_date'], ['desc']);
      return _bluebird2.default.all([destroyServicePayment, servicePaymentArray.map(item => {
        item.ref_id = servicePayments[0].calendar_item.id;
        return item;
      }), serviceResult[0], servicePayments[0].calendar_item]);
    }).spread((destroyedItems, servicePaymentArray, serviceResult, payment_calendar_item) => _bluebird2.default.all([_bluebird2.default.all(servicePaymentArray.map(item => this.modals.service_payment.findCreateFind({ where: item }))), serviceResult, payment_calendar_item])).then(results => {
      console.log(JSON.stringify(results));
      const absentDetailToUpdate = [];
      if (results[1] === 0) {
        servicePayments = results[0].map(paymentItem => {
          const paymentDetail = paymentItem[0].toJSON();
          const absent_day_detail = absentDetail.filter(absentItem => {
            const absent_date = (0, _moment2.default)(absentItem.absent_date, _moment2.default.ISO_8601);
            return absent_date.isSameOrAfter((0, _moment2.default)(paymentDetail.start_date, _moment2.default.ISO_8601)) && absent_date.isSameOrBefore((0, _moment2.default)(paymentDetail.end_date, _moment2.default.ISO_8601));
          });
          paymentDetail.absent_day_detail = absent_day_detail;
          absentDetailToUpdate.push(...absent_day_detail.map(absentItem => {
            absentItem = _lodash2.default.omit(absentItem, 'id');
            absentItem.payment_id = paymentDetail.id;
            return absentItem;
          }));
          paymentDetail.calendar_item = results[2];
          return paymentDetail;
        });
      }

      return this.updatePaymentDetailForCalc({
        servicePayments: servicePayments,
        serviceCalcList: serviceCalcList,
        absentDetailToUpdate: absentDetailToUpdate
      });
    }).then(result => {
      return _bluebird2.default.all(result.length > 0 ? result.map(absentItem => this.markAbsentForItem({ where: absentItem })) : []);
    });
  }

  updatePaymentDetailForCalc(parameters) {
    let { servicePayments, serviceCalcList } = parameters;
    const absentDetailToUpdate = [];
    return _bluebird2.default.all([...servicePayments.map(paymentItem => {
      const start_date = (0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601).valueOf();
      const end_date = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).valueOf();
      const prevServiceCalc = serviceCalcList.find(calcItem => {
        const effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601);
        return effective_date.isSameOrBefore((0, _moment2.default)(start_date));
      });

      let isPrevCalcExist = false;
      let serviceCalc = serviceCalcList.filter(calcItem => {
        const effective_date = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601);
        return effective_date.isSameOrAfter((0, _moment2.default)(start_date)) && effective_date.isSameOrBefore((0, _moment2.default)(end_date));
      });

      serviceCalc = serviceCalc.map(calcItem => {
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
      let total_amount = 0;
      let total_days = 0;
      let total_units = 0;

      const absentDaysToDestroy = [];
      serviceCalc.forEach((calcItem, index) => {
        const nextIndex = index > 0 ? index - 1 : index;
        let periodStartDate = (0, _moment2.default)(calcItem.effective_date, _moment2.default.ISO_8601);
        const effective_date = periodStartDate.valueOf();
        const next_effective_date = (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).valueOf();
        let absentDays = 0;
        let daysInMonth = 0;
        let daysInPeriod = 0;

        let selected_days = paymentItem.calendar_item.selected_days;
        selected_days = calcItem.selected_days || selected_days;
        let startDate = (0, _moment2.default)(paymentItem.start_date, _moment2.default.ISO_8601);
        let periodEndDate = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601);
        let monthEndDate = (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601).endOf('M');
        console.log('\n\n\n\n\n\n', JSON.stringify({
          effective_date,
          start_date,
          next_effective_date,
          nextEffective: serviceCalc[nextIndex].effective_date
        }));
        if ((0, _moment2.default)(effective_date).isSameOrBefore((0, _moment2.default)(start_date)) && !(0, _moment2.default)(start_date).isSame((0, _moment2.default)(next_effective_date))) {
          const nextEffectDate = (0, _moment2.default)(next_effective_date).subtract(1, 'days');
          const nextEffectStartDate = (0, _moment2.default)(nextEffectDate.format('YYYY-MM-DD'), _moment2.default.ISO_8601).startOf('months');
          console.log(paymentItem.end_date);
          const monthDiff = (0, _moment2.default)(start_date).startOf('M').diff(nextEffectStartDate, 'M');
          periodEndDate = monthDiff > 0 ? (0, _moment2.default)(paymentItem.end_date, _moment2.default.ISO_8601) : nextEffectDate;
          periodStartDate = (0, _moment2.default)(start_date);
          console.log({
            monthEndDate,
            nextEffectStartDate
          });
          const __ret = this.retrieveDayInPeriod({
            daysInMonth,
            startDate,
            monthEndDate,
            selected_days,
            daysInPeriod,
            periodStartDate,
            periodEndDate,
            absentDays,
            paymentItem
          });
          daysInMonth = __ret.daysInMonth;
          daysInPeriod = __ret.daysInPeriod;
          absentDays = __ret.absentDays;
          console.log('I am here', JSON.stringify({
            paymentItem,
            startDate,
            periodStartDate,
            periodEndDate,
            selected_days,
            daysInMonth,
            daysInPeriod,
            absentDays,
            monthDiff
          }));
        } else if (index === 0) {
          console.log({
            periodEndDate,
            startDate: (0, _moment2.default)(startDate, _moment2.default.ISO_8601).startOf('months'),
            difference: (0, _moment2.default)(startDate, _moment2.default.ISO_8601).startOf('months').diff((0, _moment2.default)(), 'months')
          });

          periodEndDate = periodEndDate.isAfter((0, _moment2.default)()) || (0, _moment2.default)(startDate, _moment2.default.ISO_8601).isSameOrBefore((0, _moment2.default)(), 'months') ? periodEndDate : (0, _moment2.default)();
          const __ret = this.retrieveDayInPeriod({
            daysInMonth,
            startDate,
            monthEndDate,
            selected_days,
            daysInPeriod,
            periodStartDate,
            periodEndDate,
            absentDays,
            paymentItem
          });
          daysInMonth = __ret.daysInMonth;
          daysInPeriod = __ret.daysInPeriod;
          absentDays = __ret.absentDays;
          console.log('\n\n\n\n\n You Are here', JSON.stringify({
            paymentItem,
            startDate,
            monthEndDate,
            periodStartDate,
            periodEndDate,
            selected_days,
            daysInMonth,
            daysInPeriod,
            absentDays
          }));
        } else {
          periodEndDate = (0, _moment2.default)(serviceCalc[nextIndex].effective_date, _moment2.default.ISO_8601).subtract(1, 'd');
          const __ret = this.retrieveDayInPeriod({
            daysInMonth,
            startDate,
            monthEndDate,
            selected_days,
            daysInPeriod,
            periodStartDate,
            periodEndDate,
            absentDays,
            paymentItem
          });
          daysInMonth = __ret.daysInMonth;
          daysInPeriod = __ret.daysInPeriod;
          absentDays = __ret.absentDays;

          console.log('We are here', JSON.stringify({
            paymentItem,
            startDate,
            monthEndDate,
            periodStartDate,
            periodEndDate,
            selected_days,
            daysInMonth,
            daysInPeriod,
            absentDays
          }));
        }

        daysInPeriod = daysInPeriod - absentDays;
        let unit_price = calcItem.unit_price;
        if (paymentItem.calendar_item.wages_type === 1) {
          unit_price = unit_price / daysInMonth;
        }

        const current_total_amount = unit_price * daysInPeriod;
        if (calcItem.quantity || calcItem.quantity === 0) {
          total_amount += calcItem.quantity * current_total_amount;
          total_units += calcItem.quantity * daysInPeriod;
        } else {
          total_amount += current_total_amount;
        }

        total_days += daysInPeriod;
        absentDetailToUpdate.push(...paymentItem.absent_day_detail.filter(absentDayItem => {
          const absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
          return selected_days.includes(absent_date.isoWeekday());
        }).map(absentDayItem => {
          absentDayItem.payment_id = paymentItem.id;
          return absentDayItem;
        }));

        absentDaysToDestroy.push(...paymentItem.absent_day_detail.filter(absentDayItem => {
          const absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
          return !selected_days.includes(absent_date.isoWeekday());
        }));
      });

      return _bluebird2.default.all([paymentItem.id ? this.modals.service_payment.update({
        start_date,
        end_date,
        updated_by: paymentItem.updated_by,
        status_type: paymentItem.status_type,
        total_amount: total_amount.toFixed(2),
        total_days,
        total_units,
        amount_paid: 0
      }, {
        where: {
          id: paymentItem.id
        }
      }) : this.modals.service_payment.create({
        start_date,
        end_date,
        updated_by: paymentItem.updated_by,
        status_type: paymentItem.status_type,
        total_amount: total_amount.toFixed(2),
        total_days,
        total_units,
        ref_id: paymentItem.ref_id,
        amount_paid: 0
      }), ...absentDaysToDestroy.map(absentItem => this.markPresentForItem({ where: { id: absentItem.id } }))]);
      /*}));*/
    })]).then(() => absentDetailToUpdate).catch(err => Console.log('Error is here', err));
  }

  retrieveDayInPeriod(parameters) {
    let { daysInMonth, startDate, monthEndDate, selected_days, daysInPeriod, periodStartDate, periodEndDate, absentDays, paymentItem } = parameters;
    daysInMonth = (0, _moment2.default)().isoWeekdayCalc((0, _moment2.default)(startDate, _moment2.default.ISO_8601).startOf('month'), monthEndDate, selected_days);
    daysInPeriod = (0, _moment2.default)().isoWeekdayCalc(periodStartDate, periodEndDate, selected_days);
    absentDays = paymentItem.absent_day_detail.filter(absentDayItem => {
      const absent_date = (0, _moment2.default)(absentDayItem.absent_date, _moment2.default.ISO_8601);
      return absent_date.isSameOrAfter(periodStartDate) && absent_date.isSameOrBefore(periodEndDate) && selected_days.includes(absent_date.isoWeekday());
    }).length;
    return { daysInMonth, daysInPeriod, absentDays };
  }

  markPaymentPaid(id, servicePaymentDetail) {
    return _bluebird2.default.try(() => _bluebird2.default.all([this.modals.calendar_item_payment.create(servicePaymentDetail), this.retrieveCalendarItemById(id, 'en')])).then(result => {

      const { user_id, provider_name, provider_number } = result[1];

      let sellerOption = {
        seller_name: {
          $iLike: provider_name
        }
      };

      if (provider_number) {
        sellerOption.contact_no = provider_number;
      }
      return _bluebird2.default.all([provider_number && provider_number.trim() || provider_name && provider_name.trim() ? this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption, {
        seller_name: provider_name,
        contact_no: provider_number,
        updated_by: user_id,
        created_by: user_id,
        status_type: 11
      }) : '', result[1]]);
    }).spread((sellerDetail, productDetail) => {

      const { product_name, service_type, user_id } = productDetail;
      const { category_id, main_category_id, sub_category_id } = service_type;
      return this.productAdaptor.createEmptyProduct(JSON.parse(JSON.stringify({
        document_date: servicePaymentDetail.paid_on,
        category_id, main_category_id, sub_category_id,
        product_name,
        seller_id: sellerDetail ? sellerDetail.sid : undefined,
        purchase_cost: servicePaymentDetail.amount_paid,
        status_type: 11,
        updated_by: user_id,
        user_id,
        model: servicePaymentDetail.name
      })));
    });
  }
}
exports.default = CalendarServiceAdaptor;