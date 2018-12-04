'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.prepareProductRoutes = prepareProductRoutes;

var _product = require('../api/controllers/product');

var _product2 = _interopRequireDefault(_product);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function prepareProductRoutes(modal, routeObject, middleware) {
  //= ========================
  // Product Routes
  //= ========================

  const controllerInit = new _product2.default(modal);
  if (controllerInit) {
    routeObject.push({
      method: 'PUT',
      path: '/{reviewfor}/{id}/reviews',
      config: {
        handler: _product2.default.updateUserReview,
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        description: 'Update User Review.',
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

    routeObject.push({
      method: 'GET',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _product2.default.retrieveProductDetail,
        description: 'Get Product Details.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'GET',
      path: '/center/products',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _product2.default.retrieveCenterProducts,
        description: 'Get Center Products.',
        plugins: {
          'hapi-swagger': {
            responseMessages: [{ code: 200, message: 'Successful' }, { code: 400, message: 'Bad Request' }, { code: 401, message: 'Invalid Credentials' }, { code: 404, message: 'Not Found' }, { code: 500, message: 'Internal Server Error' }]
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _product2.default.updateProduct,
        description: 'Update Product.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            brand_name: [_joi2.default.string(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            sub_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
            colour_id: [_joi2.default.number(), _joi2.default.allow(null)],
            ref_id: [_joi2.default.number(), _joi2.default.allow(null)],
            accessory_part_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            taxes: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_email: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_address: [_joi2.default.string(), _joi2.default.allow(null)],
            document_number: [_joi2.default.string(), _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
            model: [_joi2.default.string(), _joi2.default.allow(null)],
            isNewModel: [_joi2.default.boolean(), _joi2.default.allow(null)],
            metadata: [_joi2.default.array().items(_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              category_form_id: [_joi2.default.number(), _joi2.default.allow(null)],
              form_value: [_joi2.default.string(), _joi2.default.allow(null)]
            })), _joi2.default.allow(null)],
            warranty: [_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              dual_id: [_joi2.default.number(), _joi2.default.allow(null)],
              extended_id: [_joi2.default.number(), _joi2.default.allow(null)],
              extended_provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
              extended_provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
              renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
              dual_renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
              extended_renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
              extended_effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
              effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
              accessory_renewal_type: [_joi2.default.string(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)],
            insurance: [_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
              provider_id: [_joi2.default.number(), _joi2.default.allow(null)],
              policy_no: [_joi2.default.string(), _joi2.default.allow(null)],
              provider_name: [_joi2.default.string(), _joi2.default.allow(null)],
              value: [_joi2.default.number(), _joi2.default.allow(null)],
              amount_insured: [_joi2.default.string(), _joi2.default.allow(null)],
              expiry_period: [_joi2.default.number(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)],
            puc: [_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
              expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
              seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
              value: [_joi2.default.number(), _joi2.default.allow(null)],
              seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)],
            amc: [_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              effective_date: [_joi2.default.string(), _joi2.default.allow(null)],
              expiry_period: [_joi2.default.number(), _joi2.default.allow(null)],
              value: [_joi2.default.number(), _joi2.default.allow(null)],
              seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
              seller_contact: [_joi2.default.string(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)],
            repair: [_joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              document_date: [_joi2.default.string(), _joi2.default.allow(null)],
              repair_for: [_joi2.default.string(), _joi2.default.allow(null)],
              seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
              seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
              is_amc_seller: [_joi2.default.string(), _joi2.default.allow(null)],
              value: [_joi2.default.number(), _joi2.default.allow(null)],
              warranty_upto: [_joi2.default.string(), _joi2.default.allow(null)]
            }), _joi2.default.allow(null)]
          }
        }
      }
    });

    routeObject.push({
      method: 'POST',
      path: '/products/{ref_id}/accessories',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _product2.default.updateAccessoryProduct,
        description: 'Create Accessory Product.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            accessory_part_name: [_joi2.default.string(), _joi2.default.allow(null)],
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            sub_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
            accessory_part_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            taxes: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_email: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_address: [_joi2.default.string(), _joi2.default.allow(null)],
            document_number: [_joi2.default.string(), _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
            warranty: _joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
              effective_date: [_joi2.default.string(), _joi2.default.allow(null)]
            }).allow(null)
          }
        }
      }
    });

    routeObject.push({
      method: 'PUT',
      path: '/products/{ref_id}/accessories/{id}',
      config: {
        auth: 'jwt',
        pre: [{ method: middleware.checkAppVersion, assign: 'forceUpdate' }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _product2.default.updateAccessoryProduct,
        description: 'Update Accessory Product.',
        validate: {
          payload: {
            product_name: [_joi2.default.string(), _joi2.default.allow(null)],
            accessory_part_name: [_joi2.default.string(), _joi2.default.allow(null)],
            job_id: [_joi2.default.number(), _joi2.default.allow(null)],
            main_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            sub_category_id: [_joi2.default.number(), _joi2.default.allow(null)],
            brand_id: [_joi2.default.number(), _joi2.default.allow(null)],
            accessory_part_id: [_joi2.default.number(), _joi2.default.allow(null)],
            value: [_joi2.default.number(), _joi2.default.allow(null)],
            taxes: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_id: [_joi2.default.number(), _joi2.default.allow(null)],
            seller_name: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_contact: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_email: [_joi2.default.string(), _joi2.default.allow(null)],
            seller_address: [_joi2.default.string(), _joi2.default.allow(null)],
            document_number: [_joi2.default.string(), _joi2.default.allow(null)],
            document_date: [_joi2.default.string(), _joi2.default.allow(null)],
            warranty: _joi2.default.object().keys({
              id: [_joi2.default.number(), _joi2.default.allow(null)],
              renewal_type: [_joi2.default.number(), _joi2.default.allow(null)],
              effective_date: [_joi2.default.string(), _joi2.default.allow(null)]
            }).allow(null)
          }
        }
      }
    });

    routeObject.push({
      method: 'DELETE',
      path: '/products/{id}',
      config: {
        auth: 'jwt',
        pre: [{
          method: middleware.checkAppVersion,
          assign: 'forceUpdate'
        }, {
          method: middleware.updateUserActiveStatus,
          assign: 'userExist'
        }],
        handler: _product2.default.deleteProduct,
        description: 'Delete Product.'
      }
    });
  }
}