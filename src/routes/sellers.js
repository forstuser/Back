/*jshint esversion: 6 */
'use strict';

import controller from '../api/controllers/sellers';
import joi from 'joi';

/**
 * Seller Routes
 * @param modal
 * @param route
 * @param middleware
 */
export function prepareSellerRoutes(modal, route, middleware) {

  const varController = new controller(modal);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/mysellers',
      handler: controller.getMySellers,
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers',
      handler: controller.getSellers,
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{id}',
      handler: controller.getSellerById,
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
      },
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.unLinkSellerWithUser,
        description: 'UnLink Seller with User.',
      },
    });
    route.push({
      method: 'PUT',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.linkSellerWithUser,
        description: 'Link Seller with User.',
      },
    });

    route.push({
      method: 'POST',
      path: '/sellers/invite',
      config: {
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
          {
            method: middleware.updateUserActiveStatus,
            assign: 'userExist',
          },
        ],
        handler: controller.addInviteSeller,
        description: 'Add Seller to database and invite him on be half of User.',
        validate: {
          payload: {
            seller_name: [joi.string(), joi.allow(null)],
            contact_no: joi.string().required(),
            email: [joi.string(), joi.allow(null)],
            address: [joi.string(), joi.allow(null)],
            city_id: [joi.number(), joi.allow(null)],
            state_id: [joi.number(), joi.allow(null)],
            locality_id: [joi.number(), joi.allow(null)],
            gstin: [joi.string(), joi.allow(null)],
            pan_no: [joi.string(), joi.allow(null)],
            reg_no: [joi.string(), joi.allow(null)],
            longitude: [joi.string(), joi.allow(null)],
            latitude: [joi.string(), joi.allow(null)],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/sellers/init',
      config: {
        auth: 'jwt', pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ], handler: controller.initializeSeller,
        description: 'Initialize Seller Details by GSTIN or PAN.',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            email: joi.string(),
            gstin: joi.string(),
            pan: joi.string(),
            output: 'data',
            parse: true,
          },
        }, plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/sellers/link',
      config: {
        auth: 'jwt', pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ], handler: controller.createLinkSeller,
        description: 'Create Seller Details by GSTIN or PAN and link it with user identity.',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            gstin: [joi.string(), joi.allow(null)],
            pan: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        }, plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/link',
      config: {
        auth: 'jwt', pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ], handler: controller.updateLinkSeller,
        description: 'Update Seller Details by GSTIN or PAN and link it with user identity',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            gstin: [joi.string(), joi.allow(null)],
            pan: [joi.string(), joi.allow(null)],
            id: joi.number().required(),
            output: 'data',
            parse: true,
          },
        }, plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/reference',
      handler: controller.retrieveReferenceData,
      config: {
        auth: 'jwt',
        pre: [
          {
            method: middleware.checkAppVersion,
            assign: 'forceUpdate',
          },
        ],
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/basic',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerBasicDetail,
        description: 'Update Seller Details by GSTIN or PAN and link it with user identity',
        tags: ['api', 'Seller', 'Provider', 'Types'],
        validate: {
          payload: {
            seller_name: [joi.string(), joi.allow(null)],
            business_name: [joi.string(), joi.allow(null)],
            address: [joi.string(), joi.allow(null)],
            pincode: [joi.string(), joi.allow(null)],
            locality_id: [joi.number(), joi.allow(null)],
            city_id: [joi.number(), joi.allow(null)],
            state_id: [joi.number(), joi.allow(null)],
            category_id: [joi.number(), joi.allow(null)],
            shop_open_day: [joi.string(), joi.allow(null)],
            shop_open_timings: [joi.string(), joi.allow(null)],
            start_time: [joi.string(), joi.allow(null)],
            close_time: [joi.string(), joi.allow(null)],
            home_delivery: [joi.boolean(), joi.allow(null)],
            home_delivery_remarks: [joi.string(), joi.allow(null)],
            payment_modes: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/providers',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerProviderTypes,
        description: 'Update Seller Details provider type details',
        tags: ['api', 'Seller', 'provider type', 'Details'],
        validate: {
          payload: {
            provider_type_detail: [
              joi.array().items(joi.object().keys({
                provider_type_id: joi.number().required(),
                sub_category_id: joi.number().required(),
                category_4_id: [joi.number(), joi.allow(null)],
                brand_ids: [joi.array().items(joi.number()), joi.allow(null)],
              })).required()],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/sellers/{id}/assisted',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateAssistedServiceUsers,
        description: 'Add Seller assisted service user details',
        tags: ['api', 'Seller', 'Assisted Service User', 'Details'],
        validate: {
          payload: {
            id: [joi.number(), joi.allow(null)],
            mobile_no: joi.string().required(),
            name: [joi.string(), joi.allow(null)],
            document_details: [joi.array(), joi.allow(null)],
            profile_image_detail: [joi.object(), joi.allow(null)],
            service_type_detail: [
              joi.array().items(joi.object().keys({
                id: [joi.number(), joi.allow(null)],
                service_type_id: joi.number().required(),
                price: [
                  joi.object().keys({
                    price_type: joi.number().required(),
                    value: joi.number().required(),
                  }), joi.allow(null)],
              })), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'POST',
      path: '/sellers/{seller_id}/assisted/{id}/types',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateAssistedServiceTypes,
        description: 'Add Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        validate: {
          payload: {
            id: [joi.number(), joi.allow(null)],
            service_type_id: joi.number().required(),
            price: [
              joi.object().keys({
                price_type: joi.number().required(),
                value: joi.number().required(),
              }), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/assisted/{service_user_id}/types/{id}',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.deleteAssistedServiceTypes,
        description: 'Delete Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/offers',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerOffers,
        description: 'Update Seller Offers',
        tags: ['api', 'Seller', 'Offer', 'Details'],
        validate: {
          payload: {
            id: [joi.number(), joi.allow(null)],
            title: joi.string().required(),
            description: [joi.string(), joi.allow(null)],
            document_details: [joi.array(), joi.allow(null)],
            start_date: joi.string().required(),
            end_date: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/offers/{id}/publish',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.publishSellerOffersToUsers,
        description: 'Publish Seller Offers to Users',
        tags: ['api', 'Publish', 'Seller', 'Offers', 'Users'],
        validate: {
          payload: {
            user_ids: joi.array().items(joi.number()).required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/brands',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.getBrandsForSeller,
        description: 'Retrieve Seller Brands',
        tags: ['api', 'Seller', 'Brands'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/assisted',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.getAssistedServicesForSeller,
        description: 'Get Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/offers',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerOffers,
        description: 'Get Seller offers',
        tags: ['api', 'Seller', 'Offer', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/credits',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerCredits,
        description: 'Get Seller Credits',
        tags: ['api', 'Seller', 'Credit', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/credits',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerCredits,
        description: 'Update Seller Credits',
        tags: ['api', 'Seller', 'Credit', 'Details'],
        validate: {
          payload: {
            id: [joi.number(), joi.allow(null)],
            description: [joi.string(), joi.allow(null)],
            amount: joi.number().required(),
            transaction_type: joi.number().required(),
            consumer_id: joi.number().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/points',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerLoyaltyPoints,
        description: 'Get Seller Points',
        tags: ['api', 'Seller', 'Point', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/points',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerPoints,
        description: 'Update Seller Points',
        tags: ['api', 'Seller', 'Point', 'Details'],
        validate: {
          payload: {
            id: [joi.number(), joi.allow(null)],
            description: [joi.string(), joi.allow(null)],
            amount: joi.number().required(),
            transaction_type: joi.number().required(),
            consumer_id: joi.number().required(),
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerConsumers,
        description: 'Get Seller users',
        tags: ['api', 'Seller', 'user', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerConsumerDetails,
        description: 'Get Seller customer details',
        tags: ['api', 'Seller', 'customer', 'details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}/credits',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerConsumerCredits,
        description: 'Get Seller customer credits',
        tags: ['api', 'Seller', 'customer', 'credits'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/seller/{seller_id}/users/{customer_id}/credits/{credit_id}/jobs/{job_id}',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerConsumerCredits,
        description: 'Linking Seller customer credits with jobs',
        tags: ['api', 'Seller', 'customer', 'credits'],
        validate: {
          payload: {
            description: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/seller/{seller_id}/users/{customer_id}/points/{point_id}/jobs/{job_id}',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.updateSellerConsumerPoints,
        description: 'Linking Seller customer loyalty points with jobs',
        tags: ['api', 'Seller', 'customer', 'loyalty points'],
        validate: {
          payload: {
            description: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}/points',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveSellerConsumerPoints,
        description: 'Get Seller customer loyalty points',
        tags: ['api', 'Seller', 'customer', 'Loyalty Points'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/users/{customer_id}',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.linkCustomers,
        description: 'Link Consumer with Seller',
        tags: ['api', 'Seller', 'Consumer'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/users',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.inviteCustomers,
        description: 'Invite Consumer with Seller',
        tags: ['api', 'Seller', 'Consumer'],
        validate: {
          payload: {
            mobile_no: joi.string().required(),
            full_name: [joi.string(), joi.allow(null)],
            email: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/assisted/{id}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: controller.deleteAssistedServiceUsers,
      },
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/assisted/{id}/reviews',
      config: {
        handler: controller.updateAssistedUserReview,
        auth: 'jwt',
        pre: [
          {method: middleware.checkAppVersion, assign: 'forceUpdate'},
        ],
        description: 'Update Assisted User Reviews.',
        validate: {
          payload: {
            ratings: [joi.number(), joi.allow(null)],
            feedback: [joi.string(), joi.allow(null)],
            comments: [joi.string(), joi.allow(null)],
            output: 'data',
            parse: true,
          },
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 204, message: 'No Content'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/offers/{id}',
      config: {
        auth: 'jwt',
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        handler: controller.deleteOffer,
      },
    });

    route.push({
      method: 'GET',
      path: '/sellers/categories',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.getCategoriesForSeller,
        description: 'Retrieve Seller Categories',
        tags: ['api', 'Seller', 'Categories'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/states/{state_id}/cities',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveCities,
        description: 'Retrieve Cities',
        tags: ['api', 'Seller', 'Cities'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });

    route.push({
      method: 'GET',
      path: '/states/{state_id}/cities/{city_id}/localities',
      config: {
        pre: [{method: middleware.checkAppVersion, assign: 'forceUpdate'}],
        auth: 'jwt', handler: controller.retrieveLocalities,
        description: 'Retrieve Localities',
        tags: ['api', 'Seller', 'Localities'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [
              {code: 200, message: 'Authenticated'},
              {code: 400, message: 'Bad Request'},
              {code: 401, message: 'Invalid Credentials'},
              {code: 404, message: 'Not Found'},
              {code: 500, message: 'Internal Server Error'},
            ],
          },
        },
      },
    });
  }
}