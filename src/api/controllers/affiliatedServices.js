/*jshint esversion: 6 */
'use strict';

// affiliate service controller
import Promise from 'bluebird';
import moment from 'moment';
import AffiliatedServicesAdaptor from '../Adaptors/affiliatedServices';
import UserAdaptor from '../Adaptors/user';
import shared from '../../helpers/shared';

let modals;
let affiliatedServicesAdaptor;
let userAdaptor;

export default class affiliatedServicesController {
  constructor(modal) {
    modals = modal;
    affiliatedServicesAdaptor = new AffiliatedServicesAdaptor(modals);
    userAdaptor = new UserAdaptor(modals);
  }

  static getCities(request, reply) {

    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      return affiliatedServicesAdaptor.getCities({
        where: {},
      }).then((cities) => reply({
        status: true,
        cities,
      })).catch((err) => {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);

        return reply({
          status: false,
          message: 'Unable to retrieve all cities data',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getAllCategory(request, reply) {

    const user = shared.verifyAuthorization(request.headers);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      // this is where make us of adapter
      return affiliatedServicesAdaptor.getAllCategory({
        city_id: request.params.id,
      }).then((categories) => reply({
        status: true,
        categories,
      })).catch((err) => {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        console.log(err);
        return reply({
          status: false,
          message: 'Unable to retrieve all cities data',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getServices(request, reply) {

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return affiliatedServicesAdaptor.getServices({
        city_id: request.params.id,
      }).then((services) => reply({
        status: true,
        services,
      }));
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getAllProviders(request, reply) {

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return affiliatedServicesAdaptor.getAllProviders(
          {city_id: request.params.id}).then((providers) => reply({
        status: true,
        providers,
      })).catch(console.log);
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static getChildServices(request, reply) {

    if (request.pre.userExist && !request.pre.forceUpdate) {
      return affiliatedServicesAdaptor.getChildServices({
        ref_id: request.params.id,
        category_ids: (request.query.category_ids || '').split(',').
            filter(item => !!item),
      }).then((childServices) => reply({
        status: true,
        childServices,
      })).catch((err) => {
        console.log(
            `Error on ${new Date()} for user ${user.id ||
            user.ID} is as follow: \n \n ${err}`);
        console.log(err);
        return reply({
          status: false,
          message: 'Unable to retrieve childServices data',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  // payload for booking
  // {
  //   "full_name": "User Name",
  //     "mobile": "9012345678",
  //     "email": "thor@odinson.com",
  //     "affiliated_service_bookings":[{
  //   "affiliated_service_id": 4,
  //   "appointment_date": "2016-02-12",
  //   "timeSlot": 3,
  //   "subject": "string",
  //   "coupon": "string"
  // }],
  //     "address": {
  //   "id": "Nullable Integer",
  //       "address_type": "Integer",
  //       "line_1": "string",
  //       "city": "string",
  //       "pin": "string"
  // }
  // }
  static createBooking(request, reply) {

    const user = shared.verifyAuthorization(request.headers);
    let address = request.payload.address;
    if (request.pre.userExist && !request.pre.forceUpdate) {
      return Promise.try(() => {
        const userCouponPromises = request.payload.affiliated_service_bookings.map(
            (affItem) => {
              if (!!affItem.coupon) {

                console.log('coupon is : ', affItem.coupon);
                //return S2S call from adaptor
                return affiliatedServicesAdaptor.validateCoupon({
                  couponCode: affItem.coupon,
                  service_id: affItem.affiliated_service_id,
                });
              }

              return '';
            });

        let userAddressPromise = userAdaptor.retrieveSingleUserAddress({
          where: {
            id: address.id,
          },
        });
        console.log(`The address is ${JSON.stringify(address)}`);
        if (!address.id) {

          userAddressPromise = userAdaptor.createUserAddress({
            address_type: address.address_type,
            address_line_1: address.line_1,
            address_line_2: address.line_2,
            city: address.city,
            pin: address.pin,
          });
        }

        return Promise.all(
            [userAddressPromise, Promise.all(userCouponPromises)]);
      }).spread((userAddress, userCoupons) => {
        const data = request.payload;
        console.log('is the error here');
        console.log(
            `the address id was not provided in the request, so using the saved ${JSON.stringify(
                userAddress)} id`);
        address = userAddress;
        const serviceToBook = {
          fullName: data.full_name,
          mobileNumber: data.mobile,
          locality: userAddress.address_line_2,
          streetAddress: userAddress.address_line_1,
          city: userAddress.city,
          zipcode: userAddress.pin,
          bookings: [],
        };
        data.affiliated_service_bookings.forEach((item, index) => {
          let couponValid = true;
          if (item.coupon) {
            couponValid = userCoupons[index].Valid;
          }

          if (couponValid) {
            serviceToBook.bookings.push(JSON.parse(JSON.stringify({
              serviceId: item.affiliated_service_id,
              appointmentDate: moment(item.appointment_date, moment.ISO_8601),
              timeSlot: item.timeSlot,
              subject: item.subject,
              couponCode: item.coupon,
            })));
          }
        });

        if (serviceToBook.bookings.length > 0) {
          return affiliatedServicesAdaptor.createBooking(serviceToBook);
        }

        return '';

      }).then((result) => {
        const orderDetails = request.payload.affiliated_service_bookings.map(
            (item, index) => {
              const caseDetail = result.CaseDetailList[index];
              return {
                user_id: user.id || user.ID,
                case_id: caseDetail.CaseId,
                service_id: item.service_mapping_id,
                product_id: request.payload.product_id,
                category_id: request.payload.category_id,
                address_id: address.id,
                updated_by: user.id,
                status_type: 1,
                created_by: user.id,
                case_details: caseDetail,
              };
            });
        return affiliatedServicesAdaptor.addOrder(orderDetails);
      }).then((result) => {
            return reply({
              status: true,
              result,
            });
            // now save the case Id's to the database table using the adapter
            // this will be the sample result
//             {
//               CaseIds : [12334,12346],
//             //Booked case Id which can be used to fetch case details Later
//               Message : "Cases booked successfully."
//             }
          },
      ).catch((err) => {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Unable to retrieve create booking',
        });
      });
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static cancelBooking(request, reply) {

    if (request.pre.userExist && !request.pre.forceUpdate) {
      const body = request.payload;
      return affiliatedServicesAdaptor.cancelBooking({
        caseId: body.caseId,
        reasonType: body.reasonType,
        reason: body.reason,
      }).then((result) => reply({
        status: result,
      }));
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

  static rescheduleBooking(request, reply) {

    if (request.pre.userExist && !request.pre.forceUpdate) {
      const body = request.payload;
      return affiliatedServicesAdaptor.rescheduleBooking({
        caseId: body.caseId,
        date: body.date,
        timeSlot: body.timeSlot,
      }).then((result) => reply(result));
    } else {
      return shared.preValidation(request.pre, reply);
    }
  }

// use this function template below to write controllers
  // static cancelBooking(request, reply) {
  //
  //   const user = shared.verifyAuthorization(request.headers);
  //   if (request.pre.userExist && !request.pre.forceUpdate) {
  //
  //   } else {
  //     return shared.preValidation(request.pre, reply);
  //   }
  // }
  static getProductServices(request, reply) {

    const user = shared.verifyAuthorization(request.headers);
    console.log(`the request.header is ${request.headers}`);
    if (request.pre.userExist && !request.pre.forceUpdate) {
      console.log(`the user id is  || ${user}`);
      return affiliatedServicesAdaptor.getProductServices({
        user_id: (user.id || user.ID),
        ref_id: request.params.id,
      }).then((products) => reply({
        status: true,
        products,

      })).catch((err) => {
        console.log(`Error on ${new Date()} for user ${user.id ||
        user.ID} is as follow: \n \n ${err}`);
        return reply({
          status: false,
          message: 'Unable to retrieve Product Services data.',
        });
      });

    }

    else {
      return shared.preValidation(request.pre, reply);
    }

  }
}

