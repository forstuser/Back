/*jshint esversion: 6 */
'use strict';

import joi from 'joi';

//affiliate service route
export function prepareAffiliatedServiceRoute(
    varController, controller, route, appVersionHelper) {

  if (varController) {

    route.push({
      method: 'GET',
      path: '/cities',
      config: {
        auth: 'jwt',
        pre: [
          {method: appVersionHelper.checkAppVersion, assign: 'forceUpdate'},
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getCities,
      },
    });

    route.push({
      method: 'GET',
      path: '/cities/{id}/services',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getServices,
      },
    });

    route.push({
      method: 'GET',
      path: '/cities/{id}/categories',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getAllCategory,
      },
    });

    route.push({
      method: 'GET',
      path: '/cities/{id}/providers',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getAllProviders,
      },

    });

    route.push({
      method: 'GET',
      path: '/childservices/{id}',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getChildServices,
      },

    });

    //make a post call to make a booking at mr right
    route.push({
      method: 'POST',
      path: '/create_booking',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.createBooking,
        validate: {
          payload: {
            'full_name': joi.string().required(),
            'mobile': joi.string().required(),
            'email': joi.string().email(),
            'affiliated_service_bookings': joi.array().items(joi.object().keys({
              'service_mapping_id': [joi.string(), joi.allow(null)],
              'affiliated_service_id': joi.number().required(),
              'appointment_date': joi.string().required(),
              'timeSlot': joi.number().required().min(0).max(3),
              'coupon': [joi.string(), joi.allow(null)],
              'subject': joi.string().allow(null),
            })),
            'address': joi.object().keys({
              'id': joi.number().allow(null),
              'address_type': joi.number().required(),
              'line_1': joi.string().required(),
              'line_2': joi.string().required(),
              'city': joi.string().required(),
              'pin': joi.string().required(),
            }),
          },
        },
      },
    });

    // table for reason types for cancellation
    // Code ReasonTypes
    // 1    Over Priced
    // 2    PRO did not show up
    // 3    Called local PRO
    // 4    Unsatisfied with PRO
    // 5    Service not required
    // 6    Other
    // 7    Service not available

    route.push({
      method: 'POST',
      path: '/booking/cancel',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.cancelBooking,
        validate: {
          payload: {
            'caseId': joi.number().required(),
            'reasonType': joi.number().min(1).max(7),
            'reason': joi.string().allow(null),
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/booking/reschedule',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.rescheduleBooking,
        validate: {
          payload: {
            'caseId': joi.number().required(),
            'date': joi.string().required(),
            'timeSlot': joi.number().required().min(0).max(3),
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/services/{id}/products',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getProductServices,
      },

    });

    route.push({
      method: 'GET',
      path: '/orders',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: appVersionHelper.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: appVersionHelper.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.getOrdersList,
      },
    });

  }
}