/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareSellerRoutes = prepareSellerRoutes;

var _sellers = require('../api/controllers/sellers');

var _sellers2 = _interopRequireDefault(_sellers);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Seller Routes
 * @param modal
 * @param route
 * @param middleware
 * @param socket
 */
function prepareSellerRoutes(modal, route, middleware, socket) {

  const varController = new _sellers2.default(modal, socket);

  if (varController) {

    route.push({
      method: 'GET',
      path: '/mysellers',
      handler: _sellers2.default.getMySellers,
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }]
      }
    });

    route.push({
      method: 'GET', path: '/sellers/cashbacks',
      handler: _sellers2.default.getCashBackSellers, config: {
        auth: 'jwt', pre: [{
          method: middleware.checkAppVersion, assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus, assign: 'userExist'
        }]
      }
    });

    route.push({
      method: 'GET', path: '/sellers/offers',
      handler: _sellers2.default.getOfferSellers, config: {
        auth: 'jwt', pre: [{
          method: middleware.checkAppVersion, assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus, assign: 'userExist'
        }]
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers',
      handler: _sellers2.default.getSellers,
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }]
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{id}',
      handler: _sellers2.default.getSellerById,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.updateUserActiveStatus, assign: 'userExist' }]
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{id}/home/delivery/status',
      handler: _sellers2.default.getSellerHomeDeliveryStatus,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.updateUserActiveStatus, assign: 'userExist' }]
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{id}/details',
      handler: _sellers2.default.getSellerDetails,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }]
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{id}/categories',
      handler: _sellers2.default.getSellerCategories,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }]
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/rush/{flag}',
      handler: _sellers2.default.updateSellerRushHours,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }]
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/online/{flag}',
      handler: _sellers2.default.updateSellerPayOnline,
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }]
      }
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.unLinkSellerWithUser,
        description: 'UnLink Seller with User.'
      }
    });
    route.push({
      method: 'PUT',
      path: '/sellers/{id}/link',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.linkSellerWithUser,
        description: 'Link Seller with User.'
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/invite',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.addInviteSeller,
        description: 'Add Seller to database and invite him on be half of User.',
        validate: {
          payload: {
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            contact_no: _joi2.default.string().required(),
            email: [_joi2.default.string(), _joi2.default.allow(null)],
            address: [_joi2.default.string(), _joi2.default.allow(null)],
            city_id: [_joi2.default.number(), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)],
            locality_id: [_joi2.default.number(), _joi2.default.allow(null)],
            gstin: [_joi2.default.string(), _joi2.default.allow(null)],
            pan_no: [_joi2.default.string(), _joi2.default.allow(null)],
            reg_no: [_joi2.default.string(), _joi2.default.allow(null)],
            longitude: [_joi2.default.string(), _joi2.default.allow(null)],
            latitude: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/invite/details',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _sellers2.default.addInviteSellerByName,
        description: 'Add Seller to database so we can invite him on behalf of user.',
        validate: {
          payload: {
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            contact_no: _joi2.default.string().required(),
            email: [_joi2.default.string(), _joi2.default.allow(null)],
            address: [_joi2.default.string(), _joi2.default.allow(null)],
            city_id: [_joi2.default.number(), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)],
            locality_id: [_joi2.default.number(), _joi2.default.allow(null)],
            longitude: [_joi2.default.string(), _joi2.default.allow(null)],
            latitude: [_joi2.default.string(), _joi2.default.allow(null)]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/init',
      config: {
        auth: 'jwt', pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }], handler: _sellers2.default.initializeSeller,
        description: 'Initialize Seller Details by GSTIN or PAN.',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            email: _joi2.default.string(),
            gstin: _joi2.default.string(),
            pan: _joi2.default.string(),
            is_assisted: [_joi2.default.boolean(), _joi2.default.allow(null)],
            is_fmcg: [_joi2.default.boolean(), _joi2.default.allow(null)],
            has_pos: [_joi2.default.boolean(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        }, plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/link',
      config: {
        auth: 'jwt', pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }], handler: _sellers2.default.createLinkSeller,
        description: 'Create Seller Details by GSTIN or PAN and link it with user identity.',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            gstin: [_joi2.default.string(), _joi2.default.allow(null)],
            pan: [_joi2.default.string(), _joi2.default.allow(null)],
            is_assisted: [_joi2.default.boolean(), _joi2.default.allow(null)],
            is_fmcg: [_joi2.default.boolean(), _joi2.default.allow(null)],
            has_pos: [_joi2.default.boolean(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        }, plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/link',
      config: {
        auth: 'jwt', pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }], handler: _sellers2.default.updateLinkSeller,
        description: 'Update Seller Details by GSTIN or PAN and link it with user identity',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            gstin: [_joi2.default.string(), _joi2.default.allow(null)],
            pan: [_joi2.default.string(), _joi2.default.allow(null)],
            is_assisted: [_joi2.default.boolean(), _joi2.default.allow(null)],
            is_fmcg: [_joi2.default.boolean(), _joi2.default.allow(null)],
            has_pos: [_joi2.default.boolean(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            id: _joi2.default.number().required(),
            output: 'data',
            parse: true
          }
        }, plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/reference',
      handler: _sellers2.default.retrieveReferenceData,
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }]
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/basic',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerBasicDetail,
        description: 'Update Seller Details by GSTIN or PAN and link it with user identity',
        tags: ['api', 'Seller', 'Provider', 'Types'],
        validate: {
          payload: {
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            business_name: [_joi2.default.string(), _joi2.default.allow(null)],
            address: [_joi2.default.string(), _joi2.default.allow(null)],
            pincode: [_joi2.default.string(), _joi2.default.allow(null)],
            locality_id: [_joi2.default.number(), _joi2.default.allow(null)],
            city_id: [_joi2.default.number(), _joi2.default.allow(null)],
            state_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            shop_open_day: [_joi2.default.string(), _joi2.default.allow(null)],
            shop_open_timings: [_joi2.default.string(), _joi2.default.allow(null)],
            start_time: [_joi2.default.string(), _joi2.default.allow(null)],
            close_time: [_joi2.default.string(), _joi2.default.allow(null)],
            home_delivery: [_joi2.default.boolean(), _joi2.default.allow(null)],
            home_delivery_remarks: [_joi2.default.string(), _joi2.default.allow(null)],
            pay_online: [_joi2.default.boolean(), _joi2.default.allow(null)],
            payment_modes: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/providers',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerProviderTypes,
        description: 'Update Seller Details provider type details',
        tags: ['api', 'Seller', 'provider type', 'Details'],
        validate: {
          payload: {
            provider_type_detail: [_joi2.default.array().items(_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              provider_type_id: _joi2.default.number().required(),
              sub_category_id: _joi2.default.number().required(),
              category_brands: [_joi2.default.array().items(_joi2.default.object()), _joi2.default.allow(null)],
              category_4_id: [_joi2.default.array(), _joi2.default.allow(null)],
              brand_ids: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
            })).required()],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/providers/brands',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerProviderTypeBrands,
        description: 'Update Seller Details provider type brands',
        tags: ['api', 'Seller', 'provider type', 'Details'],
        validate: {
          payload: {
            provider_type_detail: [_joi2.default.array().items(_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              provider_type_id: [_joi2.default.number(), _joi2.default.allow(null)],
              sub_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
              category_brands: [_joi2.default.array().items(_joi2.default.object()), _joi2.default.allow(null)],
              category_4_id: [_joi2.default.number(), _joi2.default.allow(null)],
              brand_ids: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)]
            })).required()],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/{id}/assisted',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateAssistedServiceUsers,
        description: 'Add Seller assisted service user details',
        tags: ['api', 'Seller', 'Assisted Service User', 'Details'],
        validate: {
          payload: {
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            mobile_no: _joi2.default.string().required(),
            name: [_joi2.default.string(), _joi2.default.allow(null)],
            document_details: [_joi2.default.array(), _joi2.default.allow(null)],
            profile_image_detail: [_joi2.default.object(), _joi2.default.allow(null)],
            service_type_detail: [_joi2.default.array().items(_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              service_type_id: _joi2.default.number().required(),
              price: [_joi2.default.array().items(_joi2.default.object().keys({
                price_type: _joi2.default.number().required(),
                value: _joi2.default.number().required()
              })), _joi2.default.allow(null)]
            })), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'POST',
      path: '/sellers/{seller_id}/assisted/{id}/types',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateAssistedServiceTypes,
        description: 'Add Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        validate: {
          payload: {
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            service_type_id: _joi2.default.number().required(),
            price: [_joi2.default.array().items(_joi2.default.object().keys({
              price_type: _joi2.default.number().required(),
              value: _joi2.default.number().required()
            })), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/assisted/{service_user_id}/types/{id}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.deleteAssistedServiceTypes,
        description: 'Delete Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/offers',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerOffers,
        description: 'Update Seller Offers',
        tags: ['api', 'Seller', 'Offer', 'Details'],
        validate: {
          payload: {
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            sku_id: [_joi2.default.number(), _joi2.default.allow(null)],
            sku_measurement_id: [_joi2.default.number(), _joi2.default.allow(null)],
            offer_discount: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_mrp: [_joi2.default.number(), _joi2.default.allow(null)],
            bar_code: [_joi2.default.string(), _joi2.default.allow(null)],
            title: [_joi2.default.string(), _joi2.default.allow(null)],
            description: [_joi2.default.string(), _joi2.default.allow(null)],
            document_details: [_joi2.default.array(), _joi2.default.allow(null)],
            start_date: _joi2.default.string().required(),
            end_date: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/offers/{id}/publish',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.publishSellerOffersToUsers,
        description: 'Publish Seller Offers to Users',
        tags: ['api', 'Publish', 'Seller', 'Offers', 'Users'],
        validate: {
          payload: {
            user_ids: _joi2.default.array().items(_joi2.default.number()).required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/brands',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.getBrandsForSeller,
        description: 'Retrieve Seller Brands',
        tags: ['api', 'Seller', 'Brands'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/assisted',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.getAssistedServicesForSeller,
        description: 'Get Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/delivery',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.getDeliveryPersonForSellers,
        description: 'Get Seller Delivery Person list',
        tags: ['api', 'Seller', 'Delivery Person', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/services',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.getSellerAssistedServiceTypes,
        description: 'Get Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/offers',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerOffers,
        description: 'Get Seller offers',
        tags: ['api', 'Seller', 'Offer', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/credits',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerCredits,
        description: 'Get Seller Credits',
        tags: ['api', 'Seller', 'Credit', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/credits',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerCredits,
        description: 'Update Seller Credits',
        tags: ['api', 'Seller', 'Credit', 'Details'],
        validate: {
          payload: {
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            description: [_joi2.default.string(), _joi2.default.allow(null)],
            amount: _joi2.default.number().required(),
            transaction_type: _joi2.default.number().required(),
            consumer_id: _joi2.default.number().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/points',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerLoyaltyPoints,
        description: 'Get Seller Points',
        tags: ['api', 'Seller', 'Point', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/points',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerPoints,
        description: 'Update Seller Points',
        tags: ['api', 'Seller', 'Point', 'Details'],
        validate: {
          payload: {
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            description: [_joi2.default.string(), _joi2.default.allow(null)],
            amount: _joi2.default.number().required(),
            transaction_type: _joi2.default.number().required(),
            consumer_id: _joi2.default.number().required(),
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/loyalty/rules',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerLoyaltyRules,
        description: 'Retrieve Seller Loyalty Rules',
        tags: ['api', 'Seller', 'Loyalty', 'Rules'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{id}/loyalty/rules',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerLoyaltyRules,
        description: 'Update Seller Loyalty Rules',
        tags: ['api', 'Seller', 'Loyalty', 'Rules'],
        validate: {
          payload: {
            id: [_joi2.default.number(), _joi2.default.allow(null)],
            item_value: [_joi2.default.string(), _joi2.default.allow(null)],
            rule_type: [_joi2.default.number(), _joi2.default.allow(null)],
            minimum_points: [_joi2.default.number(), _joi2.default.allow(null)],
            user_id: [_joi2.default.number(), _joi2.default.allow(null)],
            points_per_item: [_joi2.default.number(), _joi2.default.allow(null)],
            order_value: [_joi2.default.number(), _joi2.default.allow(null)],
            allow_auto_loyalty: [_joi2.default.boolean(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/wallet',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerWallet,
        description: 'Get Seller Wallet',
        tags: ['api', 'Seller', 'Wallet', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerConsumers,
        description: 'Get Seller users',
        tags: ['api', 'Seller', 'user', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/cashbacks',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerConsumerCashBacks,
        description: 'Get Seller users Cash Back Details',
        tags: ['api', 'Seller', 'user', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/transactions',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerConsumerTransactions,
        description: 'Get Seller users Transaction Details',
        tags: ['api', 'Seller', 'user', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/transactions',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        auth: 'jwt', handler: _sellers2.default.retrieveTransactions,
        description: 'Get Seller Transaction Details for consumer',
        tags: ['api', 'Seller', 'user', 'List'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerConsumerDetails,
        description: 'Get Seller customer details',
        tags: ['api', 'Seller', 'customer', 'details'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}/credits',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerConsumerCredits,
        description: 'Get Seller customer credits',
        tags: ['api', 'Seller', 'customer', 'credits'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/seller/{seller_id}/users/{customer_id}/credits/{credit_id}/jobs/{job_id}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerConsumerCredits,
        description: 'Linking Seller customer credits with jobs',
        tags: ['api', 'Seller', 'customer', 'credits'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/seller/{seller_id}/users/{customer_id}/points/{point_id}/jobs/{job_id}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerConsumerPoints,
        description: 'Linking Seller customer loyalty points with jobs',
        tags: ['api', 'Seller', 'customer', 'loyalty points'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}/points',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerConsumerPoints,
        description: 'Get Seller customer loyalty points',
        tags: ['api', 'Seller', 'customer', 'Loyalty Points'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/{seller_id}/users/{customer_id}/transactions',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.retrieveSellerTransactions,
        description: 'Get Seller customer transactions',
        tags: ['api', 'Seller', 'customer', 'transactions'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/users/{customer_id}',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.linkCustomers,
        description: 'Link Consumer with Seller',
        tags: ['api', 'Seller', 'Consumer'],
        validate: {
          payload: {
            credit_limit: [_joi2.default.number(), _joi2.default.allow(null)],
            is_credit_allowed: [_joi2.default.boolean(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/users',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.inviteCustomers,
        description: 'Invite Consumer with Seller',
        tags: ['api', 'Seller', 'Consumer'],
        validate: {
          payload: {
            credit_limit: [_joi2.default.number(), _joi2.default.allow(null)],
            is_credit_allowed: [_joi2.default.boolean(), _joi2.default.allow(null)],
            mobile_no: _joi2.default.string().required(),
            full_name: [_joi2.default.string(), _joi2.default.allow(null)],
            email: [_joi2.default.string(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/assisted/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        handler: _sellers2.default.deleteAssistedServiceUsers
      }
    });

    route.push({
      method: 'PUT',
      path: '/sellers/{seller_id}/assisted/{id}/reviews',
      config: {
        handler: _sellers2.default.updateAssistedUserReview,
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        description: 'Update Assisted User Reviews.',
        validate: {
          payload: {
            ratings: [_joi2.default.number(), _joi2.default.allow(null)],
            feedback: [_joi2.default.string(), _joi2.default.allow(null)],
            comments: [_joi2.default.string(), _joi2.default.allow(null)],
            order_id: [_joi2.default.number(), _joi2.default.allow(null)],
            output: 'data',
            parse: true
          }
        },
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 204, message: 'No Content' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/offers/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        handler: _sellers2.default.deleteOffer
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/categories',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, { method: middleware.logSellerAction, assign: 'seller_action' }],
        auth: 'jwt', handler: _sellers2.default.getCategoriesForSeller,
        description: 'Retrieve Seller Categories',
        tags: ['api', 'Seller', 'Categories'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/states/{state_id}/cities',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        auth: 'jwt', handler: _sellers2.default.retrieveCities,
        description: 'Retrieve Cities',
        tags: ['api', 'Seller', 'Cities'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    route.push({
      method: 'GET',
      path: '/states/{state_id}/cities/{city_id}/localities',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        auth: 'jwt', handler: _sellers2.default.retrieveLocalities,
        description: 'Retrieve Localities',
        tags: ['api', 'Seller', 'Localities'],
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Authenticated' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });
  }
}