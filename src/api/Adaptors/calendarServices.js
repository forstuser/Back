import moment from 'moment';
import _ from 'lodash';
import Promise from 'bluebird';
import ProductAdaptor from './product';
import {monthlyPaymentCalc} from '../../helpers/shared';

require('moment-weekday-calc');

export default class CalendarServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
    this.productAdaptor = new ProductAdaptor(modals);
  }

  retrieveCalendarServices(options, language) {
    return Promise.try(() => [
      this.retrieveAllCalendarServices(options, language),
      this.retrieveAllQuantities(options, language)]).
        spread((calendar_services, unit_types) => ([
          calendar_services.map(item => {
            const calendarServiceItem = item.toJSON();
            calendarServiceItem.name = calendarServiceItem.name ||
                calendarServiceItem.default_name;
            calendarServiceItem.quantity_type = calendarServiceItem.quantity_type ||
                calendarServiceItem.default_quantity_type;
            return calendarServiceItem;
          }),
          unit_types.map(item => {
            const unitTypes = item.toJSON();
            unitTypes.title = unitTypes.title ||
                unitTypes.default_title;
            return unitTypes;
          }),
        ]));
  }

  retrieveAllQuantities(options, language) {
    return this.modals.quantities.findAll({
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

  retrieveAllCalendarServices(options, language) {
    return this.modals.calendar_services.findAll({
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

  retrieveCalendarServiceById(id, language) {
    return this.modals.calendar_services.findById(id, {
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
    }).then((calendar_services) => {
      const calendarServiceItem = calendar_services.toJSON();
      calendarServiceItem.name = calendarServiceItem.name ||
          calendarServiceItem.default_name;
      calendarServiceItem.quantity_type = calendarServiceItem.quantity_type ||
          calendarServiceItem.default_quantity_type;
      return calendarServiceItem;
    });
  }

  createCalendarItem(calendarItemDetail) {
    const {productBody, servicePaymentArray, serviceAbsentDayArray, serviceCalculationBody, user} = calendarItemDetail;
    return Promise.try(
        () => this.findAndCreateCalendarItem({where: productBody})).
        spread((calendarItem) => {
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

          return subPromiseArray;
        });
  }

  updateCalendarItem(calendarItemDetail, id) {
    return Promise.try(
        () => this.modals.user_calendar_item.update(calendarItemDetail,
            {where: {id}}));
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

  retrieveCalendarItemList(options, language) {
    let calendarItemList;
    return Promise.try(() => this.retrieveAllCalendarItems(options)).
        then((result) => {
          calendarItemList = result;

          return [
            this.retrieveCalendarServices(
                {id: calendarItemList.map((item) => item.service_id)},
                language),
            Promise.all(calendarItemList.map(
                (item) => this.retrieveLatestServicePaymentDetails({
                  include:
                      {
                        model: this.modals.service_absent_days,
                        as: 'absent_day_detail',
                        required: false,
                      },
                  where: {
                    end_date: {$lte: moment().endOf('M').valueOf()},
                    ref_id: item.id,
                  },
                }))),
            Promise.all(calendarItemList.map(
                (item) => this.retrieveLatestServiceCalculation({
                  where: {
                    ref_id: item.id,
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
                })))];
        }).
        spread(
            (services, latest_payment_details, latest_calculation_details) => {
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

                return item;
              });
            }).then((calendarItemList) => [
          Promise.all(calendarItemList.map(item => {
            if (moment(item.latest_payment_detail.end_date, moment.ISO_8601).
                    diff(moment(), 'days') < 0) {
              return this.updateServicePaymentForLatest({
                ref_id: item.id,
                latest_payment_detail: item.latest_payment_detail,
                serviceCalculationBody: item.latest_calculation_detail,
                productBody: item,
              });
            }

            return '';
          })), calendarItemList]);
  }

  retrieveAllCalendarItems(options) {
    return this.modals.user_calendar_item.findAll({
      where: options,
    }).then((result) => result.map(item => item.toJSON()));
  }

  retrieveServicePaymentDetails(options) {
    return this.modals.service_payment.findAll(options);
  }

  retrieveLatestServicePaymentDetails(options) {
    options.order = [
      [
        'end_date', 'DESC',
      ],
    ];
    return this.modals.service_payment.findOne(options).
        then((result) => result ? result.toJSON() : {});
  }

  retrieveLatestServiceCalculation(options) {
    options.order = [
      [
        'effective_date', 'DESC',
      ],
    ];
    return this.modals.service_calculation.findOne(options).
        then((result) => result ? result.toJSON() : {});
  }

  updateServicePaymentForLatest(options) {
    const {productBody, serviceCalculationBody} = options;
    console.log(serviceCalculationBody);
    const effectiveDate = serviceCalculationBody ?
        moment(options.latest_payment_detail ?
            options.latest_payment_detail.end_date :
            serviceCalculationBody.effective_date,
            moment.ISO_8601) :
        moment();
    const currentYear = moment().year();
    const effectiveYear = effectiveDate.year();
    let servicePaymentArray = [];
    const yearDiff = currentYear > effectiveYear ?
        currentYear - effectiveYear :
        null;
    if (!yearDiff) {
      const currentMth = moment().month();
      const currentYear = moment().year();
      const effectiveMth = effectiveDate.month();

      let {selected_days, wages_type} = productBody;
      selected_days = serviceCalculationBody.selected_days ||
          selected_days;
      servicePaymentArray = monthlyPaymentCalc({
        currentMth,
        effectiveMth,
        effectiveDate,
        selected_days, wages_type,
        serviceCalculationBody,
        user: {
          id: productBody.user_id,
        },
        currentYear,
      });
    } else {
      const yearArr = [];
      for (let i = 0; i <= yearDiff; i++) {
        yearArr.push(effectiveYear + i);
      }
      yearArr.forEach((currentYear) => {
        const yearStart = moment([currentYear, 0, 1]);
        const yearEnd = moment([currentYear, 0, 31]).endOf('Y');
        const currentMth = moment().endOf('M').diff(yearEnd, 'M') > 0 ?
            yearEnd.month() :
            moment().month();
        const effectiveMth = currentYear > effectiveYear ?
            yearStart.month() :
            effectiveDate.month();
        let {selected_days, wages_type} = productBody;
        selected_days = serviceCalculationBody.selected_days ||
            selected_days;
        servicePaymentArray.push(...monthlyPaymentCalc({
          currentMth,
          effectiveMth,
          effectiveDate,
          selected_days, wages_type,
          serviceCalculationBody,
          user: {
            id: productBody.user_id,
          },
          currentYear,
        }));
      });
    }

    return Promise.all(servicePaymentArray.map((payItem) => {
      if (options.latest_payment_detail &&
          effectiveDate.diff(moment(payItem.start_date, moment.ISO_8601),
              'days') === 0) {
        let {
          start_date, total_amount,
          total_days,
          total_units,
          amount_paid,
        } = options.latest_payment_detail;
        const {
          end_date,
        } = payItem;
        total_amount += Math.round(payItem.total_amount);
        total_days += payItem.total_days;
        total_units += payItem.total_units;
        return this.modals.service_payment.update({
          start_date,
          end_date,
          total_amount: Math.round(total_amount),
          total_days,
          total_units,
          amount_paid,
        }, {
          where: {
            id: options.latest_payment_detail.id,
          },
        });
      }
      payItem.ref_id = options.ref_id;
      return this.modals.service_payment.create(payItem);
    }));
  }

  retrieveCalendarItemById(id, language) {
    let calendarItemDetail;
    return this.modals.user_calendar_item.findById(id, {
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
    }).then((result) => {
      calendarItemDetail = result.toJSON();
      return this.retrieveCalendarServiceById(calendarItemDetail.service_id,
          language);
    }).then((services) => {
      calendarItemDetail.service_type = services;
      calendarItemDetail.calculation_detail = _.orderBy(
          calendarItemDetail.calculation_detail, ['effective_date'], ['desc']);
      calendarItemDetail.payment_detail = _.orderBy(
          calendarItemDetail.payment_detail, ['end_date'], ['desc']);
      const item_start_date = moment(
          calendarItemDetail.payment_detail[0].start_date,
          moment.ISO_8601);
      const item_end_date = moment(
          calendarItemDetail.payment_detail[0].end_date,
          moment.ISO_8601);
      calendarItemDetail.present_days = moment().
          isoWeekdayCalc(item_start_date, item_end_date,
              calendarItemDetail.selected_days);
      if (moment().
              endOf('days').
              diff(moment(item_end_date, moment.ISO_8601), 'days') >= 0) {
        calendarItemDetail.present_days = moment().
            isoWeekdayCalc(item_start_date, moment().endOf('days'),
                calendarItemDetail.selected_days);
      }

      calendarItemDetail.absent_days = calendarItemDetail.payment_detail[0].absent_day_detail.length;
      calendarItemDetail.present_days = calendarItemDetail.present_days -
          calendarItemDetail.absent_days;

      return calendarItemDetail;
    });
  }

  retrieveCurrentCalculationDetail(options) {
    return this.modals.service_calculation.findOne({
      where: options,
      order: [['effective_date', 'desc']],
    }).then((result) => result.toJSON());
  }

  retrieveAllCalculationDetail(options) {
    return this.modals.service_calculation.findAll({
      where: options,
      order: [['effective_date', 'desc']],
    }).then((result) => result.map(item => item.toJSON()));
  }

  updatePaymentDetail(id, paymentDetail, isForAbsent) {
    return this.modals.service_payment.findById(id, {
      include: {
        model: this.modals.user_calendar_item,
        as: 'calendar_item',
        required: true,
      },
    }).then((result) => {
      const currentDetail = result.toJSON();
      const currentEndDate = moment(currentDetail.end_date, moment.ISO_8601);
      let newEndDate = paymentDetail.end_date &&
      moment(paymentDetail.end_date, moment.ISO_8601).
          diff(currentEndDate, 'days') > 0 ?
          moment(paymentDetail.end_date, moment.ISO_8601) :
          moment().
              diff(currentEndDate, 'days') > 0 && !isForAbsent ?
              moment() :
              currentEndDate;

      let end_date = moment([currentEndDate.year(), 0, 31]).
          month(currentEndDate.month());
      const daysInMonth = moment().
          isoWeekdayCalc(currentDetail.start_date, end_date,
              currentDetail.calendar_item.selected_days);

      if (currentDetail.calendar_item.wages_type === 1) {
        paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
      }

      if (paymentDetail.quantity || paymentDetail.quantity === 0) {
        paymentDetail.unit_price = paymentDetail.quantity *
            paymentDetail.unit_price;
        paymentDetail.total_units = currentDetail.total_units -
            ((paymentDetail.absent_day || 0) > 0 ?
                paymentDetail.quantity :
                (paymentDetail.absent_day || 0) < 0 ?
                    -paymentDetail.quantity :
                    0);

        console.log(JSON.stringify({
          absent_day: paymentDetail.absent_day,
          quantity: paymentDetail.quantity,
          total_units: currentDetail.total_units,
        }));
      }

      let additional_unit_price = 0;
      let daysInPeriod = 0;
      if (newEndDate) {
        const monthDiff = newEndDate.
                month() -
            moment(currentDetail.end_date, moment.ISO_8601).month();
        if (monthDiff > 0) {
          return this.addPaymentDetail({
            start_date: newEndDate.startOf('M'),
            end_date: newEndDate.
                endOf('days'),
            latest_end_date: currentEndDate,
            ref_id: currentDetail.ref_id,
            monthDiff,
          }, paymentDetail);
        } else if (newEndDate.endOf('days').diff(currentEndDate, 'days') > 0) {

          daysInPeriod = moment().
              isoWeekdayCalc(currentDetail.end_date,
                  moment(paymentDetail.end_date, moment.ISO_8601).endOf('days'),
                  currentDetail.calendar_item.selected_days) - 1;

          console.log(JSON.stringify({
            cEnd_date: currentDetail.end_date,
            PEnd_date: paymentDetail.end_date,
            daysInPeriod,
          }));
          paymentDetail.total_units = paymentDetail.total_units + (paymentDetail.quantity ? paymentDetail.quantity * daysInPeriod :
                      0);
          additional_unit_price = paymentDetail.unit_price * daysInPeriod;
        }
      }

      paymentDetail.total_amount = paymentDetail.total_amount ||
          ((currentDetail.total_amount + additional_unit_price) -
              paymentDetail.unit_price);
      result.updateAttributes({
        total_amount: paymentDetail.total_amount > 1 ? Math.round(paymentDetail.total_amount) : 0 ,
        total_days: paymentDetail.total_days ||
        (currentDetail.total_days + daysInPeriod) -
        (paymentDetail.absent_day || 0),
        end_date: newEndDate,
        status_type: paymentDetail.status_type || currentDetail.status_type,
        amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
        total_units: paymentDetail.total_units || currentDetail.total_units,
      });

      return result;
    });
  }

  addPaymentDetail(options, paymentDetail) {
    return this.modals.service_payment.findOne({
      where: {
        start_date: options.start_date,
        end_date: {
          $lte: moment(options.end_date, moment.ISO_8601).endOf('M'),
        },
        ref_id: options.ref_id,
      }, include: {
        model: this.modals.user_calendar_item,
        as: 'calendar_item',
        required: true,
      },
    }).then((result) => {
      if (result) {
        const currentDetail = result.toJSON();
        const currentEndDate = moment(currentDetail.end_date, moment.ISO_8601);
        let end_date = moment([currentEndDate.year(), 0, 31]).
            month(currentEndDate.month());
        const daysInMonth = moment().
            isoWeekdayCalc(currentDetail.start_date, end_date,
                currentDetail.calendar_item.selected_days);

        if (currentDetail.calendar_item.wages_type === 1) {
          paymentDetail.unit_price = paymentDetail.unit_price / daysInMonth;
        }

        if (paymentDetail.quantity || paymentDetail.quantity === 0) {
          paymentDetail.unit_price = paymentDetail.quantity *
              paymentDetail.unit_price;
        }

        let additional_unit_price = 0;
        let daysInPeriod = 0;
        if (paymentDetail.end_date) {
          if (moment(paymentDetail.end_date, moment.ISO_8601).
                  endOf('days').
                  diff(moment(currentDetail.end_date, moment.ISO_8601),
                      'days') >
              0) {
            daysInPeriod = moment().
                isoWeekdayCalc(currentDetail.end_date,
                    moment(paymentDetail.end_date, moment.ISO_8601).
                        endOf('days'),
                    currentDetail.calendar_item.selected_days) - 1;
            additional_unit_price = paymentDetail.unit_price * daysInPeriod;
            paymentDetail.total_units = (paymentDetail.quantity || 0) * daysInPeriod;
          }
        }

        result.updateAttributes({
          total_amount: Math.round(paymentDetail.total_amount ||
              ((currentDetail.total_amount + additional_unit_price) -
                  paymentDetail.unit_price)),
          total_days: (currentDetail.total_days + daysInPeriod) -
          (paymentDetail.absent_day || 0),
          end_date: paymentDetail.end_date || currentDetail.end_date,
          status_type: paymentDetail.status_type || currentDetail.status_type,
          amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
          total_units: paymentDetail.total_units,
        });

        return result;
      }
    });
  }

  addServiceCalc(options, calcDetail) {
    return this.modals.service_calculation.findOne({
      where: options,
    }).then((calcResult) => {
      if (calcResult) {
        return new Promise((resolve, reject) => setImmediate(() => {
          resolve(calcResult.updateAttributes(calcDetail));
          // (calcResult);
        }));
      }

      return this.modals.service_calculation.create(calcDetail);
    });
  }

  manipulatePaymentDetail(options) {
    let serviceCalcList;
    let servicePayments;
    let absentDetail = [];
    return Promise.all([
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
      })]).then((serviceResult) => {
      serviceCalcList = serviceResult[1].map(item => item.toJSON());
      serviceCalcList = _.orderBy(serviceCalcList,
          ['effective_date'], ['asc']);
      servicePayments = serviceResult[2].map(item => item.toJSON());
      servicePayments.forEach(
          item => absentDetail.push(...(item.absent_day_detail || [])));
      absentDetail = _.orderBy(absentDetail,
          ['absent_date'], ['asc']);
      let servicePaymentArray = [];
      let destroyServicePayment;
      if (serviceResult[0] === 0) {
        destroyServicePayment = this.modals.service_payment.destroy({
          where: {
            ref_id: servicePayments[0].calendar_item.id,
          },
        });
        const effectiveDate = moment(options.effective_date,
            moment.ISO_8601);
        const currentYear = moment().year();
        const effectiveYear = effectiveDate.year();
        const yearDiff = currentYear > effectiveYear ?
            currentYear - effectiveYear :
            null;
        const absent_date = moment(
            absentDetail[absentDetail.length - 1].absent_date,
            moment.ISO_8601);
        const currentDate = absent_date.diff(moment(), 'days') > 0 ?
            absent_date :
            moment();
        if (!yearDiff) {
          const currentMth = currentDate.month();
          const currentYear = currentDate.year();
          const effectiveMth = effectiveDate.month();
          let {selected_days, wages_type} = servicePayments[0].calendar_item;
          let serviceCalculationBody = serviceCalcList[0];
          selected_days = serviceCalculationBody.selected_days || selected_days;
          servicePaymentArray = monthlyPaymentCalc({
            currentMth,
            effectiveMth,
            effectiveDate,
            selected_days,
            wages_type,
            serviceCalculationBody,
            user: {
              id: servicePayments[0].calendar_item.user_id,
            },
            currentYear,
            currentDate,
          });
        } else {
          const yearArr = [];
          for (let i = 0; i <= yearDiff; i++) {
            yearArr.push(effectiveYear + i);
          }
          yearArr.forEach((currentYear) => {
            const yearStart = moment([currentYear, 0, 1]);
            const yearEnd = moment([currentYear, 0, 31]).endOf('Y');
            const currentMth = moment().endOf('M').diff(yearEnd, 'M') > 0 ?
                yearEnd.month() :
                currentDate.month();
            const effectiveMth = currentYear > effectiveYear ?
                yearStart.month() :
                effectiveDate.month();
            let {selected_days, wages_type} = servicePayments[0].calendar_item;
            let serviceCalculationBody = serviceCalcList[0];
            selected_days = serviceCalculationBody.selected_days ||
                selected_days;
            servicePaymentArray.push(...monthlyPaymentCalc({
              currentMth,
              effectiveMth,
              effectiveDate, selected_days, wages_type,
              serviceCalculationBody,
              user: {
                id: servicePayments[0].calendar_item.user_id,
              },
              currentYear,
              currentDate,
            }));
          });
        }
      }

      serviceCalcList = _.orderBy(serviceCalcList,
          ['effective_date'], ['desc']);
      return Promise.all([
        Promise.all(servicePaymentArray.map((item) => {
          item.ref_id = servicePayments[0].calendar_item.id;
          return this.modals.service_payment.findCreateFind({where: item});
        })),
        destroyServicePayment,
        serviceResult[0],
        servicePayments[0].calendar_item,
      ]);
    }).then((results) => {
      console.log(JSON.stringify(results));
      const absentDetailToUpdate = [];
      if (results[2] === 0) {
        servicePayments = results[0].map((paymentItem) => {
          const paymentDetail = paymentItem[0].toJSON();
          const absent_day_detail = absentDetail.filter(
              absentItem => {
                return moment(absentItem.absent_date, moment.ISO_8601).
                        diff(moment(paymentDetail.start_date, moment.ISO_8601),
                            'days') >= 0 &&
                    moment(absentItem.absent_date, moment.ISO_8601).
                        diff(moment(paymentDetail.end_date, moment.ISO_8601),
                            'days') <= 0;
              });
          paymentDetail.absent_day_detail = absent_day_detail;
          absentDetailToUpdate.push(...absent_day_detail.map((absentItem) => {
            absentItem = _.omit(absentItem, 'id');
            absentItem.payment_id = paymentDetail.id;
            return absentItem;
          }));
          paymentDetail.calendar_item = results[3];
          return paymentDetail;
        });
      }

      return this.updatePaymentDetailForCalc({
        servicePayments: servicePayments,
        serviceCalcList: serviceCalcList,
        absentDetailToUpdate: absentDetailToUpdate,
      });
    }).then((result) => {
      return Promise.all(result[0].length > 0 ? result[0].map(
          absentItem => this.markAbsentForItem({where: absentItem})) : []);
    });
  }

  updatePaymentDetailForCalc(parameters) {
    let {servicePayments, serviceCalcList, absentDetailToUpdate} = parameters;
    return Promise.all([
      absentDetailToUpdate, ...servicePayments.map((paymentItem) => {
        const start_date = moment(paymentItem.start_date, moment.ISO_8601).
            valueOf();
        const end_date = moment(paymentItem.end_date, moment.ISO_8601).
            valueOf();
        const prevServiceCalc = serviceCalcList.find((calcItem) => {
          const effective_date = moment(calcItem.effective_date,
              moment.ISO_8601).valueOf();
          return effective_date <= start_date;
        });

        let isPrevCalcExist = false;
        let serviceCalc = serviceCalcList.filter((calcItem) => {
          const effective_date = moment(calcItem.effective_date,
              moment.ISO_8601).valueOf();
          return effective_date >= start_date && effective_date <= end_date;
        });
        serviceCalc = serviceCalc.map((calcItem) => {
          if (prevServiceCalc && prevServiceCalc.id === calcItem.id) {
            isPrevCalcExist = true;
          }

          return calcItem;
        });

        if (prevServiceCalc && !isPrevCalcExist) {
          serviceCalc.push(prevServiceCalc);
          serviceCalc = _.orderBy(serviceCalc,
              ['effective_date'], ['desc']);
        }

        let total_amount = 0;
        let total_days = 0;
        let total_units = 0;
        serviceCalc.forEach((calcItem, index) => {
          const nextIndex = index > 0 ? index - 1 : index;
          let periodStartDate = moment(calcItem.effective_date,
              moment.ISO_8601);
          const effective_date = periodStartDate.valueOf();
          const next_effective_date = moment(
              serviceCalc[nextIndex].effective_date,
              moment.ISO_8601).valueOf();
          let absentDays = 0;
          let daysInMonth = 0;
          let daysInPeriod = 0;

          let selected_days = paymentItem.calendar_item.selected_days;
          selected_days = calcItem.selected_days || selected_days;
          let startDate = moment(paymentItem.start_date, moment.ISO_8601);
          let periodEndDate = moment(paymentItem.end_date,
              moment.ISO_8601);
          let monthEndDate = periodEndDate.endOf('M');
          if (effective_date <= start_date &&
              start_date !== next_effective_date) {
            periodEndDate = moment(serviceCalc[nextIndex].effective_date,
                moment.ISO_8601).subtract(1, 'd');
            periodStartDate = startDate;
            const __ret = this.retrieveDayInPeriod({
              daysInMonth, startDate, monthEndDate, selected_days, daysInPeriod,
              periodStartDate, periodEndDate, absentDays, paymentItem,
            });
            daysInMonth = __ret.daysInMonth;
            daysInPeriod = __ret.daysInPeriod;
            absentDays = __ret.absentDays;
            console.log('I am here', JSON.stringify({paymentItem,startDate,monthEndDate,periodStartDate,periodEndDate, selected_days,daysInMonth, daysInPeriod, absentDays}))
          } else if (index === 0) {
            periodEndDate = periodEndDate.diff(moment(), 'days') > 0 ? moment() : periodEndDate;
            const __ret = this.retrieveDayInPeriod({
              daysInMonth,
              startDate,
              monthEndDate,
              selected_days,
              daysInPeriod,
              periodStartDate,
              periodEndDate,
              absentDays,
              paymentItem,
            });
            daysInMonth = __ret.daysInMonth;
            daysInPeriod = __ret.daysInPeriod;
            absentDays = __ret.absentDays;
            console.log('You Are here', JSON.stringify({paymentItem,startDate,monthEndDate,periodStartDate,periodEndDate, selected_days,daysInMonth, daysInPeriod, absentDays}))
          } else {
            periodEndDate = moment(serviceCalc[nextIndex].effective_date,
                moment.ISO_8601).subtract(1, 'd');
            const __ret = this.retrieveDayInPeriod({
              daysInMonth,
              startDate,
              monthEndDate,
              selected_days,
              daysInPeriod,
              periodStartDate,
              periodEndDate,
              absentDays,
              paymentItem,
            });
            daysInMonth = __ret.daysInMonth;
            daysInPeriod = __ret.daysInPeriod;
            absentDays = __ret.absentDays;

            console.log('We are here', JSON.stringify({paymentItem,startDate,monthEndDate,periodStartDate,periodEndDate, selected_days,daysInMonth, daysInPeriod, absentDays}))
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
          }

          total_days += daysInPeriod;
        });

        return this.modals.service_payment.update({
          start_date,
          end_date,
          updated_by: paymentItem.updated_by,
          status_type: paymentItem.status_type,
          total_amount: Math.round(total_amount),
          total_days,
          total_units,
          amount_paid: 0,
        }, {
          where: {
            id: paymentItem.id,
          },
        }).catch((err) => Console.log('Error is here', err));
      })]).catch((err) => Console.log('Error is here', err));
  }

  retrieveDayInPeriod(parameters) {
    let {daysInMonth, startDate, monthEndDate, selected_days, daysInPeriod, periodStartDate, periodEndDate, absentDays, paymentItem} = parameters;
    daysInMonth = moment().
        isoWeekdayCalc(startDate, monthEndDate, selected_days);
    daysInPeriod = moment().
        isoWeekdayCalc(periodStartDate, periodEndDate, selected_days);
    absentDays = paymentItem.absent_day_detail.filter(
        (absentDayItem) => {
          const absent_date = moment(absentDayItem.absent_date,
              moment.ISO_8601);
          return absent_date.diff(periodStartDate, 'days') >= 0 &&
              absent_date.diff(periodEndDate, 'days') <= 0;
        }).length;
    return {daysInMonth, daysInPeriod, absentDays};
  }

  markPaymentPaid(id, servicePaymentDetail) {
    return Promise.all([
      this.modals.calendar_item_payment.create(servicePaymentDetail),
      this.retrieveCalendarItemById(id, 'en')]).then((result) => {
      const {product_name, service_type, user_id} = result[1];
      const {category_id, main_category_id, sub_category_id} = service_type;
      return this.productAdaptor.createEmptyProduct({
        document_date: servicePaymentDetail.paid_on,
        category_id, main_category_id, sub_category_id,
        product_name,
        purchase_cost: servicePaymentDetail.amount_paid,
        status_type: 11,
        updated_by: user_id,
        user_id,
        model: servicePaymentDetail.name,
      });
    });
  }
}