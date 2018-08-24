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
 */
function prepareSellerRoutes(modal, route, middleware) {

  const varController = new _sellers2.default(modal);

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
      path: '/sellers/init',
      config: {
        auth: 'jwt', pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }], handler: _sellers2.default.initializeSeller,
        description: 'Initialize Seller Details by GSTIN or PAN.',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            email: _joi2.default.string(),
            gstin: _joi2.default.string(),
            pan: _joi2.default.string(),
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
        auth: 'jwt', pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }], handler: _sellers2.default.createLinkSeller,
        description: 'Create Seller Details by GSTIN or PAN and link it with user identity.',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            gstin: [_joi2.default.string(), _joi2.default.allow(null)],
            pan: [_joi2.default.string(), _joi2.default.allow(null)],
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
        auth: 'jwt', pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }], handler: _sellers2.default.updateLinkSeller,
        description: 'Update Seller Details by GSTIN or PAN and link it with user identity',
        tags: ['api', 'Seller', 'GSTIN', 'PAN'], validate: {
          payload: {
            gstin: [_joi2.default.string(), _joi2.default.allow(null)],
            pan: [_joi2.default.string(), _joi2.default.allow(null)],
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
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
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
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerProviderTypes,
        description: 'Update Seller Details provider type details',
        tags: ['api', 'Seller', 'provider type', 'Details'],
        validate: {
          payload: {
            provider_type_detail: [_joi2.default.array().items(_joi2.default.object().keys({
              provider_type_id: _joi2.default.number().required(),
              sub_category_id: _joi2.default.number().required(),
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
      method: 'PUT',
      path: '/sellers/{id}/assisted',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerAssistedServiceTypes,
        description: 'Update Seller assisted service types details',
        tags: ['api', 'Seller', 'Assisted Service Types', 'Details'],
        validate: {
          payload: {
            service_type_detail: [_joi2.default.array().items(_joi2.default.object().keys({
              service_type_id: _joi2.default.number().required(),
              mobile_no: _joi2.default.string().required(),
              name: [_joi2.default.string(), _joi2.default.allow(null)],
              document_details: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)],
              price: [_joi2.default.object().keys({
                price_type: _joi2.default.number().required(),
                value: _joi2.default.number().required()
              }), _joi2.default.allow(null)]
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
      path: '/sellers/{id}/offers',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        auth: 'jwt', handler: _sellers2.default.updateSellerOffers,
        description: 'Update Seller Offers',
        tags: ['api', 'Seller', 'Offer', 'Details'],
        validate: {
          payload: {
            seller_offers: [_joi2.default.array().items(_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              title: _joi2.default.string().required(),
              description: [_joi2.default.string(), _joi2.default.allow(null)],
              document_details: [_joi2.default.array().items(_joi2.default.number()), _joi2.default.allow(null)],
              start_date: _joi2.default.string().required(),
              end_date: [_joi2.default.string(), _joi2.default.allow(null)]
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
      method: 'GET',
      path: '/sellers/brands',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
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
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
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
      path: '/sellers/{seller_id}/offers',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
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
      method: 'DELETE',
      path: '/sellers/{seller_id}/assisted/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _sellers2.default.deleteAssistedService
      }
    });

    route.push({
      method: 'DELETE',
      path: '/sellers/{seller_id}/offers/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
        handler: _sellers2.default.deleteOffer
      }
    });

    route.push({
      method: 'GET',
      path: '/sellers/categories',
      config: {
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }],
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