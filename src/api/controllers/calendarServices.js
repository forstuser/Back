/*jshint esversion: 6 */
'use strict';

import CalendarServiceAdaptor from '../Adaptors/calendarServices';
import shared, {monthlyPaymentCalc} from '../../helpers/shared';
import Promise from 'bluebird';
import moment from 'moment/moment';
import config from '../../config/main';

require('moment-weekday-calc');

let calendarServiceAdaptor;
let models;

class CalendarServiceController {

  constructor(modal) {
    calendarServiceAdaptor = new CalendarServiceAdaptor(modal);
    models = modal;
  }

  static retrieveCalendarServices(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => calendarServiceAdaptor.retrieveCalendarServices(
          {status_type: 1},
          request.language)).spread((items, unit_types) => reply({
        status: true,
        items,
        unit_types,
        default_ids: config.CATEGORIES.CALENDAR_ITEM,
      }).code(200)).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'An error occurred in retrieving calendar service list.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static createItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const productBody = {
        product_name: request.payload.product_name,
        user_id: user.id || user.ID,
        service_id: request.params.service_id,
        provider_name: request.payload.provider_name,
        wages_type: request.payload.wages_type || 0,
        selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
        updated_by: user.id || user.ID,
        status_type: 11,
      };

      const serviceCalculationBody = {
        effective_date: moment(request.payload.effective_date, moment.ISO_8601).
            startOf('days'),
        quantity: request.payload.quantity,
        unit_price: parseFloat(Number(request.payload.unit_price).toFixed(2)),
        unit_type: request.payload.unit_type,
        selected_days: request.payload.selected_days,
        updated_by: user.id || user.ID,
        status_type: 1,
      };

      const serviceAbsentDayArray = (request.payload.absent_dates || []).map(
          (item) => ({
            absent_date: moment(item, moment.ISO_8601).
                startOf('days'),
            updated_by: user.id || user.ID,
            status_type: 1,
          }));
      const effectiveDate = moment(request.payload.effective_date,
          moment.ISO_8601);
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
        selected_days = serviceCalculationBody ?
            serviceCalculationBody.selected_days ||
            selected_days :
            selected_days;
        servicePaymentArray = monthlyPaymentCalc({
          currentMth,
          effectiveMth,
          effectiveDate,
          selected_days,
          wages_type,
          serviceCalculationBody,
          user,
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
          selected_days = serviceCalculationBody ?
              serviceCalculationBody.selected_days ||
              selected_days :
              selected_days;
          servicePaymentArray.push(...monthlyPaymentCalc({
            currentMth,
            effectiveMth,
            effectiveDate,
            selected_days,
            wages_type,
            serviceCalculationBody,
            user,
            currentYear,
          }));
        });
      }

      return Promise.try(() => calendarServiceAdaptor.createCalendarItem({
        productBody,
        servicePaymentArray,
        serviceAbsentDayArray,
        serviceCalculationBody,
        user,
      })).spread((calendar_item) => reply({
        status: true,
        message: 'successful',
        calendar_item,
        forceUpdate: request.pre.forceUpdate,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in calendar item creation.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const productBody = {
        product_name: request.payload.product_name,
        provider_name: request.payload.provider_name,
        updated_by: user.id || user.ID,
        status_type: 11,
      };
      return Promise.try(
          () => calendarServiceAdaptor.updateCalendarItem(productBody,
              request.params.id)).then(() => reply({
        status: true,
        message: 'successful',
        forceUpdate: request.pre.forceUpdate,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in calendar item creation.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static markAbsent(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceAbsentDetail = {
        absent_date: moment(request.payload.absent_date, moment.ISO_8601).
            startOf('days'),
        payment_id: request.params.id,
        updated_by: user.id || user.ID,
        status_type: 1,
      };
      let payment_detail;
      return Promise.try(
          () => Promise.all([
            calendarServiceAdaptor.retrieveCurrentCalculationDetail({
              ref_id: request.params.ref_id, effective_date: {
                $lte: request.payload.absent_date,
              },
            }), calendarServiceAdaptor.markAbsentForItem(
                {where: serviceAbsentDetail})])).spread((calcResults) => {
        const currentCalcDetail = calcResults;

        return calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
          quantity: currentCalcDetail.quantity,
          end_date: request.payload.absent_date,
          unit_price: currentCalcDetail.unit_price,
          selected_days: currentCalcDetail.selected_days,
        }, true);
      }).then((payment_detail) => reply({
        status: true,
        message: 'successful',
        payment_detail,
        forceUpdate: request.pre.forceUpdate,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Unable to mark absent.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static markPaid(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const servicePaymentDetail = {
        paid_on: moment(request.payload.paid_on, moment.ISO_8601),
        amount_paid: request.payload.amount_paid,
        updated_by: user.id || user.ID,
        status_type: 5,
        ref_id: request.params.id,
      };
      return Promise.try(
          () => calendarServiceAdaptor.markPaymentPaid(request.params.id,
              servicePaymentDetail)).
          then((payment_detail) => reply({
            status: true,
            message: 'successful',
            payment_detail,
            forceUpdate: request.pre.forceUpdate,
          })).
          catch((err) => {
            console.log(
                `Error on ${new Date()} for user ${user.id ||
                user.ID} is as follow: \n \n ${err}`);
            return reply({
              status: false,
              message: 'Unable to mark paid.',
              forceUpdate: request.pre.forceUpdate,
              err,
            });
          });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static markPresent(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceAbsentDetail = {
        absent_date: moment(request.payload.present_date, moment.ISO_8601).
            startOf('days'),
        payment_id: request.params.id,
      };
      return Promise.try(
          () => Promise.all([
            calendarServiceAdaptor.retrieveCurrentCalculationDetail({
              ref_id: request.params.ref_id, effective_date: {
                $lte: request.payload.present_date,
              },
            }), calendarServiceAdaptor.markPresentForItem(
                {where: serviceAbsentDetail})])).spread((calcResults) => {
        const currentCalcDetail = calcResults;

        return calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
          quantity: currentCalcDetail.quantity,
          unit_price: currentCalcDetail.unit_price,
          end_date: request.payload.present_date,
          selected_days: currentCalcDetail.selected_days,
        }, true);
      }).then((payment_detail) => reply({
        status: true,
        message: 'successful',
        payment_detail,
        forceUpdate: request.pre.forceUpdate,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Unable to mark absent.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveCalendarItemList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => calendarServiceAdaptor.retrieveCalendarItemList({
        user_id: user.id ||
        user.ID,
      }, request.language)).then((items) => reply({
        status: true,
        message: 'successful',
        items,
        forceUpdate: request.pre.forceUpdate,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'An error occurred in retrieving calendar item list.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveCalendarItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => calendarServiceAdaptor.retrieveCalendarItemById(
          request.params.id,
          request.language)).then((result) => reply({
        status: true,
        message: 'successful',
        item: result,
        forceUpdate: request.pre.forceUpdate,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'An error occurred in retrieving calendar item list.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static addServiceCalc(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceCalculationBody = {
        effective_date: moment(request.payload.effective_date, moment.ISO_8601).
            startOf('days'),
        quantity: request.payload.quantity,
        unit_price: request.payload.unit_price,
        unit_type: request.payload.unit_type,
        selected_days: request.payload.selected_days,
        updated_by: user.id || user.ID,
        status_type: 1,
        ref_id: request.params.id,
      };
      return Promise.try(() => {
        return calendarServiceAdaptor.addServiceCalc({
          effective_date: moment(request.payload.effective_date,
              moment.ISO_8601).
              startOf('days'),
          ref_id: request.params.id,
        }, serviceCalculationBody);
      }).then((result) => {
        return [
          calendarServiceAdaptor.manipulatePaymentDetail({
            ref_id: request.params.id,
            effective_date: moment(request.payload.effective_date,
                moment.ISO_8601).
                startOf('days'),
          }), result.toJSON()];
      }).spread((manipulatedResult, calculation_detail) => {
        return reply({
          status: true,
          message: 'successful',
          calculation_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in adding effective calculation method for service.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static updateServiceCalc(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const serviceCalculationBody = {
        effective_date: moment(request.payload.effective_date, moment.ISO_8601).
            startOf('days'),
        quantity: request.payload.quantity,
        unit_price: request.payload.unit_price,
        unit_type: request.payload.unit_type,
        selected_days: request.payload.selected_days,
        updated_by: user.id || user.ID,
        status_type: 1,
        ref_id: request.params.id,
      };

      return Promise.try(() => {
        return calendarServiceAdaptor.addServiceCalc({
          id: request.params.calc_id,
          ref_id: request.params.id,
        }, serviceCalculationBody);
      }).then((result) => {
        return [
          calendarServiceAdaptor.manipulatePaymentDetail({
            id: request.params.calc_id,
            effective_date: moment(request.payload.effective_date,
                moment.ISO_8601).
                startOf('days'),
            ref_id: request.params.id,
          }), result];
      }).spread((manipulatedResult, calculation_detail) => {
        return reply({
          status: true,
          message: 'successful',
          calculation_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in adding effective calculation method for service.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static deleteCalendarItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => calendarServiceAdaptor.deleteCalendarItemById(
          request.params.id, user.id || user.ID)).then(() => {
        return reply({
          status: true,
          message: 'successful',
          forceUpdate: request.pre.forceUpdate,
        });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'An error occurred in adding effective calculation method for service.',
          forceUpdate: request.pre.forceUpdate,
          err,
        });
      });
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }
}

export default CalendarServiceController;
