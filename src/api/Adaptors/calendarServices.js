import moment from 'moment';
import _ from 'lodash';

require('moment-weekday-calc');

export default class CalendarServiceAdaptor {
  constructor(modals) {
    this.modals = modals;
  }

  retrieveCalendarServices(options, language) {
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
          'default_quantity_type'],
        [
          this.modals.sequelize.literal(`"quantity"."${language ?
              `quantity_name_${language}` :
              `quantity_name`}"`), 'quantity_type'],
        [
          this.modals.sequelize.fn('CONCAT', '/calendarservice/',
              this.modals.sequelize.literal('"calendar_services"."id"'),
              '/images/'),
          'calendarServiceImageUrl'],
      ],
      include: {
        model: this.modals.quantities,
        as: 'quantity',
        attributes: [],
        required: false,
      },
      order: ['id'],
    }).then((result) => result.map(item => {
      const calendarServiceItem = item.toJSON();
      calendarServiceItem.name = calendarServiceItem.name ||
          calendarServiceItem.default_name;
      calendarServiceItem.quantity_type = calendarServiceItem.quantity_type ||
          calendarServiceItem.default_quantity_type;
      return calendarServiceItem;
    }));
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
          'default_quantity_type'],
        [
          this.modals.sequelize.literal(`"quantity"."${language ?
              `quantity_name_${language}` :
              `quantity_name`}"`), 'quantity_type'],
        [
          this.modals.sequelize.fn('CONCAT', '/calendarservice/',
              this.modals.sequelize.literal('"calendar_services"."id"'),
              '/images/'),
          'calendarServiceImageUrl'],
      ],
      include: {
        model: this.modals.quantities,
        as: 'quantity',
        attributes: [],
        required: true,
      },
      order: ['id'],
    }).then((result) => {
      const calendarServiceItem = result.toJSON();
      calendarServiceItem.name = calendarServiceItem.name ||
          calendarServiceItem.default_name;
      calendarServiceItem.quantity_type = calendarServiceItem.quantity_type ||
          calendarServiceItem.default_quantity_type;
      return calendarServiceItem;
    });
  }

  createCalendarItem(calendarItemDetail) {
    const {productBody, servicePaymentArray, serviceAbsentDayArray, serviceCalculationBody, user} = calendarItemDetail;
    return this.modals.user_calendar_item.findCreateFind({
      where: productBody,
    }).then((calendarItem) => {
      console.log(calendarItem);
      calendarItem = calendarItem[0].toJSON();
      serviceCalculationBody.ref_id = calendarItem.id;
      const subPromiseArray = [
        calendarItem,
        this.modals.service_calculation.findCreateFind({
          where: serviceCalculationBody,
        })];
      servicePaymentArray.forEach((item) => {
        item.ref_id = calendarItem.id;
        subPromiseArray.push(
            this.modals.service_payment.findCreateFind({where: item}));
      });
      serviceAbsentDayArray.forEach((item) => {
        item.ref_id = calendarItem.id;
        subPromiseArray.push(
            this.modals.service_absent_days.findCreateFind({where: item}));
      });

      return Promise.all(subPromiseArray);
    });
  }

  markAbsentForItem(absentDayDetail) {
    return this.modals.service_absent_days.findCreateFind(
        {where: absentDayDetail});
  }

  markPresentForItem(absentDayDetail) {
    return this.modals.service_absent_days.destroy({where: absentDayDetail});
  }

  retrieveCalendarItemList(options, language) {
    let calendarItemList;
    return this.modals.user_calendar_item.findAll({
      where: options,
      include: [
        {
          model: this.modals.service_payment,
          as: 'payment_detail',
          include:
              {
                model: this.modals.service_absent_days,
                as: 'absent_day_detail',
                required: false,
              },
          where: {
            start_date: {$gte: moment().startOf('M').valueOf()},
            end_date: {$lte: moment().endOf('M').valueOf()},
          },
          required: false,
        }, {
          model: this.modals.service_calculation,
          as: 'calculation_detail',
          required: true,
          order: [['effective_date', 'desc']],
        },
      ],
    }).then((result) => {
      calendarItemList = result.map((item) => item.toJSON());
      return this.retrieveCalendarServices(
          {id: calendarItemList.map((item) => item.service_id)}, language);
    }).then((services) => {
      return calendarItemList.map((item) => {
        item.service_type = services.find(
            (serviceItem) => serviceItem.id === item.service_id);

        item.calculation_detail = _.orderBy(item.calculation_detail,
            ['effective_date'], ['desc']);
        const item_start_date = moment(item.payment_detail[0].start_date,
            moment.ISO_8601);
        const item_end_date = moment(item.payment_detail[0].end_date,
            moment.ISO_8601);
        item.present_days = moment().
            isoWeekdayCalc(item_start_date, item_end_date, item.selected_days);
        if (moment().
                endOf('days').
                diff(moment(item_end_date, moment.ISO_8601), 'days') >= 0) {
          item.present_days = moment().
              isoWeekdayCalc(item_start_date, moment().endOf('days'),
                  item.selected_days);
        }

        item.absent_days = item.payment_detail[0].absent_day_detail.length;
        item.present_days = item.present_days - item.absent_days;

        return item;
      });
    });
  }

  retrieveCalendarItemById(id, language) {
    let calendarItemDetail;
    return this.modals.user_calendar_item.findById(id, {
      include: [
        {
          model: this.modals.service_payment,
          as: 'payment_detail',
          include: {
            model: this.modals.service_absent_days,
            as: 'absent_day_detail',
            required: false,
          },
          order: [['end_date', 'desc']],
          required: false,
        }, {
          model: this.modals.service_calculation,
          as: 'calculation_detail',
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

  updatePaymentDetail(id, paymentDetail) {
    return this.modals.service_payment.findById(id, {
      include: {
        model: this.modals.user_calendar_item,
        as: 'calendar_item',
        required: true,
      },
    }).then((result) => {
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

      if (paymentDetail.quantity) {
        paymentDetail.unit_price = paymentDetail.quantity *
            paymentDetail.unit_price;
      }

      let additional_unit_price = 0;
      let daysInPeriod = 0;
      if (paymentDetail.end_date) {
        const monthDiff = moment(paymentDetail.end_date, moment.ISO_8601).
                month() -
            moment(currentDetail.end_date, moment.ISO_8601).month();
        if (monthDiff > 0) {
          return this.addPaymentDetail({
            start_date: moment(paymentDetail.end_date, moment.ISO_8601).
                startOf('M'),
            end_date: moment(paymentDetail.end_date, moment.ISO_8601).
                endOf('days'),
            last_end_date: currentEndDate,
            ref_id: currentDetail.ref_id,
            monthDiff,
          }, paymentDetail);
        } else if (moment(paymentDetail.end_date, moment.ISO_8601).
                endOf('days').
                diff(moment(currentDetail.end_date, moment.ISO_8601), 'days') >
            0) {
          daysInPeriod = moment().
              isoWeekdayCalc(currentDetail.end_date,
                  moment(paymentDetail.end_date, moment.ISO_8601).endOf('days'),
                  currentDetail.calendar_item.selected_days) - 1;
          additional_unit_price = paymentDetail.unit_price * daysInPeriod;
        }
      }

      result.updateAttributes({
        total_amount: paymentDetail.total_amount ||
        ((currentDetail.total_amount + additional_unit_price) -
            paymentDetail.unit_price),
        total_days: paymentDetail.total_days ||
        (currentDetail.total_days + daysInPeriod) -
        (paymentDetail.absent_day || 0),
        end_date: paymentDetail.end_date || currentDetail.end_date,
        status_type: paymentDetail.status_type || currentDetail.status_type,
        amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
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

        if (paymentDetail.quantity) {
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
          }
        }

        result.updateAttributes({
          total_amount: paymentDetail.total_amount ||
          ((currentDetail.total_amount + additional_unit_price) -
              paymentDetail.unit_price),
          total_days: (currentDetail.total_days + daysInPeriod) -
          (paymentDetail.absent_day || 0),
          end_date: paymentDetail.end_date || currentDetail.end_date,
          status_type: paymentDetail.status_type || currentDetail.status_type,
          amount_paid: paymentDetail.amount_paid || currentDetail.amount_paid,
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
        calcResult.updateAttributes(calcDetail);
        return calcResult;
      }

      return this.modals.service_calculation.create(calcDetail);
    });
  }

  manipulatePaymentDetail(options, calcDetail) {
    return Promise.all([
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
      }), this.modals.service_calculation.findAll({
        where: {
          ref_id: options.ref_id,
        },
      })]).then((results) => {
      const servicePayments = results[0].map(item => item.toJSON());
      let serviceCalcList = results[1].map(item => item.toJSON());
      serviceCalcList = _.orderBy(serviceCalcList,
          ['effective_date'], ['desc']);

      Promise.all(servicePayments.map((paymentItem) => {
        const start_date = moment(paymentItem.start_date, moment.ISO_8601).
            valueOf();
        const end_date = moment(paymentItem.end_date, moment.ISO_8601).
            valueOf();
        const prevServiceCalc = serviceCalcList.find((calcItem) => {
          console.log({
            prev: calcItem,
          });
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
          console.log(JSON.stringify({
            current: serviceCalc,
          }));
          serviceCalc.push(prevServiceCalc);
          console.log(JSON.stringify({
            all: serviceCalc,
          }));
          serviceCalc = _.orderBy(serviceCalc,
              ['effective_date'], ['desc']);
        }

        let total_amount = 0;
        let total_days = 0;
        let total_units = 0;
        serviceCalc.forEach((calcItem, index) => {
          const nextIndex = index > 0 ? index - 1 : index;
          console.log(serviceCalc[nextIndex]);
          const effective_date = moment(calcItem.effective_date,
              moment.ISO_8601).valueOf();
          const next_effective_date = moment(
              serviceCalc[nextIndex].effective_date,
              moment.ISO_8601).valueOf();
          let absentDays = 0;
          let daysInMonth = 0;
          let daysInPeriod = 0;
          if (effective_date <= start_date &&
              start_date !== next_effective_date) {
            daysInMonth = moment().
                isoWeekdayCalc(moment(paymentItem.start_date, moment.ISO_8601),
                    moment(paymentItem.end_date, moment.ISO_8601).endOf('M'),
                    paymentItem.calendar_item.selected_days);
            daysInPeriod = moment().
                isoWeekdayCalc(moment(paymentItem.start_date, moment.ISO_8601),
                    moment(serviceCalc[nextIndex].effective_date,
                        moment.ISO_8601).subtract(1, 'd'),
                    paymentItem.calendar_item.selected_days);
            absentDays = paymentItem.absent_day_detail.filter(
                (absentDayItem) => {
                  const absent_date = moment(absentDayItem.absent_date,
                      moment.ISO_8601).valueOf();
                  return absent_date >= start_date && absent_date <=
                      next_effective_date;
                }).length;
          } else if (index === 0) {
            daysInMonth = moment().
                isoWeekdayCalc(moment(paymentItem.start_date, moment.ISO_8601),
                    moment(paymentItem.end_date, moment.ISO_8601).endOf('M'),
                    paymentItem.calendar_item.selected_days);
            daysInPeriod = moment().
                isoWeekdayCalc(moment(calcItem.effective_date, moment.ISO_8601),
                    moment(paymentItem.end_date,
                        moment.ISO_8601),
                    paymentItem.calendar_item.selected_days);

            absentDays = paymentItem.absent_day_detail.filter(
                (absentDayItem) => {
                  const absent_date = moment(absentDayItem.absent_date,
                      moment.ISO_8601).valueOf();
                  return absent_date >= effective_date && absent_date <=
                      next_effective_date;
                }).length;
          } else {
            daysInMonth = moment().
                isoWeekdayCalc(moment(paymentItem.start_date, moment.ISO_8601),
                    moment(paymentItem.end_date, moment.ISO_8601).endOf('M'),
                    paymentItem.calendar_item.selected_days);
            daysInPeriod = moment().
                isoWeekdayCalc(moment(calcItem.effective_date, moment.ISO_8601),
                    moment(serviceCalc[nextIndex].effective_date,
                        moment.ISO_8601).subtract(1, 'd'),
                    paymentItem.calendar_item.selected_days);

            absentDays = paymentItem.absent_day_detail.filter(
                (absentDayItem) => {
                  const absent_date = moment(absentDayItem.absent_date,
                      moment.ISO_8601).valueOf();
                  return absent_date >= effective_date && absent_date <=
                      next_effective_date;
                }).length;
          }
          console.log({daysInPeriod, absentDays, total_units, total_amount});
          daysInPeriod = daysInPeriod - absentDays;
          let unit_price = calcItem.unit_price;
          if (paymentItem.calendar_item.wages_type === 1) {
            unit_price = unit_price / daysInMonth;
          }
          console.log(unit_price);
          const current_total_amount = unit_price * daysInPeriod;
          if (calcItem.quantity) {
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
          total_amount,
          total_days,
          total_units,
          amount_paid: 0,
        }, {
          where: {
            id: paymentItem.id,
          },
        });
      }));
    });
  }
}