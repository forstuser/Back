/*jshint esversion: 6 */
'use strict';

import CalendarServiceAdaptor from '../Adaptors/calendarServices';
import shared, {monthlyPaymentCalc} from '../../helpers/shared';
import Promise from 'bluebird';
import moment from 'moment/moment';
import config from '../../config/main';

require('moment-weekday-calc');

let calendarServiceAdaptor;
let modals;

export default class CalendarServiceController {

  constructor(modal) {
    calendarServiceAdaptor = new CalendarServiceAdaptor(modal);
    modals = modal;
  }

  static async retrieveCalendarServices(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const [items, unit_types] = await calendarServiceAdaptor.retrieveCalendarServices(
            {status_type: 1}, request.language);
        return reply.response({
          status: true,
          items,
          unit_types,
          default_ids: config.CATEGORIES.CALENDAR_ITEM,
        }).code(200);
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'An error occurred in retrieving calendar service list.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async createItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const productBody = {
          product_name: request.payload.product_name,
          user_id: user.id || user.ID,
          service_id: request.params.service_id,
          provider_name: request.payload.provider_name,
          provider_number: request.payload.provider_number,
          wages_type: request.payload.wages_type || 0,
          selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
          updated_by: user.id || user.ID,
          status_type: 11,
        };
        request.payload.quantity = request.payload.quantity ?
            parseFloat((request.payload.quantity).toFixed(2)) :
            request.payload.quantity;
        request.payload.unit_price = parseFloat(
            (request.payload.unit_price).toFixed(2));
        const serviceCalculationBody = {
          effective_date: moment(request.payload.effective_date,
              moment.ISO_8601).
              startOf('days'),
          quantity: request.payload.quantity,
          unit_price: request.payload.unit_price,
          unit_type: request.payload.unit_type,
          selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
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
        let servicePaymentArray = [];
        const currentMth = moment().month();
        const effectiveMth = effectiveDate.month();

        let {selected_days, wages_type} = productBody;
        selected_days = serviceCalculationBody ?
            serviceCalculationBody.selected_days ||
            selected_days :
            selected_days;
        servicePaymentArray = monthlyPaymentCalc({
          currentMth, effectiveMth, effectiveDate, selected_days,
          wages_type, serviceCalculationBody, user, currentYear,
        });
        const calendar_item = await calendarServiceAdaptor.createCalendarItem({
          productBody,
          servicePaymentArray,
          serviceAbsentDayArray,
          serviceCalculationBody,
          user,
        });
        return reply.response({
          status: true,
          message: 'successful',
          calendar_item,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'An error occurred in calendar item creation.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const productBody = {
          product_name: request.payload.product_name,
          provider_name: request.payload.provider_name,
          provider_number: request.payload.provider_number,
          updated_by: user.id || user.ID,
          status_type: 11,
        };
        await calendarServiceAdaptor.updateCalendarItem(productBody,
            request.params.id);
        return reply.response({
          status: true,
          message: 'successful',
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'An error occurred in calendar item creation.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async markAbsent(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const serviceAbsentDetail = {
          absent_date: moment(request.payload.absent_date, moment.ISO_8601).
              startOf('days'),
          payment_id: request.params.id,
          updated_by: user.id || user.ID,
          status_type: 1,
        };
        const [calcResults, absentDetail] = await Promise.all([
          calendarServiceAdaptor.retrieveCurrentCalculationDetail({
            ref_id: request.params.ref_id, effective_date: {
              $lte: request.payload.absent_date,
            },
          }), calendarServiceAdaptor.markAbsentForItem(
              {where: serviceAbsentDetail})]);
        const currentCalcDetail = calcResults;

        const payment_detail = await  calendarServiceAdaptor.updatePaymentDetail(
            request.params.id,
            {
              quantity: currentCalcDetail.quantity,
              end_date: request.payload.absent_date,
              unit_price: currentCalcDetail.unit_price,
              selected_days: currentCalcDetail.selected_days,
            }, true);
        return reply.response({
          status: true,
          message: 'successful',
          payment_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to mark absent.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async markPaid(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const servicePaymentDetail = {
          paid_on: moment(request.payload.paid_on, moment.ISO_8601),
          amount_paid: request.payload.amount_paid,
          updated_by: user.id || user.ID,
          status_type: 5,
          ref_id: request.params.id,
        };
        const payment_detail = await calendarServiceAdaptor.markPaymentPaid(
            request.params.id,
            servicePaymentDetail);
        return reply.response({
          status: true,
          message: 'successful',
          payment_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to mark paid.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async markPresent(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const serviceAbsentDetail = {
          absent_date: moment(request.payload.present_date, moment.ISO_8601).
              startOf('days'),
          payment_id: request.params.id,
        };
        const [calcResults, presentDetail] = await Promise.all([
          calendarServiceAdaptor.retrieveCurrentCalculationDetail({
            ref_id: request.params.ref_id, effective_date: {
              $lte: request.payload.present_date,
            },
          }), calendarServiceAdaptor.markPresentForItem(
              {where: serviceAbsentDetail})]);
        const currentCalcDetail = calcResults;

        const payment_detail = await calendarServiceAdaptor.updatePaymentDetail(
            request.params.id,
            {
              quantity: currentCalcDetail.quantity,
              unit_price: currentCalcDetail.unit_price,
              end_date: request.payload.present_date,
              selected_days: currentCalcDetail.selected_days,
            }, true);
        return reply.response({
          status: true,
          message: 'successful',
          payment_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to mark present.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveCalendarItemList(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    console.log({user_exist: request.pre.userExist});
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const items = await calendarServiceAdaptor.retrieveCalendarItemList({
          user_id: user.id ||
          user.ID,
        }, request.language, request.query.limit, request.query.offset);
        return reply.response({
          status: true,
          message: 'successful',
          items,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'An error occurred in retrieving calendar item list.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async retrieveCalendarItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const result = await calendarServiceAdaptor.retrieveCalendarItemById(
            request.params.id,
            request.language);
        return reply.response({
          status: true,
          message: 'successful',
          item: result,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to retrieve calendar item.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async addServiceCalc(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        request.payload.quantity = request.payload.quantity ?
            parseFloat((request.payload.quantity).toFixed(2)) :
            request.payload.quantity;
        const serviceCalculationBody = {
          effective_date: moment(request.payload.effective_date,
              moment.ISO_8601).
              startOf('days'),
          quantity: request.payload.quantity,
          unit_price: parseFloat((request.payload.unit_price).toFixed(2)),
          unit_type: request.payload.unit_type,
          selected_days: request.payload.selected_days || [1, 2, 3, 4, 5, 6, 7],
          updated_by: user.id || user.ID,
          status_type: 1,
          ref_id: request.params.id,
        };
        const result = await calendarServiceAdaptor.addServiceCalc({
          effective_date: moment(request.payload.effective_date,
              moment.ISO_8601).
              startOf('days'),
          ref_id: request.params.id,
        }, serviceCalculationBody);
        const calculation_detail = result.toJSON();
        let manipulatedResult = [];
        if (moment(request.payload.effective_date,
            moment.ISO_8601).isSameOrBefore(moment())) {
          manipulatedResult = await calendarServiceAdaptor.manipulatePaymentDetail(
              {
                ref_id: request.params.id,
                effective_date: moment(request.payload.effective_date,
                    moment.ISO_8601).
                    startOf('days'),
              });
        }

        return reply.response({
          status: true,
          message: 'successful',
          calculation_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'An error occurred in adding effective calculation method for service.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async updateServiceCalc(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        const serviceCalculationBody = {
          effective_date: moment(request.payload.effective_date,
              moment.ISO_8601).
              startOf('days'),
          quantity: request.payload.quantity,
          unit_price: request.payload.unit_price,
          unit_type: request.payload.unit_type,
          selected_days: request.payload.selected_days,
          updated_by: user.id || user.ID,
          status_type: 1,
          ref_id: request.params.id,
        };

        const calculation_detail = await calendarServiceAdaptor.addServiceCalc({
          id: request.params.calc_id,
          ref_id: request.params.id,
        }, serviceCalculationBody);
        const manipulatedResult = await calendarServiceAdaptor.manipulatePaymentDetail(
            {
              id: request.params.calc_id,
              effective_date: moment(request.payload.effective_date,
                  moment.ISO_8601).
                  startOf('days'),
              ref_id: request.params.id,
            });
        return reply.response({
          status: true,
          message: 'successful',
          calculation_detail,
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      console.log(err);
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'An error occurred while updating effective calculation method for service.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async deleteCalendarItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {
        await calendarServiceAdaptor.deleteCalendarItemById(
            request.params.id, user.id || user.ID);
        return reply.response({
          status: true,
          message: 'successful',
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to delete calendar item.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }

  static async finishCalendarItem(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    try {
      if (request.pre.userExist === 0) {
        return reply.response({
          status: false,
          message: 'Inactive User',
          forceUpdate: request.pre.forceUpdate,
        }).code(402);
      } else if (!request.pre.userExist) {
        return reply.response({
          status: false,
          message: 'Unauthorized',
          forceUpdate: request.pre.forceUpdate,
        }).code(401);
      } else if (request.pre.userExist && !request.pre.forceUpdate) {

        const productBody = {
          end_date: request.payload.end_date,
        };

        await calendarServiceAdaptor.updateCalendarItem(productBody,
            request.params.id);
        return reply.response({
          status: true,
          message: 'successful',
          forceUpdate: request.pre.forceUpdate,
        });
      } else {
        return reply.response({
          status: false,
          message: 'Forbidden',
          forceUpdate: request.pre.forceUpdate,
        });
      }
    } catch (err) {
      modals.logs.create({
        api_action: request.method,
        api_path: request.url.pathname,
        log_type: 2,
        user_id: user ? user.id || user.ID : undefined,
        log_content: JSON.stringify({
          params: request.params,
          query: request.query,
          headers: request.headers,
          payload: request.payload,
          err,
        }),
      }).catch((ex) => console.log('error while logging on db,', ex));
      return reply.response({
        status: false,
        message: 'Unable to finish calendar item.',
        forceUpdate: request.pre.forceUpdate,
        err,
      });
    }
  }
}
