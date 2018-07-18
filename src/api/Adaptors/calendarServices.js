import moment from 'moment';
import _ from 'lodash';
import Promise from 'bluebird';
import ProductAdaptor from './product';
import SellerAdaptor from './sellers';
import {monthlyPaymentCalc} from '../../helpers/shared';

require('moment-weekday-calc');

export default class CalendarServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.sellerAdaptor = new SellerAdaptor(modals);
    this.productAdaptor = new ProductAdaptor(modals);
  }

  async retrieveCalendarServices(options, language) {
    const [calendar_services, unit_types] = await Promise.all([
      this.retrieveAllCalendarServices(options, language),
      this.retrieveAllQuantities(options, language)]);
    return [
      calendar_services.map(item => {
        const calendarServiceItem = item.toJSON();
        calendarServiceItem.calendarServiceImageUrl = `${calendarServiceItem.calendarServiceImageUrl}/thumbnail`;
        calendarServiceItem.name = calendarServiceItem ?
            calendarServiceItem.name ||
            calendarServiceItem.default_name :
            '';
        calendarServiceItem.quantity_type = calendarServiceItem ?
            calendarServiceItem.quantity_type ||
            calendarServiceItem.default_quantity_type :
            '';
        return calendarServiceItem;
      }),
      unit_types.map(item => {
        const unitTypes = item.toJSON();
        unitTypes.title = unitTypes.title ||
            unitTypes.default_title;
        return unitTypes;
      }),
    ];
  }

  async retrieveAllQuantities(options, language) {
    return await this.modals.quantities.findAll({
      where: options,
      attributes: [
        'id',
        [
          'quantity_name',
          'default_title'],
        [
          `${language ?
              `quantity_name_${language}` :
              `quantity_name`}`, 'title'],
      ],
      order: ['id'],
    });
  }

  async retrieveAllCalendarServices(options, language) {
    return await this.modals.calendar_services.findAll({
      where: options,
      attributes: [
        'id',
        [
          'service_name',
          'default_name'],
        [
          `${language ? `service_name_${language}` : `service_name`}`,
          'name'],
        [
          this.modals.sequelize.literal('"quantity"."quantity_name"'),
          'default_quantity_name'],
        [
          this.modals.sequelize.literal(`"quantity"."${language ?
              `quantity_name_${language}` :
              `quantity_name`}"`), 'quantity_name'],
        'quantity_type',
        'category_id',
        'main_category_id',
        'sub_category_id',
        'wages_type',
        [
          this.modals.sequelize.fn('CONCAT', '/calendarservice/',
              this.modals.sequelize.literal('"calendar_services"."id"'),
              '/images'),
          'calendarServiceImageUrl'],
      ],
      include: {
        model: this.modals.quantities,
        as: 'quantity',
        attributes: [],
        required: false,
      },
      order: ['id'],
    });
  }

  async retrieveCalendarServiceById(id, language) {
    const calendar_services = await this.modals.calendar_services.findById(id, {
      attributes: [
        'id',
        [
          'service_name',
          'default_name'],
        [
          `${language ? `service_name_${language}` : `service_name`}`,
          'name'],
        [
          this.modals.sequelize.literal('"quantity"."quantity_name"'),
          'default_quantity_name'],
        [
          this.modals.sequelize.literal(`"quantity"."${language ?
              `quantity_name_${language}` :
              `quantity_name`}"`), 'quantity_name'],
        'quantity_type',
        'wages_type',
        [
          this.modals.sequelize.fn('CONCAT', '/calendarservice/',
              this.modals.sequelize.literal('"calendar_services"."id"'),
              '/images'),
          'calendarServiceImageUrl'],
        'category_id',
        'main_category_id',
        'sub_category_id',
      ],
      include: {
        model: this.modals.quantities,
        as: 'quantity',
        attributes: [],
        required: false,
      },
      order: ['id'],
    });
    const calendarServiceItem = calendar_services.toJSON();
    calendarServiceItem.name = calendarServiceItem.name ||
        calendarServiceItem.default_name;
    calendarServiceItem.quantity_type = calendarServiceItem.quantity_type ||
        calendarServiceItem.default_quantity_type;
    return calendarServiceItem;
  }

  async createCalendarItem(calendarItemDetail) {
    const {productBody, servicePaymentArray, serviceAbsentDayArray, serviceCalculationBody} = calendarItemDetail;
    let calendarItem = await this.findAndCreateCalendarItem(
        {where: productBody});
    calendarItem = calendarItem.toJSON();
    serviceCalculationBody.ref_id = calendarItem.id;
    const subPromiseArray = [
      calendarItem,
      this.findCreateCalculationDetail({where: serviceCalculationBody})];
    servicePaymentArray.forEach((item) => {
      item.ref_id = calendarItem.id;
      subPromiseArray.push(this.findCreateServicePayment({where: item}));
    });
    serviceAbsentDayArray.forEach((item) => {
      item.ref_id = calendarItem.id;
      subPromiseArray.push(this.markAbsentForItem({where: item}));
    });

    return await Promise.all(subPromiseArray);
  }

  async updateCalendarItem(calendarItemDetail, id) {
    return await this.modals.user_calendar_item.update(calendarItemDetail,
        {where: {id}});
  }

  async findCreateAbsentDateDetails(parameters) {
    return await this.modals.service_absent_days.findCreateFind(parameters);
  }

  async findCreateServicePayment(parameters) {
    return await this.modals.service_payment.findCreateFind(parameters);
  }

  async findCreateCalculationDetail(parameters) {
    return await this.modals.service_calculation.findCreateFind(parameters);
  }

  async findAndCreateCalendarItem(parameters) {
    return await this.modals.user_calendar_item.findCreateFind(parameters);
  }

  async markAbsentForItem(parameters) {
    return await this.modals.service_absent_days.findCreateFind(parameters);
  }

  async markPresentForItem(parameters) {
    return await this.modals.service_absent_days.destroy(parameters);
  }

  async retrieveCalendarItemList(options, language, limit, offset) {
    const calendarItemOptions = {
      where: options,
      order: [['created_at', 'desc']],
    };
    if (limit) {
      calendarItemOptions.limit = limit;
    }

    if (offset) {
      calendarItemOptions.offset = offset;
    }

    let calendarItemList = await this.retrieveAllCalendarItems(
        calendarItemOptions);
    const calendarItemIds = calendarItemList.map(
        (item) => item.id);
    let [services, latest_payment_details, latest_calculation_details, attendance_totals, payment_totals] = await Promise.all(
        [
          this.retrieveCalendarServices(
              {id: calendarItemList.map((item) => item.service_id)},
              language),
          this.retrieveServicePaymentDetails({
            include:
                {
                  model: this.modals.service_absent_days,
                  as: 'absent_day_detail',
                  required: false,
                },
            where: {
              ref_id: calendarItemIds,
              end_date: {
                $in: [
                  this.modals.sequelize.literal(
                      `SELECT MAX("service_payment"."end_date") FROM "table_service_payment" 
                        as "service_payment" ${calendarItemIds.length > 0 ?
                          `WHERE "service_payment"."ref_id" in 
                        (${calendarItemIds.toString()})` :
                          ''} GROUP BY ref_id`),
                ],
              },
            },
          }),
          this.modals.service_calculation.findAll({
            where: {
              ref_id: calendarItemIds,
              effective_date: {
                $in: [
                  this.modals.sequelize.literal(
                      `SELECT MAX("service_calc"."effective_date") FROM "table_service_calculation" 
                        as "service_calc" ${calendarItemIds.length > 0 ?
                          `WHERE "service_calc"."ref_id" in 
                        (${calendarItemIds.toString()})` :
                          ''} GROUP BY ref_id`),
                ],
              },
            },
            include: {
              model: this.modals.quantities,
              as: 'unit',
              attributes: [
                'id',
                [
                  'quantity_name',
                  'default_title'],
                [
                  `${language ?
                      `quantity_name_${language}` :
                      `quantity_name`}`, 'title']],
              required: false,
            },
          }),
          this.retrieveServicePaymentDetails({
            where: {
              ref_id: calendarItemIds,
            },
            attributes: [
              'ref_id',
              [
                this.modals.sequelize.fn('SUM',
                    this.modals.sequelize.col('total_amount')),
                'total_amount']],
            group: ['ref_id'],
          }),
          this.modals.calendar_item_payment.findAll({
            where: {
              ref_id: calendarItemIds,
            },
            attributes: [
              'ref_id',
              [
                this.modals.sequelize.fn('SUM',
                    this.modals.sequelize.col('amount_paid')),
                'total_amount_paid']],
            group: ['ref_id'],
          })]);
    payment_totals = payment_totals.map(
        (paymentItem) => paymentItem ? paymentItem.toJSON() : undefined);
    latest_calculation_details = latest_calculation_details.map(
        (calcItem) => {
          const calculationItem = calcItem.toJSON();
          if (calculationItem.unit) {
            calculationItem.unit.title = calculationItem.unit.title ||
                calculationItem.unit.default_title;
          }
          return calculationItem;
        });
    return calendarItemList.map((item) => {
      item.service_type = services[0].find(
          (serviceItem) => serviceItem.id === item.service_id);

      item.latest_payment_detail = latest_payment_details.find(
          (paymentItem) => paymentItem.ref_id === item.id);
      item.latest_calculation_detail = latest_calculation_details.find(
          (calcItem) => calcItem.ref_id === item.id);
      item.present_days = item.latest_payment_detail ?
          item.latest_payment_detail.total_days :
          0;
      item.absent_days = item.latest_payment_detail ?
          item.latest_payment_detail.absent_day_detail.length :
          0;
      const attendance_calc = attendance_totals.find(
          (paymentItem) => paymentItem && paymentItem.ref_id === item.id);
      let payment_calc = payment_totals.find(
          (paymentItem) => {
            return paymentItem && paymentItem.ref_id === item.id;
          });
      const attendance_total = attendance_calc ?
          attendance_calc.total_amount :
          0;
      const payment_total = payment_calc ?
          payment_calc.total_amount_paid || 0 :
          0;
      console.log('\n\n\n\n',
          {
            payment_calc,
            attendance_calc,
            attendance_total,
            payment_total,
          });
      item.outstanding_amount = (payment_total -
          attendance_total).toFixed(2);

      return item;
    });
  }

  async retrieveAllCalendarItems(options) {
    return await this.modals.user_calendar_item.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  async retrieveServicePaymentDetails(options) {
    return await this.modals.service_payment.findAll(options).
        then((result) => result.map(item => item.toJSON()));
  }

  async retrieveLatestServicePaymentDetails(options) {
    options.order = [['end_date', 'DESC']];
    const result = await this.modals.service_payment.findOne(options);
    return result ? result.toJSON() : {};
  }

  async retrieveLatestServiceCalculation(options) {
    options.order = [['effective_date', 'DESC']];
    const result = await this.modals.service_calculation.findOne(options);
    return result ? result.toJSON() : {};
  }

  async retrieveCalendarItemById(id, language) {
    let calendarItemDetail;
    let destroyablePaymentDetail = [];
    let destroyableAbsentDetails = [];
    const result = await this.modals.user_calendar_item.findById(id, {
      include: [
        {
          model: this.modals.calendar_item_payment,
          as: 'payments',
          order: [['paid_on', 'asc']],
          required: false,
        },
        {
          model: this.modals.service_payment,
          as: 'payment_detail',
          include: {
            model: this.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false,
          },
          order: [['end_date', 'desc']],
          required: true,
        }, {
          model: this.modals.service_calculation,
          as: 'calculation_detail',
          include: {
            model: this.modals.quantities,
            as: 'unit',
            attributes: [
              'id',
              [
                'quantity_name',
                'default_title'],
              [
                `${language ?
                    `quantity_name_${language}` :
                    `quantity_name`}`, 'title']],
            required: false,
          },
          required: true,
          order: [['effective_date', 'desc']],
        },
      ],
    });
    calendarItemDetail = result.toJSON();
    calendarItemDetail.service_type = await this.retrieveCalendarServiceById(
        calendarItemDetail.service_id,
        language);
    calendarItemDetail.calculation_detail = _.orderBy(
        calendarItemDetail.calculation_detail, ['effective_date'], ['desc']);
    calendarItemDetail.calculation_detail = calendarItemDetail.end_date ?
        calendarItemDetail.calculation_detail.filter(
            (cDItem) => moment(calendarItemDetail.end_date, moment.ISO_8601).
                isSameOrAfter(moment(cDItem.effective_date, moment.ISO_8601))) :
        calendarItemDetail.calculation_detail;
    destroyablePaymentDetail = calendarItemDetail.end_date ?
        calendarItemDetail.payment_detail.filter(
            (pDItem) => moment(calendarItemDetail.end_date, moment.ISO_8601).
                isBefore(moment(pDItem.start_date, moment.ISO_8601))) :
        [];
    calendarItemDetail.payment_detail = _.orderBy(
        calendarItemDetail.payment_detail, ['end_date'], ['desc']);
    calendarItemDetail.payment_detail = calendarItemDetail.end_date ?
        calendarItemDetail.payment_detail.filter(
            (pDItem) => moment(calendarItemDetail.end_date, moment.ISO_8601).
                isSameOrAfter(moment(pDItem.start_date, moment.ISO_8601))) :
        calendarItemDetail.payment_detail;
    const item_end_date = moment(calendarItemDetail.payment_detail[0].end_date,
        moment.ISO_8601);
    const current_date = calendarItemDetail.end_date &&
    moment().isAfter(calendarItemDetail.end_date) ?
        moment(calendarItemDetail.end_date, moment.ISO_8601) :
        moment();
    if (current_date.isSameOrAfter(moment(item_end_date, moment.ISO_8601))) {
      console.log('If is here', {current_date});
      const lastItemMonth = item_end_date.month();
      const monthDiff = moment(current_date, moment.ISO_8601).startOf('months').
          diff(moment(item_end_date, moment.ISO_8601).startOf('months'),
              'months');
      if (monthDiff > 0) {
        calendarItemDetail.payment_detail[0].end_date = moment(
            [current_date.year(), 0, 31]).month(lastItemMonth);
        for (let i = 1; i <= monthDiff; i++) {
          const start_date = moment(
              [current_date.year(), lastItemMonth + i, 1]);
          const month_end_date = moment([current_date.year(), 0, 31]).
              month(lastItemMonth + i);
          calendarItemDetail.payment_detail.push({
            start_date,
            end_date: month_end_date.isAfter(current_date) ?
                current_date :
                month_end_date,
            absent_day_detail: [],
            ref_id: id,
          });
        }
      } else {
        console.log('Else is here', {current_date});
        calendarItemDetail.payment_detail[0].end_date = current_date;
      }
    }

    calendarItemDetail.payment_detail = calendarItemDetail.payment_detail.map(
        (pItem) => {
          pItem.end_date = !calendarItemDetail.end_date ||
          (calendarItemDetail.end_date && current_date.isSameOrAfter(
              moment(pItem.end_date, moment.ISO_8601))) ?
              pItem.end_date :
              current_date;

          pItem.absent_day_detail = calendarItemDetail.end_date ?
              pItem.absent_day_detail.filter(
                  (aDayDetail) => moment(calendarItemDetail.end_date,
                      moment.ISO_8601).
                      isSameOrAfter(
                          moment(aDayDetail.absent_date,
                              moment.ISO_8601))) :
              pItem.absent_day_detail;
          const last_absent_date = pItem.absent_day_detail[pItem.absent_day_detail.length -
          1];
          if (last_absent_date) {
            pItem.end_date = moment(pItem.end_date, moment.ISO_8601).
                isSameOrAfter(
                    moment(last_absent_date.absent_date,
                        moment.ISO_8601)) ?
                pItem.end_date :
                last_absent_date.absent_date;
          }

          pItem.end_date = moment(pItem.start_date, moment.ISO_8601).
              endOf('months').
              isSameOrAfter(
                  moment(pItem.end_date, moment.ISO_8601)) ?
              pItem.end_date :
              moment(pItem.start_date, moment.ISO_8601).endOf('months');

          destroyableAbsentDetails = calendarItemDetail.end_date ?
              pItem.absent_day_detail.filter(
                  (aDayDetail) => moment(calendarItemDetail.end_date,
                      moment.ISO_8601).
                      isBefore(
                          moment(aDayDetail.absent_date,
                              moment.ISO_8601))) :
              [];
          pItem.calendar_item = {
            selected_days: calendarItemDetail.selected_days,
            wages_type: calendarItemDetail.wages_type,
            end_date: calendarItemDetail.end_date,
          };
          return pItem;
        });

    await Promise.all([
      this.updatePaymentDetailForCalc({
        servicePayments: calendarItemDetail.payment_detail,
        serviceCalcList: calendarItemDetail.calculation_detail,
        absentDetailToUpdate: [],
      }),
      ...destroyablePaymentDetail.map(
          (dPDItem) => this.modals.service_payment.destroy({
            where: {id: dPDItem.id},
          })),
      ...destroyableAbsentDetails.map(
          (dAbsentDetail) => this.markPresentForItem({
            where: {id: dAbsentDetail.id},
          }))]);
    let [paymentDetailResult, attendance_total, payment_total] = await Promise.all(
        [
          this.retrieveServicePaymentDetails({
            where: {ref_id: id},
            include: {
              model: this.modals.service_absent_days,
              as: 'absent_day_detail', required: false,
            },
            order: [['end_date', 'desc']],
          }),
          this.retrieveLatestServicePaymentDetails({
            where: {ref_id: id},
            attributes: [
              'ref_id', [
                this.modals.sequelize.fn('SUM',
                    this.modals.sequelize.col('total_amount')),
                'total_amount']],
            group: ['ref_id', 'end_date'],
          }),
          this.modals.calendar_item_payment.findOne({
            where: {ref_id: id},
            attributes: [
              'ref_id', [
                this.modals.sequelize.fn('SUM',
                    this.modals.sequelize.col('amount_paid')),
                'total_amount_paid']],
            group: ['ref_id'],
          })]);
    calendarItemDetail.payment_detail = paymentDetailResult;
    calendarItemDetail.payment_detail[0].absent_day_detail = calendarItemDetail.end_date
        ?
        calendarItemDetail.payment_detail[0].absent_day_detail.filter(
            (aDayDetail) => moment(calendarItemDetail.end_date,
                moment.ISO_8601).
                isSameOrAfter(
                    moment(aDayDetail.absent_date, moment.ISO_8601))) :
        calendarItemDetail.payment_detail[0].absent_day_detail;
    const attendance_total_amount = attendance_total ?
        attendance_total.total_amount : 0;
    payment_total = payment_total ? payment_total.toJSON() : undefined;
    const payment_total_amount = payment_total ?
        payment_total.total_amount_paid : 0;

    calendarItemDetail.outstanding_amount = (payment_total_amount -
        attendance_total_amount).toFixed(2);
    return calendarItemDetail;
  }

  async retrieveCurrentCalculationDetail(options) {
    const result = await this.modals.service_calculation.findOne(
        {where: options, order: [['effective_date', 'desc']]});
    return result.toJSON();
  }

  async retrieveAllCalculationDetail(options) {
    const result = await this.modals.service_calculation.findAll(
        {where: options, order: [['effective_date', 'desc']]});
    return result.map(item => item.toJSON());
  }

  async updatePaymentDetail(id, paymentDetail, isForAbsent) {
    const result = await this.modals.service_payment.findById(id, {
      include: [
        {
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true,
        }, {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false,
        }],
    });
    const currentDetail = result.toJSON();
    const currentEndDate = moment(currentDetail.end_date, moment.ISO_8601);
    let newEndDate = paymentDetail.end_date &&
    moment(paymentDetail.end_date, moment.ISO_8601).
        isAfter(currentEndDate) ?
        moment(paymentDetail.end_date, moment.ISO_8601) :
        moment().isAfter(currentEndDate) && !isForAbsent ?
            moment() : currentEndDate;

    let end_date = moment([currentEndDate.year(), 0, 31]).
        month(currentEndDate.month());
    const daysInMonth = moment().
        isoWeekdayCalc(currentDetail.start_date, end_date,
            paymentDetail.selected_days ||
            currentDetail.calendar_item.selected_days);

    if (currentDetail.calendar_item.wages_type === 1) {
      paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
    }

    if (paymentDetail.quantity || paymentDetail.quantity === 0) {
      paymentDetail.unit_price = paymentDetail.quantity *
          paymentDetail.unit_price;
    }

    let daysInPeriod = 0;
    if (newEndDate) {
      const monthDiff = newEndDate.month() -
          moment(currentDetail.end_date, moment.ISO_8601).month();
      if (monthDiff > 0) {
        return await this.addPaymentDetail({
          start_date: moment(newEndDate, moment.ISO_8601).startOf('M'),
          end_date: moment(newEndDate, moment.ISO_8601).
              endOf('days'), latest_end_date: currentEndDate,
          ref_id: currentDetail.ref_id, monthDiff,
        }, paymentDetail);
      } else {
        paymentDetail.absent_day = currentDetail.absent_day_detail.length;
        daysInPeriod = moment().isoWeekdayCalc(currentDetail.start_date,
            moment(newEndDate, moment.ISO_8601).endOf('days'),
            paymentDetail.selected_days ||
            currentDetail.calendar_item.selected_days) -
            paymentDetail.absent_day;

        paymentDetail.total_days = daysInPeriod;
        paymentDetail.total_units = (paymentDetail.quantity ?
            paymentDetail.quantity * daysInPeriod : 0);
        paymentDetail.total_amount = paymentDetail.unit_price * daysInPeriod;
      }
    }

    paymentDetail.total_amount = paymentDetail.total_amount ||
    paymentDetail.total_days === 0 ? paymentDetail.total_amount :
        currentDetail.total_amount;
    paymentDetail.total_days = paymentDetail.total_days ||
    paymentDetail.total_days === 0 ?
        paymentDetail.total_days :
        currentDetail.total_days;
    paymentDetail.total_units = paymentDetail.total_units ||
    paymentDetail.total_units === 0 ?
        paymentDetail.total_units :
        currentDetail.total_units;
    return await result.updateAttributes({
      total_amount: (paymentDetail.total_amount).toFixed(2),
      total_days: paymentDetail.total_days,
      end_date: newEndDate,
      status_type: paymentDetail.status_type || currentDetail.status_type,
      amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
      total_units: paymentDetail.total_units,
    });
  }

  async addPaymentDetail(options, paymentDetail) {
    const result = await this.modals.service_payment.findOne({
      where: {
        start_date: options.start_date, end_date: {
          $lte: moment(options.end_date, moment.ISO_8601).endOf('M'),
        }, ref_id: options.ref_id,
      }, include: [
        {
          model: this.modals.user_calendar_item,
          as: 'calendar_item',
          required: true,
        },
        {
          model: this.modals.service_absent_days,
          as: 'absent_day_detail',
          required: false,
        }],
    });
    if (result) {
      const currentDetail = result.toJSON();
      const currentEndDate = moment(currentDetail.end_date, moment.ISO_8601);
      let end_date = moment([currentEndDate.year(), 0, 31]).
          month(currentEndDate.month());
      const daysInMonth = moment().
          isoWeekdayCalc(currentDetail.start_date, end_date,
              paymentDetail.selected_days ||
              currentDetail.calendar_item.selected_days);

      if (currentDetail.calendar_item.wages_type === 1) {
        paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
      }

      if (paymentDetail.quantity || paymentDetail.quantity === 0) {
        paymentDetail.unit_price = paymentDetail.quantity *
            paymentDetail.unit_price;
      }

      let daysInPeriod = 0;
      if (paymentDetail.end_date) {
        if (moment(paymentDetail.end_date, moment.ISO_8601).
            isAfter(moment(currentDetail.end_date, moment.ISO_8601))) {
          daysInPeriod = moment().isoWeekdayCalc(
              moment(currentDetail.start_date, moment.ISO_8601).endOf('days'),
              moment(currentDetail.end_date, moment.ISO_8601).
                  endOf('days'), paymentDetail.selected_days ||
              currentDetail.calendar_item.selected_days) -
              currentDetail.absent_day_detail.length;
          paymentDetail.total_days = daysInPeriod;
          paymentDetail.total_units = (paymentDetail.quantity ?
              paymentDetail.quantity * daysInPeriod :
              0);
          paymentDetail.total_amount = paymentDetail.unit_price *
              daysInPeriod;
        }
      }

      paymentDetail.total_amount = paymentDetail.total_amount ||
          currentDetail.total_amount;
      return await result.updateAttributes({
        total_amount: paymentDetail.total_amount > 1 ?
            (paymentDetail.total_amount).toFixed(2) : 0,
        total_days: paymentDetail.total_days || currentDetail.total_days,
        status_type: paymentDetail.status_type || currentDetail.status_type,
        amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
        total_units: paymentDetail.total_units,
      });
    }
  }

  async addServiceCalc(options, calcDetail) {
    const calcResult = await this.modals.service_calculation.findOne(
        {where: options});
    if (calcResult) {
      return await new Promise((resolve) => setImmediate(() => {
        resolve(calcResult.updateAttributes(calcDetail));
      }));
    }

    return await this.modals.service_calculation.create(calcDetail);
  }

  async deleteCalendarItemById(id, user_id) {
    return await this.modals.user_calendar_item.destroy(
        {where: {id, user_id}});
  }

  async manipulatePaymentDetail(options) {
    let serviceCalcList;
    let servicePayments;
    let absentDetail = [];
    const serviceResult = Promise.all([
      this.modals.service_payment.count({
        where: {
          ref_id: options.ref_id,
          start_date: {
            $lte: options.effective_date,
          },
        },
        include: [
          {
            model: this.modals.user_calendar_item,
            as: 'calendar_item',
            required: true,
          }, {
            model: this.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false,
          }],
      }),
      this.modals.service_calculation.findAll({
        where: {
          ref_id: options.ref_id,
        },
      }),
      this.modals.service_payment.findAll({
        where: {
          ref_id: options.ref_id,
          end_date: {
            $gte: options.effective_date,
          },
        },
        include: [
          {
            model: this.modals.user_calendar_item,
            as: 'calendar_item',
            required: true,
          }, {
            model: this.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false,
          }],
      })]);
    serviceCalcList = serviceResult[1].map(item => item.toJSON());
    serviceCalcList = _.orderBy(serviceCalcList, ['effective_date'], ['asc']);
    servicePayments = serviceResult[2].map(item => item.toJSON());
    servicePayments.forEach(
        item => absentDetail.push(...(item.absent_day_detail || [])));
    absentDetail = _.orderBy(absentDetail, ['absent_date'], ['asc']);
    let servicePaymentArray = [];
    let destroyServicePayment;
    let payment_calendar_item;
    if (serviceResult[0] === 0) {
      destroyServicePayment = this.modals.service_payment.destroy({
        where: {ref_id: servicePayments[0].calendar_item.id},
      });
      const effectiveDate = moment(options.effective_date,
          moment.ISO_8601);
      const absent_date = moment(servicePayments[0].end_date,
          moment.ISO_8601).startOf();
      const currentDate = absent_date.isAfter(moment().startOf('days')) ?
          absent_date : moment();
      const currentMth = currentDate.month();
      const currentYear = currentDate.year();
      const effectiveMth = effectiveDate.month();
      let {selected_days, wages_type} = servicePayments[0].calendar_item;
      let serviceCalculationBody = serviceCalcList[0];
      selected_days = serviceCalculationBody.selected_days || selected_days;
      servicePaymentArray = monthlyPaymentCalc({
        currentMth, effectiveMth,
        effectiveDate, selected_days, wages_type,
        serviceCalculationBody, user: {
          id: servicePayments[0].calendar_item.user_id,
        }, currentYear, currentDate,
      });
    }

    serviceCalcList = _.orderBy(serviceCalcList, ['effective_date'], ['desc']);
    [
      servicePaymentArray,
      serviceResult,
      payment_calendar_item] = await Promise.all([
      servicePaymentArray.map((item) => {
        item.ref_id = servicePayments[0].calendar_item.id;
        return item;
      }),
      serviceResult[0],
      servicePayments[0].calendar_item,
    ]);
    const results = await Promise.all([
      Promise.all(servicePaymentArray.map(
          (item) => this.modals.service_payment.findCreateFind(
              {where: item}))),
      serviceResult,
      payment_calendar_item,
    ]);

    console.log(JSON.stringify(results));
    const absentDetailToUpdate = [];
    let paymentDetail;
    if (results[1] === 0) {
      servicePayments = results[0].map((paymentItem) => {
        paymentDetail = paymentItem[0].toJSON();
        const absent_day_detail = absentDetail.filter(
            absentItem => {
              const absent_date = moment(absentItem.absent_date,
                  moment.ISO_8601);
              return absent_date.isSameOrAfter(
                  moment(paymentDetail.start_date, moment.ISO_8601)) &&
                  absent_date.isSameOrBefore(
                      moment(paymentDetail.end_date, moment.ISO_8601));
            });
        paymentDetail.absent_day_detail = absent_day_detail;
        absentDetailToUpdate.push(
            ...absent_day_detail.map((absentItem) => {
              absentItem = _.omit(absentItem, 'id');
              absentItem.payment_id = paymentDetail.id;
              return absentItem;
            }));
        paymentDetail.calendar_item = results[2];
      });
    } else {
      paymentDetail = await this.updatePaymentDetailForCalc({
        servicePayments,
        serviceCalcList,
        absentDetailToUpdate,
      });
    }
    return await Promise.all(paymentDetail.length > 0 ? paymentDetail.map(
        absentItem => this.markAbsentForItem({where: absentItem})) : []);
  }

  async updatePaymentDetailForCalc(parameters) {
    let {servicePayments, serviceCalcList} = parameters;
    const absentDetailToUpdate = [];
    return await Promise.all([
      ...servicePayments.map(async (paymentItem) => {
        const start_date = moment(paymentItem.start_date, moment.ISO_8601).
            valueOf();
        const end_date = moment(paymentItem.end_date, moment.ISO_8601).
            valueOf();
        const prevServiceCalc = serviceCalcList.find((calcItem) => {
          const effective_date = moment(calcItem.effective_date,
              moment.ISO_8601);
          return effective_date.isSameOrBefore(moment(start_date));
        });

        let isPrevCalcExist = false;
        let serviceCalc = serviceCalcList.filter((calcItem) => {
          const effective_date = moment(calcItem.effective_date,
              moment.ISO_8601);
          return effective_date.isSameOrAfter(moment(start_date)) &&
              effective_date.isSameOrBefore(moment(end_date));
        });

        serviceCalc = serviceCalc.map((calcItem) => {
          if (prevServiceCalc && prevServiceCalc.id === calcItem.id) {
            isPrevCalcExist = true;
          }

          return calcItem;
        });

        if (prevServiceCalc && !isPrevCalcExist) {
          serviceCalc.push(prevServiceCalc);
          serviceCalc = _.orderBy(serviceCalc, ['effective_date'], ['desc']);
        }
        /*return Promise.try(() => setImmediate(() => {*/
        let total_amount = 0;
        let total_days = 0;
        let total_units = 0;

        const absentDaysToDestroy = [];
        await serviceCalc.forEach(async (calcItem, index) => {
          const totalAmtUnitDay = await this.prepareTotalAmtUnitDays({
            index, calcItem, serviceCalc, paymentItem,
            start_date, total_amount, total_units, total_days,
            absentDetailToUpdate, absentDaysToDestroy,
          });
          total_amount = totalAmtUnitDay.total_amount;
          total_units = totalAmtUnitDay.total_units;
          total_days = totalAmtUnitDay.total_days;
        });

        return Promise.all([
          paymentItem.id ?
              this.modals.service_payment.update({
                start_date, end_date,
                updated_by: paymentItem.updated_by,
                status_type: paymentItem.status_type,
                total_amount: (total_amount).toFixed(2),
                total_days, total_units, amount_paid: 0,
              }, {where: {id: paymentItem.id}}) :
              this.modals.service_payment.create({
                start_date, end_date,
                updated_by: paymentItem.updated_by,
                status_type: paymentItem.status_type,
                total_amount: (total_amount).toFixed(2),
                total_days, total_units, ref_id: paymentItem.ref_id,
                amount_paid: 0,
              }),
          ...absentDaysToDestroy.map((absentItem) => this.markPresentForItem(
              {where: {id: absentItem.id}}))]);
        /*}));*/
      })]);
  }

  async prepareTotalAmtUnitDays(parameters) {
    let {index, calcItem, serviceCalc, paymentItem, start_date, total_amount, total_units, total_days, absentDetailToUpdate, absentDaysToDestroy} = parameters;
    const nextIndex = index > 0 ? index - 1 : index;
    let periodStartDate = moment(calcItem.effective_date,
        moment.ISO_8601);
    const effective_date = periodStartDate.valueOf();
    const next_effective_date = moment(
        serviceCalc[nextIndex].effective_date, moment.ISO_8601).valueOf();
    let absentDays = 0;
    let daysInMonth = 0;
    let daysInPeriod = 0;
    let selected_days = paymentItem.calendar_item.selected_days;
    selected_days = calcItem.selected_days || selected_days;
    let startDate = moment(paymentItem.start_date, moment.ISO_8601);
    let periodEndDate = moment(paymentItem.end_date, moment.ISO_8601);
    let monthEndDate = moment(paymentItem.end_date, moment.ISO_8601).
        endOf('M');
    if (moment(effective_date).isSameOrBefore(moment(start_date)) &&
        !moment(start_date).isSame(moment(next_effective_date))) {
      const nextEffectDate = moment(next_effective_date).
          subtract(1, 'days');
      const nextEffectStartDate = moment(
          nextEffectDate.format('YYYY-MM-DD'), moment.ISO_8601).
          startOf('months');
      console.log(paymentItem.end_date);
      const monthDiff = moment(start_date).
          startOf('M').diff(nextEffectStartDate, 'M');
      periodEndDate = monthDiff > 0 ? moment(paymentItem.end_date,
          moment.ISO_8601) : nextEffectDate;
      periodStartDate = moment(start_date);
      const __ret = await this.retrieveDayInPeriod({
        daysInMonth, startDate, monthEndDate, selected_days, daysInPeriod,
        periodStartDate, periodEndDate, absentDays, paymentItem,
      });
      daysInMonth = __ret.daysInMonth;
      daysInPeriod = __ret.daysInPeriod;
      absentDays = __ret.absentDays;
    } else if (index === 0) {
      periodEndDate = periodEndDate.isAfter(moment()) ||
      moment(startDate, moment.ISO_8601).
          isSameOrBefore(moment(), 'months') ?
          periodEndDate : moment();
      const __ret = await this.retrieveDayInPeriod({
        daysInMonth, startDate, monthEndDate, selected_days, daysInPeriod,
        periodStartDate, periodEndDate, absentDays, paymentItem,
      });
      daysInMonth = __ret.daysInMonth;
      daysInPeriod = __ret.daysInPeriod;
      absentDays = __ret.absentDays;
      console.log('This is ok', __ret);
    } else {
      periodEndDate = moment(serviceCalc[nextIndex].effective_date,
          moment.ISO_8601).subtract(1, 'd');
      const __ret = await this.retrieveDayInPeriod({
        daysInMonth, startDate, monthEndDate, selected_days, daysInPeriod,
        periodStartDate, periodEndDate, absentDays, paymentItem,
      });
      daysInMonth = __ret.daysInMonth;
      daysInPeriod = __ret.daysInPeriod;
      absentDays = __ret.absentDays;
    }

    daysInPeriod = daysInPeriod - absentDays;
    let unit_price = calcItem.unit_price;
    if (paymentItem.calendar_item.wages_type === 1) {
      unit_price = unit_price / daysInMonth;
    }

    const current_total_amount = unit_price * daysInPeriod;
    if (calcItem.quantity || calcItem.quantity === 0) {
      total_amount += (calcItem.quantity * current_total_amount);
      total_units += (calcItem.quantity * daysInPeriod);
    } else {
      total_amount += current_total_amount;
    }

    total_days += daysInPeriod;
    absentDetailToUpdate.push(...paymentItem.absent_day_detail.filter(
        (absentDayItem) => {
          const absent_date = moment(absentDayItem.absent_date,
              moment.ISO_8601);
          return selected_days.includes(absent_date.isoWeekday());
        }).map((absentDayItem) => {
      absentDayItem.payment_id = paymentItem.id;
      return absentDayItem;
    }));

    absentDaysToDestroy.push(...paymentItem.absent_day_detail.filter(
        (absentDayItem) => {
          const absent_date = moment(absentDayItem.absent_date,
              moment.ISO_8601);
          return !selected_days.includes(absent_date.isoWeekday());
        }));
    return {total_amount, total_units, total_days};
  }

  async retrieveDayInPeriod(parameters) {
    let {startDate, monthEndDate, selected_days, periodStartDate, periodEndDate, paymentItem} = parameters;
    return await {
      daysInMonth: moment().
          isoWeekdayCalc(moment(startDate, moment.ISO_8601).startOf('month'),
              monthEndDate, selected_days),
      daysInPeriod: moment().
          isoWeekdayCalc(periodStartDate, periodEndDate, selected_days),
      absentDays: paymentItem.absent_day_detail.filter((absentDayItem) => {
        const absent_date = moment(absentDayItem.absent_date,
            moment.ISO_8601);
        return absent_date.isSameOrAfter(periodStartDate) &&
            absent_date.isSameOrBefore(periodEndDate) &&
            selected_days.includes(absent_date.isoWeekday());
      }).length,
    };
  }

  async markPaymentPaid(id, servicePaymentDetail) {
    const result = await Promise.all([
      this.modals.calendar_item_payment.create(servicePaymentDetail),
      this.retrieveCalendarItemById(id, 'en')]);
    const {user_id, provider_name, provider_number, product_name, service_type} = result[1];

    let sellerOption = {seller_name: {$iLike: provider_name}};

    if (provider_number) {
      sellerOption.contact_no = provider_number;
    }
    const sellerDetail = await Promise.try(
        () => (provider_number && provider_number.trim()) ||
        (provider_name && provider_name.trim()) ?
            this.sellerAdaptor.retrieveOrCreateOfflineSellers(sellerOption,
                {
                  seller_name: provider_name,
                  contact_no: provider_number,
                  updated_by: user_id,
                  created_by: user_id,
                  status_type: 11,
                }) : '');
    const {category_id, main_category_id, sub_category_id} = service_type;
    return await this.productAdaptor.createEmptyProduct(
        JSON.parse(JSON.stringify({
          document_date: servicePaymentDetail.paid_on,
          category_id, main_category_id, sub_category_id,
          product_name,
          seller_id: sellerDetail ? sellerDetail.sid : undefined,
          purchase_cost: servicePaymentDetail.amount_paid,
          status_type: 11,
          updated_by: user_id,
          user_id,
          model: servicePaymentDetail.name,
        })));
  }
}