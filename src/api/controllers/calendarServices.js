/*jshint esversion: 6 */
'use strict';

import CalendarServiceAdaptor from '../Adaptors/calendarServices';
import shared, {monthlyPaymentCalc} from '../../helpers/shared';
import moment from 'moment/moment';

require('moment-weekday-calc');

let calendarServiceAdaptor;
let models;

class CalendarServiceController {

  constructor(modal) {
    calendarServiceAdaptor = new CalendarServiceAdaptor(modal);
    models = modal;
  }

  static retrieveCalendarServices(request, reply) {
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return calendarServiceAdaptor.retrieveCalendarServices({status_type: 1},
          request.language).then((referenceData) => reply({
        status: true,
        items: referenceData.items,
        unit_types: referenceData.unit_types,
      }).code(200));
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
        unit_price: request.payload.unit_price,
        unit_type: request.payload.unit_type,
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
        servicePaymentArray = monthlyPaymentCalc({
          currentMth,
          effectiveMth,
          effectiveDate,
          productBody,
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
          servicePaymentArray.push(...monthlyPaymentCalc({
            currentMth,
            effectiveMth,
            effectiveDate,
            productBody,
            serviceCalculationBody,
            user,
            currentYear,
          }));
        });
      }

      return calendarServiceAdaptor.createCalendarItem({
        productBody,
        servicePaymentArray,
        serviceAbsentDayArray,
        serviceCalculationBody,
        user,
      }).
          then((result) => {
            return reply({
              status: true,
              message: 'successful',
              calendar_item: result[0],
              forceUpdate: request.pre.forceUpdate,
            });
          }).catch((err) => {
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
      const monthStartDate = moment(request.payload.absent_date,
          moment.ISO_8601).
          startOf('M').format();
      return calendarServiceAdaptor.retrieveCurrentCalculationDetail({
        ref_id: request.params.ref_id, effective_date: {
          $lte: request.payload.absent_date,
        },
      }).then((calcResults) => {
        const currentCalcDetail = calcResults;

        return Promise.all([
          calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
            quantity: currentCalcDetail.quantity,
            end_date: request.payload.absent_date,
            unit_price: currentCalcDetail.unit_price,
            absent_day: 1,
          }), calendarServiceAdaptor.markAbsentForItem(serviceAbsentDetail)]);
      }).then((result) => {
        return reply({
          status: true,
          message: 'successful',
          payment_detail: result[0],
          forceUpdate: request.pre.forceUpdate,
        });
      }).
          catch((err) => {
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
        absent_date: moment(request.payload.absent_date, moment.ISO_8601).
            startOf('days'),
        payment_id: request.params.id,
      };
      return calendarServiceAdaptor.retrieveCurrentCalculationDetail({
        ref_id: request.params.ref_id, effective_date: {
          $lte: request.payload.absent_date,
        },
      }).then((calcResults) => {
        const currentCalcDetail = calcResults;

        return Promise.all([
          calendarServiceAdaptor.updatePaymentDetail(request.params.id, {
            quantity: currentCalcDetail.quantity,
            unit_price: -(currentCalcDetail.unit_price),
            end_date: request.payload.absent_date,
            absent_day: -1,
          }), calendarServiceAdaptor.markPresentForItem(serviceAbsentDetail)]);
      }).then((result) => {
        return reply({
          status: true,
          message: 'successful',
          payment_detail: result[0],
          forceUpdate: request.pre.forceUpdate,
        });
      }).
          catch((err) => {
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
      return calendarServiceAdaptor.retrieveCalendarItemList({
        user_id: user.id ||
        user.ID,
      }, request.language).
          then((result) => {
            return reply({
              status: true,
              message: 'successful',
              items: result,
              forceUpdate: request.pre.forceUpdate,
            });
          }).
          catch((err) => {
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
      reply({
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
      return calendarServiceAdaptor.retrieveCalendarItemById(request.params.id,
          request.language).
          then((result) => {
            return reply({
              status: true,
              message: 'successful',
              item: result,
              forceUpdate: request.pre.forceUpdate,
            });
          }).
          catch((err) => {
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
      reply({
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
        updated_by: user.id || user.ID,
        status_type: 1,
        ref_id: request.params.id,
      };

      return calendarServiceAdaptor.addServiceCalc({
        effective_date: moment(request.payload.effective_date, moment.ISO_8601).
            startOf('days'),
        ref_id: request.params.id,
      }, serviceCalculationBody).
          then((result) => {
            if (result) {
              return calendarServiceAdaptor.manipulatePaymentDetail(
                  {
                    ref_id: request.params.id,
                    effective_date: moment(request.payload.effective_date,
                        moment.ISO_8601).
                        startOf('days'),
                  }, result.toJSON()).then(() => {
                return reply({
                  status: true,
                  message: 'successful',
                  product: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              });
            }
          }).
          catch((err) => {
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
        updated_by: user.id || user.ID,
        status_type: 1,
        ref_id: request.params.id,
      };

      return calendarServiceAdaptor.addServiceCalc({
        id: request.params.calc_id,
        ref_id: request.params.id,
      }, serviceCalculationBody).then((result) => {
            if (result) {
              return calendarServiceAdaptor.manipulatePaymentDetail(
                  {
                    id: request.params.calc_id,
                    effective_date: moment(request.payload.effective_date, moment.ISO_8601).
                        startOf('days'),
                    ref_id: request.params.id,
                  }, result.toJSON()).then(() => {
                return reply({
                  status: true,
                  message: 'successful',
                  product: result,
                  forceUpdate: request.pre.forceUpdate,
                });
              });
            }
          }).
          catch((err) => {
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

  static updateUserReview(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const id = request.params.id;
      if (request.params.reviewfor === 'brands') {
        return reply(
            calendarServiceAdaptor.updateBrandReview(user, id, request));
      } else if (request.params.reviewfor === 'sellers') {
        return reply(calendarServiceAdaptor.updateSellerReview(user, id,
            request.query.isonlineseller, request));
      } else {
        return reply(
            calendarServiceAdaptor.updateProductReview(user, id, request));
      }
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveProductDetail(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      return reply(calendarServiceAdaptor.prepareProductDetail({
        user,
        request,
      })).code(200);
    } else {
      return reply({
        status: false,
        message: 'Forbidden',
        forceUpdate: request.pre.forceUpdate,
      });
    }
  }

  static retrieveCenterProducts(request, reply) {
    const user = shared.verifyAuthorization(request.headers);
    if (!request.pre.userExist) {
      return reply({
        status: false,
        message: 'Unauthorized',
        forceUpdate: request.pre.forceUpdate,
      });
    } else if (request.pre.userExist && !request.pre.forceUpdate) {
      const brandId = (request.query.brandids || '[]').split('[')[1].split(
          ']')[0].split(',').filter(Boolean);
      const categoryId = (request.query.categoryids || '[]').split(
          '[')[1].split(']')[0].split(',').filter(Boolean);
      const options = {
        main_category_id: [2, 3],
        status_type: [5, 11],
        user_id: user.id || user.ID,
      };

      if (brandId.length > 0) {
        options.brand_id = brandId;
      }

      if (categoryId.length > 0) {
        options.category_id = categoryId;
      }

      return calendarServiceAdaptor.retrieveProducts(options).then((result) => {
        return reply({
          status: true,
          productList: result /* :productList.slice((pageNo * 10) - 10, 10) */,
          forceUpdate: request.pre.forceUpdate,
          /* ,
              nextPageUrl: productList.length > listIndex + 10 ?
               `categories/${masterCategoryId}/products?pageno=${parseInt(pageNo, 10) + 1}
               &ctype=${ctype}&categoryids=${categoryIds}&brandids=${brandIds}
               &offlinesellerids=${offlineSellerIds}&onlinesellerids=
               ${onlineSellerIds}&sortby=${sortBy}&searchvalue=${searchValue}` : '' */
        });
      }).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'Unable to fetch product list',
          forceUpdate: request.pre.forceUpdate,
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
